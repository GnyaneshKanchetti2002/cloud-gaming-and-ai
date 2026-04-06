# backend/api/main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os

# --- 1. IMPORT ROUTERS & DATABASE ---
# Added telemetry to the import list
from api.routers import auth, users, payments, proxmox, games, telemetry 
from api.database import engine, Base, get_db
from sqlalchemy.orm import Session
from fastapi import Depends, WebSocket, WebSocketDisconnect
from api.auth import redis_client
from api import models
from pydantic import BaseModel
from datetime import datetime, timezone
import logging

telemetry_logger = logging.getLogger("telemetry")

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, node_id: str):
        await websocket.accept()
        self.active_connections[node_id] = websocket

    def disconnect(self, node_id: str):
        if node_id in self.active_connections:
            del self.active_connections[node_id]

    async def send_command(self, node_id: str, command: str):
        if node_id in self.active_connections:
            await self.active_connections[node_id].send_text(command)

manager = ConnectionManager()

# --- 2. INITIALIZE APP ---
app = FastAPI(
    title="LIQUID COMPUTE API",
    description="Backend API for high-performance cloud gaming and AI compute"
)

# --- 3. SESSION CONFIGURATION ---
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production")
IS_PROD = os.getenv("RENDER", "false").lower() == "true"

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    max_age=3600,
    https_only=IS_PROD,
    same_site="none" if IS_PROD else "lax" 
)

# --- 4. STRICT CORS CONFIGURATION ---
frontend_url = os.getenv("FRONTEND_URL", "https://cloud-gaming-and-ai.vercel.app").rstrip("/")

if IS_PROD:
    # We allow the Vercel frontend AND any local connections (for your Spectre's telemetry)
    origins = [frontend_url]
else:
    origins = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        frontend_url
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 5. INCLUDE ROUTERS ---
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(proxmox.router, prefix="/api/proxmox", tags=["proxmox"])
app.include_router(games.router, prefix="/api/games", tags=["games"])
# Registered the new Telemetry router
app.include_router(telemetry.router, prefix="/api/telemetry", tags=["telemetry"])

# --- 6. SYSTEM ENDPOINTS ---
@app.get("/", tags=["system"])
def read_root():
    return {
        "status": "online",
        "environment": "production" if IS_PROD else "development",
        "message": "LIQUID COMPUTE Mainframe is active."
    }

@app.get("/verify-token", tags=["auth"])
def verify_token(
    token: str,
    ip: str = "unknown",
    res: str = "unknown",
    fps: str = "unknown",
    db: Session = Depends(get_db)
):
    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis unavailable")
        
    # Atomic get and delete
    val = redis_client.getdel(f"nexus_token:{token}")
    if not val:
        raise HTTPException(status_code=401, detail="Invalid, missing, or expired token.")
        
    val_str = val.decode("utf-8") if isinstance(val, bytes) else str(val)
    parts = val_str.split(":")
    user_id = int(parts[0])
    tier_id = parts[1] if len(parts) > 1 else "unknown"
    credits_deducted = float(parts[2]) if len(parts) > 2 else 0.0
    node_id = parts[3] if len(parts) > 3 else "unknown"
    
    # Schedule the 1-hour kill switch!
    if node_id != "unknown":
        from api.celery_worker import terminate_session
        terminate_session.apply_async(args=[node_id, user_id], countdown=3600)
    
    # Logging the Telemetry row
    telemetry_logger.info(f"NEXUS_IGNITION | UserID: {user_id} | Target IP: {ip} | Res: {res} | FPS: {fps} | Tier: {tier_id} | Node: {node_id} | Cost: {credits_deducted}")
    print(f"[TELEMETRY] Ignition Verified. User: {user_id}, IP: {ip}, Res: {res}, FPS: {fps}, Tier: {tier_id}, Cost: {credits_deducted}")
    
    return {"status": "success", "message": "Token Verified & Burned."}

@app.get("/api/ping", tags=["system"])
def ping():
    return {"status": "pong"}

@app.get("/health", tags=["system"])
def health_check():
    return {"status": "healthy"}

# --- 7. DATABASE RESET ---
@app.get("/api/dev/reset-db", tags=["system"])
def reset_database():
    if IS_PROD:
        raise HTTPException(
            status_code=403, 
            detail="Critical operation blocked. Database wipe disabled in production."
        )
        
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"message": "Matrix wiped. Schema upgraded successfully."}

