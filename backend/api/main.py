# backend/api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

# --- 1. IMPORT ROUTERS ---
# Note: Ensure 'games' is imported here after creating the router file
from api.routers import auth, users, payments, proxmox, games 

# --- 2. INITIALIZE APP ---
# This MUST happen before adding middleware or including routers
app = FastAPI(
    title="Liquid Compute Pool API",
    description="Backend API for high-performance cloud gaming and AI compute"
)

# --- 3. SESSION CONFIGURATION (OAUTH) ---
# Authlib needs this to store OAuth state during the Discord/Azure handshake.
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")

# Render automatically sets the 'RENDER' environment variable to 'true'.
IS_PROD = os.getenv("RENDER", "false").lower() == "true"

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    max_age=3600,            # 1 hour session lifetime
    https_only=IS_PROD,      # Only send cookies over HTTPS in production
    same_site="lax"          # Essential for cross-site OAuth redirects
)

# --- 4. STRICT CORS CONFIGURATION (LOCALHOST KILL) ---
frontend_url = os.getenv("FRONTEND_URL", "https://cloud-gaming-and-ai.vercel.app").rstrip("/")

if IS_PROD:
    # PRODUCTION MODE: Strictly allow only the Vercel domain. Localhost is killed.
    origins = [frontend_url]
else:
    # DEVELOPMENT MODE: Allow localhost for local testing.
    origins = [
        "http://localhost:3000",      
        "http://127.0.0.1:3000",      
        frontend_url,                 
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,       # Required for HttpOnly cookies and Auth headers
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 5. INCLUDE ROUTERS ---
# All routers are included here after the 'app' instance is fully defined
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
        "message": "Liquid Compute Pool Backend is running smoothly!"
    }

@app.get("/health", tags=["system"])
def health_check():
    """Endpoint for Render/Uptime monitoring"""
    return {"status": "healthy"}