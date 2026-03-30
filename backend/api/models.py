import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from .database import Base

# -------------------------------------------------------------------
# ENUMS: The Guardrails for your State Machine
# -------------------------------------------------------------------
class UserRole(str, enum.Enum):
    B2B = "B2B"  # Matches frontend 'B2B' logic
    B2C = "B2C"  # Matches frontend 'B2C' logic

class InstanceStatus(str, enum.Enum):
    PENDING = "pending"             # API received request, waiting for Celery
    PROVISIONING = "provisioning"   # Proxmox is actively cloning or mounting SAN
    RUNNING = "running"             # VM is online, billing active
    STOPPING = "stopping"           # Safely unmounting B2B data
    DESTROYING = "destroying"       # Vaporizing the B2C gaming clone
    ERROR = "error"                 # Hardware failure, billing paused

# -------------------------------------------------------------------
# CORE MODELS
# -------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True) # Added for Discord display names
    role = Column(Enum(UserRole), nullable=False)
    
    # Enterprise Infrastructure & SSO Mapping
    sso_provider = Column(String, nullable=True)          # 'discord', 'google', etc.
    sso_id = Column(String, unique=True, index=True, nullable=True) 
    hashed_password = Column(String, nullable=True)
    
    # Zero-Touch Configuration
    # FIX: Changed to String. If a PIN is 0521, Integer makes it 521, breaking login.
    moonlight_pin = Column(String, nullable=True)         
    ssh_public_key = Column(String, nullable=True)        # For B2B RSA keys
    
    # Admin & Moderation Flags
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    instances = relationship("Instance", back_populates="user")

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    balance_hours = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="wallet")

class Instance(Base):
    """
    Ties a user to a physical Proxmox VM.
    """
    __tablename__ = "instances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    node_name = Column(String, nullable=False) 
    
    # Hardware & Hypervisor Tracking
    proxmox_vmid = Column(Integer, nullable=True)          # e.g., 105
    physical_node = Column(String, nullable=True)          # e.g., 'pve-node-04'
    vlan_id = Column(Integer, nullable=True)               # Micro-segmentation
    os_template = Column(String, nullable=True)            # e.g., 'WINDOWS_11_GAMER'
    
    # Resource Allocation
    vram_allocation = Column(Integer, nullable=False)      # VRAM slice size in GB
    ip_address = Column(String, nullable=True)
    
    # State Machine
    status = Column(Enum(InstanceStatus), default=InstanceStatus.PENDING, nullable=False)
    
    user = relationship("User", back_populates="instances")
    telemetry = relationship("SessionTelemetry", back_populates="instance", uselist=False)

class SessionTelemetry(Base):
    """
    Black box recorder for SLA and performance.
    """
    __tablename__ = "session_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("instances.id"), unique=True, nullable=False)
    
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    
    vram_peak_usage = Column(Float, nullable=True)
    network_ping = Column(Integer, nullable=True)
    termination_reason = Column(String, nullable=True)
    
    instance = relationship("Instance", back_populates="telemetry")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hours_added = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    reason = Column(String, nullable=True)
    
    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[admin_id])