import time
from .database import SessionLocal
from .models import Instance, InstanceStatus, SessionTelemetry
from datetime import datetime

# Fallback background tasks replacing Celery/Redis for instant local testing

def provision_node_background(instance_id: int):
    db = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return

        instance.status = InstanceStatus.PROVISIONING
        db.commit()

        # Simulating Proxmox Hardware Provisioning Delay
        time.sleep(15) 

        # Assign Hardware specifics upon successful clone
        instance.proxmox_vmid = 100 + instance.id
        instance.physical_node = "pve-node-04"
        instance.vlan_id = 450
        instance.ip_address = f"10.0.5.{instance.id}"
        
        instance.status = InstanceStatus.RUNNING
        
        # Attach telemetry block now that billing is active
        telemetry = SessionTelemetry(instance_id=instance.id)
        db.add(telemetry)
        
        db.commit()

    except Exception as e:
        db.rollback()
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if instance:
            instance.status = InstanceStatus.ERROR
            db.commit()
    finally:
        db.close()

def destroy_node_background(instance_id: int):
    db = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return

        # Check for telemetry and log termination
        telemetry = db.query(SessionTelemetry).filter(SessionTelemetry.instance_id == instance_id).first()
        if telemetry:
            telemetry.end_time = datetime.utcnow()
            telemetry.termination_reason = 'USER_STOP'
        
        # Simulating the Proxmox QEMU Shutdown or Destroy command.
        time.sleep(5) 
        db.delete(instance)
        db.commit()
    finally:
        db.close()
