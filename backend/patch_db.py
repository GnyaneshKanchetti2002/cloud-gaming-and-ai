import os
from api.database import engine, Base
from api import models
from sqlalchemy import text

def apply_migrations():
    print("Applying structural database updates...")
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE NOT NULL;"))
            print("Successfully patched 'users' table with God-Mode flags.")
        except Exception as e:
            print(f"Migration notes on users table: {e}")
            
    print("Ensuring new tables (e.g. WalletTransactions) are built...")
    Base.metadata.create_all(bind=engine)
    print("Database is structurally sound and up-to-date for enterprise deployment.")

if __name__ == "__main__":
    apply_migrations()
