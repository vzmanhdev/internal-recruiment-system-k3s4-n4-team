# 🚀 TUYỂN DỤNG NỘI BỘ — Internal Recruitment System

Hệ thống Tuyển dụng Nội bộ (Internal Recruitment System) — Giải pháp quản trị & tự động hóa quy trình tuyển dụng doanh nghiệp theo chuẩn **Enterprise SaaS**.

---

## 📋 Mục lục
1. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
2. [Cấu trúc dự án](#-cấu-trúc-dự-án)
3. [Tải Môi trường & Khởi chạy Tự động (Đề xuất)](#-tải-môi-trường--khởi-chạy-tự-động-đề-xuất)
4. [Chạy bằng Docker Compose](#-chạy-bằng-docker-compose)
5. [Chạy thủ công không dùng Docker (Local Development)](#-chạy-thủ-công-không-dùng-docker-local-development)
6. [Quy trình Git & Coding Convention](#-quy-trình-git--coding-convention)
7. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)

---

## 💻 Yêu cầu hệ thống

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt:
- **Git** (Phiên bản `>= 2.30`)
- **Node.js** (Phiên bản `>= 18.x` hoặc `20.x`) & `npm`
- **Python** (Phiên bản `>= 3.10` hoặc `3.11`)
- *(Tùy chọn)* **Docker Desktop** (Phiên bản mới nhất)

---

## 📁 Cấu trúc dự án

```
internal-recruiment-system-k3s4-n4-team/
├── frontend/                 # Ứng dụng Next.js (App Router, Tailwind CSS)
│   ├── src/                  # Mã nguồn ứng dụng
│   ├── Dockerfile            # Cấu hình Docker Frontend
│   ├── package.json          # Dependencies Node.js
│   └── .env.example          # Biến môi trường mẫu Frontend
│
├── backend/                  # Ứng dụng FastAPI (Python)
│   ├── app/                  # Mã nguồn FastAPI
│   ├── alembic/              # Database Migrations
│   ├── tests/                # Unit & Integration Tests (pytest)
│   ├── requirements.txt      # Thư viện Python Backend
│   ├── pyproject.toml        # Cấu hình dự án Python
│   ├── Dockerfile            # Cấu hình Docker Backend
│   └── .env.example          # Biến môi trường mẫu Backend
│
├── setup.bat                 # Script tự động cài đặt môi trường (Windows)
├── setup.sh                  # Script tự động cài đặt môi trường (Linux/macOS)
├── run-dev.bat               # Script chạy đồng thời Backend & Frontend (Windows)
├── run-dev.sh                # Script chạy đồng thời Backend & Frontend (Linux/macOS)
├── compose.yaml              # Docker Compose toàn hệ thống
├── .env.example              # Biến môi trường mẫu toàn hệ thống
└── README.md                 # Tài liệu hướng dẫn dự án
```

---

## ⚡ Tải Môi trường & Khởi chạy Tự động (Đề xuất)

Sau khi clone dự án về máy:
```bash
git clone <URL-REPO-CUA-TEAM>
cd internal-recruiment-system-k3s4-n4-team
```

### 1. Cài đặt tự động môi trường (Chỉ cần 1 lệnh)

Tự động copy file môi trường (`.env`), tạo virtual environment cho Python backend, cài đặt `requirements.txt` và `npm install` frontend:

- **Trên Windows (Cmd / PowerShell)**:
  ```cmd
  setup.bat
  ```

- **Trên Linux / macOS**:
  ```bash
  chmod +x setup.sh run-dev.sh
  ./setup.sh
  ```

### 2. Khởi chạy ứng dụng Dev

- **Trên Windows**:
  ```cmd
  run-dev.bat
  ```

- **Trên Linux / macOS**:
  ```bash
  ./run-dev.sh
  ```

Truy cập hệ thống:
- **Frontend App**: `http://localhost:3000`
- **Backend API Docs (Swagger UI)**: `http://localhost:8000/docs`

---

## 🐳 Chạy bằng Docker Compose

Chạy toàn bộ hệ thống bao gồm Frontend, Backend và Database PostgreSQL độc lập trong container:

```bash
# 1. Tạo file môi trường từ mẫu nếu chưa có
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Khởi chạy bằng Docker Compose
docker compose up -d --build
```

---

## 🛠 Chạy thủ công không dùng Docker (Local Development)

Nếu bạn muốn cấu hình và cài đặt từng bước thủ công:

### 1. Khởi chạy Backend (FastAPI)

```bash
cd backend

# Tạo môi trường ảo Python
python -m venv venv

# Kích hoạt môi trường ảo:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Cài đặt thư viện backend
pip install -r requirements.txt

# Tạo file cấu hình môi trường
cp .env.example .env

# Chạy Server Backend (Uvicorn)
uvicorn app.main:app --reload --port 8000
```

### 2. Khởi chạy Frontend (Next.js)

```bash
cd frontend

# Cài đặt các gói npm
npm install

# Tạo file cấu hình môi trường
cp .env.example .env.local

# Chạy môi trường Dev
npm run dev
```

---

## 🌿 Quy trình Git & Coding Convention cho Team

### 1. Chuẩn bị trước khi Code
Mỗi khi bắt đầu làm tính năng mới, hãy cập nhật nhánh `main` mới nhất:
```bash
git checkout main
git pull origin main
git checkout -b feature/ten-tinh-nang
```

### 2. Quy tắc Commit Message
- `feat:` Thêm tính năng mới (Ví dụ: `feat: add user login API endpoint`)
- `fix:` Sửa lỗi UI/Logic (Ví dụ: `fix: resolve input icon overlap on login form`)
- `style:` Thay đổi UI/CSS mà không đổi logic
- `docs:` Thêm hoặc cập nhật tài liệu (Ví dụ: `docs: update README setup guide`)
- `refactor:` Cải tiến cấu trúc code mà không đổi tính năng

---

## 🧰 Công nghệ sử dụng

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Pydantic, Alembic.
- **Database**: PostgreSQL 16 (Alpine).
- **DevOps**: Docker, Docker Compose, GitHub Actions.
