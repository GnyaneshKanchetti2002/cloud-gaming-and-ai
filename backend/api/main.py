from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware  # <--- 1. ADDED IMPORT
import os

# Import your routers (adjust these if your file names are different)
from api.routers import auth, users, payments, proxmox 

app = FastAPI()

# --- Session Configuration (ADDED FOR OAUTH) ---
# Authlib requires a session to temporarily store the OAuth state during login
# In Render, you should add a 'SECRET_KEY' environment variable with a long random string.
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-session-key-change-this-later")

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    max_age=3600  # 1 hour session lifetime
)

# --- CORS Configuration ---
origins = [
    "http://localhost:3000", # Local Next.js
    os.getenv("FRONTEND_URL", "https://cloud-gaming-and-ai.vercel.app") # Production Next.js
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
# This connects your separate route files to the main application
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(proxmox.router, prefix="/api/proxmox", tags=["proxmox"])

# Optional: A simple health check route to verify the server is running
@app.get("/")
def read_root():
    return {"status": "Backend is running smoothly!"}