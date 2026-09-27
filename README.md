# Internal Recruitment System

Hệ thống Tuyển dụng Nội bộ (Internal Recruitment System).

## 📁 Cấu trúc Thư mục Dự án

```
├── frontend/                 # Ứng dụng Next.js
│   ├── src/
│   │   ├── app/              # Trang và định tuyến App Router
│   │   ├── components/       # Các component tái sử dụng
│   │   ├── features/         # Chức năng theo từng module
│   │   ├── lib/              # API client và tiện ích
│   │   └── types/            # Kiểu dữ liệu TypeScript
│   ├── public/               # Ảnh và tài nguyên tĩnh
│   ├── Dockerfile            # Build Frontend
│   └── .env.example          # Biến môi trường mẫu
│
├── backend/                  # Ứng dụng FastAPI
│   ├── app/
│   │   ├── api/v1/           # Các API endpoint
│   │   ├── core/             # Cấu hình và bảo mật
│   │   ├── db/               # Kết nối database
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── alembic/              # Database migrations
│   ├── tests/                # Kiểm thử Backend
│   ├── Dockerfile            # Build Backend
│   ├── pyproject.toml        # Dependencies và cấu hình Python
│   └── .env.example          # Biến môi trường mẫu
│
├── database/                 # SQL và dữ liệu mẫu
├── docs/                     # Tài liệu thiết kế và teamwork
├── .github/workflows/        # GitHub Actions CI/CD
├── compose.yaml              # Docker Compose cấu hình dịch vụ
├── .env.example              # Cấu hình mẫu toàn hệ thống
├── .gitignore                # Các file không đưa lên Git
└── README.md                 # Hướng dẫn chạy dự án
```

## 🚀 Hướng dẫn khởi chạy

### Sử dụng Docker Compose

```bash
# 1. Sao chép file cấu hình môi trường
cp .env.example .env

# 2. Khởi chạy hệ thống bằng Docker Compose
docker compose up -d --build
```
