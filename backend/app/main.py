from typing import Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.db.session import engine, Base
import app.models  # Register all SQLAlchemy models
from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.hr import router as hr_router
from app.api.v1.requisitions import router as requisitions_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.applications import router as applications_router
from app.api.v1.interviews import router as interviews_router
from app.api.v1.offer_onboarding import router as offers_router
from app.api.v1.referral_eval import router as referrals_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.email_automation import router as email_automation_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

# Lightweight compatibility migration for existing local databases.
with engine.begin() as connection:
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "account_status" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'active'"))
        connection.execute(text("UPDATE users SET account_status = 'pending' WHERE is_active = false"))
    if "lock_reason" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN lock_reason VARCHAR(500)"))
    if "avatar_url" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(4000000)"))
    if "employee_code" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN employee_code VARCHAR(50)"))
    competency_columns = {column["name"] for column in inspect(engine).get_columns("competencies")}
    if "weight" not in competency_columns:
        connection.execute(text("ALTER TABLE competencies ADD COLUMN weight FLOAT NOT NULL DEFAULT 0"))

app = FastAPI(
    title="Internal Recruitment System API",
    version="1.0.0",
    description="FastAPI Backend connected with PostgreSQL Database",
)

# CORS middleware for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Override Pydantic validation exception handler for precise field-level errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    field_errors = {}
    for error in exc.errors():
        loc = error.get("loc", [])
        msg = error.get("msg", "")
        field_name = loc[-1] if loc else "general"
        
        if "value is not a valid email address" in msg:
            msg_str = "Địa chỉ Email không đúng định dạng (Ví dụ: name@company.com)."
        elif "field required" in msg:
            msg_str = "Trường này là bắt buộc, không được để trống."
        elif "String should have at least" in msg:
            msg_str = msg.replace("String should have at least", "Độ dài tối thiểu là")
        elif msg.startswith("Value error,"):
            msg_str = msg.replace("Value error,", "").strip()
        else:
            msg_str = msg
            
        field_errors[str(field_name)] = msg_str

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Dữ liệu nhập vào chưa chính xác hoặc thiếu trường thông tin bắt buộc.",
            "field_errors": field_errors
        }
    )

@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok", "message": "Backend connected & database ready"}

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Account administration"])
app.include_router(hr_router, prefix="/api/v1/hr", tags=["Human resources"])
app.include_router(requisitions_router, prefix="/api/v1/requisitions", tags=["Job Requisitions"])
app.include_router(jobs_router, prefix="/api/v1/jobs", tags=["Job Postings"])
app.include_router(applications_router, prefix="/api/v1/applications", tags=["Job Applications"])
app.include_router(interviews_router, prefix="/api/v1/interviews", tags=["Interview Schedules"])
app.include_router(offers_router, prefix="/api/v1/offers", tags=["Job Offers & Onboarding"])
app.include_router(referrals_router, prefix="/api/v1/referrals", tags=["Internal Referrals"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics & KPIs"])
app.include_router(email_automation_router, prefix="/api/v1", tags=["Email Automation"])
