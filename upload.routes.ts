/**
 * Rotas de Upload
 * 
 * POST /api/upload/presigned - Gera URL para upload direto ao B2
 * POST /api/upload/complete - Confirma upload e salva metadados
 * GET /api/upload/test - Testa conexão com B2
 */

import { Router } from 'express';
import { generateStandardFileName, getUploadUrl, B2_CONFIG, authorizeB2 } from '../services/backblaze.service';
import { saveMetadata, getMetadataByPath } from '../services/database.service';
import { MediaMetadata } from '../types';

const router = Router();

/**
 * POST /api/upload/presigned
 * Gera URL presigned para upload direto ao Backblaze B2
 */
router.post('/presigned', async (req, res) => {
  try {
    console.log('[POST /api/upload/presigned] Recebendo requisição');
    
    const { filename, contentType, size, metadata } = req.body;
    
    // Validação
    if (!filename) {
      console.error('[POST /api/upload/presigned] Erro: filename não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: 'Filename é obrigatório' 
      });
    }
    
    if (!metadata || !metadata.area || !metadata.tema) {
      console.error('[POST /api/upload/presigned] Erro: metadados incompletos');
      return res.status(400).json({ 
        success: false, 
        error: 'Metadados (area, tema) são obrigatórios' 
      });
    }
    
    console.log(`[POST /api/upload/presigned] Arquivo: ${filename}`);
    console.log(`[POST /api/upload/presigned] Metadados:`, metadata);
    
    // Gera nome padronizado
    const { fileName, folderPath, fullPath } = generateStandardFileName(filename, {
      area: metadata.area,
      nucleo: metadata.nucleo,
      tema: metadata.tema,
      status: metadata.status || 'Entrada (Bruto)',
    });
    
    // Obtém URL de upload do B2
    const uploadData = await getUploadUrl(fullPath);
    
    console.log(`[POST /api/upload/presigned] URL gerada para: ${fullPath}`);
    
    // Retorna dados para o frontend
    res.json({
      success: true,
      data: {
        presignedUrl: uploadData.uploadUrl,
        authorizationToken: uploadData.authorizationToken,
        fileName,
        filePath: fullPath,
        folderPath,
        headers: {
          'Authorization': uploadData.authorizationToken,
          'X-Bz-File-Name': encodeURIComponent(fullPath),
          'Content-Type': contentType || 'application/octet-stream',
          'X-Bz-Content-Sha1': 'do_not_verify',
        }
      }
    });
    
  } catch (error: any) {
    console.error('[POST /api/upload/presigned] Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar URL de upload',
      details: error.message 
    });
  }
});

/**
 * POST /api/upload/complete
 * Confirma upload e salva metadados no banco de dados
 */
router.post('/complete', async (req, res) => {
  try {
    console.log('[POST /api/upload/complete] Recebendo confirmação de upload');
    
    const { filePath, metadata } = req.body;
    
    if (!filePath) {
      console.error('[POST /api/upload/complete] Erro: filePath não fornecido');
      return res.status(400).json({ 
        success: false, 
        error: 'filePath é obrigatório' 
      });
    }
    
    console.log(`[POST /api/upload/complete] Arquivo: ${filePath}`);
    
    // Extrai informações do caminho
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    
    // Extrai componentes do nome
    const nameParts = fileName.split('_');
    let ano = '', mes = '', dia = '', uuid = '', extensao = '';
    
    if (nameParts.length >= 8) {
      ano = nameParts[0];
      mes = nameParts[1];
      dia = nameParts[2];
      const uuidExt = nameParts[7]?.split('.') || ['', ''];
      uuid = uuidExt[0] || '';
      extensao = uuidExt[1] || '';
    }
    
    // Gera ID único
    const id = fileName.replace(/\./g, '_');
    
    // Verifica se já existe
    const existing = getMetadataByPath(filePath);
    if (existing) {
      console.log(`[POST /api/upload/complete] Arquivo já existe: ${id}`);
    }
    
    // Monta objeto de metadados
    const mediaMetadata: MediaMetadata = {
      id,
      fileName,
      filePath,
      size: metadata?.size || 0,
      contentType: metadata?.contentType || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      url: `https://f005.backblazeb2.com/file/${B2_CONFIG.bucketName}/${filePath}`,
      thumbnailUrl: `https://f005.backblazeb2.com/file/${B2_CONFIG.bucketName}/${filePath}`,
      
      // Metadados da RC
      area: metadata?.area || 'GERAL',
      nucleo: metadata?.nucleo,
      tema: metadata?.tema || 'GERAL',
      status: metadata?.status || 'Entrada (Bruto)',
      ponto: metadata?.ponto,
      tipoProjeto: metadata?.tipoProjeto,
      funcaoHistorica: metadata?.funcaoHistorica,
      evento: metadata?.evento,
      
      // Componentes do nome
      ano,
      mes,
      dia,
      uuid,
      extensao,
    };
    
    // Salva no banco de dados
    saveMetadata(mediaMetadata);
    
    console.log(`[POST /api/upload/complete] Metadados salvos: ${id}`);
    
    res.json({
      success: true,
      data: {
        message: 'Upload confirmado e catalogado com sucesso',
        id: mediaMetadata.id,
        filePath: mediaMetadata.filePath,
        url: mediaMetadata.url,
      }
    });
    
  } catch (error: any) {
    console.error('[POST /api/upload/complete] Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao confirmar upload',
      details: error.message 
    });
  }
});

/**
 * GET /api/upload/test
 * Testa conexão com Backblaze B2
 */
router.get('/test', async (req, res) => {
  try {
    console.log('[GET /api/upload/test] Testando conexão com B2');
    
    const auth = await authorizeB2();
    
    res.json({
      success: true,
      message: 'Conexão com Backblaze B2 estabelecida com sucesso',
      data: {
        apiUrl: auth.apiUrl,
        downloadUrl: auth.downloadUrl,
        bucketName: B2_CONFIG.bucketName,
      }
    });
    
  } catch (error: any) {
    console.error('[GET /api/upload/test] Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Falha na conexão com Backblaze B2',
      details: error.message 
    });
  }
});

export default router;
