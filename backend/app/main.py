from typing import Dict

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text

from app.api.v1.admin import router as admin_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.application import router as application_router
from app.api.v1.auth import router as auth_router
from app.api.v1.hr import router as hr_router
from app.api.v1.interview import router as interview_router
from app.api.v1.job import router as job_router
from app.api.v1.offer_onboarding import router as offer_onboarding_router
from app.api.v1.referral_eval import router as referral_eval_router
from app.api.v1.requisition import router as requisition_router
from app.core.config import settings
from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.application import ApplicationLog, JobApplication
from app.models.hr import Competency, Department, JobTitle, SharedCategory
from app.models.interview import InterviewInterviewer, InterviewSchedule
from app.models.job import JobPosting
from app.models.offer_onboarding import JobOffer, OnboardingChecklist
from app.models.referral_eval import CandidateEvaluation, InternalReferral
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.system import AuditLog, SystemSetting
from app.models.user import User

Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "account_status" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'active'"))
        connection.execute(text("UPDATE users SET account_status = 'pending' WHERE is_active = false"))
    if "lock_reason" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN lock_reason VARCHAR(500)"))
    if "avatar_url" not in user_columns:
        connection.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(4000000)"))
    competency_columns = {column["name"] for column in inspect(engine).get_columns("competencies")}
    if "weight" not in competency_columns:
        connection.execute(text("ALTER TABLE competencies ADD COLUMN weight FLOAT NOT NULL DEFAULT 0"))
    interview_columns = {column["name"] for column in inspect(engine).get_columns("interview_schedules")}
    if "candidate_response" not in interview_columns:
        connection.execute(text("ALTER TABLE interview_schedules ADD COLUMN candidate_response VARCHAR(30) NOT NULL DEFAULT 'pending'"))
    if "candidate_response_at" not in interview_columns:
        timestamp_type = "TIMESTAMP" if engine.dialect.name == "postgresql" else "DATETIME"
        connection.execute(text(f"ALTER TABLE interview_schedules ADD COLUMN candidate_response_at {timestamp_type}"))

if settings.APP_ENV != "production":
    db = SessionLocal()
    try:
        has_admin = db.query(User).filter(User.role.ilike("%admin%")).first()
        if not has_admin:
            db.add(User(
                email=settings.DEV_ADMIN_EMAIL,
                hashed_password=hash_password(settings.DEV_ADMIN_PASSWORD),
                full_name="System Admin",
                role="admin",
                is_active=True,
                account_status="active",
            ))
            db.commit()
    finally:
        db.close()

app = FastAPI(
    title="Internal Recruitment System API",
    version="1.0.0",
    description="FastAPI Backend connected with PostgreSQL Database",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        content={"detail": "Dữ liệu nhập vào chưa chính xác hoặc thiếu trường thông tin bắt buộc.", "field_errors": field_errors},
    )


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Account administration"])
app.include_router(hr_router, prefix="/api/v1/hr", tags=["Human resources"])
app.include_router(requisition_router, prefix="/api/v1/requisitions", tags=["Job Requisitions"])
app.include_router(job_router, prefix="/api/v1/jobs", tags=["Job Postings"])
app.include_router(application_router, prefix="/api/v1/applications", tags=["Job Applications"])
app.include_router(referral_eval_router, prefix="/api/v1", tags=["Internal Referrals & Evaluations"])
app.include_router(interview_router, prefix="/api/v1", tags=["Interview Scheduling & Panel"])
app.include_router(offer_onboarding_router, prefix="/api/v1", tags=["Offer Management & Onboarding"])
app.include_router(analytics_router, prefix="/api/v1", tags=["Recruitment Analytics & Reports"])
