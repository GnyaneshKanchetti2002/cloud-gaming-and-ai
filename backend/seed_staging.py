import sys
import os
import sqlite3
from sqlalchemy import create_engine

# Ensure the backend folder is in the path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from api.database import Base
from api.models import UserRole

# --- STAGING OVERRIDE ---
# We create a local SQLite engine specifically for this script 
# to avoid the Postgres connection error.
STAGING_DB_PATH = os.path.join("backend", "cga_staging.db")
sqlite_url = f"sqlite:///{STAGING_DB_PATH}"
staging_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def seed_db():
    # --- STEP 1: CREATE TABLES ---
    print(f"Creating tables in: {STAGING_DB_PATH}...")
    # Use our local staging_engine instead of the one from api.database
    Base.metadata.create_all(bind=staging_engine)

    # --- STEP 2: SEED DATA ---
    conn = sqlite3.connect(STAGING_DB_PATH)
    cursor = conn.cursor()

    try:
        print("Seeding test users...")
        # 1. Create a Test Gamer (B2C)
        cursor.execute("""
            INSERT INTO users (email, username, role, sso_provider, is_active, is_admin)
            VALUES ('gamer@test.com', 'ProGamer_99', 'B2C', 'discord', 1, 0)
        """)
        gamer_id = cursor.lastrowid

        # 2. Create a Test Enterprise (B2B)
        cursor.execute("""
            INSERT INTO users (email, username, role, sso_provider, is_active, is_admin)
            VALUES ('ceo@enterprise.com', 'Enterprise_Client', 'B2B', 'azure', 1, 0)
        """)
        corp_id = cursor.lastrowid

        # 3. Give them Wallets
        cursor.execute("INSERT INTO wallets (user_id, balance_hours) VALUES (?, ?)", (gamer_id, 10.0))
        cursor.execute("INSERT INTO wallets (user_id, balance_hours) VALUES (?, ?)", (corp_id, 500.0))

        conn.commit()
        print("✅ Staging DB seeded successfully!")
    
    except sqlite3.IntegrityError:
        print("⚠️ Users already exist in the staging database. Skipping seed.")
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_db()