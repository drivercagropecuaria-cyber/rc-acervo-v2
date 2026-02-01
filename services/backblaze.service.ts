/**
 * Serviço de Integração com Backblaze B2
 * 
 * Responsável por:
 * - Autenticação na API do B2
 * - Geração de URLs de upload (presigned)
 * - Listagem de arquivos
 * - Geração de nomenclatura padronizada
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { B2AuthResponse, B2UploadUrlResponse } from '../types';

// Configuração do B2
export const B2_CONFIG = {
  accountId: process.env.B2_ACCOUNT_ID || '',
  applicationKey: process.env.B2_APPLICATION_KEY || '',
  bucketId: process.env.B2_BUCKET_ID || '',
  bucketName: process.env.B2_BUCKET_NAME || '',
  apiUrl: 'https://api005.backblazeb2.com',
};

// Cache de autenticação
let authCache: {
  token: string;
  apiUrl: string;
  downloadUrl: string;
  expiresAt: number;
} | null = null;

// Estrutura de pastas
export const FOLDER_STRUCTURE = {
  ENTRADA: '00_ENTRADA',
  CATALOGADO: '01_CATALOGADO',
  PRODUCAO: '02_PRODUCAO',
  PUBLICADO: '03_PUBLICADO',
  ARQUIVADO: '04_ARQUIVADO',
} as const;

// Verifica configuração
const checkConfig = (): void => {
  if (!B2_CONFIG.accountId || !B2_CONFIG.applicationKey || !B2_CONFIG.bucketId) {
    throw new Error('Configuração do Backblaze B2 incompleta. Verifique as variáveis de ambiente.');
  }
};

// Autenticação no B2
export const authorizeB2 = async (): Promise<B2AuthResponse> => {
  try {
    // Verifica cache válido
    if (authCache && authCache.expiresAt > Date.now()) {
      console.log('[B2] Usando token em cache');
      return {
        authorizationToken: authCache.token,
        apiUrl: authCache.apiUrl,
        downloadUrl: authCache.downloadUrl,
        recommendedPartSize: 100000000,
      };
    }
    
    checkConfig();
    
    console.log('[B2] Autenticando...');
    
    const authString = Buffer.from(`${B2_CONFIG.accountId}:${B2_CONFIG.applicationKey}`).toString('base64');
    
    const response = await axios.get(`${B2_CONFIG.apiUrl}/b2api/v2/b2_authorize_account`, {
      headers: {
        Authorization: `Basic ${authString}`,
      },
    });
    
    const { authorizationToken, apiInfo } = response.data;
    const apiUrl = apiInfo.storageApi.apiUrl;
    const downloadUrl = apiInfo.storageApi.downloadUrl;
    
    // Cache por 23 horas
    authCache = {
      token: authorizationToken,
      apiUrl,
      downloadUrl,
      expiresAt: Date.now() + (23 * 60 * 60 * 1000),
    };
    
    console.log('[B2] Autenticação bem-sucedida');
    
    return {
      authorizationToken,
      apiUrl,
      downloadUrl,
      recommendedPartSize: apiInfo.storageApi.recommendedPartSize,
    };
  } catch (error: any) {
    console.error('[B2] Erro na autenticação:', error.response?.data || error.message);
    throw new Error(`Falha na autenticação do Backblaze B2: ${error.message}`);
  }
};

// Gera URL de upload
export const getUploadUrl = async (filePath: string): Promise<B2UploadUrlResponse> => {
  try {
    const auth = await authorizeB2();
    
    console.log(`[B2] Solicitando URL de upload para: ${filePath}`);
    
    const response = await axios.post(
      `${auth.apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: B2_CONFIG.bucketId },
      { headers: { Authorization: auth.authorizationToken } }
    );
    
    console.log('[B2] URL de upload obtida');
    
    return {
      uploadUrl: response.data.uploadUrl,
      authorizationToken: response.data.authorizationToken,
    };
  } catch (error: any) {
    console.error('[B2] Erro ao obter URL de upload:', error.response?.data || error.message);
    throw new Error(`Falha ao obter URL de upload: ${error.message}`);
  }
};

// Lista arquivos do bucket
export const listFiles = async (prefix: string = '', maxFileCount: number = 1000): Promise<any[]> => {
  try {
    const auth = await authorizeB2();
    
    console.log(`[B2] Listando arquivos${prefix ? ` com prefixo: ${prefix}` : ''}`);
    
    const response = await axios.post(
      `${auth.apiUrl}/b2api/v2/b2_list_file_names`,
      {
        bucketId: B2_CONFIG.bucketId,
        prefix,
        maxFileCount,
      },
      { headers: { Authorization: auth.authorizationToken } }
    );
    
    const files = response.data.files || [];
    console.log(`[B2] ${files.length} arquivos encontrados`);
    
    return files;
  } catch (error: any) {
    console.error('[B2] Erro ao listar arquivos:', error.response?.data || error.message);
    throw new Error(`Falha ao listar arquivos: ${error.message}`);
  }
};

// Gera URL de download
export const getDownloadUrl = async (filePath: string): Promise<string> => {
  try {
    const auth = await authorizeB2();
    
    // URL pública do arquivo
    const publicUrl = `${auth.downloadUrl}/file/${B2_CONFIG.bucketName}/${filePath}`;
    
    console.log(`[B2] URL de download gerada: ${publicUrl}`);
    
    return publicUrl;
  } catch (error: any) {
    console.error('[B2] Erro ao gerar URL de download:', error.message);
    throw new Error(`Falha ao gerar URL de download: ${error.message}`);
  }
};

// Função para criar slug (nome amigável para URL)
const slugify = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, '') // Remove caracteres especiais
    .toUpperCase()
    .substring(0, 20);
};

// Gera nome de arquivo padronizado
export const generateStandardFileName = (
  originalName: string,
  metadata: {
    area: string;
    nucleo?: string;
    tema: string;
    status: string;
  }
): { fileName: string; folderPath: string; fullPath: string } => {
  const now = new Date();
  const ano = now.getFullYear().toString();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const dia = String(now.getDate()).padStart(2, '0');
  
  // Gera UUID curto (8 caracteres)
  const uuid = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  
  // Extrai extensão
  const extensao = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  // Cria componentes do nome
  const areaSlug = slugify(metadata.area) || 'GERAL';
  const nucleoSlug = metadata.nucleo ? slugify(metadata.nucleo) : 'GERAL';
  const temaSlug = slugify(metadata.tema) || 'GERAL';
  const statusSlug = slugify(metadata.status) || 'ENTRADA';
  
  // Nome do arquivo padronizado
  const fileName = `${ano}_${mes}_${dia}_${areaSlug}_${nucleoSlug}_${temaSlug}_${statusSlug}_${uuid}.${extensao}`;
  
  // Pasta baseada no status
  let baseFolder = FOLDER_STRUCTURE.ENTRADA;
  if (metadata.status === 'Catalogado') {
    baseFolder = FOLDER_STRUCTURE.CATALOGADO;
  } else if (metadata.status === 'Em produção') {
    baseFolder = FOLDER_STRUCTURE.PRODUCAO;
  } else if (metadata.status === 'Publicado') {
    baseFolder = FOLDER_STRUCTURE.PUBLICADO;
  } else if (metadata.status === 'Arquivado') {
    baseFolder = FOLDER_STRUCTURE.ARQUIVADO;
  }
  
  // Caminho completo da pasta
  const folderPath = `${baseFolder}/${ano}/${mes}/${dia}`;
  
  // Caminho completo do arquivo
  const fullPath = `${folderPath}/${fileName}`;
  
  console.log(`[B2] Nome gerado: ${fileName}`);
  console.log(`[B2] Caminho: ${fullPath}`);
  
  return { fileName, folderPath, fullPath };
};

// Extrai metadados do nome do arquivo
export const parseFileName = (fileName: string): {
  ano: string;
  mes: string;
  dia: string;
  area: string;
  nucleo: string;
  tema: string;
  status: string;
  uuid: string;
  extensao: string;
} | null => {
  try {
    // Remove extensão
    const parts = fileName.split('.');
    const extensao = parts.pop() || '';
    const nameWithoutExt = parts.join('.');
    
    // Divide por underscore
    const components = nameWithoutExt.split('_');
    
    if (components.length < 8) {
      console.warn(`[B2] Nome de arquivo não segue padrão: ${fileName}`);
      return null;
    }
    
    return {
      ano: components[0],
      mes: components[1],
      dia: components[2],
      area: components[3],
      nucleo: components[4],
      tema: components[5],
      status: components[6],
      uuid: components[7],
      extensao,
    };
  } catch (error) {
    console.error(`[B2] Erro ao parsear nome: ${fileName}`, error);
    return null;
  }
};

// Verifica se é imagem
export const isImage = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'raw', 'svg'].includes(ext || '');
};

// Verifica se é vídeo
export const isVideo = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv', 'm4v', '3gp'].includes(ext || '');
};

// Inicialização
console.log('[B2] Serviço inicializado');
console.log(`[B2] Bucket: ${B2_CONFIG.bucketName}`);
