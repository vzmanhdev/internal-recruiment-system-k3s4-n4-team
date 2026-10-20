@echo off
echo ===================================================
echo   INTERNAL RECRUITMENT SYSTEM - ENVIRONMENT SETUP
echo ===================================================
echo.

:: 1. Copy Environment Configuration Files
echo [1/4] Checking environment configurations...
if not exist ".env" (
    echo [INFO] Creating root .env from .env.example
    copy .env.example .env > NUL
) else (
    echo [INFO] Root .env already exists.
)

if not exist "backend\.env" (
    echo [INFO] Creating backend\.env from backend\.env.example
    copy backend\.env.example backend\.env > NUL
) else (
    echo [INFO] backend\.env already exists.
)

if not exist "frontend\.env.local" (
    echo [INFO] Creating frontend\.env.local from frontend\.env.example
    copy frontend\.env.example frontend\.env.local > NUL
) else (
    echo [INFO] frontend\.env.local already exists.
)

echo.
:: 2. Setup Backend Python Virtual Environment and Install Dependencies
echo [2/4] Setting up Backend Python Environment...
cd backend
if not exist "venv" (
    echo [INFO] Creating virtual environment venv
    python -m venv venv
)
call venv\Scripts\activate.bat
echo [INFO] Installing Backend dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo.
:: 3. Setup Frontend Node.js Dependencies
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
echo  - Option 1 Docker:  docker compose up --build
echo  - Option 2 Local:   run-dev.bat
echo.
