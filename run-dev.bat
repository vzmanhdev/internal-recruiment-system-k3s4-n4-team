@echo off
setlocal enabledelayedexpansion

:: Ensure script runs from project root directory
cd /d "%~dp0"

echo ===================================================
echo   STARTING BACKEND ^& FRONTEND DEVELOPMENT SERVERS
echo ===================================================
echo.

:: Check environment files
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" > NUL
    )
)
if not exist "frontend\.env.local" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env.local" > NUL
    )
)

:: Locate Python executable for backend
set "PY_CMD="
if exist "backend\venv\Scripts\python.exe" (
    set "PY_CMD=venv\Scripts\python.exe"
) else if exist "backend\.venv\Scripts\python.exe" (
    set "PY_CMD=.venv\Scripts\python.exe"
) else (
    echo [INFO] Creating Python virtual environment in backend...
    python -m venv backend\venv
    if exist "backend\venv\Scripts\python.exe" (
        echo [INFO] Installing backend dependencies...
        backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
        set "PY_CMD=venv\Scripts\python.exe"
    ) else (
        echo [WARNING] Could not create virtual environment. Using global python.
        set "PY_CMD=python"
    )
)

:: Start Backend server in separate window
start "Backend Server (FastAPI)" cmd /k "cd /d "%~dp0backend" && !PY_CMD! -m uvicorn app.main:app --reload --port 8000"

:: Start Frontend server in separate window
start "Frontend Server (Next.js)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Backend running on http://localhost:8000 (Swagger API: http://localhost:8000/docs)
echo Frontend running on http://localhost:3000
echo ===================================================
echo.

