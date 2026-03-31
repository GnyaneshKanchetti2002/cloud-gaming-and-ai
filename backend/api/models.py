# backend/api/models.py
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class UserRole(str, enum.Enum):
    B2B = "B2B"
    B2C = "B2C"

class InstanceStatus(str, enum.Enum):
    PENDING = "pending"
    PROVISIONING = "provisioning"
    RUNNING = "running"
    STOPPING = "stopping"
    DESTROYING = "destroying"
    ERROR = "error"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    sso_provider = Column(String, nullable=True)
    sso_id = Column(String, unique=True, index=True, nullable=True) 
    hashed_password = Column(String, nullable=True)
    moonlight_pin = Column(String, nullable=True)        
    ssh_public_key = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_banned = Column(Boolean, default=False, nullable=False)
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    instances = relationship("Instance", back_populates="user")

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    balance_hours = Column(Float, default=0.0)
    user = relationship("User", back_populates="wallet")

class Instance(Base):
    __tablename__ = "instances"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    node_name = Column(String, nullable=False) 
    proxmox_vmid = Column(Integer, nullable=True)
    physical_node = Column(String, nullable=True)
    vlan_id = Column(Integer, nullable=True)
    os_template = Column(String, nullable=True)
    vram_allocation = Column(Integer, nullable=False)
    ip_address = Column(String, nullable=True)
    status = Column(Enum(InstanceStatus), default=InstanceStatus.PENDING, nullable=False)
    
    # NEW: Track when the billing clock starts
    session_start_time = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", back_populates="instances")
    telemetry = relationship("SessionTelemetry", back_populates="instance", uselist=False)

class SessionTelemetry(Base):
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
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Can be System ID (0) for auto-deductions
    hours_added = Column(Float, nullable=False) # Can be negative for deductions
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    reason = Column(String, nullable=True)
    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[admin_id])