# 🚀 RAG MVP: Chatbot Inteligente

> **Sistema completo de chatbot empresarial com RAG (Retrieval-Augmented Generation)**

Um serviço de chatbot de produção que permite empresas criarem assistentes de IA treinados em seus próprios documentos (PDFs), com widget embarcável, autenticação segura, e processamento assíncrono.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Features](#-features)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Sistema](#-executando-o-sistema)
- [Guia de Uso](#-guia-de-uso)
- [API Endpoints](#-api-endpoints)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Troubleshooting](#-troubleshooting)
- [Segurança](#-segurança)

---

## 🎯 Visão Geral

Este projeto é um **MVP (Produto Mínimo Viável)** de um serviço de chatbot que utiliza **RAG (Retrieval-Augmented Generation)** para responder perguntas baseadas exclusivamente nos documentos fornecidos por cada cliente.

### O que é RAG?

RAG (Retrieval-Augmented Generation) é uma técnica de IA que combina:
1. **Recuperação de Informação**: Busca os trechos mais relevantes em documentos vetorizados
2. **Geração de Texto**: Usa esses trechos como contexto para a LLM gerar respostas precisas

**Diferencial**: O chatbot responde APENAS com informações dos documentos do cliente, evitando "alucinações" da IA.

### Componentes Principais

- **Backend (Python/FastAPI)**: API REST, lógica RAG, segurança JWT, PostgreSQL, filas assíncronas (Celery + Redis)
- **Frontend Portal (HTML/CSS/JS)**: Dashboard para registro, login, upload de documentos e gerenciamento
- **Widget Embarcável**: `<iframe>` para instalação em qualquer site sem necessidade de código backend

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE FINAL                           │
│  (Visita site da empresa e interage com o widget do chatbot)   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │   Widget Embarcável (iframe) │ ← Instalado no site do cliente
         │   chatbot-widget.html        │
         └─────────────┬────────────────┘
                       │ POST /api/v1/chat
                       │ {query, client_token}
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────┐  │
│  │   Endpoints  │──▶│  RAG Service   │──▶│  ChromaDB        │  │
│  │   (7 APIs)   │   │  (LangChain)   │   │  (Vector Store)  │  │
│  └──────────────┘   └────────────────┘   └──────────────────┘  │
│         │                    │                                   │
│         │                    ▼                                   │
│         │           ┌────────────────┐                          │
│         │           │  Celery Worker │ ← Processa PDFs          │
│         │           │  (Assíncrono)  │   em background          │
│         │           └────────────────┘                          │
│         │                    │                                   │
│         ▼                    ▼                                   │
│  ┌──────────────┐   ┌────────────────┐                          │
│  │  PostgreSQL  │   │  Redis Cloud   │                          │
│  │  (Clientes,  │   │  (Fila/Broker) │                          │
│  │  Documentos) │   └────────────────┘                          │
│  └──────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
                       ▲
                       │
         ┌─────────────┴────────────────┐
         │   Dashboard Admin            │ ← Usado pelo dono da empresa
         │   (client-portal/)           │
         │   - Registro/Login           │
         │   - Upload de PDFs           │
         │   - Obter código do widget   │
         └──────────────────────────────┘
```

### Fluxo de Trabalho

1. **Registro**: Empresa se cadastra no dashboard → Recebe `client_token` único
2. **Upload**: Empresa envia PDFs → Celery processa em background → Cria embeddings no ChromaDB
3. **Integração**: Empresa copia código `<iframe>` com seu token → Cola no site
4. **Uso**: Cliente final faz pergunta → RAG busca trechos relevantes → OpenAI gera resposta

---

## ✨ Features

### Para Empresas (Clientes do Sistema)
- ✅ Registro e autenticação com JWT
- ✅ Upload de múltiplos PDFs (base de conhecimento)
- ✅ Dashboard para gerenciamento de documentos
- ✅ Monitoramento de status de processamento (PENDING → PROCESSING → COMPLETED)
- ✅ Código de widget pronto para copiar/colar
- ✅ Multi-tenancy (isolamento total entre clientes)

### Para Usuários Finais (Visitantes do Site)
- ✅ Interface de chat limpa e responsiva
- ✅ Respostas baseadas exclusivamente nos documentos da empresa
- ✅ Experiência sem necessidade de login
- ✅ Proteção contra prompt injection (guardrails de segurança)

### Técnicas
- ✅ RAG com ChromaDB (vector database)
- ✅ Embeddings OpenAI
- ✅ Processamento assíncrono com Celery + Redis
- ✅ Segurança JWT + Bcrypt
- ✅ API RESTful com FastAPI
- ✅ Persistência PostgreSQL

---

## 🛠️ Tecnologias

### Backend
- **Python 3.9+**
- **FastAPI** - Framework web de alta performance
- **SQLAlchemy** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **Celery** - Fila de tarefas assíncronas
- **Redis Cloud** - Broker de mensagens
- **LangChain** - Orquestração de RAG
- **ChromaDB** - Vector database para embeddings
- **OpenAI API** - Embeddings e geração de texto (GPT-3.5-turbo)
- **PyPDF** - Processamento de arquivos PDF
- **python-jose** - JWT tokens
- **passlib** - Hash de senhas com bcrypt

### Frontend
- **HTML5** + **CSS3** + **JavaScript (Vanilla)**
- **Fetch API** para requisições HTTP
- **LocalStorage** para persistência de tokens

---

## 📦 Pré-requisitos

### Software Necessário
- **Python 3.9+** ([Download](https://www.python.org/downloads/))
- **PostgreSQL 12+** ([Download](https://www.postgresql.org/download/))
- **Redis** (ou conta no [Redis Cloud](https://redis.com/try-free/) - grátis)
- **Git** (opcional, para controle de versão)

### Contas Externas
- **OpenAI API Key** ([Obter aqui](https://platform.openai.com/api-keys))
- **Redis Cloud** (opcional, para produção)

### Conhecimentos Recomendados
- Python básico
- Conceitos de REST API
- HTML/CSS/JavaScript básico
- SQL básico

---

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone <seu-repositorio>
cd Chatbot-MCP-Enterprise
```

### 2. Crie um Ambiente Virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Instale as Dependências

```bash
pip install -r requirements.txt
```

### 4. Crie as Pastas Necessárias

As pastas `data/` e `chroma_db/` serão criadas automaticamente se não existirem. Certifique-se de que o projeto tem a seguinte estrutura:

```
Chatbot-MCP-Enterprise/
├── app/                    # Código Python
├── client-portal/          # Dashboard frontend
├── client-website/         # Widget embarcável
├── data/                   # Upload de PDFs (criado automaticamente)
├── chroma_db/              # Vector database (criado automaticamente)
├── venv/                   # Ambiente virtual Python
├── .env                    # Variáveis de ambiente (criar manualmente)
├── requirements.txt
└── README.md
```

---

## ⚙️ Configuração

### 1. Configure o PostgreSQL

#### Criar Database

```sql
-- Conecte ao PostgreSQL e execute:
CREATE DATABASE chatbot_db;
CREATE USER chatbot_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE chatbot_db TO chatbot_user;
```

### 2. Configure o Redis

#### Opção A: Redis Cloud (Recomendado para Produção)
1. Crie conta em [redis.com/try-free](https://redis.com/try-free/)
2. Crie um database
3. Copie o **Endpoint** (ex: `redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345`)
4. Copie a **senha**

#### Opção B: Redis Local (Desenvolvimento)
```bash
# Windows (via WSL ou Docker)
docker run -d -p 6379:6379 redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# Mac
brew install redis
brew services start redis
```

### 3. Crie o Arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```ini
# ========================================
# DATABASE (PostgreSQL)
# ========================================
POSTGRES_USER=chatbot_user
POSTGRES_PASSWORD=sua_senha_segura
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_DB=chatbot_db

# ========================================
# SEGURANÇA & IA
# ========================================
# Obtenha em: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Gere com: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=sua_chave_secreta_super_longa_e_aleatoria

# ========================================
# REDIS (Filas Assíncronas)
# ========================================
# Opção A - Redis Cloud:
REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=sua_senha_redis

# Opção B - Redis Local:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=

# ========================================
# CELERY (Filas)
# ========================================
# Redis Cloud:
CELERY_REDIS_DSN=redis://:sua_senha_redis@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345/0

# Redis Local:
# CELERY_REDIS_DSN=redis://localhost:6379/0

CELERY_BROKER_URL=${CELERY_REDIS_DSN}
CELERY_RESULT_BACKEND=${CELERY_REDIS_DSN}

# ========================================
# GOOGLE (Opcional - Futuro OAuth)
# ========================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ========================================
# CONFIGURAÇÕES DE UPLOAD
# ========================================
UPLOAD_FOLDER=./data
```

**IMPORTANTE**: Substitua todos os valores placeholder pelos seus dados reais.

#### Gerar SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## ▶️ Executando o Sistema

O sistema requer **3 processos simultâneos** para funcionar corretamente. Abra 3 terminais separados:

### Terminal 1: Servidor FastAPI

Inicia a API REST e cria/atualiza as tabelas do PostgreSQL automaticamente.

```bash
# Certifique-se de estar no diretório raiz e com venv ativo
uvicorn app.main:app --reload
```

**Saída esperada:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Acesse**: http://localhost:8000/docs (Documentação interativa da API)

### Terminal 2: Worker Celery

Processa a ingestão de PDFs em background (cria embeddings e popula o ChromaDB).

```bash
# Windows
celery -A app.core.celery_app worker -l info --pool=solo

# Linux/Mac
celery -A app.core.celery_app worker -l info
```

**Saída esperada:**
```
[tasks]
  . app.services.rag_service.ingest_document_task

[2025-01-17 10:00:00,000: INFO/MainProcess] Connected to redis://...
[2025-01-17 10:00:00,000: INFO/MainProcess] celery@hostname ready.
```

### Terminal 3: Frontend

Abra o portal de gerenciamento no navegador.

#### Opção A: Abrir arquivo diretamente
```
Abra no navegador: /client-portal/index.html
```

#### Opção B: Servidor local (Recomendado)
```bash
# Python 3
cd client-portal
python -m http.server 8080

# Acesse: http://localhost:8080
```

---

## 📖 Guia de Uso

### 1️⃣ Registro de Nova Empresa

1. Acesse `client-portal/index.html`
2. Clique em **"Começar Agora"** ou **"Registrar"**
3. Preencha:
   - Nome da empresa
   - Email
   - Senha
4. Clique em **"Registrar"**
5. Você será redirecionado para o **Dashboard**

### 2️⃣ Upload de Documentos

No Dashboard:

1. Vá até a seção **"Base de Conhecimento"**
2. Clique em **"Escolher Arquivo"** e selecione um PDF
3. Clique em **"Upload"**
4. O status será exibido:
   - ⏳ **PENDING** - Na fila
   - 🔄 **PROCESSING** - Sendo processado pelo Celery
   - ✅ **COMPLETED** - Pronto para uso
   - ❌ **FAILED** - Erro no processamento

**Observação**: O processamento pode levar de 15 segundos a alguns minutos dependendo do tamanho do PDF.

### 3️⃣ Integrar Widget no Site

No Dashboard:

1. Localize a seção **"Código de Integração"**
2. Clique em **"Copiar Código"**
3. Cole o código no HTML do seu site (antes de `</body>`):

```html
<!-- Cole este código no seu site -->
<iframe
  src="http://localhost:8000/static/chatbot-widget.html?token=SEU_CLIENT_TOKEN_AQUI"
  width="380"
  height="500"
  frameborder="0"
  style="position: fixed; bottom: 20px; right: 20px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.2);">
</iframe>
```

**Para Produção**: Substitua `localhost:8000` pelo domínio do seu servidor (ex: `https://api.suaempresa.com`).

### 4️⃣ Testar o Chatbot

1. Abra o arquivo `client-website/index.html` no navegador (site de demonstração)
2. Ou acesse seu próprio site onde colou o widget
3. Digite uma pergunta relacionada aos documentos enviados
4. O chatbot responderá com base APENAS no conteúdo dos PDFs

**Exemplo de Pergunta**:
- "Qual o horário de funcionamento?"
- "Como faço para cancelar meu pedido?"
- "Quais são os métodos de pagamento aceitos?"

---

## 🔌 API Endpoints

A API está disponível em `http://localhost:8000/api/v1/`

### Autenticação

#### `POST /api/v1/register`
Registra um novo cliente.

**Request:**
```json
{
  "name": "Empresa XYZ",
  "email": "contato@empresa.com",
  "password": "senha_segura123"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "client_token": "8d3f4ea0-2fa6-48b9-a8be-0a4f31f5f4e7"
}
```

#### `POST /api/v1/token`
Realiza login e retorna JWT.

**Request:**
```json
{
  "email": "contato@empresa.com",
  "password": "senha_segura123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Documentos

#### `POST /api/v1/documents/upload`
Faz upload de um PDF (requer JWT).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request (multipart/form-data):**
- `file`: Arquivo PDF

**Response (202):**
```json
{
  "message": "Documento enviado com sucesso e será processado em breve.",
  "document_id": 42,
  "status": "PENDING"
}
```

#### `GET /api/v1/documents`
Lista documentos do cliente autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "documents": [
    {
      "id": 42,
      "filename": "manual.pdf",
      "uploaded_at": "2025-01-17T10:30:00",
      "status": "COMPLETED"
    }
  ]
}
```

#### `GET /api/v1/documents/download/{document_id}`
Baixa o PDF original (requer JWT).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response**: Arquivo PDF

### Chat

#### `POST /api/v1/chat`
Envia pergunta ao chatbot (NÃO requer JWT, usa client_token).

**Request:**
```json
{
  "query": "Qual é o horário de atendimento?",
  "client_token": "8d3f4ea0-2fa6-48b9-a8be-0a4f31f5f4e7"
}
```

**Response (200):**
```json
{
  "answer": "De acordo com os documentos, o horário de atendimento é de segunda a sexta, das 9h às 18h."
}
```

---

## 📁 Estrutura do Projeto

```
Chatbot-MCP-Enterprise/
│
├── app/                              # Backend Python
│   ├── main.py                       # Aplicação FastAPI principal
│   ├── api/                          # Camada de API
│   │   ├── endpoints.py              # 7 endpoints REST
│   │   └── schemas.py                # Modelos Pydantic (validação)
│   ├── core/                         # Configurações e utilitários
│   │   ├── config.py                 # Carregamento do .env
│   │   ├── db.py                     # Conexão PostgreSQL
│   │   ├── models.py                 # Modelos ORM (Client, Document)
│   │   ├── security.py               # JWT e bcrypt
│   │   └── celery_app.py             # Configuração Celery
│   └── services/                     # Lógica de negócio
│       └── rag_service.py            # RAG (ChromaDB + LangChain + OpenAI)
│
├── client-portal/                    # Dashboard Frontend
│   ├── index.html                    # Landing page
│   ├── register.html                 # Página de registro
│   ├── login.html                    # Página de login
│   ├── dashboard.html                # Painel administrativo
│   ├── script.js                     # Lógica da landing page
│   ├── dashboard-script.js           # Lógica do dashboard (upload, polling)
│   ├── styles.css                    # Estilos landing page
│   └── dashboard-styles.css          # Estilos dashboard
│
├── client-website/                   # Widget Embarcável
│   ├── index.html                    # Site de demonstração
│   └── chatbot-widget.html           # Widget do chatbot (iframe)
│
├── data/                             # Armazenamento temporário de PDFs
│   └── [arquivos_pdf_upload]         # Deletados após processamento
│
├── chroma_db/                        # Vector Database (ChromaDB)
│   └── [collections_por_cliente]     # Uma coleção por client_token
│
├── venv/                             # Ambiente virtual Python
│
├── .env                              # Variáveis de ambiente (não versionado)
├── .gitignore                        # Arquivos ignorados pelo Git
├── requirements.txt                  # Dependências Python
└── README.md                         # Documentação (este arquivo)
```

### Arquivos Principais

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `app/main.py` | 38 | Inicialização FastAPI, CORS, rotas |
| `app/api/endpoints.py` | 201 | Implementação dos 7 endpoints |
| `app/services/rag_service.py` | 194 | Pipeline RAG, embeddings, ChromaDB |
| `client-portal/dashboard-script.js` | 200+ | Lógica upload, polling, autenticação |
| `client-website/chatbot-widget.html` | 90+ | Interface do chat embarcável |

---

## 🔧 Troubleshooting

### Problema: Erro ao conectar no PostgreSQL

**Erro:**
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```

**Solução:**
1. Verifique se o PostgreSQL está rodando:
   ```bash
   # Windows
   services.msc → PostgreSQL

   # Linux
   sudo systemctl status postgresql
   ```
2. Confirme credenciais no `.env`:
   ```ini
   POSTGRES_USER=chatbot_user
   POSTGRES_PASSWORD=sua_senha
   POSTGRES_SERVER=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=chatbot_db
   ```
3. Teste conexão:
   ```bash
   psql -U chatbot_user -d chatbot_db -h localhost
   ```

---

### Problema: Worker Celery não processa documentos

**Sintoma**: Status fica eternamente em `PENDING`

**Solução:**
1. Verifique se o worker está rodando:
   ```bash
   celery -A app.core.celery_app worker -l info --pool=solo
   ```
2. Confirme conexão com Redis:
   ```bash
   # Teste local
   redis-cli ping
   # Deve retornar: PONG
   ```
3. Verifique logs do Celery para erros
4. Confirme `CELERY_REDIS_DSN` no `.env`:
   ```ini
   CELERY_REDIS_DSN=redis://:senha@host:porta/0
   ```

---

### Problema: OpenAI API retorna erro 401

**Erro:**
```
openai.error.AuthenticationError: Incorrect API key provided
```

**Solução:**
1. Verifique a chave no `.env`:
   ```ini
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxx
   ```
2. Confirme que a chave é válida em [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Verifique saldo de créditos OpenAI

---

### Problema: Widget não aparece no site

**Solução:**
1. Confirme que o servidor FastAPI está rodando (http://localhost:8000)
2. Verifique o código do iframe:
   ```html
   <iframe src="http://localhost:8000/static/chatbot-widget.html?token=SEU_TOKEN"></iframe>
   ```
3. Abra DevTools (F12) → Console → Verifique erros CORS
4. Certifique-se de que o `client_token` está correto

---

### Problema: Respostas vazias ou genéricas

**Sintoma**: Chatbot responde "Não encontrei informações" mesmo com PDFs enviados

**Solução:**
1. Verifique se o documento está `COMPLETED`:
   ```bash
   curl -X GET http://localhost:8000/api/v1/documents \
     -H "Authorization: Bearer SEU_JWT"
   ```
2. Confirme que a pergunta está relacionada ao conteúdo do PDF
3. Verifique logs do RAG Service para erros de embedding
4. Teste query direta no ChromaDB:
   ```python
   from app.services.rag_service import RAGService
   rag = RAGService()
   results = rag.vector_store.similarity_search("sua pergunta", k=3)
   print(results)
   ```

---

### Problema: Erro "ModuleNotFoundError"

**Solução:**
1. Ative o ambiente virtual:
   ```bash
   # Windows
   venv\Scripts\activate

   # Linux/Mac
   source venv/bin/activate
   ```
2. Reinstale dependências:
   ```bash
   pip install -r requirements.txt
   ```

---

## 🔒 Segurança

### Implementações de Segurança

#### 1. Autenticação JWT
- Tokens expiram em 30 minutos
- Assinados com `SECRET_KEY` (HS256)
- Validação obrigatória em endpoints protegidos

#### 2. Hash de Senhas
- Bcrypt com salt automático
- Algoritmo: `pbkdf2_sha256`
- Senhas nunca armazenadas em texto plano

#### 3. Multi-Tenancy
- Isolamento total entre clientes via `client_token` (UUID)
- Coleções separadas no ChromaDB por tenant
- Foreign keys garantem acesso somente aos próprios documentos

#### 4. Proteção contra Prompt Injection
- Guardrail prompt analisa tentativas de manipulação
- Retorna "RISCO" se detectar padrões suspeitos
- Bloqueia resposta antes de processar query

#### 5. CORS
- Configurado para permitir origens específicas
- Headers permitidos: Authorization, Content-Type
- Métodos: GET, POST, PUT, DELETE

#### 6. Validação de Entrada
- Pydantic valida todos requests
- Tipo MIME verificado em uploads (application/pdf)
- Sanitização de nomes de arquivo

### Boas Práticas Recomendadas

1. **NÃO commite o `.env`** (já está no `.gitignore`)
2. **Use HTTPS em produção** (certifique-se de configurar SSL/TLS)
3. **Rotacione SECRET_KEY periodicamente**
4. **Limite tamanho de upload** (FastAPI permite configurar max_upload_size)
5. **Monitore logs de acesso** para detectar atividades suspeitas
6. **Atualize dependências regularmente**:
   ```bash
   pip list --outdated
   pip install --upgrade <pacote>
   ```

### Variáveis Sensíveis

**NUNCA exponha publicamente**:
- `OPENAI_API_KEY`
- `SECRET_KEY`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`

---

## 📝 Notas Adicionais

### Limitações Conhecidas

- **Tamanho de PDF**: Arquivos muito grandes (>50MB) podem causar timeout no processamento
- **Idioma**: RAG funciona melhor com documentos em português/inglês
- **Formato**: Apenas PDFs suportados (sem DOCX, TXT, etc.)
- **Custo OpenAI**: Embeddings e chat consomem tokens (monitore uso em [platform.openai.com/usage](https://platform.openai.com/usage))

### Roadmap Futuro

- [ ] Suporte a múltiplos tipos de arquivo (DOCX, TXT, HTML)
- [ ] Interface de customização do widget (cores, logo, mensagens)
- [ ] Analytics de uso do chatbot
- [ ] Feedback de qualidade das respostas
- [ ] Suporte a múltiplas LLMs (Anthropic Claude, Llama, etc.)
- [ ] Modo offline com embeddings locais
- [ ] Integração com Google Drive/Dropbox para upload
- [ ] Webhooks para notificações de status
- [ ] Autenticação com Google
- [ ] Tornar <iframe> mais seguro do lado do Cliente

---


## 📧 Suporte

Para dúvidas ou problemas:

1. Verifique a seção [Troubleshooting](#-troubleshooting)
2. Consulte a documentação da API em http://localhost:8000/docs
3. Revise os logs do terminal (FastAPI, Celery, navegador)

---

**Desenvolvido com ❤️ usando FastAPI, LangChain e OpenAI**
