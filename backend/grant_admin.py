import os
from api.database import engine, Base
from sqlalchemy.orm import Session
from api import models

def grant_first_user_admin():
    from api.database import SessionLocal
    db = SessionLocal()
    user = db.query(models.User).order_by(models.User.id).first()
    if user:
        user.is_admin = True
        db.commit()
        print(f"Granted Global Admin (God-Mode) to User ID #{user.id} ({user.email})")
    else:
        print("No users found in database to grant admin privileges to.")
    db.close()

if __name__ == "__main__":
    grant_first_user_admin()
