# backend/init_db.py
import os
from sqlalchemy import create_engine
from api.database import Base
from api import models 

def init():
    # 1. Fetch the URL from Render environment
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("ERROR: DATABASE_URL not found in environment variables.")
        return

    # 2. FIX: SQLAlchemy 1.4+ and 2.0+ require 'postgresql://', not 'postgres://'
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print(f"Connecting to database for initialization...")
    
    try:
        temp_engine = create_engine(db_url)
        
        # --- NEW CODE: DROP EXISTING TABLES ---
        print("Dropping old outdated tables...")
        Base.metadata.drop_all(bind=temp_engine)
        
        # --- REBUILD TABLES ---
        print("Creating fresh database tables with new schema...")
        Base.metadata.create_all(bind=temp_engine)
        
        print("Database reset and tables created successfully!")
        
    except Exception as e:
        print(f"CRITICAL ERROR during database init: {e}")
        exit(1)

if __name__ == "__main__":
    init()