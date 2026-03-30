from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth
from ..tasks import provision_node_background, destroy_node_background

router = APIRouter()

@router.post("/provision", status_code=202)
async def provision_instance(
    payload: schemas.InstanceCreate,
    background_tasks: BackgroundTasks, # Inject the background task runner
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # 1. Create Initial Record
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

    # 2. Add to FastAPI Background Queue (Runs after response is sent)
    background_tasks.add_task(provision_node_background, new_instance.id)

    return {"message": "Provisioning sequence initiated", "instance_id": new_instance.id}

@router.delete("/kill/{instance_id}")
async def kill_instance(
    instance_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    instance = db.query(models.Instance).filter(
        models.Instance.id == instance_id, 
        models.Instance.user_id == current_user.id
    ).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    # Trigger background destruction
    background_tasks.add_task(destroy_node_background, instance.id)
    
    return {"status": "Termination sequence started"}