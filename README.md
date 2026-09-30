# 🚀 TUYỂN DỤNG NỘI BỘ — Internal Recruitment System

Hệ thống Tuyển dụng Nội bộ (Internal Recruitment System) — Giải pháp quản trị & tự động hóa quy trình tuyển dụng doanh nghiệp theo chuẩn **Enterprise SaaS**.

---

## 📋 Mục lục
1. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
2. [Cấu trúc dự án](#-cấu-trúc-dự-án)
3. [Hướng dẫn Khởi chạy nhanh (Quick Start)](#-hướng-dẫn-khởi-chạy-nhanh-quick-start)
4. [Chạy thủ công không dùng Docker (Local Development)](#-chạy-thủ-công-không-dùng-docker-local-development)
5. [Quy trình Git & Coding Convention](#-quy-trình-git--coding-convention)
6. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)

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
│   ├── src/
│   │   ├── app/              # Trang & định tuyến (Landing, Login, Register, Jobs, etc.)
│   │   ├── components/       # UI Components tái sử dụng (Button, Input, Card, Modal, etc.)
│   │   ├── features/         # Logic chức năng theo module (Auth, Landing, Jobs)
│   │   ├── styles/           # Design System & Color Tokens (design-tokens.css)
│   │   └── lib/              # Utility functions & API helpers
│   ├── public/               # Ảnh và tài nguyên tĩnh
│   ├── Dockerfile            # Cấu hình Docker Frontend
│   ├── package.json          # Dependencies Node.js
│   └── .env.example          # Biến môi trường mẫu Frontend
│
├── backend/                  # Ứng dụng FastAPI (Python)
│   ├── app/
│   │   ├── api/v1/           # API endpoints
│   │   ├── core/             # Security, JWT, Config
│   │   ├── db/               # SQLAlchemy Database session
│   │   ├── models/           # ORM Database Models
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── services/         # Business logic layer
│   │   └── repositories/     # Data Access Layer
│   ├── alembic/              # Database Migrations
│   ├── tests/                # Unit & Integration Tests (pytest)
│   ├── Dockerfile            # Cấu hình Docker Backend
│   ├── pyproject.toml        # Dependencies Python
│   └── .env.example          # Biến môi trường mẫu Backend
│
├── compose.yaml              # Docker Compose toàn hệ thống (Frontend + Backend + PostgreSQL)
├── .env.example              # Biến môi trường tổng
├── .gitignore                # Danh sách file bỏ qua khi commit Git
└── README.md                 # Tài liệu hướng dẫn dự án
```

---

## ⚡ Hướng dẫn Khởi chạy nhanh (Quick Start)

### Cách 1: Chạy bằng Docker Compose (Khuyên dùng)

Cách nhanh nhất để chạy toàn bộ hệ thống (bao gồm Frontend, Backend và PostgreSQL Database):

```bash
# 1. Clone repository về máy
git clone <URL-REPO-CUA-TEAM>
cd internal-recruiment-system-k3s4-n4-team

# 2. Tạo file môi trường từ mẫu
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# 3. Khởi chạy toàn bộ hệ thống bằng Docker Compose
docker compose up -d --build
```

Sau khi khởi chạy thành công:
- **Frontend App**: Truy cập tại `http://localhost:3000`
- **Trang Đăng nhập**: `http://localhost:3000/login`
- **Backend API Docs (Swagger UI)**: `http://localhost:8000/docs`
- **Backend Health Check**: `http://localhost:8000/health`

---

## 🛠 Chạy thủ công không dùng Docker (Local Development)

Nếu bạn muốn phát triển và sửa code trực tiếp trên từng môi trường:

### 1. Khởi chạy Frontend (Next.js)

```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chạy môi trường Dev (Hot-Reloading)
npm run dev
```
🌐 Frontend sẽ chạy tại: **`http://localhost:3000`**

Các lệnh hữu ích cho Frontend:
- `npm run lint` — Kiểm tra lỗi syntax & style
- `npm run build` — Build sản phẩm kiểm tra lỗi TypeScript

---

### 2. Khởi chạy Backend (FastAPI)

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo Python (Virtual Environment)
python -m venv venv

# Kích hoạt môi trường ảo:
# Trên Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Trên macOS / Linux:
source venv/bin/activate

# Cài đặt dependencies (dùng pip hoặc uv/poetry)
pip install -e .

# Tạo file .env
cp .env.example .env

# Chạy Server Backend (Uvicorn)
uvicorn app.main:app --reload --port 8000
```
🌐 Backend API sẽ chạy tại: **`http://localhost:8000`**  
📄 Tài liệu API Swagger UI: **`http://localhost:8000/docs`**

Các lệnh hữu ích cho Backend:
- `pytest` — Chạy toàn bộ các bài test backend

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
Sử dụng tiền tố chuẩn theo từng loại thay đổi:
- `feat:` Thêm tính năng mới (Ví dụ: `feat: add user login API endpoint`)
- `fix:` Sửa lỗi UI/Logic (Ví dụ: `fix: resolve input icon overlap on login form`)
- `style:` Thay đổi UI/CSS mà không đổi logic (Ví dụ: `style: update royal blue color tokens`)
- `docs:` Thêm hoặc cập nhật tài liệu (Ví dụ: `docs: update README setup guide`)
- `refactor:` Cải tiến cấu trúc code mà không đổi tính năng

### 3. Kiểm tra trước khi đẩy code (Push)
Trước khi push code lên nhánh làm việc, luôn chạy kiểm tra:
```bash
# Ở thư mục frontend:
npm run lint && npm run build

# Ở thư mục backend:
pytest
```

---

## 🧰 Công nghệ sử dụng

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Pydantic, Alembic.
- **Database**: PostgreSQL 16 (Alpine).
- **DevOps**: Docker, Docker Compose, GitHub Actions.

---

Chúc cả team làm việc hiệu quả và hoàn thành dự án xuất sắc! 🎉
