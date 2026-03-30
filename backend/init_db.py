import os
from sqlalchemy import create_engine
from api.database import Base
from api import models 

def init():
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("ERROR: DATABASE_URL not found in environment variables.")
        return

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print(f"Connecting to database for initialization...")
    
    try:
        temp_engine = create_engine(db_url)
        
        # We only CREATE tables now. We never DROP them in production.
        print("Checking database schema...")
        Base.metadata.create_all(bind=temp_engine)
        
        print("Database verification complete!")
        
    except Exception as e:
        print(f"CRITICAL ERROR during database init: {e}")
        exit(1)

if __name__ == "__main__":
    init()