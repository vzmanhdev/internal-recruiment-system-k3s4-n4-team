#!/usr/bin/env bash

echo "==================================================="
echo "  STARTING BACKEND & FRONTEND DEVELOPMENT SERVERS"
echo "==================================================="
echo ""

# Function to kill child processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
}
trap cleanup EXIT

echo "Starting Backend on http://localhost:8000..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
cd ..

echo "Starting Frontend on http://localhost:3000..."
cd frontend
npm run dev &
cd ..

wait
