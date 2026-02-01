/**
 * Servidor Principal - RC Acervo Backend v2
 * 
 * API REST para gerenciamento de biblioteca de fotos e vídeos
 * Integração com Backblaze B2 para storage
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Importa rotas
import uploadRoutes from './routes/upload.routes';
import mediaRoutes from './routes/media.routes';
import folderRoutes from './routes/folder.routes';

// Cria aplicação Express
const app = express();
const PORT = process.env.PORT || 3001;

// Configuração CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Bz-File-Name', 'X-Bz-Content-Sha1'],
  credentials: true,
};

app.use(cors(corsOptions));

// Parse JSON com limite aumentado para uploads grandes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROTAS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rotas da API
app.use('/api/upload', uploadRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/folders', folderRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'RC Acervo API v2',
    endpoints: {
      health: '/api/health',
      upload: {
        presigned: 'POST /api/upload/presigned',
        complete: 'POST /api/upload/complete',
        test: 'GET /api/upload/test',
      },
      media: {
        list: 'GET /api/media',
        stats: 'GET /api/media/stats',
        detail: 'GET /api/media/:id',
        download: 'GET /api/media/:id/url',
      },
      folders: {
        list: 'GET /api/folders',
        structure: 'GET /api/folders/structure',
        files: 'GET /api/folders/:folderPath/files',
      },
    },
  });
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path,
  });
});

// Tratamento de erros gerais
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Inicia servidor
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          RC ACERVO API v2 - Servidor Iniciado              ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Porta: ${PORT.toString().padEnd(50)} ║`);
  console.log(`║  Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(47)} ║`);
  console.log(`║  Frontend: ${(process.env.FRONTEND_URL || '*').padEnd(47)} ║`);
  console.log('║                                                            ║');
  console.log('║  Endpoints:                                                ║');
  console.log('║    • GET  /api/health         → Status do servidor         ║');
  console.log('║    • POST /api/upload/presigned → URL de upload            ║');
  console.log('║    • POST /api/upload/complete  → Confirma upload          ║');
  console.log('║    • GET  /api/media          → Lista mídias               ║');
  console.log('║    • GET  /api/folders        → Lista pastas               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
});

export default app;
