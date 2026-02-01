/**
 * Serviço de Banco de Dados - Persistência de Metadados
 * 
 * Usa arquivo JSON para armazenar metadados dos arquivos.
 * No Render, usa /tmp para permitir escrita.
 */

import fs from 'fs';
import path from 'path';
import { MediaMetadata, Estatisticas } from '../types';

// Diretório do banco de dados
const DB_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp/rc-acervo-data'
  : path.join(process.cwd(), 'data');

const DB_FILE = path.join(DB_DIR, 'media-metadata.json');

// Garante que o diretório existe
const ensureDir = (): void => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log(`[Database] Diretório criado: ${DB_DIR}`);
  }
};

// Lê todos os metadados
export const getAllMetadata = (): MediaMetadata[] => {
  try {
    ensureDir();
    
    if (!fs.existsSync(DB_FILE)) {
      console.log('[Database] Arquivo não existe, retornando array vazio');
      return [];
    }
    
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    if (!Array.isArray(parsed)) {
      console.warn('[Database] Arquivo corrompido, retornando array vazio');
      return [];
    }
    
    console.log(`[Database] ${parsed.length} registros carregados`);
    return parsed;
  } catch (error) {
    console.error('[Database] Erro ao ler metadados:', error);
    return [];
  }
};

// Salva um metadado
export const saveMetadata = (metadata: MediaMetadata): void => {
  try {
    ensureDir();
    
    const allMetadata = getAllMetadata();
    
    // Verifica se já existe (atualiza) ou adiciona novo
    const existingIndex = allMetadata.findIndex(m => m.id === metadata.id);
    
    if (existingIndex >= 0) {
      allMetadata[existingIndex] = {
        ...allMetadata[existingIndex],
        ...metadata,
        uploadedAt: metadata.uploadedAt || new Date().toISOString()
      };
      console.log(`[Database] Metadado atualizado: ${metadata.id}`);
    } else {
      allMetadata.push(metadata);
      console.log(`[Database] Novo metadado salvo: ${metadata.id}`);
    }
    
    fs.writeFileSync(DB_FILE, JSON.stringify(allMetadata, null, 2));
    console.log(`[Database] Total de registros: ${allMetadata.length}`);
  } catch (error) {
    console.error('[Database] Erro ao salvar metadados:', error);
    throw new Error('Falha ao salvar metadados no banco de dados');
  }
};

// Busca metadado por ID
export const getMetadataById = (id: string): MediaMetadata | null => {
  const allMetadata = getAllMetadata();
  return allMetadata.find(m => m.id === id) || null;
};

// Busca metadado por filePath
export const getMetadataByPath = (filePath: string): MediaMetadata | null => {
  const allMetadata = getAllMetadata();
  return allMetadata.find(m => m.filePath === filePath) || null;
};

// Filtra metadados
export const filterMetadata = (filters: {
  area?: string;
  nucleo?: string;
  tema?: string;
  status?: string;
  ponto?: string;
  tipoProjeto?: string;
  funcaoHistorica?: string;
  evento?: string;
  ano?: string;
  mes?: string;
  search?: string;
}): MediaMetadata[] => {
  let allMetadata = getAllMetadata();
  
  if (filters.area) {
    allMetadata = allMetadata.filter(m => m.area === filters.area);
  }
  
  if (filters.nucleo) {
    allMetadata = allMetadata.filter(m => m.nucleo === filters.nucleo);
  }
  
  if (filters.tema) {
    allMetadata = allMetadata.filter(m => m.tema === filters.tema);
  }
  
  if (filters.status) {
    allMetadata = allMetadata.filter(m => m.status === filters.status);
  }
  
  if (filters.ponto) {
    allMetadata = allMetadata.filter(m => m.ponto === filters.ponto);
  }
  
  if (filters.tipoProjeto) {
    allMetadata = allMetadata.filter(m => m.tipoProjeto === filters.tipoProjeto);
  }
  
  if (filters.funcaoHistorica) {
    allMetadata = allMetadata.filter(m => m.funcaoHistorica === filters.funcaoHistorica);
  }
  
  if (filters.evento) {
    allMetadata = allMetadata.filter(m => m.evento === filters.evento);
  }
  
  if (filters.ano) {
    allMetadata = allMetadata.filter(m => m.ano === filters.ano);
  }
  
  if (filters.mes) {
    allMetadata = allMetadata.filter(m => m.mes === filters.mes);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    allMetadata = allMetadata.filter(m => 
      m.fileName.toLowerCase().includes(searchLower) ||
      m.area.toLowerCase().includes(searchLower) ||
      m.tema.toLowerCase().includes(searchLower) ||
      (m.nucleo && m.nucleo.toLowerCase().includes(searchLower))
    );
  }
  
  return allMetadata;
};

// Atualiza status de um arquivo
export const updateStatus = (id: string, newStatus: string): MediaMetadata | null => {
  const metadata = getMetadataById(id);
  if (!metadata) return null;
  
  metadata.status = newStatus;
  saveMetadata(metadata);
  return metadata;
};

// Deleta um metadado
export const deleteMetadata = (id: string): boolean => {
  try {
    const allMetadata = getAllMetadata();
    const filtered = allMetadata.filter(m => m.id !== id);
    
    if (filtered.length === allMetadata.length) {
      return false; // Não encontrou
    }
    
    fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2));
    console.log(`[Database] Metadado deletado: ${id}`);
    return true;
  } catch (error) {
    console.error('[Database] Erro ao deletar metadado:', error);
    return false;
  }
};

// Gera estatísticas
export const getEstatisticas = (): Estatisticas => {
  const allMetadata = getAllMetadata();
  
  const porStatus: Record<string, number> = {};
  const porArea: Record<string, number> = {};
  const porTema: Record<string, number> = {};
  const porNucleo: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  
  let totalImagens = 0;
  let totalVideos = 0;
  
  allMetadata.forEach(m => {
    // Status
    porStatus[m.status] = (porStatus[m.status] || 0) + 1;
    
    // Área
    porArea[m.area] = (porArea[m.area] || 0) + 1;
    
    // Tema
    porTema[m.tema] = (porTema[m.tema] || 0) + 1;
    
    // Núcleo
    if (m.nucleo) {
      porNucleo[m.nucleo] = (porNucleo[m.nucleo] || 0) + 1;
    }
    
    // Mês/Ano
    const mesAno = `${m.ano}-${m.mes}`;
    porMes[mesAno] = (porMes[mesAno] || 0) + 1;
    
    // Tipo
    const ext = m.extensao?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'raw'].includes(ext)) {
      totalImagens++;
    } else if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'].includes(ext)) {
      totalVideos++;
    }
  });
  
  return {
    totalItens: allMetadata.length,
    totalImagens,
    totalVideos,
    porStatus,
    porArea,
    porTema,
    porNucleo,
    porMes,
  };
};

// Lista arquivos por pasta
export const getFilesByFolder = (folderPath: string): MediaMetadata[] => {
  const allMetadata = getAllMetadata();
  return allMetadata.filter(m => m.filePath.startsWith(folderPath));
};

// Lista pastas únicas
export const getUniqueFolders = (): string[] => {
  const allMetadata = getAllMetadata();
  const folders = new Set<string>();
  
  allMetadata.forEach(m => {
    const parts = m.filePath.split('/');
    parts.pop(); // Remove o nome do arquivo
    if (parts.length > 0) {
      folders.add(parts.join('/'));
    }
  });
  
  return Array.from(folders).sort();
};

// Inicialização
console.log(`[Database] Serviço inicializado`);
console.log(`[Database] Arquivo: ${DB_FILE}`);
