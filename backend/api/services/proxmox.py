# backend/api/services/proxmox.py
import os
from proxmoxer import ProxmoxAPI
import urllib3

# Disable insecure request warnings if using self-signed certs (common for default Proxmox installs)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_proxmox_client():
    """
    Initializes and returns the Proxmox API client using environment variables.
    Supports both Password and API Token authentication.
    """
    host = os.getenv("PROXMOX_HOST", "192.168.1.100") # Replace with your hypervisor IP
    user = os.getenv("PROXMOX_USER", "root@pam")
    password = os.getenv("PROXMOX_PASSWORD", "")
    
    # Using API Tokens is highly recommended for security over passwords
    token_name = os.getenv("PROXMOX_TOKEN_NAME")
    token_value = os.getenv("PROXMOX_TOKEN_VALUE")

    try:
        if token_name and token_value:
            return ProxmoxAPI(host, user=user, token_name=token_name, token_value=token_value, verify_ssl=False)
        elif password:
            return ProxmoxAPI(host, user=user, password=password, verify_ssl=False)
        else:
            print("[PROXMOX] Warning: No authentication credentials provided.")
            return None
    except Exception as e:
        print(f"[PROXMOX] Failed to connect: {e}")
        return None

def get_cluster_stats():
    """
    Fetches real-time node and VM statistics directly from the Proxmox Datacenter.
    """
    proxmox = get_proxmox_client()
    
    # Safe fallback if the hypervisor is offline or credentials are missing
    fallback_stats = {
        "active_instances": 0, 
        "total_vram_gb": 0.0, 
        "current_hourly_burn": 0.0
    }
    
    if not proxmox:
        return fallback_stats

    try:
        nodes = proxmox.nodes.get()
        active_vms = 0
        total_mem_bytes = 0

        # Iterate through physical nodes to find all VMs
        for node in nodes:
            node_name = node['node']
            vms = proxmox.nodes(node_name).qemu.get()
            
            for vm in vms:
                if vm.get('status') == 'running':
                    active_vms += 1
                    # Proxmox returns memory in bytes. 'maxmem' is the allocated RAM.
                    total_mem_bytes += vm.get('maxmem', 0)
        
        # Convert Bytes to Gigabytes
        total_vram_gb = total_mem_bytes / (1024 ** 3)
        
        # Calculate burn rate (Matching your frontend logic of $0.15/GB)
        hourly_burn = total_vram_gb * 0.15

        return {
            "active_instances": active_vms,
            "total_vram_gb": round(total_vram_gb, 2),
            "current_hourly_burn": round(hourly_burn, 2)
        }
    except Exception as e:
        print(f"[PROXMOX] Error fetching stats: {e}")
        return fallback_stats