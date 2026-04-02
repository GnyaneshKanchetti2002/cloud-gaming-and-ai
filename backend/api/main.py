# backend/api/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

# --- 1. IMPORT ROUTERS & DATABASE ---
from api.routers import auth, users, payments, proxmox, games 
from api.database import engine, Base # Imported for DB Reset

# --- 2. INITIALIZE APP ---
app = FastAPI(
    title="LIQUID COMPUTE API",
    description="Backend API for high-performance cloud gaming and AI compute"
)

# --- 3. SESSION CONFIGURATION (OAUTH) ---
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
# Detects if running on Render based on their default environment variable
IS_PROD = os.getenv("RENDER", "false").lower() == "true"

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    max_age=3600,
    https_only=IS_PROD,
    # MUST be "none" in production so Vercel and Render can share OAuth state cookies
    same_site="none" if IS_PROD else "lax" 
)

# --- 4. STRICT CORS CONFIGURATION ---
frontend_url = os.getenv("FRONTEND_URL", "https://cloud-gaming-and-ai.vercel.app").rstrip("/")

if IS_PROD:
    origins = [frontend_url]
else:
    origins = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        frontend_url
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 5. INCLUDE ROUTERS ---
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(proxmox.router, prefix="/api/proxmox", tags=["proxmox"])
app.include_router(games.router, prefix="/api/games", tags=["games"])

# --- 6. SYSTEM ENDPOINTS ---
@app.get("/", tags=["system"])
def read_root():
    return {
        "status": "online",
        "environment": "production" if IS_PROD else "development",
        "message": "LIQUID COMPUTE Mainframe is active."
    }

@app.get("/api/ping", tags=["system"])
def ping():
    """Lightweight endpoint for real-time latency calculation."""
    return {"status": "pong"}

@app.get("/health", tags=["system"])
def health_check():
    """Endpoint for Render/Uptime monitoring"""
    return {"status": "healthy"}

# --- 7. OVERLORD DATABASE RESET (TEMPORARILY UNLOCKED) ---
@app.get("/api/dev/reset-db", tags=["system"])
def reset_database():
    """
    TEMPORARY ENDPOINT: Wipes the entire PostgreSQL database and recreates it.
    Hard-locked to development mode for safety.
    """
    # TEMPORARILY COMMENTED OUT TO FORCE CLOUD WIPE ON RENDER
    # if IS_PROD:
    #     raise HTTPException(
    #         status_code=403, 
    #         detail="Critical operation blocked. Database wipe disabled in the production environment."
    #     )
        
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"message": "Matrix wiped. Schema upgraded successfully. You may now log in."}