# backend/api/tasks.py

import time
from datetime import datetime, timezone
from .database import SessionLocal
from .models import Instance, InstanceStatus, SessionTelemetry
from .celery_app import celery_app  # FIX: Importing from the dedicated celery_app file

# -------------------------------------------------------------------
# CELERY TASKS: The "Brawn" of the Liquid Compute Pool
# -------------------------------------------------------------------

@celery_app.task(name="provision_node_background")
def provision_node_background(instance_id: int):
    """
    Handles the asynchronous 'heavy lifting' of cloning and 
    configuring a new Proxmox VM node.
    """
    db = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return f"Task Failed: Instance {instance_id} not found."

        # Mark as provisioning immediately so UI shows progress
        instance.status = InstanceStatus.PROVISIONING
        db.commit()

        # Simulating Proxmox Hardware Provisioning Delay (Cloning VM)
        # In production, this would be a series of Proxmox API calls.
        time.sleep(15) 

        # Assign Hardware specifics (Mocking successful Proxmox API response)
        instance.proxmox_vmid = 100 + instance.id
        instance.physical_node = "pve-node-04"
        instance.vlan_id = 450
        instance.ip_address = f"10.0.5.{instance.id}"
        
        # Transition to active status
        instance.status = InstanceStatus.RUNNING
        
        # Attach telemetry block now that billing is active
        telemetry = SessionTelemetry(instance_id=instance.id)
        db.add(telemetry)
        
        db.commit()
        return f"Successfully provisioned Instance {instance_id}"

    except Exception as e:
        db.rollback()
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if instance:
            instance.status = InstanceStatus.ERROR
            db.commit()
        return f"Provisioning Error for {instance_id}: {str(e)}"
    finally:
        db.close()

@celery_app.task(name="destroy_node_background")
def destroy_node_background(instance_id: int):
    """
    Handles the graceful shutdown and removal of a VM node.
    """
    db = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return f"Task Failed: Instance {instance_id} not found."

        # Check for telemetry and log termination time
        telemetry = db.query(SessionTelemetry).filter(SessionTelemetry.instance_id == instance_id).first()
        if telemetry:
            telemetry.end_time = datetime.now(timezone.utc)
            telemetry.termination_reason = 'USER_STOP'
        
        # Simulating the Proxmox QEMU Shutdown command delay
        time.sleep(5) 
        
        # Following the "Vaporize" approach: delete from DB
        db.delete(instance)
        db.commit()
        return f"Successfully vaporized Instance {instance_id}"
        
    except Exception as e:
        db.rollback()
        return f"Destruction Error for {instance_id}: {str(e)}"
    finally:
        db.close()