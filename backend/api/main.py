from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

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