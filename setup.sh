#!/usr/bin/env bash

echo "==================================================="
echo "  INTERNAL RECRUITMENT SYSTEM - ENVIRONMENT SETUP"
echo "==================================================="
echo ""

# 1. Copy Environment Configuration Files
echo "[1/4] Checking & Copying Environment Configurations..."
if [ ! -f ".env" ]; then
    echo "[INFO] Creating root .env from .env.example"
    cp .env.example .env
else
    echo "[INFO] Root .env already exists."
fi

if [ ! -f "backend/.env" ]; then
    echo "[INFO] Creating backend/.env from backend/.env.example"
    cp backend/.env.example backend/.env
else
    echo "[INFO] backend/.env already exists."
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "[INFO] Creating frontend/.env.local from frontend/.env.example"
    cp frontend/.env.example frontend/.env.local
else
    echo "[INFO] frontend/.env.local already exists."
fi

echo ""
# 2. Setup Backend Python Environment
echo "[2/4] Setting up Backend Python Environment..."
cd backend
if [ ! -d "venv" ]; then
    echo "[INFO] Creating virtual environment (venv)..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "[INFO] Installing/Upgrading Backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo ""
# 3. Setup Frontend Node.js Dependencies
echo "[3/4] Setting up Frontend Node.js Dependencies..."
cd frontend
echo "[INFO] Installing Node.js packages..."
npm install
cd ..

echo ""
echo "==================================================="
echo "  ENVIRONMENT SETUP COMPLETED SUCCESSFULLY!"
echo "==================================================="
echo ""
echo "You can now start the application:"
echo " - Option 1 (Docker):  docker compose up --build"
echo " - Option 2 (Local):   ./run-dev.sh"
echo ""
