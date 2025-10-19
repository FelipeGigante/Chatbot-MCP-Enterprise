from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ChatQuery(BaseModel):
    """Schema para a requisição de consulta do chatbot."""
    query: str = Field(..., description="A pergunta do usuário final.")
    client_token: str = Field(..., description="O token de segurança/identificação do cliente (Tenant ID).")

class ChatResponse(BaseModel):
    """Schema para a resposta do chatbot."""
    answer: str = Field(..., description="A resposta gerada pelo RAG.")
    
class UploadResponse(BaseModel):
    """Schema para a resposta após o upload e ingestão."""
    message: str
    filename: str
    client_id: str

class Token(BaseModel):
    """Resposta com o Access Token e o tipo."""
    access_token: str
    token_type: str = "bearer"
    client_token: str # Retornamos o client_token para ser usado no iframe

class TokenData(BaseModel):
    """Dados contidos dentro do JWT."""
    sub: Optional[str] = None # 'sub' é o padrão JWT para Subject

class ClientCreate(BaseModel):
    """Dados para criação de um novo cliente (cadastro)."""
    name: str
    email: str
    password: str
    
class ClientLogin(BaseModel):
    """Dados para o login."""
    email: str
    password: str

class DocumentSchema(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    status: str
    
    class Config:
        from_attributes = True