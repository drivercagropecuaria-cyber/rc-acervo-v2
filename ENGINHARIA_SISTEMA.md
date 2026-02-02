# ENGENHARIA DO SISTEMA RC ACERVO v2

## 🎯 VISÃO GERAL

Sistema completo de biblioteca de fotos/vídeos da RC Agropecuária com:
- Upload direto para Backblaze B2
- Nomenclatura padronizada automática
- Organização por pastas baseada em metadados
- Busca e filtragem avançada
- Visualização em catálogo

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Dashboard      │  │  Catálogo       │  │  Upload Modal   │              │
│  │  - Estatísticas │  │  - Grid/List    │  │  - Metadados    │              │
│  │  - Filtros      │  │  - Preview      │  │  - Progresso    │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ API REST
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (Node.js)                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  EXPRESS SERVER                                                         ││
│  │  ├── /api/health           → Status do servidor                        ││
│  │  ├── /api/upload/presigned → Gera URL para upload direto ao B2         ││
│  │  ├── /api/upload/complete  → Confirma upload e salva metadados         ││
│  │  ├── /api/media            → Lista todos os arquivos com metadados     ││
│  │  ├── /api/media/:id        → Detalhes de um arquivo                    ││
│  │  ├── /api/folders          → Lista estrutura de pastas                 ││
│  │  └── /api/media/stats      → Estatísticas do acervo                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │  Backblaze Service      │  │  Database Service       │                   │
│  │  - Autenticação B2      │  │  - JSON file (Render)   │                   │
│  │  - Presigned URLs       │  │  - Persiste metadados   │                   │
│  │  - Listar arquivos      │  │  - Busca/Filtros        │                   │
│  │  - Nomenclatura         │  │  - Estatísticas         │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼ S3 API
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKBLAZE B2 (Storage)                             │
│  Bucket: Drive-mkt-RC                                                        │
│  Endpoint: s3.us-east-005.backblazeb2.com                                    │
│                                                                              │
│  Estrutura de Pastas:                                                        │
│  ├── 00_ENTRADA/          → Uploads iniciais (temporário)                   │
│  ├── 01_CATALOGADO/       → Arquivos classificados                          │
│  │   └── ANO/MES/DIA/                                                        │
│  ├── 02_PRODUCAO/         → Em edição                                       │
│  ├── 03_PUBLICADO/        → Aprovados                                       │
│  └── 04_ARQUIVADO/        → Backup/Histórico                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📋 FLUXO DE UPLOAD

```
1. USUÁRIO SELECIONA ARQUIVO
   └── Frontend: UploadModal.tsx
       └── Coleta metadados (área, núcleo, tema, status)

2. FRONTEND PEDE URL DE UPLOAD
   └── POST /api/upload/presigned
       └── Backend gera nome padronizado
       └── Backend pede URL ao B2
       └── Retorna: presignedUrl + headers

3. FRONTEND FAZ UPLOAD DIRETO AO B2
   └── PUT {presignedUrl} (direto do navegador)
       └── Arquivo vai para: 00_ENTRADA/ANO/MES/DIA/
       └── Nome: ANO_MES_DIA_AREA_NUCLEO_TEMA_STATUS_UUID.EXT

4. FRONTEND CONFIRMA UPLOAD
   └── POST /api/upload/complete
       └── Backend salva metadados no "banco"
       └── Backend retorna sucesso

5. ARQUIVO APARECE NO CATÁLOGO
   └── GET /api/media
       └── Frontend busca lista de arquivos
       └── Mostra no grid com metadados
```

## 📝 NOMENCLATURA PADRONIZADA

```
Formato: {ANO}_{MES}_{DIA}_{AREA}_{NUCLEO}_{TEMA}_{STATUS}_{UUID}.{EXT}

Exemplo: 2025_02_01_VILACANABRAVA_CRIA_TERRASERTAO_CATALOGADO_A1B2C3D4.jpg

Componentes:
- ANO: 2025
- MES: 02
- DIA: 01
- AREA: VILACANABRAVA (slug da área)
- NUCLEO: CRIA (slug do núcleo)
- TEMA: TERRASERTAO (slug do tema)
- STATUS: CATALOGADO
- UUID: A1B2C3D4 (8 caracteres)
- EXT: jpg
```

## 💾 BANCO DE DADOS (JSON File)

```typescript
interface MediaItem {
  id: string;                    // Identificador único
  fileName: string;              // Nome do arquivo
  filePath: string;              // Caminho no B2
  size: number;                  // Tamanho em bytes
  contentType: string;           // MIME type
  uploadedAt: string;            // ISO date
  url: string;                   // URL pública do B2
  
  // Metadados da RC
  area: string;                  // Área/Fazenda
  nucleo?: string;               // Núcleo
  tema: string;                  // Tema principal
  status: string;                // Status do material
  ponto?: string;                // Ponto específico
  tipoProjeto?: string;          // Tipo de projeto
  funcaoHistorica?: string;      // Função histórica
  
  // Componentes do nome
  ano: string;
  mes: string;
  dia: string;
  uuid: string;
  extensao: string;
}
```

## 🔧 VARIÁVEIS DE AMBIENTE

```env
# Backend
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.vercel.app

# Backblaze B2
B2_ACCOUNT_ID=seu_account_id
B2_APPLICATION_KEY=sua_application_key
B2_BUCKET_NAME=seu_bucket_name
B2_BUCKET_ID=seu_bucket_id
```

## 🚀 DEPLOY

### Backend (Render)
1. Criar Web Service
2. Conectar repositório GitHub
3. Build Command: `npm install && npm run build`
4. Start Command: `node server.ts` (ou `npm run start`)
5. Adicionar Environment Variables

### Frontend (Vercel/Netlify)
1. Build do React
2. Environment: `VITE_API_URL=https://seu-backend.onrender.com`
3. Deploy
