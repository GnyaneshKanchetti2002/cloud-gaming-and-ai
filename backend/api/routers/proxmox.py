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
    bg_tasks: BackgroundTasks, # FastAPI's built-in background runner
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Endpoint to request a new Cloud Compute node.
    Returns immediately while the work happens in the background.
    """
    # 1. Create the base record in the DB
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

    # 2. Trigger the background task (No Redis/Celery required!)
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
    # Ensure users can only see their own instances (unless Admin)
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

    # Authorization check
    if instance.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not your instance to kill.")

    # Trigger background destruction
    bg_tasks.add_task(destroy_node_logic, instance.id)
    
    return {"status": "Termination sequence initiated."}

@router.get("/instances", response_model=List[schemas.InstanceResponse])
def get_all_instances_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Admin-only telemetry view"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Omega Clearance Required.")
    return db.query(models.Instance).all()