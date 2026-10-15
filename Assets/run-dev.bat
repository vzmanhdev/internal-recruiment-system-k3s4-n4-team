@echo off
echo ===================================================
echo   STARTING BACKEND ^& FRONTEND DEVELOPMENT SERVERS
echo ===================================================
echo.

if exist "backend\.venv\Scripts\python.exe" (
    start "Backend Server (FastAPI)" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
) else (
    start "Backend Server (FastAPI)" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
)
start "Frontend Server (Next.js)" cmd /k "cd frontend && npm run dev"

echo Backend starting on http://localhost:8000 (Swagger API: http://localhost:8000/docs)
echo Frontend starting on http://localhost:3000
echo.
