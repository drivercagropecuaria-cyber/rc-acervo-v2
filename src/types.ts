// Tipos do Frontend - RC Acervo

export interface MediaItem {
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

export interface Folder {
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

export interface UploadMetadata {
  area: string;
  nucleo?: string;
  tema: string;
  status: string;
  ponto?: string;
  tipoProjeto?: string;
  funcaoHistorica?: string;
  evento?: string;
}

export interface UploadResponse {
  presignedUrl: string;
  authorizationToken: string;
  fileName: string;
  filePath: string;
  folderPath: string;
  headers: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  total?: number;
}

// Opções de metadados
export const AREAS = [
  'Vila Canabrava',
  'Olhos d\'Água',
  'Boa Vista',
  'São João',
  'Santa Maria',
  'Outra'
];

export const NUCLEOS_PECUARIA = [
  'Cria',
  'Recria',
  'Engorda',
  'Maternidade',
  'Curral',
  'Outro'
];

export const NUCLEOS_AGRO = [
  'Agricultura',
  'Silvicultura',
  'Irrigação',
  'Outro'
];

export const TEMAS = [
  'Terra e Sertão',
  'Tradição',
  'Inovação',
  'Sustentabilidade',
  'Família',
  'História',
  'Outro'
];

export const STATUS = [
  'Entrada (Bruto)',
  'Catalogado',
  'Em produção',
  'Publicado',
  'Arquivado'
];

export const PONTOS = [
  'Curral de Manejo',
  'Pasto',
  'Maternidade',
  'Sede',
  'Casa de Máquinas',
  'Outro'
];

export const TIPOS_PROJETO = [
  'Documentário',
  'Série',
  'Rotina',
  'Campanha',
  'Evento',
  'Outro'
];

export const FUNCOES_HISTORICAS = [
  'Origem e Fundação',
  'Evolução',
  'Legado',
  'Outra'
];
