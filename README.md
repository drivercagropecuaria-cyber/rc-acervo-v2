# RC Acervo v2 - Sistema de Biblioteca de Fotos

Sistema completo de gerenciamento de acervo fotográfico e audiovisual da RC Agropecuária.

## 🚀 Funcionalidades

- **Upload Direto**: Arquivos vão direto para Backblaze B2
- **Nomenclatura Automática**: Nome padronizado baseado em metadados
- **Organização por Pastas**: Estrutura automática (ANO/MES/DIA)
- **Catálogo Completo**: Visualização com filtros e busca
- **Dashboard**: Estatísticas em tempo real

## 📁 Estrutura

```
rc-acervo-v2/
├── routes/            # Rotas da API (Express)
├── services/          # Serviços do backend
├── server.ts          # Servidor principal (API)
├── types.ts           # Tipos compartilhados do backend
├── src/               # Frontend React + TypeScript
│   ├── components/    # Componentes React
│   ├── services/      # API client
│   ├── types.ts       # Tipos do frontend
│   ├── App.tsx        # App principal
│   └── main.tsx       # Entrada do React
└── ENGENHARIA_SISTEMA.md  # Documentação técnica
```

## 🔧 Configuração

### Backend (Render)

1. Crie um Web Service no Render
2. Conecte ao repositório GitHub
3. Configure as variáveis de ambiente:

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.vercel.app

B2_ACCOUNT_ID=seu_account_id
B2_APPLICATION_KEY=sua_application_key
B2_BUCKET_NAME=seu_bucket_name
B2_BUCKET_ID=seu_bucket_id
```

4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`

### Frontend (Vercel/Netlify)

1. Crie arquivo `.env`:

```env
VITE_API_URL=https://seu-backend.onrender.com
```

2. Build: `npm run build`
3. Deploy da pasta `dist/`

## 📋 API Endpoints

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/health` | GET | Status do servidor |
| `/api/upload/presigned` | POST | Gera URL para upload |
| `/api/upload/complete` | POST | Confirma upload |
| `/api/media` | GET | Lista mídias |
| `/api/media/stats` | GET | Estatísticas |
| `/api/folders` | GET | Lista pastas |

## 📝 Nomenclatura de Arquivos

```
Formato: ANO_MES_DIA_AREA_NUCLEO_TEMA_STATUS_UUID.EXT

Exemplo: 2025_02_01_VILACANABRAVA_CRIA_TERRASERTAO_CATALOGADO_A1B2C3D4.jpg
```

## 🏗️ Arquitetura

```
Frontend (React) → Backend (Node.js) → Backblaze B2 (Storage)
                         ↓
                    Database (JSON file)
```

## 💰 Custos

- **Backblaze B2**: ~$0.006/GB/mês
- **Render (Free)**: $0 (dorme após 15min)
- **Render (Starter)**: $7/mês

## 📞 Suporte

Para dúvidas ou problemas, entre em contato.
