# backend/api/routers/telemetry.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import time

router = APIRouter()

# Simple in-memory store for the latest node stats
# In a professional setup, use Redis or PostgreSQL
node_stats = {
    "hp_spectre": {
        "status": "offline",
        "cpu_usage": 0,
        "gpu_temp": 0,
        "ram_usage": 0,
        "last_seen": 0
    }
}

class TelemetryUpdate(BaseModel):
    node_id: str
    cpu_usage: float
    gpu_temp: float
    ram_usage: float
    status: str = "online"

@router.post("/report")
async def report_telemetry(data: TelemetryUpdate):
    """
    Endpoint for your HP Spectre to post its current vitals.
    """
    if data.node_id not in node_stats:
        node_stats[data.node_id] = {}
        
    node_stats[data.node_id] = {
        "status": data.status,
        "cpu_usage": data.cpu_usage,
        "gpu_temp": data.gpu_temp,
        "ram_usage": data.ram_usage,
        "last_seen": time.time()
    }
    return {"message": "Telemetry received"}

@router.get("/node/{node_id}")
async def get_node_status(node_id: str):
    """
    Endpoint for the Frontend to fetch the current status of a node.
    """
    stats = node_stats.get(node_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # If we haven't heard from the node in 30 seconds, mark it offline
    if time.time() - stats.get("last_seen", 0) > 30:
        stats["status"] = "offline"
        
    return stats