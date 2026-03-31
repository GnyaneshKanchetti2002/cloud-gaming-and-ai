# backend/api/tasks.py
import time
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Instance, InstanceStatus, Wallet, WalletTransaction

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def provision_node_logic(instance_id: int):
    """
    Handles the heavy lifting of booting the VM and starts the billing clock.
    """
    db: Session = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return

        instance.status = InstanceStatus.PROVISIONING
        db.commit()
        logger.info(f"PROVISIONING STARTED: {instance.node_name}")

        # Simulate Proxmox Boot
        time.sleep(15) 

        # Finalize, set to Running, and START THE CLOCK
        instance.status = InstanceStatus.RUNNING
        instance.ip_address = f"10.0.0.{100 + instance.id}"
        instance.physical_node = "pve-cluster-node-01"
        instance.proxmox_vmid = 1000 + instance.id
        
        # NEW: Record exact UTC time the instance became usable
        instance.session_start_time = datetime.now(timezone.utc)
        
        db.commit()
        logger.info(f"PROVISIONING SUCCESS: {instance.node_name} is LIVE. Billing Clock Started.")

    except Exception as e:
        logger.error(f"CRITICAL ERROR in background task: {str(e)}")
        if instance:
            instance.status = InstanceStatus.ERROR
            db.commit()
    finally:
        db.close()

def destroy_node_logic(instance_id: int, user_id: int):
    """
    Tears down VM and calculates/deducts wallet time.
    """
    db: Session = SessionLocal()
    try:
        instance = db.query(Instance).filter(Instance.id == instance_id).first()
        if not instance:
            return

        logger.info(f"DESTROYING: {instance.node_name} and Syncing Wallet.")

        # --- WALLET MATH LOGIC ---
        if instance.session_start_time:
            # 1. Calculate time spent
            end_time = datetime.now(timezone.utc)
            duration_seconds = (end_time - instance.session_start_time).total_seconds()
            hours_used = duration_seconds / 3600.0

            # 2. Update Wallet
            wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
            if wallet:
                original_balance = wallet.balance_hours
                new_balance = max(0.0, original_balance - hours_used)
                wallet.balance_hours = new_balance
                
                # 3. Log the Transaction (Using admin_id=user_id for system deductions)
                transaction = WalletTransaction(
                    user_id=user_id,
                    admin_id=user_id, # Self-initiated deduction
                    hours_added=-hours_used, # Negative for deduction
                    reason=f"System Deduction: Node {instance.node_name} ({round(duration_seconds)}s)"
                )
                db.add(transaction)
                logger.info(f"WALLET DEDUCTED: {hours_used:.4f} hours from User {user_id}. New Balance: {new_balance:.4f}")

        # --- VM DESTRUCTION LOGIC ---
        time.sleep(5) # Simulate Proxmox shutdown
        
        db.delete(instance)
        db.commit()
        logger.info(f"PURGE SUCCESS: Instance {instance_id} removed.")

    except Exception as e:
        logger.error(f"Cleanup Failed: {str(e)}")
    finally:
        db.close()