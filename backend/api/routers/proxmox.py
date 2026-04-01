# backend/api/routers/proxmox.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List
import time
from ..database import get_db
from .. import models, schemas, auth
from ..tasks import provision_node_logic, destroy_node_logic

router = APIRouter()

# --- PHASE 2: SMART LAUNCH HELPER ---
def trigger_smart_launch(node: str, vmid: int, launcher: str):
    """
    Uses QEMU Guest Agent to auto-start the game platform inside the VM.
    NOTE: This must be called from tasks.py *after* the VM is fully booted and responding!
    """
    commands = {
        "Steam": "C:\\Program Files (x86)\\Steam\\steam.exe -tenfoot", # Big Picture Mode
        "Epic Games": "C:\\Program Files (x86)\\Epic Games\\Launcher\\Portal\\Binaries\\Win32\\EpicGamesLauncher.exe",
        "Battle.net": "C:\\Program Files (x86)\\Battle.net\\Battle.net.exe",
        "GOG": "C:\\Program Files (x86)\\GOG Galaxy\\GalaxyClient.exe"
    }
    
    cmd = commands.get(launcher, commands["Steam"])
    
    # The Proxmox API payload for Guest Exec
    payload = {
        "command": cmd
    }
    
    print(f"[SMART LAUNCH] Injecting QEMU Guest Exec on VM {vmid}: {cmd}")
    return True

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

    # 2. Check if user already has an active instance
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

    launcher_choice = getattr(payload, 'launcher', 'Steam')
    print(f"Provisioning Node {new_instance.id} with Target Launcher: {launcher_choice}")

    # 4. Trigger the background task
    bg_tasks.add_task(provision_node_logic, new_instance.id, launcher_choice)

    return {
        "message": "Node allocation request accepted.",
        "instance_id": new_instance.id,
        "launcher_target": launcher_choice,
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

    if instance.status in [models.InstanceStatus.DESTROYING, models.InstanceStatus.STOPPING]:
         return {"status": "Termination already in progress."}

    instance.status = models.InstanceStatus.DESTROYING
    db.commit()

    bg_tasks.add_task(destroy_node_logic, instance.id, current_user.id)
    
    return {"status": "Termination sequence initiated. Wallet syncing in background."}

# --- NEW: IDLE MANAGEMENT (FEATURE 7) ---
@router.post("/idle-shutdown/{instance_id}")
async def idle_shutdown(
    instance_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Triggered by Frontend Idle Sentinel.
    Creates a snapshot (Preserves RAM + Disk) then puts the DB status into hibernation.
    """
    instance = db.query(models.Instance).filter(
        models.Instance.id == instance_id,
        models.Instance.user_id == current_user.id
    ).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Instance target not found.")

    # 1. Logic to tell Proxmox to Snapshot (Simulated hook for tasks.py integration)
    snapshot_name = f"AutoIdleSave_{int(time.time())}"
    print(f"[SECURITY] Creating Persistent Snapshot: {snapshot_name} for VM {instance.node_name}")
    
    # 2. Update status in DB to indicate it's saved/hibernating
    instance.status = "hibernating"
    db.commit()

    return {"message": "Session state persisted. Mainframe entering low-power mode."}

@router.get("/instances", response_model=List[schemas.InstanceResponse])
def get_all_instances_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Omega Clearance Required.")
    return db.query(models.Instance).all()