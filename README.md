# 🚀 TUYỂN DỤNG NỘI BỘ — Internal Recruitment System
> **Dự án thực tập cơ sở K3S4 - Nhóm 4 (Team 4)**  
> Giải pháp quản trị & tự động hóa quy trình tuyển dụng doanh nghiệp đa cấp bậc theo chuẩn **Enterprise SaaS**.

---

## 📋 Mục Lục
1. [Giới thiệu & Kiến trúc hệ thống](#-giới-thiệu--kiến-trúc-hệ-thống)
2. [Cơ sở dữ liệu đám mây Neon PostgreSQL (Dùng chung)](#-cơ-sở-dữ-liệu-đám-mây-neon-postgresql-dùng-chung)
3. [Danh sách tài khoản kiểm thử đã Seed sẵn](#-danh-sách-tài-khoản-kiểm-thử-đã-seed-sẵn)
4. [Yêu cầu môi trường](#-yêu-cầu-môi-trường)
5. [Hướng dẫn cài đặt & Khởi chạy (Setup Guide)](#-hướng-dẫn-cài-đặt--khởi-chạy-setup-guide)
   - [Cách 1: Khởi chạy từng bước thủ công (Đề xuất)](#cách-1-khởi-chạy-từng-bước-thủ-công-đề-xuất)
   - [Cách 2: Khởi chạy tự động bằng Script](#cách-2-khởi-chạy-tự-động-bằng-script)
   - [Cách 3: Khởi chạy bằng Docker Compose](#cách-3-khởi-chạy-bằng-docker-compose)
6. [Đường dẫn hệ thống & Cổng dịch vụ](#-đường-dẫn-hệ-thống--cổng-dịch-vụ)
7. [Xử lý sự cố & Lỗi thường gặp (Troubleshooting)](#-xử-lý-sự-cố--lỗi-thường-gặp-troubleshooting)
8. [Quy trình Git & Coding Convention](#-quy-trình-git--coding-convention)
9. [Công nghệ sử dụng](#-công-nghệ-sử-dụng)

---

## 🏢 Giới Thiệu & Kiến Trúc Hệ Thống

Hệ thống Tuyển dụng Nội bộ hỗ trợ toàn diện vòng đời tuyển dụng từ khâu lập tờ trình nhu cầu nhân sự, phê duyệt đa cấp động, đăng tin tuyển dụng, tiếp nhận ứng viên, xếp lịch & chấm điểm phỏng vấn theo khung năng lực, cho đến phê duyệt Offer & Onboarding nhân viên mới.

```
internal-recruiment-system-k3s4-n4-team/
├── frontend/                 # Ứng dụng Next.js 15 (App Router, TypeScript, Tailwind CSS)
│   ├── src/                  # Toàn bộ mã nguồn giao diện & components
│   ├── package.json          # Thư viện frontend
│   └── .env.example          # Biến môi trường mẫu frontend
│
├── backend/                  # API Service FastAPI (Python)
│   ├── app/                  # REST APIs, SQLAlchemy Models, RBAC, Services
│   ├── alembic/              # Database Migrations (15 phiên bản hoàn chỉnh)
│   ├── tests/                # Bộ kiểm thử tự động Pytest
│   ├── requirements.txt      # Thư viện Python Backend
│   ├── test_neon.py          # Script kiểm tra kết nối Neon PostgreSQL
│   ├── seed.py               # Script khởi tạo dữ liệu mẫu và phân quyền RBAC
│   └── .env                  # Cấu hình kết nối Backend & Neon DB
│
├── setup.bat                 # Script tự động cài đặt môi trường (Windows)
├── run-dev.bat               # Script mở đồng thời Backend & Frontend (Windows)
├── setup.sh                  # Script tự động cài đặt môi trường (Linux/macOS)
├── run-dev.sh                # Script mở đồng thời Backend & Frontend (Linux/macOS)
├── compose.yaml              # Docker Compose cấu hình toàn hệ thống
└── README.md                 # Tài liệu hướng dẫn dự án
```

---

## ☁️ Cơ Sở Dữ Liệu Đám Mây Neon PostgreSQL (Dùng Chung)

> [!IMPORTANT]
> **Tất cả thành viên trong nhóm dùng chung 1 Database đám mây trên Neon PostgreSQL.**  
> Bạn **KHÔNG** cần phải tự cài đặt PostgreSQL cục bộ trên máy và không lo bị lệch dữ liệu giữa các thành viên.

- Toàn bộ **48 bảng cơ sở dữ liệu** đã được migration đầy đủ qua Alembic.
- Dữ liệu cấu hình hệ thống, từ điển danh mục dùng chung, khung năng lực, phòng ban, và các tài khoản demo đã được nạp sẵn.
- Chuỗi kết nối đã được thiết lập sẵn trong file `backend/.env`:
  ```ini
  DATABASE_URL=postgresql://neondb_owner:npg_0VbGotTU3diP@ep-mute-hall-az1fy70s-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```

---

## 👥 Danh Sách Tài Khoản Kiểm Thử Đã Seed Sẵn

Hệ thống phân quyền theo mô hình **RBAC (Role-Based Access Control)** với 7 vai trò nghiệp vụ chính. Bạn có thể sử dụng các tài khoản dưới đây để đăng nhập và kiểm thử:

> **Mật khẩu dùng chung cho tất cả tài khoản:** `password123`

| Vai trò | Email đăng nhập | Mật khẩu | Trang chuyển hướng | Chức năng chính |
| :--- | :--- | :---: | :---: | :--- |
| **Quản trị hệ thống (Admin)** | `admin@company.com` | `password123` | `/admin` | Quản trị tài khoản, phân quyền RBAC, cấu hình hệ thống, xem nhật ký Audit Log. |
| **Trưởng phòng Nhân sự (HR Manager)** | `hrmanager@company.com` | `password123` | `/hr` | Quản lý master data, sơ đồ phòng ban, chức danh & dải lương, khung năng lực, CMS Career Page, phê duyệt tờ trình. |
| **Trưởng bộ phận (Hiring Manager)** | `truongbophan@company.com` | `password123` | `/manager` | Lập tờ trình yêu cầu tuyển dụng (Job Requisition), theo dõi ngân sách Headcount, duyệt vòng chuyên môn. |
| **Chuyên viên tuyển dụng (Recruiter)** | `recruiter@company.com` | `password123` | `/recruiter` | Tiếp nhận yêu cầu, đăng tin tuyển dụng, sàng lọc hồ sơ, xếp lịch phỏng vấn, gửi Offer. |
| **Người phỏng vấn (Interviewer)** | `interviewer@company.com` | `password123` | `/interviewer` | Xem lịch phỏng vấn được giao, chấm điểm ứng viên theo tiêu chí khung năng lực (Scorecard). |
| **Ban Giám Đốc (Approver)** | `approver@company.com` | `password123` | `/approver` | Phê duyệt cấp cao cho các tờ trình tuyển dụng và đề xuất mức lương ngoại lệ. |
| **Ứng viên nội bộ (Candidate)** | `candidate@company.com` | `password123` | `/jobs` | Xem danh sách việc làm, nộp hồ sơ ứng tuyển nội bộ, giới thiệu ứng viên (Referral), theo dõi trạng thái. |

---

## 💻 Yêu Cầu Môi Trường

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt:
- **Git** (Phiên bản `>= 2.30`)
- **Node.js** (Phiên bản `18.x`, `20.x` hoặc `22.x`) & `npm`
- **Python** (Phiên bản `3.10`, `3.11`, `3.12` hoặc `3.14`)
- *(Tùy chọn)* **Docker Desktop** nếu muốn chạy qua container.

---

## 🛠 Hướng Dẫn Cài Đặt & Khởi Chạy (Setup Guide)

### Cách 1: Khởi chạy từng bước thủ công (Đề xuất)

#### Bước 1: Kéo mã nguồn mới nhất về máy
```bash
git clone https://github.com/vzmanhdev/internal-recruiment-system-k3s4-n4-team.git
cd internal-recruiment-system-k3s4-n4-team
git checkout feature/develop
git pull origin feature/develop
```

#### Bước 2: Cài đặt & Khởi chạy Backend (Terminal 1)
```bash
cd backend

# 1. Tạo môi trường ảo Python (chỉ cần làm 1 lần đầu)
python -m venv venv

# 2. Kích hoạt môi trường ảo:
# Trên Windows PowerShell:
.\venv\Scripts\Activate.ps1
# (Nếu Windows chặn script, chạy lệnh: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)
# Hoặc trên macOS / Linux:
source venv/bin/activate

# 3. Cài đặt các thư viện phụ thuộc:
pip install -r requirements.txt

# 4. Kiểm tra kết nối tới cơ sở dữ liệu Neon:
python test_neon.py
# (Khi thấy in ra: "Kết nối Neon thành công! Database: neondb" là đã kết nối chuẩn)

# 5. Khởi chạy Backend API Server:
uvicorn app.main:app --reload --port 8000
```
> Server Backend sẽ chạy tại: **http://localhost:8000**  
> Tài liệu Swagger API tương tác: **http://localhost:8000/docs**

---

#### Bước 3: Cài đặt & Khởi chạy Frontend (Terminal 2)
Mở một cửa sổ Terminal mới tại thư mục gốc của dự án:
```bash
cd frontend

# 1. Cài đặt các gói thư viện Node.js (chỉ cần làm lần đầu hoặc khi có package mới)
npm install

# 2. Khởi chạy Frontend Next.js Dev Server:
npm run dev
```
> Ứng dụng Frontend sẽ chạy tại: **http://localhost:3000**
`
---

### Cách 2: Khởi chạy tự động bằng Script

Dự án đã tích hợp sẵn script tự động hóa:

- **Trên Windows**:
  1. Chạy `setup.bat` (tự động tạo venv, cài đặt pip và npm).
  2. Chạy `run-dev.bat` (tự động mở 2 cửa sổ độc lập chạy song song Backend & Frontend).
- **Trên macOS / Linux**:
  1. Cấp quyền thực thi: `chmod +x setup.sh run-dev.sh`
  2. Cài đặt: `./setup.sh`
  3. Khởi chạy: `./run-dev.sh`

---

### Cách 3: Khởi chạy bằng Docker Compose

Nếu bạn đã cài đặt Docker Desktop:
```bash
# Khởi chạy toàn bộ hệ thống
docker compose up -d --build

# Xem logs thời gian thực
docker compose logs -f

# Dừng hệ thống
docker compose down
```

---

## 🌐 Đường Dẫn Hệ Thống & Cổng Dịch Vụ

| Dịch vụ | URL | Mô tả |
| :--- | :--- | :--- |
| **Cổng tuyển dụng & Trang chủ** | `http://localhost:3000` | Trang giới thiệu doanh nghiệp, việc làm công khai |
| **Đăng nhập hệ thống** | `http://localhost:3000/login` | Cổng đăng nhập cho toàn bộ 7 vai trò |
| **Bàn làm việc Quản trị viên** | `http://localhost:3000/admin` | Quản trị người dùng & phân quyền hệ thống |
| **Bàn làm việc Trưởng phòng HR** | `http://localhost:3000/hr` | Trung tâm điều hành nhân sự & danh mục |
| **Cấu hình Career Page CMS** | `http://localhost:3000/hr/career-page-config` | CMS soạn thảo & xem trước trực quan (Live Preview) |
| **Backend Swagger UI** | `http://localhost:8000/docs` | Kiểm thử trực tiếp toàn bộ REST API |
| **Backend ReDoc** | `http://localhost:8000/redoc` | Tài liệu API chi tiết theo chuẩn OpenAPI |

---

## ❓ Xử Lý Sự Cố & Lỗi Thường Gặp (Troubleshooting)

### 1. Lỗi `alembic : The term 'alembic' is not recognized...`
- **Nguyên nhân**: Môi trường ảo Python (`venv`) chưa được kích hoạt trong terminal.
- **Cách khắc phục**: Kích hoạt venv trước (`.\venv\Scripts\Activate.ps1`) hoặc chạy trực tiếp qua python:
  ```bash
  python -m alembic upgrade head
  ```

### 2. Lỗi `Module not found: Can't resolve '@/lib/currency'`
- **Nguyên nhân**: Do trước đây `.gitignore` vô tình bỏ qua thư mục `lib/`.
- **Cách khắc phục**: Kéo code mới nhất từ nhánh `feature/develop` về:
  ```bash
  git pull origin feature/develop
  ```
  File `frontend/src/lib/currency.ts` đã được cập nhật đầy đủ.

### 3. Lỗi `ImportError: no pq wrapper available` (psycopg)
- **Nguyên nhân**: Môi trường Python thiếu wheel binary cho driver PostgreSQL.
- **Cách khắc phục**: Cập nhật lại thư viện theo file `requirements.txt` mới nhất:
  ```bash
  cd backend
  pip install -r requirements.txt
  ```

### 4. Lỗi PowerShell không cho kích hoạt venv (`running scripts is disabled`)
- **Cách khắc phục**: Chạy lệnh cấp quyền tạm thời cho phiên làm việc hiện tại:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\venv\Scripts\Activate.ps1
  ```

### 5. Dữ liệu trên Neon bị thiếu hoặc muốn làm mới lại dữ liệu demo?
- **Cách khắc phục**: Chạy lại script seed dữ liệu mẫu:
  ```bash
  cd backend
  python seed.py
  ```

---

## 🌿 Quy Trình Git & Coding Convention

### 1. Nhánh làm việc chính
- **`feature/develop`**: Nhánh tích hợp tính năng chung của nhóm. Tất cả thành viên pull code từ nhánh này và tạo Pull Request vào đây.
- **`master` / `develop`**: Nhánh phát hành ổn định.

### 2. Tạo nhánh khi làm tính năng mới
```bash
# Luôn cập nhật code mới nhất trước khi phân nhánh
git checkout feature/develop
git pull origin feature/develop

# Tạo nhánh mới với tên mô tả rõ ràng
git checkout -b feature/ma-userstory-ten-tinh-nang
# Ví dụ: git checkout -b feature/SCRUM-55-career-page-cms
```

### 3. Quy tắc Commit Message (Chuẩn Conventional Commits)
- `feat(...)`: Thêm tính năng mới (Ví dụ: `feat(career-page): add real logo and banner upload`)
- `fix(...)`: Sửa lỗi logic hoặc giao diện (Ví dụ: `fix(auth): fix session expiration redirect`)
- `refactor(...)`: Tối ưu hóa cấu trúc mã nguồn mà không đổi nghiệp vụ
- `docs(...)`: Cập nhật tài liệu kỹ thuật hoặc README
- `test(...)`: Bổ sung hoặc chỉnh sửa bộ test tự động

### 4. Kiểm tra trước khi tạo Pull Request
Trước khi commit và push lên GitHub, hãy đảm bảo:
```bash
# Kiểm tra cú pháp và kiểu dữ liệu Frontend:
cd frontend
npx tsc --noEmit

# Kiểm tra Backend Tests:
cd ../backend
pytest
```

---

## 🧰 Công Nghệ Sử Dụng

- **Frontend**:
  - **Framework**: Next.js 15 (App Router, React 19)
  - **Ngôn ngữ**: TypeScript 5
  - **Styling**: Tailwind CSS, CSS Custom Properties (Theme tokens)
  - **Icons & Animation**: Lucide React, Canvas Confetti
- **Backend**:
  - **Framework**: FastAPI (Python 3.10+)
  - **ORM & Database Toolkit**: SQLAlchemy 2.0, Alembic
  - **Drivers**: Psycopg 3 Binary, Psycopg2 Binary, Asyncpg
  - **Bảo mật**: JWT (python-jose), Password Hashing (passlib bcrypt), XSS Sanitization, RBAC Enforcer
  - **Mailing**: SMTP Gmail Automation
  - **Testing**: Pytest, Httpx TestClient
- **Database**:
  - **Cloud Database**: Neon PostgreSQL (Serverless, ap-southeast-1 Singapore)
- **DevOps & Tooling**:
  - Docker, Docker Compose, Git, GitHub Actions.
