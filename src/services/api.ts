/**
 * Serviço de API - Comunicação com o Backend
 */

import axios, { AxiosError } from 'axios';
import { 
  MediaItem, 
  Folder, 
  Estatisticas, 
  UploadMetadata, 
  UploadResponse, 
  ApiResponse 
} from '../types';

// URL base da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Instância do Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor para logs
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('[API Error]', error.message);
    return Promise.reject(error);
  }
);

// ============================================
// ENDPOINTS DE SAÚDE
// ============================================

export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await api.get<ApiResponse<{ status: string }>>('/api/health');
    return response.data.success && response.data.data?.status === 'ok';
  } catch {
    return false;
  }
};

// ============================================
// ENDPOINTS DE UPLOAD
// ============================================

export const getPresignedUrl = async (
  filename: string,
  contentType: string,
  size: number,
  metadata: UploadMetadata
): Promise<UploadResponse> => {
  const response = await api.post<ApiResponse<UploadResponse>>('/api/upload/presigned', {
    filename,
    contentType,
    size,
    metadata,
  });
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao gerar URL de upload');
  }
  
  return response.data.data;
};

export const uploadToB2 = async (
  presignedUrl: string,
  file: File,
  headers: Record<string, string>
): Promise<void> => {
  // Upload direto para o Backblaze B2 (sem passar pelo nosso backend)
  await axios.put(presignedUrl, file, {
    headers: {
      ...headers,
      'Content-Type': file.type || 'application/octet-stream',
    },
    timeout: 300000, // 5 minutos para arquivos grandes
    onUploadProgress: (progressEvent) => {
      const progress = progressEvent.total
        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
        : 0;
      console.log(`[Upload] Progresso: ${progress}%`);
    },
  });
};

export const confirmUpload = async (
  filePath: string,
  metadata: UploadMetadata & { size: number; contentType: string }
): Promise<void> => {
  const response = await api.post<ApiResponse<void>>('/api/upload/complete', {
    filePath,
    metadata,
  });
  
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao confirmar upload');
  }
};

// ============================================
// ENDPOINTS DE MÍDIA
// ============================================

export const listMedias = async (filters?: {
  area?: string;
  nucleo?: string;
  tema?: string;
  status?: string;
  search?: string;
}): Promise<MediaItem[]> => {
  const params = new URLSearchParams();
  
  if (filters?.area) params.append('area', filters.area);
  if (filters?.nucleo) params.append('nucleo', filters.nucleo);
  if (filters?.tema) params.append('tema', filters.tema);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  
  const response = await api.get<ApiResponse<MediaItem[]>>(`/api/media?${params.toString()}`);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao listar mídias');
  }
  
  return response.data.data;
};

export const getMediaById = async (id: string): Promise<MediaItem> => {
  const response = await api.get<ApiResponse<MediaItem>>(`/api/media/${id}`);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao buscar mídia');
  }
  
  return response.data.data;
};

export const getMediaUrl = async (id: string): Promise<string> => {
  const response = await api.get<ApiResponse<{ url: string }>>(`/api/media/${id}/url`);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao gerar URL');
  }
  
  return response.data.data.url;
};

export const getEstatisticas = async (): Promise<Estatisticas> => {
  const response = await api.get<ApiResponse<Estatisticas>>('/api/media/stats');
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao buscar estatísticas');
  }
  
  return response.data.data;
};

// ============================================
// ENDPOINTS DE PASTAS
// ============================================

export const listFolders = async (): Promise<Folder[]> => {
  const response = await api.get<ApiResponse<Folder[]>>('/api/folders');
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao listar pastas');
  }
  
  return response.data.data;
};

export const getFolderFiles = async (folderPath: string): Promise<MediaItem[]> => {
  const encodedPath = encodeURIComponent(folderPath);
  const response = await api.get<ApiResponse<MediaItem[]>>(`/api/folders/${encodedPath}/files`);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao listar arquivos da pasta');
  }
  
  return response.data.data;
};

export default api;
