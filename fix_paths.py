import os
import glob

def fix_cors_origins():
    search_path = r"c:\Users\GNYANESH\.gemini\antigravity\scratch\cloud-gaming-and-ai\frontend\src\app\**\*.tsx"
    files = glob.glob(search_path, recursive=True)
    
    count = 0
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'http://127.0.0.1:8000' in content:
            new_content = content.replace('http://127.0.0.1:8000', 'http://localhost:8000')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f"Patched CORS origins in {filepath}")
            
    print(f"Total files patched: {count}")

if __name__ == "__main__":
    fix_cors_origins()