# --- 8. INFRASTRUCTURE & ORCHESTRATION ---
class HeartbeatPayload(BaseModel):
    node_id: str
    tailscale_ip: str
    status: str

@app.post("/api/telemetry/heartbeat", tags=["infrastructure"])
def handle_heartbeat(payload: HeartbeatPayload, db: Session = Depends(get_db)):
    node = db.query(models.HardwareNode).filter(models.HardwareNode.node_id == payload.node_id).first()
    if not node:
        # Auto-register
        node = models.HardwareNode(
            node_id=payload.node_id,
            tailscale_ip=payload.tailscale_ip,
            tier=models.HardwareTier.ESPORTS,
            status=models.HardwareStatus.AVAILABLE if payload.status == "idle" else models.HardwareStatus.OFFLINE
        )
        db.add(node)
    
    # Do not forcefully override IN_USE if it's just actively reporting
    if node.status != models.HardwareStatus.IN_USE:
        node.status = models.HardwareStatus.AVAILABLE if payload.status == "idle" else models.HardwareStatus.OFFLINE
        
    node.last_heartbeat = datetime.now(timezone.utc)
    node.tailscale_ip = payload.tailscale_ip
    db.commit()
    return {"status": "recognized"}

@app.websocket("/ws/agent/{node_id}")
async def websocket_agent_endpoint(websocket: WebSocket, node_id: str):
    await manager.connect(websocket, node_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(node_id)

@app.post("/api/internal/kill-node/{node_id}", tags=["infrastructure"])
async def internal_kill_node(node_id: str):
    """ Internal hook for Celery to trigger WS kill signal without PubSub """
    await manager.send_command(node_id, "TERMINATE_STREAM")
    return {"status": "Dispatched termination"}

# --- 9. GOD-MODE C2 TELEMETRY ---
from jose import jwt
from api.auth import SECRET_KEY, ALGORITHM
from sqlalchemy import func
import aiofiles
import os

@app.websocket("/ws/admin/telemetry")
async def websocket_admin_telemetry(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(models.User).filter(models.User.id == int(payload.get("sub"))).first()
        if not user or not user.is_admin:
            await websocket.close()
            return
            
        while True:
            nodes = db.query(models.HardwareNode).all()
            total_vram = len(nodes) * 12 # Mocking 12GB per node block
            used_vram = sum(12 for n in nodes if n.status == models.HardwareStatus.IN_USE)
            nodes_data = [{"id": n.node_id, "status": n.status.value, "tier": n.tier.value} for n in nodes]
            total_rev = db.query(func.sum(models.Transaction.amount)).scalar() or 0.0

            await websocket.send_json({
                "nodes": nodes_data,
                "vram_allocated_pct": (used_vram / total_vram * 100) if total_vram > 0 else 0,
                "revenue": float(total_rev)
            })
            await asyncio.sleep(1) # Delta push
    except WebSocketDisconnect:
        pass

@app.websocket("/ws/admin/logs")
async def websocket_admin_logs(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(models.User).filter(models.User.id == int(payload.get("sub"))).first()
        if not user or not user.is_admin:
            await websocket.close()
            return

        log_file = "logs/celery.log"
        if not os.path.exists("logs"): os.makedirs("logs")
        if not os.path.exists(log_file): open(log_file, "a").close()
        
        async with aiofiles.open(log_file, mode="r") as f:
            await f.seek(0, 2) # jump to end
            while True:
                line = await f.readline()
                if line:
                    await websocket.send_text(line)
                else:
                    await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass

@app.post("/api/admin/fleet/halt", tags=["admin"])
def halt_fleet(token: str, db: Session = Depends(get_db)):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    admin = db.query(models.User).filter(models.User.id == int(payload.get("sub"))).first()
    if not admin or not admin.is_admin:
        raise HTTPException(status_code=403, detail="Omega Clearance Required")

    # Global Broadcast
    nodes = db.query(models.HardwareNode).all()
    for n in nodes:
        n.status = models.HardwareStatus.OFFLINE
        asyncio.create_task(manager.send_command(n.node_id, "TERMINATE_STREAM"))

    audit = models.AdminAuditLog(
        admin_id=admin.id,
        action_type="CLUSTER_HALT",
        reason="Manual Global Override"
    )
    db.add(audit)
    db.commit()
    return {"message": "Cluster halted."}