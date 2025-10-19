from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import uuid
from sqlalchemy import ForeignKey, Enum
import enum


class DocumentStatus(enum.Enum):
    PENDING = "PENDENTE"
    PROCESSING = "PROCESSANDO"
    COMPLETED = "CONCLUÍDO"
    FAILED = "FALHOU"

Base = declarative_base()

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    client_token = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    hashed_password = Column(String)
    
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Client(name='{self.name}', token='{self.client_token}')>"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    # Relação de Chave Estrangeira: liga o doc ao client_token
    client_id = Column(String, ForeignKey("clients.client_token"), index=True) 
    filename = Column(String)
    file_path = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    status = Column(
        Enum('PENDENTE', 'PROCESSANDO', 'CONCLUÍDO', 'FALHOU', name="document_status_enum"),
        default='PENDENTE',
        nullable=False
    )