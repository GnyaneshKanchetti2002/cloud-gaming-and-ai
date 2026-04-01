# backend/api/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .models import InstanceStatus, UserRole

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: Optional[str] = None
    username: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: UserRole

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    id: int
    username: Optional[str] = None
    moonlight_pin: Optional[str] = None
    is_admin: bool
    is_active: bool
    is_banned: bool
    
    class Config:
        from_attributes = True

# --- Instance Schemas ---
class InstanceBase(BaseModel):
    vram_allocation: int
    os_template: str

class InstanceCreate(InstanceBase):
    node_name: str
    user_id: int
    # NEW: Accept the launcher choice from the frontend platform picker
    launcher: Optional[str] = "Steam" 

class InstanceResponse(InstanceBase):
    id: int
    user_id: int
    node_name: str
    ip_address: Optional[str] = None
    proxmox_vmid: Optional[int] = None
    physical_node: Optional[str] = None
    vlan_id: Optional[int] = None
    status: InstanceStatus
    
    # NEW: Added so frontend can verify sync
    session_start_time: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Telemetry Schemas ---
class SessionTelemetryBase(BaseModel):
    instance_id: int

class SessionTelemetryResponse(SessionTelemetryBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    vram_peak_usage: Optional[float] = None
    termination_reason: Optional[str] = None
    network_ping: Optional[int] = None

    class Config:
        from_attributes = True

# --- Wallet Schemas ---
class WalletTransactionResponse(BaseModel):
    id: int
    user_id: int
    admin_id: int
    hours_added: float
    timestamp: datetime
    reason: Optional[str] = None

    class Config:
        from_attributes = True