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
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    uvicorn app.main:app --reload --port 8000 &
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    uvicorn app.main:app --reload --port 8000 &
elif [ -f "venv/Scripts/python.exe" ]; then
    echo "Phát hiện môi trường Windows venv. Đang khởi chạy uvicorn qua Windows Python..."
    ./venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000 &
else
    echo "Lưu ý: Chưa tìm thấy môi trường ảo backend/venv cho Linux. Nếu cần chạy Backend, hãy tạo venv: python3 -m venv backend/venv && source backend/venv/bin/activate && pip install -r backend/requirements.txt"
fi
cd ..

echo "Starting Frontend on http://localhost:3000..."
cd frontend
npm run dev &
cd ..

wait
