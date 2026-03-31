# backend/init_db.py

import os
from sqlalchemy import create_engine, text
from api.database import Base
from api import models 

def init():
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("ERROR: DATABASE_URL not found in environment variables.")
        return

    # Fix Render's deprecated 'postgres://' URI scheme
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print("Connecting to database for initialization...")
    
    try:
        temp_engine = create_engine(db_url)
        
        # 1. CREATE TABLES: Safe to run in production, only creates if missing.
        print("Checking base database schema...")
        Base.metadata.create_all(bind=temp_engine)
        
        # 2. FORCE COLUMN SYNC: Inject the new columns if they were missed by Alembic.
        print("Checking for missing columns...")
        with temp_engine.connect() as conn:
            # IF NOT EXISTS makes this perfectly safe to run on every deploy
            conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_resolution VARCHAR;'))
            conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_fps INTEGER;'))
            conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS sunshine_host_id VARCHAR;'))
            conn.commit()
            
        print("Database verification and schema sync complete!")
        
    except Exception as e:
        print(f"CRITICAL ERROR during database init: {e}")
        exit(1)

if __name__ == "__main__":
    init()