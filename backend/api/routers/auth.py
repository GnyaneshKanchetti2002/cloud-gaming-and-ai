import os
import random
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import create_access_token, get_current_user, redis_client
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from fastapi.responses import RedirectResponse

router = APIRouter()

config = Config(environ=os.environ)
oauth = OAuth(config)

# --- PRODUCTION URL HARDENING ---
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://cloud-gaming-and-ai.vercel.app").rstrip("/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")

oauth.register(
    name='discord',
    client_id=os.getenv("DISCORD_CLIENT_ID"),
    client_secret=os.getenv("DISCORD_CLIENT_SECRET"),
    authorize_url='https://discord.com/api/oauth2/authorize',
    access_token_url='https://discord.com/api/oauth2/token',
    userinfo_endpoint='https://discord.com/api/users/@me',
    client_kwargs={'scope': 'identify email'}
)

AZURE_TENANT = os.getenv("AZURE_TENANT_ID", "common")
oauth.register(
    name='azure',
    client_id=os.getenv("AZURE_CLIENT_ID"),
    client_secret=os.getenv("AZURE_CLIENT_SECRET"),
    server_metadata_url=f'https://login.microsoftonline.com/{AZURE_TENANT}/v2.0/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

def generate_moonlight_pin():
    return str(random.randint(1000, 9999))

def generate_ssh_keys():
    return f"ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI{os.urandom(24).hex()} admin@cga_platform"

@router.get("/login/discord")
async def login_discord(request: Request):
    # DYNAMIC REDIRECT: Uses the BACKEND_URL from environment variables
    redirect_uri = f"{BACKEND_URL}/api/auth/callback/discord"
    return await oauth.discord.authorize_redirect(request, redirect_uri)

@router.get("/login/azure")
async def login_azure(request: Request):
    # DYNAMIC REDIRECT: Uses the BACKEND_URL from environment variables
    redirect_uri = f"{BACKEND_URL}/api/auth/callback/azure"
    return await oauth.azure.authorize_redirect(request, redirect_uri)

@router.get("/callback/discord")
async def callback_discord(request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        token = await oauth.discord.authorize_access_token(request)
        resp = await oauth.discord.get('https://discord.com/api/users/@me', token=token)
        user_info = resp.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Discord authentication rejected.")

    email = user_info.get("email")
    username = user_info.get("username")
    discord_id = str(user_info.get("id"))
    
    return process_sso_login(db, response, email, username, "discord", discord_id, models.UserRole.B2C)

@router.get("/callback/azure")
async def callback_azure(request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        token = await oauth.azure.authorize_access_token(request)
        user_info = token.get('userinfo')
    except Exception as e:
        raise HTTPException(status_code=400, detail="Microsoft Entra authentication rejected.")

    email = user_info.get("email") or user_info.get("preferred_username")
    username = user_info.get("name") or email.split('@')[0]
    azure_id = user_info.get("sub")
    
    return process_sso_login(db, response, email, username, "azure", azure_id, models.UserRole.B2B)

def process_sso_login(db: Session, response: Response, email: str, username: str, provider: str, sso_id: str, role: models.UserRole):
    if not email:
        raise HTTPException(status_code=400, detail="Email verification required.")

    user = db.query(models.User).filter((models.User.sso_id == sso_id) | (models.User.email == email)).first()

    if not user:
        user = models.User(
            email=email,
            username=username,
            role=role,
            sso_provider=provider,
            sso_id=sso_id,
        )
        if role == models.UserRole.B2C:
            user.moonlight_pin = generate_moonlight_pin()
        else:
            user.ssh_public_key = generate_ssh_keys()
            
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.wallet:
        new_wallet = models.Wallet(user_id=user.id, balance_hours=0.0)
        db.add(new_wallet)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    # Send user to the Frontend "Sorting Hat"
    redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
    redirect_response = RedirectResponse(url=redirect_url, status_code=302)
    
    # Production Cookie Settings
    IS_PROD = os.getenv("RENDER", "false").lower() == "true"
    redirect_response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=IS_PROD,
        samesite="lax" if not IS_PROD else "none",
        max_age=86400,
        path="/"
    )
    
    return redirect_response

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get("access_token")
    if token:
        # Safety wrapper in case Redis is completely disabled on free tier
        try:
            if redis_client:
                redis_client.setex(f"blacklist_jwt:{token}", 86400, "revoked")
        except Exception:
            pass 
            
    IS_PROD = os.getenv("RENDER", "false").lower() == "true"
    response.delete_cookie(
        "access_token",
        httponly=True,
        secure=IS_PROD,
        samesite="lax" if not IS_PROD else "none",
        path="/"
    )
    return {"status": "Enterprise sessions forcefully terminated."}