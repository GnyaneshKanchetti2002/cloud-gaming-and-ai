@echo off
echo ===================================================
echo CLOUD GAMING ^& AI PLATFORM - ONE CLICK TEST SCRIPT
echo ===================================================
echo.

echo [1] Starting PostgreSQL and Redis via Docker...
docker-compose up -d db redis
echo Services Started.

echo.
echo [2] Starting FastAPI Backend on Port 8000...
cd backend
if not exist .venv (
    python -m venv .venv
)
start cmd.exe /c "title FastAPI Backend && call .venv\Scripts\activate && pip install -r requirements.txt && python init_db.py && uvicorn api.main:app --reload --env-file .env --host 127.0.0.1 --port 8000"

echo.
echo [3] Starting Next.js Frontend on Port 3000...
cd ..\frontend
start cmd.exe /c "title Next.js Frontend && npm install --legacy-peer-deps && npm run dev"

echo.
echo ===================================================
echo ALL SYSTEMS GO!
echo The Backend Terminal and Frontend Terminal have opened in new windows.
echo Please wait a moment for the Next.js server to finish compiling...
echo.
echo When ready, open your browser to: http://localhost:3000
echo ===================================================
pause
