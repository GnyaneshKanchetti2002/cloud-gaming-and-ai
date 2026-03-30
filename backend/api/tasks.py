# backend/api/tasks.py
import time
import logging
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Instance, InstanceStatus

# Configure logging so you can see the background progress in Render's logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def provision_node_logic(instance_id: int):
    """
    Handles the heavy lifting of 'cloning' and 'configuring' the VM.
    Since this runs in a background thread, we manage the DB session manually.
    """
    db: Session = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            logger.error(f"Task Failed: Instance {instance_id} not found in database.")
            return

        # 1. Update status to Provisioning
        instance.status = InstanceStatus.PROVISIONING
        db.commit()
        logger.info(f"PROVISIONING STARTED: {instance.node_name}")

        # 2. Simulate the Proxmox Delay (Cloning Image / Cloud-Init)
        # In a real scenario, this is where you'd call the Proxmox API
        time.sleep(15) 

        # 3. Finalize and set to Running
        instance.status = InstanceStatus.RUNNING
        instance.ip_address = f"10.0.0.{100 + instance.id}" # Mock IP assignment
        instance.physical_node = "pve-cluster-node-01"
        instance.proxmox_vmid = 1000 + instance.id
        
        db.commit()
        logger.info(f"PROVISIONING SUCCESS: {instance.node_name} is now LIVE at {instance.ip_address}")

    except Exception as e:
        logger.error(f"CRITICAL ERROR in background task: {str(e)}")
        if instance:
            instance.status = InstanceStatus.ERROR
            db.commit()
    finally:
        db.close() # Always close the session in background tasks to prevent leaks

def destroy_node_logic(instance_id: int):
    """
    Handles the teardown of a VM.
    """
    db: Session = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return

        instance.status = InstanceStatus.DESTROYING
        db.commit()
        logger.info(f"DESTROYING: {instance.node_name}")

        # Simulate shutdown and disk wipe
        time.sleep(5)
        
        db.delete(instance)
        db.commit()
        logger.info(f"PURGE SUCCESS: Instance {instance_id} removed from cluster.")
    except Exception as e:
        logger.error(f"Cleanup Failed: {str(e)}")
    finally:
        db.close()