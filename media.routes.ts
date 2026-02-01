/**
 * Rotas de Mídia
 * 
 * GET /api/media - Lista todas as mídias com filtros
 * GET /api/media/:id - Detalhes de uma mídia específica
 * GET /api/media/:id/url - URL de download
 * GET /api/media/stats - Estatísticas do acervo
 */

import { Router } from 'express';
import { getAllMetadata, getMetadataById, filterMetadata, getEstatisticas } from '../services/database.service';
import { isImage, isVideo } from '../services/backblaze.service';
import { MediaItemResponse } from '../types';

const router = Router();

/**
 * GET /api/media
 * Lista todas as mídias com opções de filtro
 */
router.get('/', async (req, res) => {
  try {
    console.log('[GET /api/media] Listando mídias');
    
    // Extrai filtros da query
    const filters = {
      area: req.query.area as string | undefined,
      nucleo: req.query.nucleo as string | undefined,
      tema: req.query.tema as string | undefined,
      status: req.query.status as string | undefined,
      ponto: req.query.ponto as string | undefined,
      tipoProjeto: req.query.tipoProjeto as string | undefined,
      funcaoHistorica: req.query.funcaoHistorica as string | undefined,
      evento: req.query.evento as string | undefined,
      ano: req.query.ano as string | undefined,
      mes: req.query.mes as string | undefined,
      search: req.query.search as string | undefined,
    };
    
    // Remove filtros vazios
    Object.keys(filters).forEach(key => {
      if (!filters[key as keyof typeof filters]) {
        delete filters[key as keyof typeof filters];
      }
    });
    
    console.log('[GET /api/media] Filtros:', filters);
    
    // Busca metadados
    let metadados = Object.keys(filters).length > 0 
      ? filterMetadata(filters)
      : getAllMetadata();
    
    console.log(`[GET /api/media] ${metadados.length} mídias encontradas`);
    
    // Ordena por data (mais recente primeiro)
    metadados = metadados.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    
    // Mapeia para resposta
    const mediaItems: MediaItemResponse[] = metadados.map(m => ({
      id: m.id,
      fileName: m.fileName,
      filePath: m.filePath,
      size: m.size,
      uploadedAt: m.uploadedAt,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl || m.url,
      area: m.area,
      nucleo: m.nucleo,
      tema: m.tema,
      status: m.status,
      ponto: m.ponto,
      tipoProjeto: m.tipoProjeto,
      funcaoHistorica: m.funcaoHistorica,
      evento: m.evento,
      ano: m.ano,
      mes: m.mes,
      dia: m.dia,
      uuid: m.uuid,
      extensao: m.extensao,
      tipo: isImage(m.fileName) ? 'imagem' : isVideo(m.fileName) ? 'video' : 'imagem',
    }));
    
    res.json({
      success: true,
      data: mediaItems,
      total: mediaItems.length,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });
    
  } catch (error: any) {
    console.error('[GET /api/media] Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar mídias',
      details: error.message 
    });
  }
});

/**
 * GET /api/media/stats
 * Retorna estatísticas do acervo
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('[GET /api/media/stats] Gerando estatísticas');
    
    const stats = getEstatisticas();
    
    res.json({
      success: true,
      data: stats,
    });
    
  } catch (error: any) {
    console.error('[GET /api/media/stats] Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar estatísticas',
      details: error.message 
    });
  }
});

/**
 * GET /api/media/:id
 * Retorna detalhes de uma mídia específica
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[GET /api/media/${id}] Buscando mídia`);
    
    const metadata = getMetadataById(id);
    
    if (!metadata) {
      console.log(`[GET /api/media/${id}] Mídia não encontrada`);
      return res.status(404).json({ 
        success: false, 
        error: 'Mídia não encontrada' 
      });
    }
    
    const mediaItem: MediaItemResponse = {
      id: metadata.id,
      fileName: metadata.fileName,
      filePath: metadata.filePath,
      size: metadata.size,
      uploadedAt: metadata.uploadedAt,
      url: metadata.url,
      thumbnailUrl: metadata.thumbnailUrl || metadata.url,
      area: metadata.area,
      nucleo: metadata.nucleo,
      tema: metadata.tema,
      status: metadata.status,
      ponto: metadata.ponto,
      tipoProjeto: metadata.tipoProjeto,
      funcaoHistorica: metadata.funcaoHistorica,
      evento: metadata.evento,
      ano: metadata.ano,
      mes: metadata.mes,
      dia: metadata.dia,
      uuid: metadata.uuid,
      extensao: metadata.extensao,
      tipo: isImage(metadata.fileName) ? 'imagem' : isVideo(metadata.fileName) ? 'video' : 'imagem',
    };
    
    res.json({
      success: true,
      data: mediaItem,
    });
    
  } catch (error: any) {
    console.error(`[GET /api/media/${req.params.id}] Erro:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar mídia',
      details: error.message 
    });
  }
});

/**
 * GET /api/media/:id/url
 * Gera URL de download para uma mídia
 */
router.get('/:id/url', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[GET /api/media/${id}/url] Gerando URL de download`);
    
    const metadata = getMetadataById(id);
    
    if (!metadata) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mídia não encontrada' 
      });
    }
    
    res.json({
      success: true,
      data: {
        url: metadata.url,
        fileName: metadata.fileName,
        contentType: metadata.contentType,
      }
    });
    
  } catch (error: any) {
    console.error(`[GET /api/media/${req.params.id}/url] Erro:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar URL de download',
      details: error.message 
    });
  }
});

export default router;
