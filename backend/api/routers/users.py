# backend/api/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_admin_user, get_current_user, redis_client
from ..tasks import destroy_node_logic 

router = APIRouter()

# --- Request Schemas ---
class RoleUpdateRequest(BaseModel):
    role: models.UserRole

class WalletUpdateRequest(BaseModel):
    hours_added: float
    reason: str
    tier: str = "aaa" # Added to support tiered allocations from the admin panel

class AdminUpdateRequest(BaseModel):
    is_admin: bool

class ConfigUpdate(BaseModel):
    target_resolution: str

# --- Profile Config Sync ---
@router.put("/config")
def update_user_config(
    req: ConfigUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Syncs the user's preferred rendering resolution (1080p, 1440p, 4K)."""
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    user.target_resolution = req.target_resolution
    db.commit()
    return {"message": "Config updated", "target_resolution": user.target_resolution}

# --- Identity Sorter ---
@router.get("/me", response_model=schemas.UserResponse)
def get_my_profile(
    current_user: models.User = Depends(get_current_user)
):
    """
    CRITICAL: This is the endpoint used by the frontend /auth/callback 
    to determine if the user is B2B or B2C and redirect them correctly.
    """
    return current_user

@router.get("/wallet/{user_id}")
def get_wallet_balance(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Fetches the user's current tiered wallet balance."""
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Unauthorized to view this wallet.")

    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    
    if not wallet:
        wallet = models.Wallet(user_id=user_id, esports_hours=0.0, aaa_hours=0.0, ultra_hours=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    return {
        "esports_hours": wallet.esports_hours,
        "aaa_hours": wallet.aaa_hours,
        "ultra_hours": wallet.ultra_hours
    }

# --- Admin Endpoints ---
@router.get("/", response_model=List[dict])
def list_users(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    users = db.query(models.User).filter(
        models.User.is_active == True
    ).order_by(models.User.id.desc()).offset(skip).limit(limit).all()
    
    results = []
    for user in users:
        total_balance = 0.0
        if user.wallet:
            total_balance = user.wallet.esports_hours + user.wallet.aaa_hours + user.wallet.ultra_hours
            
        results.append({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "sso_provider": user.sso_provider,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "is_banned": user.is_banned,
            "balance_hours": total_balance
        })
    return results

@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    request: RoleUpdateRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(
        models.User.id == user_id, 
        models.User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = request.role
    db.commit()
    return {"status": "success", "message": f"Identity privileges updated to {request.role}"}

@router.put("/{user_id}/admin")
def update_user_admin_status(
    user_id: int,
    request: AdminUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found")

    # Safety Check: Prevent the admin from revoking their own access
    if user.id == current_admin.id and not request.is_admin:
        raise HTTPException(status_code=400, detail="Protocol Violation: You cannot revoke your own OMEGA CLEARANCE.")

    user.is_admin = request.is_admin
    db.commit()
    
    status_msg = "granted OMEGA CLEARANCE" if request.is_admin else "stripped of OMEGA CLEARANCE"
    return {"status": "success", "message": f"Identity {status_msg}."}

@router.put("/{user_id}/wallet")
def update_user_wallet(
    user_id: int,
    request: WalletUpdateRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found")
        
    # Auto-create wallet if missing
    if not user.wallet:
        new_wallet = models.Wallet(user_id=user.id, esports_hours=0.0, aaa_hours=0.0, ultra_hours=0.0)
        db.add(new_wallet)
        db.flush() 
        
    if request.tier == "esports":
        user.wallet.esports_hours += request.hours_added
    elif request.tier == "ultra":
        user.wallet.ultra_hours += request.hours_added
    else:
        user.wallet.aaa_hours += request.hours_added
    
    # Audit trail
    tx = models.WalletTransaction(
        user_id=user.id,
        admin_id=admin.id,
        hours_added=request.hours_added,
        reason=request.reason
    )
    db.add(tx)
    db.commit()
    
    return {"status": "success", "message": f"Allocated {request.hours_added} to {request.tier} tier"}

@router.post("/{user_id}/ban")
def ban_user(
    user_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in master record")
        
    user.is_banned = True
    db.commit()
    
    # Instantly find ghost streams
    active_instances = db.query(models.Instance).filter(
        models.Instance.user_id == user.id,
        models.Instance.status.in_([
            models.InstanceStatus.RUNNING, 
            models.InstanceStatus.PROVISIONING, 
            models.InstanceStatus.PENDING
        ])
    ).all()
    
    for instance in active_instances:
        instance.status = models.InstanceStatus.DESTROYING
        background_tasks.add_task(destroy_node_logic, instance.id)
        
    db.commit()
    
    return {"status": "success", "message": f"Identity banned. {len(active_instances)} streams vaporized."}

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found")
        
    # Soft delete
    user.is_active = False
    
    active_instances = db.query(models.Instance).filter(
        models.Instance.user_id == user.id,
        models.Instance.status.in_([
            models.InstanceStatus.RUNNING, 
            models.InstanceStatus.PROVISIONING, 
            models.InstanceStatus.PENDING
        ])
    ).all()
    
    for instance in active_instances:
        instance.status = models.InstanceStatus.DESTROYING
        background_tasks.add_task(destroy_node_logic, instance.id)
    
    db.commit()
    return {"status": "success", "message": "Identity softly purged from operational datastore"}