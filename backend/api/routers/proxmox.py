from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..tasks import provision_node_background, destroy_node_background
from ..auth import get_b2b_user, get_b2c_user, get_current_user

router = APIRouter()

@router.post("/provision", response_model=schemas.InstanceResponse, status_code=status.HTTP_202_ACCEPTED)
def provision_node(
    request: schemas.InstanceCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # B2C or B2B can provision
):
    # Enforce token extraction dynamically ignoring the payload request logic seamlessly
    new_instance = models.Instance(
        user_id=current_user.id,
        node_name=request.node_name,
        vram_allocation=request.vram_allocation,
        os_template=request.os_template,
        status=models.InstanceStatus.PENDING
    )
    db.add(new_instance)
    db.commit()
    db.refresh(new_instance)

    # Dispatch to FastAPI Native Background worker
    background_tasks.add_task(provision_node_background, new_instance.id)

    return new_instance

@router.delete("/kill/{instance_id}")
def kill_session(instance_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    instance = db.query(models.Instance).filter(models.Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    # Change state explicitly
    instance.status = models.InstanceStatus.DESTROYING
    db.commit()

    # Dispatch cleanup task
    background_tasks.add_task(destroy_node_background, instance.id)

    return {"status": "success", "message": f"Instance {instance_id} flagged for destruction."}

@router.get("/instances")
def list_cluster_instances(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Must be authenticated broadly 
):
    return db.query(models.Instance).all()

@router.get("/instances/{user_id}")
def user_instances(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) 
):
    # Prevent cross-user snooping
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden. Cannot track explicit remote identities.")
    
    return db.query(models.Instance).filter(models.Instance.user_id == user_id).all()
