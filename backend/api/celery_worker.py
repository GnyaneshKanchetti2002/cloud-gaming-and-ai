import os
import time
import requests
from celery import Celery
from .database import SessionLocal
from .models import Instance, InstanceStatus, SessionTelemetry, HardwareNode, HardwareStatus
from datetime import datetime

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("compute_tasks", broker=REDIS_URL)

@celery_app.task
def provision_node_task(instance_id: int):
    # Retrieve DB session within the worker context
    db = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return "Instance not found"

        # Signal that Celery has picked up the orchestration request
        instance.status = InstanceStatus.PROVISIONING
        db.commit()

        # Simulating Proxmox Hardware Provisioning Delay
        # PRODUCTION NOTE: Do not just sleep here in production! 
        # You must implement a Polling Loop here to continuously ping 
        # the Proxmox QEMU Guest Agent via the Proxmoxer API.
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

        return f"Successfully provisioned VMID {instance.proxmox_vmid} on {instance.physical_node}"

    except Exception as e:
        db.rollback()
        # Ensure we capture errors safely to stop billing and alert Slack
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if instance:
            instance.status = InstanceStatus.ERROR
            db.commit()
        raise e
    finally:
        db.close()


@celery_app.task
def destroy_node_task(instance_id: int):
    db = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return "Instance not found"

        # Check for telemetry and log termination
        telemetry = db.query(SessionTelemetry).filter(SessionTelemetry.instance_id == instance_id).first()
        if telemetry:
            telemetry.end_time = datetime.utcnow()
            telemetry.termination_reason = 'USER_STOP'
        
        # Simulating the Proxmox QEMU Shutdown or Destroy command.
        time.sleep(5) 
        db.delete(instance)
        db.commit()

        return f"Cleaned up instance {instance_id}"
    finally:
        db.close()

@celery_app.task
def check_ghost_lock(node_id: str, token: str):
    db = SessionLocal()
    try:
        # Check if the token still exists in Redis 
        # (meaning the frontend generated it but /verify-token never consumed it)
        from api.auth import redis_client
        if redis_client and redis_client.exists(f"nexus_token:{token}"):
            redis_client.delete(f"nexus_token:{token}")
            
            node = db.query(HardwareNode).filter(HardwareNode.node_id == node_id).first()
            if node and node.status == HardwareStatus.IN_USE:
                node.status = HardwareStatus.AVAILABLE
                node.current_user_id = None
                db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

@celery_app.task
def terminate_session(node_id: str, user_id: int):
    db = SessionLocal()
    try:
        node = db.query(HardwareNode).filter(HardwareNode.node_id == node_id).first()
        if node and node.current_user_id == user_id:
            node.status = HardwareStatus.REBOOTING
            node.current_user_id = None
            db.commit()
            
            # Hit the Internal API so main.py's in-memory WS tracking handles the Kill switch payload MVP
            backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
            requests.post(f"{backend_url}/api/internal/kill-node/{node_id}")
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
