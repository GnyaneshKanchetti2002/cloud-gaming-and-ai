# backend/api/routers/payments.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from .. import models, auth

router = APIRouter()

class TopUpRequest(BaseModel):
    amount_inr: int
    hours_added: int
    tier_name: str
    plan_type: str
    tier_id: str # 'esports', 'aaa', 'ultra'

@router.post("/topup", status_code=status.HTTP_200_OK)
async def topup_wallet(
    req: TopUpRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Simulates a payment gateway transaction, routes compute hours to the correct tier, and logs it.
    """
    # 1. Find or create the user's wallet
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    
    if not wallet:
        wallet = models.Wallet(user_id=current_user.id, esports_hours=0.0, aaa_hours=0.0, ultra_hours=0.0)
        db.add(wallet)
        db.flush()

    # 2. Route the purchased hours to the proper tier bucket
    if req.tier_id == "esports":
        wallet.esports_hours += req.hours_added
    elif req.tier_id == "aaa":
        wallet.aaa_hours += req.hours_added
    elif req.tier_id == "ultra":
        wallet.ultra_hours += req.hours_added

    # 3. Create the Transaction Ledger entry
    new_tx = models.Transaction(
        user_id=current_user.id,
        title=f"Credit Top-up ({req.tier_name})",
        amount=req.amount_inr,
        hours=req.hours_added,
        tier=req.tier_id
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(wallet)

    return {
        "message": "Payment successful. Compute hours allocated.",
        "transaction_details": req.dict()
    }

@router.get("/history")
async def get_history(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """Fetches the user's transaction ledger ordered by newest first."""
    history = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).order_by(models.Transaction.timestamp.desc()).all()
    
    return history