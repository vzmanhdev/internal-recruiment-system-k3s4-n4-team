@echo off
chcp 65001 > nul
echo ===================================================
echo   INTERNAL RECRUITMENT SYSTEM - ENVIRONMENT SETUP
echo ===================================================
echo.

echo [1/4] Checking and Copying Environment Configurations...
if not exist ".env" (
    echo [INFO] Creating root .env from .env.example
    copy .env.example .env > nul
) else (
    echo [INFO] Root .env already exists.
)

if not exist "backend\.env" (
    echo [INFO] Creating backend\.env from backend\.env.example
    copy backend\.env.example backend\.env > nul
) else (
    echo [INFO] backend\.env already exists.
)

if not exist "frontend\.env.local" (
    echo [INFO] Creating frontend\.env.local from frontend\.env.example
    copy frontend\.env.example frontend\.env.local > nul
) else (
    echo [INFO] frontend\.env.local already exists.
)

echo.
echo [2/4] Setting up Backend Python Environment...
cd backend
if not exist "venv" (
    echo [INFO] Creating virtual environment (venv)...
    python -m venv venv
)
echo [INFO] Installing Backend dependencies...
call venv\Scripts\python.exe -m pip install --upgrade pip
call venv\Scripts\pip.exe install -r requirements.txt
echo [INFO] Testing Neon PostgreSQL Connection...
call venv\Scripts\python.exe test_neon.py
cd ..

echo.
echo [3/4] Setting up Frontend Node.js Dependencies...
cd frontend
echo [INFO] Installing Node.js packages...
call npm install
cd ..

echo.
echo ===================================================
echo   ENVIRONMENT SETUP COMPLETED SUCCESSFULLY!
echo ===================================================
echo.
echo You can now start the application:
echo  - Option 1 (Windows Script): run-dev.bat
echo  - Option 2 (Manual):
echo       Terminal 1: cd backend ^& .\venv\Scripts\Activate.ps1 ^& uvicorn app.main:app --reload --port 8000
echo       Terminal 2: cd frontend ^& npm run dev
echo.
pause
