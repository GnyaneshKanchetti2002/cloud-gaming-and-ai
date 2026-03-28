import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Fetch the Database URL from the environment, with a local fallback
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:password@localhost:5432/cloudgaming" 
)

# 2. Fix Render's URL format (SQLAlchemy requires 'postgresql://')
if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Create the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 4. Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Create the Base class for your database models
Base = declarative_base()


# --- ADD THIS FUNCTION AT THE BOTTOM ---
# 6. Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()