# backend/api/routers/proxmox.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, auth
from ..tasks import provision_node_logic, destroy_node_logic

router = APIRouter()

@router.post("/provision", status_code=status.HTTP_202_ACCEPTED)
async def provision_instance(
    payload: schemas.InstanceCreate,
    bg_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Endpoint to request a new Cloud Compute node.
    """
    # 1. SECURITY GATE: Check Wallet Balance before allowing boot
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet or wallet.balance_hours <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED, 
            detail="Insufficient wallet balance to start a session."
        )

    # 2. Check if user already has an active instance (optional, but good practice)
    existing = db.query(models.Instance).filter(
        models.Instance.user_id == current_user.id,
        models.Instance.status.in_([models.InstanceStatus.PENDING, models.InstanceStatus.PROVISIONING, models.InstanceStatus.RUNNING])
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active node.")

    # 3. Create the base record in the DB
    new_instance = models.Instance(
        user_id=current_user.id,
        node_name=payload.node_name,
        vram_allocation=payload.vram_allocation,
        os_template=payload.os_template,
        status=models.InstanceStatus.PENDING
    )
    
    db.add(new_instance)
    db.commit()
    db.refresh(new_instance)

    # 4. Trigger the background task 
    bg_tasks.add_task(provision_node_logic, new_instance.id)

    return {
        "message": "Node allocation request accepted.",
        "instance_id": new_instance.id,
        "status": "pending"
    }

@router.get("/instances/{user_id}", response_model=List[schemas.InstanceResponse])
def get_user_instances(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Clearance denied.")
        
    return db.query(models.Instance).filter(models.Instance.user_id == user_id).all()

@router.delete("/kill/{instance_id}")
async def kill_instance(
    instance_id: int,
    bg_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    instance = db.query(models.Instance).filter(models.Instance.id == instance_id).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Instance target not found.")

    if instance.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not your instance to kill.")

    # Prevent spamming the kill button
    if instance.status in [models.InstanceStatus.DESTROYING, models.InstanceStatus.STOPPING]:
         return {"status": "Termination already in progress."}

    # Set status immediately to prevent frontend confusion
    instance.status = models.InstanceStatus.DESTROYING
    db.commit()

    # Trigger background destruction and wallet calculation
    bg_tasks.add_task(destroy_node_logic, instance.id, current_user.id)
    
    return {"status": "Termination sequence initiated. Wallet syncing in background."}

@router.get("/instances", response_model=List[schemas.InstanceResponse])
def get_all_instances_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Omega Clearance Required.")
    return db.query(models.Instance).all()