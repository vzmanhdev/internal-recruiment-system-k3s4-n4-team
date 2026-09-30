@echo off
echo ===================================================
echo   STARTING BACKEND & FRONTEND DEVELOPMENT SERVERS
echo ===================================================
echo.

start "Backend Server (FastAPI)" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
start "Frontend Server (Next.js)" cmd /k "cd frontend && npm run dev"

echo Backend starting on http://localhost:8000 (Swagger API: http://localhost:8000/docs)
echo Frontend starting on http://localhost:3000
echo.
