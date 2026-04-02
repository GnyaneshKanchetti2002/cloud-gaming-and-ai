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

@router.post("/topup", status_code=status.HTTP_200_OK)
async def topup_wallet(
    req: TopUpRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Simulates a payment gateway transaction and adds compute hours to the digital wallet.
    """
    # 1. Find or create the user's wallet
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    
    if not wallet:
        wallet = models.Wallet(user_id=current_user.id, balance_hours=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    # 2. Add the purchased hours
    wallet.balance_hours += req.hours_added
    
    # Optional: If you have a Transaction History/Ledger table, you would log it here:
    # new_tx = models.Transaction(user_id=current_user.id, amount=req.amount_inr, hours=req.hours_added, description=f"Top-up: {req.tier_name} ({req.plan_type})")
    # db.add(new_tx)

    db.commit()
    db.refresh(wallet)

    return {
        "message": "Payment successful. Compute hours allocated.",
        "new_balance": wallet.balance_hours,
        "transaction_details": req.dict()
    }