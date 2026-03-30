from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import models, schemas
from ..database import get_db
from .. import models, schemas
from ..auth import get_admin_user, get_current_user, redis_client
# FIX: Updated name to match the new task logic in tasks.py
from ..tasks import destroy_node_logic 

router = APIRouter()

# --- Request Schemas ---
class RoleUpdateRequest(BaseModel):
    role: models.UserRole

class WalletUpdateRequest(BaseModel):
    hours_added: float
    reason: str

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
        results.append({
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "sso_provider": user.sso_provider,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
            "is_banned": user.is_banned,
            "balance_hours": user.wallet.balance_hours if user.wallet else 0.0
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

@router.put("/{user_id}/wallet")
def update_user_wallet(
    user_id: int,
    request: WalletUpdateRequest,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.wallet:
        raise HTTPException(status_code=404, detail="User or wallet system offline or missing")
        
    user.wallet.balance_hours += request.hours_added
    
    # Audit trail
    tx = models.WalletTransaction(
        user_id=user.id,
        admin_id=admin.id,
        hours_added=request.hours_added,
        reason=request.reason
    )
    db.add(tx)
    db.commit()
    
    return {"status": "success", "new_balance": user.wallet.balance_hours}

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
        # Mark as destroying in DB
        instance.status = models.InstanceStatus.DESTROYING
        # FIX: Trigger the correctly named background task
        background_tasks.add_task(destroy_node_logic, instance.id)
        
    db.commit()
    
    return {"status": "success", "message": f"Identity banned. {len(active_instances)} streams vaporized."}

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    background_tasks: BackgroundTasks, # Added background_tasks for cleanup
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found")
        
    # Soft delete
    user.is_active = False
    
    # Safely clear their active streams via background task
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
        # FIX: Ensure instances are actually purged from Proxmox logic
        background_tasks.add_task(destroy_node_logic, instance.id)
    
    db.commit()
    return {"status": "success", "message": "Identity softly purged from operational datastore"}