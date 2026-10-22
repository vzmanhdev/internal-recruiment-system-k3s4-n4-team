@echo off
chcp 65001 > nul
echo ===================================================
echo   STARTING BACKEND & FRONTEND DEVELOPMENT SERVERS
echo ===================================================
echo.

echo [1/2] Launching FastAPI Backend on http://localhost:8000...
start "Backend - FastAPI (Port 8000)" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Next.js Frontend on http://localhost:3000...
start "Frontend - Next.js (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   SERVERS LAUNCHED IN SEPARATE WINDOWS!
echo ===================================================
echo  - Frontend App:         http://localhost:3000
echo  - Backend API Docs:     http://localhost:8000/docs
echo.
