# backend/fix_db.py
import sqlite3

def fix():
    conn = sqlite3.connect('cga_staging.db')
    cursor = conn.cursor()
    
    print("Checking columns...")
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    new_cols = [
        ("preferred_resolution", "VARCHAR"),
        ("preferred_fps", "INTEGER"),
        ("sunshine_host_id", "VARCHAR")
    ]
    
    for col_name, col_type in new_cols:
        if col_name not in columns:
            print(f"Adding column {col_name}...")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
        else:
            print(f"Column {col_name} already exists.")
            
    conn.commit()
    conn.close()
    print("Database fix complete!")

if __name__ == "__main__":
    fix()