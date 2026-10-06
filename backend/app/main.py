from typing import Dict
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.db.session import engine, Base
from app.models.user import User  # Register model
from app.models.recruitment import JobRequisition, JobPosting, Application, InterviewSchedule, ReferralRecord  # Register recruitment models
from app.models.audit import AuditLog  # Register audit log model
from app.api.v1.auth import router as auth_router
from app.api.v1.admin import router as admin_router
from app.api.v1.recruiter import router as recruiter_router

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
    if "job_postings" in inspect(engine).get_table_names():
        job_columns = {column["name"] for column in inspect(engine).get_columns("job_postings")}
        if "approval_status" not in job_columns:
            connection.execute(text("ALTER TABLE job_postings ADD COLUMN approval_status VARCHAR(30) NOT NULL DEFAULT 'approved'"))
        if "requisition_id" not in job_columns:
            connection.execute(text("ALTER TABLE job_postings ADD COLUMN requisition_id INTEGER REFERENCES job_requisitions(id)"))

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
        # Extract field name
        field_name = loc[-1] if loc else "general"
        
        # Translate common Pydantic error messages to friendly Vietnamese
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
app.include_router(recruiter_router, prefix="/api/v1/recruiter", tags=["Recruiter Operations"])

# Public Jobs Endpoints (no authentication required)
from app.api.v1.recruiter import list_public_jobs, get_public_job_detail
app.add_api_route("/api/v1/jobs", list_public_jobs, methods=["GET"], tags=["Public Jobs"])
app.add_api_route("/api/v1/jobs/{job_id}", get_public_job_detail, methods=["GET"], tags=["Public Jobs"])
