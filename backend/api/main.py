from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import your routers (adjust these if your file names are different)
from api.routers import auth, users, payments, proxmox 

app = FastAPI()

# --- CORS Configuration ---
# Add your future Vercel URL here once you have it
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