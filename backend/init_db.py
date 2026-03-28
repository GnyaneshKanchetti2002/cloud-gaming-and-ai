from api.database import engine, Base
# Import all models to ensure they are registered with Base metadata
from api import models

def init():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init()
