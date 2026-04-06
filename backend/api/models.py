# backend/api/models.py
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
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

class HardwareTier(str, enum.Enum):
    ESPORTS = "esports"
    AAA = "aaa"
    ULTRA = "ultra"
    ENTERPRISE = "enterprise"

class HardwareStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    OFFLINE = "OFFLINE"
    REBOOTING = "REBOOTING"

class HardwareNode(Base):
    __tablename__ = "hardware_nodes"
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(String, unique=True, index=True, nullable=False)
    tailscale_ip = Column(String, nullable=False)
    tier = Column(Enum(HardwareTier), nullable=False)
    status = Column(Enum(HardwareStatus), default=HardwareStatus.OFFLINE, nullable=False)
    last_heartbeat = Column(DateTime(timezone=True), nullable=True)
    current_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    sso_provider = Column(String, nullable=True)
    sso_id = Column(String, unique=True, index=True, nullable=True) 
    hashed_password = Column(String, nullable=True)
    
    # --- Profile Config Fields ---
    moonlight_pin = Column(String, nullable=True)
    preferred_resolution = Column(String, default="1080p")
    preferred_fps = Column(Integer, default=60)
    sunshine_host_id = Column(String, nullable=True) 
    target_resolution = Column(String, default="1080p") 
    # -----------------------------
    
    # --- NEW: Enterprise Config Fields ---
    vcore_limit = Column(Integer, default=100, nullable=False)
    vram_limit = Column(Integer, default=120, nullable=False)
    # -----------------------------
    
    totp_secret = Column(String, nullable=True)

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
    
    # Tiered Compute Balances (B2C)
    esports_hours = Column(Float, default=0.0)
    aaa_hours = Column(Float, default=0.0)
    ultra_hours = Column(Float, default=0.0)
    
    # NEW: Enterprise Balance (B2B)
    enterprise_balance = Column(Float, default=0.0)
    
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
    tier_id = Column(String, nullable=True)
    credits_deducted = Column(Float, nullable=True)
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

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    amount = Column(Float)
    hours = Column(Float)
    tier = Column(String)
    stripe_session_id = Column(String, unique=True, index=True, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_user_id = Column(Integer, nullable=True)
    action_type = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())