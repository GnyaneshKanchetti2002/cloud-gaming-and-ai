# backend/api/schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
# Ensure these are imported correctly from your local models file
from .models import InstanceStatus, UserRole

# --- User Schemas ---

class UserBase(BaseModel):
    email: EmailStr # Changed to EmailStr for better validation if using pydantic[email]
    role: UserRole  # This will return 'B2B' or 'B2C' as defined in your Enum

class UserCreate(UserBase):
    password: Optional[str] = None
    username: Optional[str] = None # Added for Discord/Display name support

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
    username: Optional[str] = None # Helpful for displaying "Welcome, Aryan"
    moonlight_pin: Optional[str] = None # Changed to str as PINs can have leading zeros
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

class InstanceResponse(InstanceBase):
    id: int
    user_id: int
    node_name: str
    ip_address: Optional[str] = None
    proxmox_vmid: Optional[int] = None
    physical_node: Optional[str] = None
    vlan_id: Optional[int] = None
    status: InstanceStatus

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