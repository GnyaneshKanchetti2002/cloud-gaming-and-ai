import os
import redis
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, UserRole

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cga_platform_secret_key_0987654321")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(request: Request, db: Session = Depends(get_db)):
    # Safely extract from HttpOnly Cookies
    token = request.cookies.get("access_token")
    if not token:
        # Fallback to Authorization Header for Postman / API testing 
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token missing or cookie expired.")

    # High-Velocity Redis Kill-Switch (Wrapped in Try/Except for Safety)
    try:
        is_blacklisted = redis_client.get(f"blacklist_jwt:{token}")
        if is_blacklisted:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session permanently terminated by administrator.")
    except redis.exceptions.ConnectionError:
        # If Redis is not running or not configured on Render yet, 
        # bypass the blacklist check instead of crashing the login flow.
        pass

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token architecture.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cryptographic user no longer exists.")
    
    if user.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Identity permanently suspended. Access denied by Administrator.")
        
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Identity removed from the system.")
    
    return user

# Strict RBAC Dependencies injected into routes
def get_b2b_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.B2B_ENTERPRISE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="RESTRICTED ZONE: Azure Identity Enterprise privileges strictly required.")
    return current_user

def get_b2c_user(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.B2C_GAMER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="RESTRICTED ZONE: Active Gaming Pass identity required.")
    return current_user

def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="RESTRICTED ZONE: Global Administrator privileges strictly required.")
    return current_user