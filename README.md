# 🚀 RAG Fullstack MVP: Chatbot Embeddable Assíncrono

Este projeto é um Produto Mínimo Viável (MVP) de um serviço de chatbot que utiliza **Geração Aumentada por Recuperação (RAG)** para responder a perguntas baseadas exclusivamente nos documentos fornecidos pelo cliente.

## O serviço é composto por:
- **Backend (Python/FastAPI)**: Lógica RAG, Segurança JWT, PostgreSQL e Filas Assíncronas (Celery + Redis Cloud).
- **Frontend (HTML/JS)**: Um Portal de Gerenciamento e um Widget de Chatbot (`<iframe>`) para fácil adoção (instalação zero-código).

---

## ⚙️ 1. Configuração do Ambiente

### 1.1. Estrutura de Pastas Essencial

Crie as seguintes pastas na raiz do projeto:

| Pasta                     | Propósito                                                                 |
|---------------------------|---------------------------------------------------------------------------|
| `app/`                    | Contém todo o código Python (FastAPI, RAG, Celery, Modelos).             |
| `data/`                   | Armazenamento Essencial. Onde os PDFs são salvos temporariamente antes e durante o processamento do RAG. |
| `client-portal/`          | Frontend do Dashboard de Login/Cadastro/Upload.                         |
| `client-website-simulator/` | Arquivos do Widget de Chatbot (`<iframe>`) e o site de demonstração.   |

---

### 1.2. Instalação de Dependências

Certifique-se de que você está em um ambiente virtual (venv) ativo e instale todos os pacotes:

```bash
pip install -r requirements.txt
```

---

### 1.3. Configuração do Arquivo `.env`

Crie o arquivo `.env` na raiz do projeto. Substitua os placeholders pelos seus dados reais do PostgreSQL, Redis Cloud e OpenAI.

#### Snippet de código:
```ini
# --- DATABASE (PostgreSQL) ---
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_SERVER=
POSTGRES_PORT=
POSTGRES_DB=

# --- SEGURANÇA & LLM ---
OPENAI_API_KEY="SUA_CHAVE_AQUI"
SECRET_KEY="SUA_CHAVE_SECRETA_LONGA"

# --- FILAS ASSÍNCRONAS (Redis Cloud) ---
CELERY_REDIS_DSN="redis://:SUA_SENHA_REDIS@SEU_HOST:SUA_PORTA/0"
CELERY_BROKER_URL=${CELERY_REDIS_DSN}
CELERY_RESULT_BACKEND=${CELERY_REDIS_DSN}

# --- PASTAS ---
UPLOAD_FOLDER="./data"
```

---

## 3. Comandos de Execução (3 Processos)

Abra três terminais separados na raiz do projeto e execute os comandos abaixo. O sistema só funcionará se os três processos estiverem ativos e as credenciais do `.env` estiverem corretas.

### 3.1. Processo 1: Servidor Web (FastAPI/Uvicorn)

Inicia a API principal, lida com HTTP e cria/atualiza as tabelas do DB na inicialização.

```bash
uvicorn app.main:app --reload
```

---

### 3.2. Processo 2: Worker Assíncrono (Celery)

Este é o motor RAG. Ele processa a ingestão de documentos em segundo plano, usando o Redis Cloud.

```bash
celery -A app.core.celery_app worker -l info --pool=solo
```

---

### 3.3. Processo 3: Acesso ao Frontend

Abra o portal no seu navegador para começar a usar o sistema:

```bash
# Para iniciar o fluxo de usuário:
# Abra este arquivo no seu navegador (via file:// ou rodando um servidor simples)
client-portal/index.html
```