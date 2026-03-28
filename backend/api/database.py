import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Enterprise-grade PostgreSQL deployment handling high concurrency load for 6:00 PM rushes
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://myuser:mypassword@localhost:5432/cga_db"
)

# Robust connection pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, pool_size=20, max_overflow=50
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
