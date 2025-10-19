from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.db import init_db 
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="RAG Fullstack MVP API",
    description="API para o serviço de Chatbot RAG embarcado.",
    version="1.0.0",
)

app.mount("/static", StaticFiles(directory="client-website"), name="static")

@app.on_event("startup")
def on_startup():
    print("Criando tabelas DB...")
    init_db()

origins = [
    "*",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Roteador de APIs
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "RAG MVP API está rodando!"}