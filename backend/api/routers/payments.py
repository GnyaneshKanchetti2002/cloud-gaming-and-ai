# backend/api/routers/payments.py
import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from .. import models, auth

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

class CheckoutRequest(BaseModel):
    amount_inr: int
    hours_added: int
    tier_name: str
    plan_type: str
    tier_id: str

@router.post("/create-checkout-session", status_code=status.HTTP_200_OK)
async def create_checkout_session(
    req: CheckoutRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    if not stripe.api_key:
        raise HTTPException(status_code=500, detail="Stripe integration is not configured.")
        
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            billing_address_collection="required",
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'product_data': {
                        'name': f"Compute Execution: {req.tier_name}",
                        'description': f"Allocation: {req.hours_added} Hours"
                    },
                    'unit_amount': req.amount_inr * 100, # paise
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{FRONTEND_URL}/gaming/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/gaming/pricing",
            metadata={
                "user_id": str(current_user.id),
                "tier_id": req.tier_id,
                "hours_added": str(req.hours_added)
            }
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session.get('id')
        
        # Idempotency lock
        existing_tx = db.query(models.Transaction).filter(models.Transaction.stripe_session_id == session_id).first()
        if existing_tx:
            return {"status": "success", "message": "Already processed idempotent."}

        metadata = session.get('metadata', {})
        user_id = int(metadata.get('user_id'))
        tier_id = metadata.get('tier_id')
        hours_added = int(metadata.get('hours_added'))
        amount_total = session.get('amount_total', 0) / 100

        wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
        if not wallet:
            wallet = models.Wallet(user_id=user_id, esports_hours=0.0, aaa_hours=0.0, ultra_hours=0.0)
            db.add(wallet)
            db.flush()

        if tier_id == "esports":
            wallet.esports_hours += hours_added
        elif tier_id == "aaa":
            wallet.aaa_hours += hours_added
        elif tier_id == "ultra":
            wallet.ultra_hours += hours_added

        new_tx = models.Transaction(
            user_id=user_id,
            title=f"Stripe Payment ({tier_id})",
            amount=amount_total,
            hours=hours_added,
            tier=tier_id,
            stripe_session_id=session_id
        )
        db.add(new_tx)
        db.commit()

    return {"status": "success"}

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