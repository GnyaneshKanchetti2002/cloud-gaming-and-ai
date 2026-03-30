import time
import logging
from .database import SessionLocal
from .models import Instance, InstanceStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def provision_node_background(instance_id: int):
    """
    Simulates heavy lifting: Cloning VM, Configuring Network, etc.
    """
    db = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return

        # 1. Start Provisioning
        instance.status = InstanceStatus.PROVISIONING
        db.commit()
        logger.info(f"START: Provisioning node {instance.node_name}")

        # 2. Simulate Proxmox Delay (Cloning Image)
        time.sleep(15) 

        # 3. Finalize
        instance.status = InstanceStatus.RUNNING
        instance.ip_address = f"10.0.0.{instance.id + 100}"
        instance.physical_node = "pve-node-01"
        instance.proxmox_vmid = 1000 + instance.id
        
        db.commit()
        logger.info(f"SUCCESS: Node {instance.node_name} is now RUNNING")

    except Exception as e:
        logger.error(f"FAILED to provision: {str(e)}")
        if instance:
            instance.status = InstanceStatus.ERROR
            db.commit()
    finally:
        db.close()

def destroy_node_background(instance_id: int):
    """
    Simulates safely shutting down and deleting the VM.
    """
    db = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return

        instance.status = InstanceStatus.DESTROYING
        db.commit()
        
        time.sleep(5) # Simulate shutdown
        
        db.delete(instance)
        db.commit()
        logger.info(f"SUCCESS: Node {instance_id} destroyed.")
    finally:
        db.close()