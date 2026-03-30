# backend/promote.py
from api.database import SessionLocal
from api.models import User

def promote_first_user():
    db = SessionLocal()
    # Grabs the very first user created (which should be you!)
    user = db.query(User).filter(User.id == 1).first() 
    
    if user:
        user.is_admin = True
        db.commit()
        print(f"SUCCESS: {user.email} is now an OMEGA ADMIN!")
    else:
        print("ERROR: No users found in the database.")
    
    db.close()

if __name__ == "__main__":
    promote_first_user()