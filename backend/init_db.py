from api.database import engine, Base

# CRITICAL: Import your models so SQLAlchemy registers them in memory before creating tables.
# Adjust the import path slightly if your models file is named differently.
from api import models 

def init():
    print("Creating database tables...")
    # This executes the SQL to build your tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init()