import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from .database import Base

# -------------------------------------------------------------------
# ENUMS: The Guardrails for your State Machine
# -------------------------------------------------------------------
class UserRole(str, enum.Enum):
    B2B_ENTERPRISE = "b2b_enterprise"
    B2C_GAMER = "b2c_gamer"

class InstanceStatus(str, enum.Enum):
    PENDING = "pending"             # API received request, waiting for Celery
    PROVISIONING = "provisioning"   # Proxmox is actively cloning or mounting SAN
    RUNNING = "running"             # VM is online, QEMU Guest Agent responding, billing active
    STOPPING = "stopping"           # Safely unmounting B2B data, do not re-slice yet
    DESTROYING = "destroying"       # Vaporizing the B2C gaming clone
    ERROR = "error"                 # Hardware/Network failure, billing paused, admin alerted

# -------------------------------------------------------------------
# CORE MODELS
# -------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    
    # Enterprise Infrastructure & SSO Mapping
    sso_provider = Column(String, nullable=True)          # 'azure', 'discord', 'google', 'local'
    sso_id = Column(String, unique=True, index=True, nullable=True) 
    hashed_password = Column(String, nullable=True)       # Nullable because SSO users don't have passwords
    
    # Zero-Touch Configuration (Injected into QEMU Guest Agent)
    moonlight_pin = Column(Integer, nullable=True)        # 4-Digit auto-generated PIN for B2C
    ssh_public_key = Column(String, nullable=True)        # Generated RSA/Ed25519 key for B2B
    
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
    balance_hours = Column(Float, default=0.0)  # Used for 20-Hour Standard Passes
    
    # Relationships
    user = relationship("User", back_populates="wallet")

class Instance(Base):
    """
    The core record tying a user to a physical Proxmox Virtual Machine.
    """
    __tablename__ = "instances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    node_name = Column(String, nullable=False) # Retaining for frontend dashboard naming
    
    # Hardware & Hypervisor Tracking
    proxmox_vmid = Column(Integer, nullable=True)          # e.g., 105 (crucial for API commands)
    physical_node = Column(String, nullable=True)          # e.g., 'pve-node-04'
    vlan_id = Column(Integer, nullable=True)               # e.g., 101 (Micro-segmentation)
    os_template = Column(String, nullable=True)            # e.g., 'WINDOWS_11_GAMER'
    
    # Resource Allocation
    vram_allocation = Column(Integer, nullable=False)      # e.g., 12 or 24 (in GB)
    ip_address = Column(String, nullable=True)             # The dynamic IP assigned to the VM
    
    # State Machine
    status = Column(Enum(InstanceStatus), default=InstanceStatus.PENDING, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="instances")
    telemetry = relationship("SessionTelemetry", back_populates="instance", uselist=False)

class SessionTelemetry(Base):
    """
    The black box recorder for SLA enforcement, upsells, and refund defense.
    """
    __tablename__ = "session_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    instance_id = Column(Integer, ForeignKey("instances.id"), unique=True, nullable=False)
    
    # Time Tracking (UTC)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    
    # Performance & Diagnostics
    vram_peak_usage = Column(Float, nullable=True)         # Monitored for B2B upsells (e.g., 11.9 GB)
    network_ping = Column(Integer, nullable=True)          # Average latency in ms (Refund defense)
    
    # Lifecycle Logging
    termination_reason = Column(String, nullable=True)     # e.g., 'USER_STOP', 'FUNDS_DEPLETED', 'SHIFT_CHANGE'
    
    # Relationships
    instance = relationship("Instance", back_populates="telemetry")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False) # The admin who authorized
    hours_added = Column(Float, nullable=False) # Negative if deducted
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    reason = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[admin_id])
