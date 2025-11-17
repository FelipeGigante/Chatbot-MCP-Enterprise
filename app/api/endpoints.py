import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import FileResponse
from mimetypes import guess_type
from sqlalchemy.orm import Session

from app.core.models import Document, DocumentStatus, Client
from app.services.rag_service import ingest_document_task, rag_service_instance
from app.api.schemas import ChatQuery, ChatResponse, UploadResponse, DocumentSchema, ClientCreate, ClientLogin, Token
from app.core.config import settings
from app.core.security import get_password_hash, create_access_token, decode_access_token, verify_password 
from app.core.db import get_db


router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def validate_client_token(client_token: str, db: Session = Depends(get_db)) -> str:
    """Verifica se o token existe e está ativo no PostgreSQL."""
    client = db.query(Client).filter(
        Client.client_token == client_token,
        Client.is_active == True
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=401, 
            detail="Token de cliente inválido ou não autorizado. Cliente não encontrado ou inativo."
        )
        
    return client.client_token

async def get_current_client_token(token: str = Depends(oauth2_scheme)) -> str:
    """Verifica o JWT e retorna o client_token do usuário logado."""
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Token de autenticação inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    client_token_from_jwt = payload.get("client_token")
    if client_token_from_jwt is None:
         raise HTTPException(status_code=401, detail="Token mal formado.")
    
    return client_token_from_jwt


@router.post("/documents/upload", response_model=UploadResponse, status_code=202)
async def upload_document(
    client_token: str = Depends(get_current_client_token), 
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(('.pdf')):
        raise HTTPException(
            status_code=400, 
            detail="Formato de arquivo não suportado. Apenas PDF é permitido."
        )

    safe_filename = f"{client_token}_{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_FOLDER, safe_filename)
    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print(f"Erro ao salvar arquivo: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar o arquivo no disco.")

    new_doc = Document(
        client_id=client_token,
        filename=file.filename,
        file_path=file_path,
        status=DocumentStatus.PENDING
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    try:
        task = ingest_document_task.delay(new_doc.id)
        
        return UploadResponse(
            message=f"Processamento iniciado em segundo plano. ID da Tarefa: {task.id}",
            filename=file.filename,
            client_id=client_token,
            doc_id=new_doc.id
        )

    except Exception as e:
        db.delete(new_doc)
        db.commit()
        if os.path.exists(file_path): os.remove(file_path)
        print(f"Erro ao disparar tarefa Celery: {e}") 
        raise HTTPException(
            status_code=503, 
            detail="Serviço de Processamento (Fila) está indisponível. Tente novamente mais tarde."
        )

@router.post("/chat", response_model=ChatResponse)
async def chat_query(data: ChatQuery, db: Session = Depends(get_db)):
    tenant_id = validate_client_token(data.client_token, db)
    answer = rag_service_instance.query_rag_service(data.query, tenant_id)
    
    if "Desculpe, houve um erro interno" in answer:
        raise HTTPException(status_code=503, detail=answer)
        
    return ChatResponse(answer=answer)

@router.post("/register", response_model=Token, status_code=201)
async def register_client(data: ClientCreate, db: Session = Depends(get_db)):
    """Cria um novo cliente e retorna um JWT."""
    if db.query(Client).filter(Client.email == data.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

    hashed_password = get_password_hash(data.password)

    new_client = Client(
        name=data.name,
        email=data.email,
        hashed_password=hashed_password
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    access_token = create_access_token(
        data={"sub": new_client.email, "client_token": new_client.client_token}
    )

    return Token(
        access_token=access_token, 
        client_token=new_client.client_token
    )

@router.post("/token", response_model=Token)
async def login_for_access_token(data: ClientLogin, db: Session = Depends(get_db)):
    """Autentica o cliente e retorna o JWT (Login)."""
    client = db.query(Client).filter(Client.email == data.email).first()

    if not client or not verify_password(data.password, client.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Credenciais inválidas.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": client.email, "client_token": client.client_token}
    )

    return Token(
        access_token=access_token, 
        client_token=client.client_token
    )

@router.get("/documents", response_model=List[DocumentSchema])
async def get_document_history(
    tenant_id: str = Depends(get_current_client_token),
    db: Session = Depends(get_db)
):
    documents = db.query(Document).filter(
        Document.client_id == tenant_id
    ).all()
    
    return documents

@router.get("/documents/download/{document_id}")
async def download_document(
    document_id: int,
    tenant_id: str = Depends(get_current_client_token),
    db: Session = Depends(get_db)
):
    """Permite o download do documento APENAS se o JWT for válido e o documento
    pertencer ao cliente logado (tenant_id)."""
    doc = db.query(Document).filter(
        Document.id == document_id,
        Document.client_id == tenant_id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado ou acesso negado.")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado no servidor.")

    mime_type, _ = guess_type(doc.file_path)
    return FileResponse(
        doc.file_path, 
        media_type=mime_type or 'application/octet-stream', 
        filename=doc.filename
    )