# backend/api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

# Import your routers
from api.routers import auth, users, payments, proxmox 

app = FastAPI(title="Liquid Compute Pool API")

# --- 1. SESSION CONFIGURATION (OAUTH) ---
# Authlib needs this to store OAuth state during the Discord/Azure handshake
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-session-key-change-this-later")

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    max_age=3600  # 1 hour session lifetime
)

# --- 2. CORS CONFIGURATION ---
origins = [
    "http://localhost:3000",      # Local Next.js
    "http://127.0.0.1:3000",      # Local Next.js (IP fallback)
    os.getenv("FRONTEND_URL", "https://cloud-gaming-and-ai.vercel.app") 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. INCLUDE ROUTERS ---
# The prefixes here match your frontend fetch calls
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(proxmox.router, prefix="/api/proxmox", tags=["proxmox"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Liquid Compute Pool Backend is running smoothly!"
    }