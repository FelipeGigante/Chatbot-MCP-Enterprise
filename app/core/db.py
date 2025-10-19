from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.models import Base

# Cria o motor de conexão
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={
        "client_encoding": "utf8" # Força o cliente a usar UTF-8
    }
)

# Cria a Sessão de Banco de Dados
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Função de dependência para o FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Função para criar todas as tabelas
def init_db():
    Base.metadata.create_all(bind=engine)