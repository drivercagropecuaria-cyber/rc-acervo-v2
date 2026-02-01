/**
 * Tipos do Backend - RC Acervo
 */

export interface B2AuthResponse {
  authorizationToken: string;
  apiUrl: string;
  downloadUrl: string;
  recommendedPartSize: number;
}

export interface B2UploadUrlResponse {
  uploadUrl: string;
  authorizationToken: string;
}

export interface MediaMetadata {
  id: string;
  fileName: string;
  filePath: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  url: string;
  thumbnailUrl?: string;
  area: string;
  nucleo?: string;
  tema: string;
  status: string;
  ponto?: string;
  tipoProjeto?: string;
  funcaoHistorica?: string;
  evento?: string;
  ano: string;
  mes: string;
  dia: string;
  uuid: string;
  extensao: string;
}

export interface MediaItemResponse {
  id: string;
  fileName: string;
  filePath: string;
  size: number;
  uploadedAt: string;
  url: string;
  thumbnailUrl: string;
  area: string;
  nucleo?: string;
  tema: string;
  status: string;
  ponto?: string;
  tipoProjeto?: string;
  funcaoHistorica?: string;
  evento?: string;
  ano: string;
  mes: string;
  dia: string;
  uuid: string;
  extensao: string;
  tipo: 'imagem' | 'video';
}

export interface FolderStructure {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

export interface Estatisticas {
  totalItens: number;
  totalImagens: number;
  totalVideos: number;
  porStatus: Record<string, number>;
  porArea: Record<string, number>;
  porTema: Record<string, number>;
  porNucleo: Record<string, number>;
  porMes: Record<string, number>;
}
