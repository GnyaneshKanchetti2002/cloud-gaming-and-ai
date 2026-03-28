import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from api.routers import proxmox, payments, auth, users

app = FastAPI(title="Cloud Gaming & AI Orchestration API")

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("JWT_SECRET_KEY", "cga_platform_secret_key_0987654321")
)

# Setup CORS for Next.js frontend default port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication & IAM"])
app.include_router(users.router, prefix="/api/users", tags=["User & Access Control"])
app.include_router(proxmox.router, prefix="/api/proxmox", tags=["Hardware Orchestration"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Dual-Sided Compute Platform Core API"}
