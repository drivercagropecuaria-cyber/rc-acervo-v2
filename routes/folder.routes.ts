/**
 * Rotas de Pastas
 * 
 * GET /api/folders - Lista estrutura de pastas
 * GET /api/folders/:folderPath/files - Lista arquivos de uma pasta
 */

import { Router } from 'express';
import { getAllMetadata, getFilesByFolder, getUniqueFolders } from '../services/database.service';
import { FOLDER_STRUCTURE, isImage, isVideo } from '../services/backblaze.service';
import { FolderStructure, MediaItemResponse } from '../types';

const router = Router();

/**
 * GET /api/folders
 * Lista estrutura de pastas com contagem de arquivos
 */
router.get('/', async (req, res) => {
  try {
    console.log('[GET /api/folders] Listando estrutura de pastas');
    
    const allMetadata = getAllMetadata();
    
    // Conta arquivos por pasta base
    const countByFolder: Record<string, number> = {};
    
    allMetadata.forEach(m => {
      const parts = m.filePath.split('/');
      if (parts.length > 0) {
        const baseFolder = parts[0];
        countByFolder[baseFolder] = (countByFolder[baseFolder] || 0) + 1;
      }
    });
    
    // Monta estrutura de pastas
    const folders: FolderStructure[] = [
      {
        id: 'entrada',
        name: '00 - Entrada (Bruto)',
        slug: FOLDER_STRUCTURE.ENTRADA,
        count: countByFolder[FOLDER_STRUCTURE.ENTRADA] || 0,
      },
      {
        id: 'catalogado',
        name: '01 - Catalogado',
        slug: FOLDER_STRUCTURE.CATALOGADO,
        count: countByFolder[FOLDER_STRUCTURE.CATALOGADO] || 0,
      },
      {
        id: 'producao',
        name: '02 - Em Produção',
        slug: FOLDER_STRUCTURE.PRODUCAO,
        count: countByFolder[FOLDER_STRUCTURE.PRODUCAO] || 0,
      },
      {
        id: 'publicado',
        name: '03 - Publicado',
        slug: FOLDER_STRUCTURE.PUBLICADO,
        count: countByFolder[FOLDER_STRUCTURE.PUBLICADO] || 0,
      },
      {
        id: 'arquivado',
        name: '04 - Arquivado',
        slug: FOLDER_STRUCTURE.ARQUIVADO,
        count: countByFolder[FOLDER_STRUCTURE.ARQUIVADO] || 0,
      },
    ];
    
    res.json({
      success: true,
      data: folders,
    });
    
  } catch (error: any) {
    console.error('[GET /api/folders] Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar pastas',
      details: error.message 
    });
  }
});

/**
 * GET /api/folders/structure
 * Retorna estrutura hierárquica completa de pastas
 */
router.get('/structure', async (req, res) => {
  try {
    console.log('[GET /api/folders/structure] Listando estrutura completa');
    
    const allMetadata = getAllMetadata();
    
    // Agrupa por pasta
    const folderTree: Record<string, any> = {};
    
    allMetadata.forEach(m => {
      const parts = m.filePath.split('/');
      parts.pop(); // Remove nome do arquivo
      
      let current = folderTree;
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            count: 0,
            children: {},
          };
        }
        current[part].count++;
        current = current[part].children;
      });
    });
    
    res.json({
      success: true,
      data: folderTree,
    });
    
  } catch (error: any) {
    console.error('[GET /api/folders/structure] Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar estrutura',
      details: error.message 
    });
  }
});

/**
 * GET /api/folders/:folderPath/files
 * Lista arquivos de uma pasta específica
 */
router.get('/:folderPath/files', async (req, res) => {
  try {
    const folderPath = req.params.folderPath;
    console.log(`[GET /api/folders/${folderPath}/files] Listando arquivos`);
    
    const metadados = getFilesByFolder(folderPath);
    
    // Ordena por data
    metadados.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    
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
      folder: folderPath,
    });
    
  } catch (error: any) {
    console.error(`[GET /api/folders/${req.params.folderPath}/files] Erro:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao listar arquivos da pasta',
      details: error.message 
    });
  }
});

export default router;
