from pathlib import Path
from typing import Dict

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.api.v1.admin import router as admin_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.application import router as application_router
from app.api.v1.auth import router as auth_router
from app.api.v1.hr import router as hr_router
from app.api.v1.headcount import router as headcount_router
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
from app.models.headcount import HeadcountBudget, RequisitionPublication
from app.models.interview import InterviewInterviewer, InterviewSchedule
from app.models.job import JobPosting
from app.models.offer_onboarding import JobOffer, OnboardingChecklist
from app.models.referral_eval import CandidateEvaluation, InternalReferral
from app.models.requisition import JobRequisition, RequisitionApprovalLog
from app.models.system import AuditLog, SystemSetting
from app.models.user import User
from app.models.password_reset import PasswordResetSession
from app.models.email_automation import EmailTemplate, EmailLog

Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    requisition_columns = {column["name"] for column in inspect(engine).get_columns("job_requisitions")}
    for name, definition in {"recruiter_id": "INTEGER REFERENCES users(id)", "support_recruiter_id": "INTEGER REFERENCES users(id)", "headcount_budget_id": "INTEGER REFERENCES headcount_budgets(id)", "reserved_monthly_salary": "NUMERIC(18, 2)"}.items():
        if name not in requisition_columns:
            connection.execute(text(f"ALTER TABLE job_requisitions ADD COLUMN {name} {definition}"))
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
    setting_columns = {column["name"] for column in inspect(engine).get_columns("system_settings")}
    if "landing_title" not in setting_columns:
        connection.execute(text("ALTER TABLE system_settings ADD COLUMN landing_title VARCHAR(255) NOT NULL DEFAULT 'Cùng nhau tạo nên những điều lớn lao'"))
    if "landing_body" not in setting_columns:
        connection.execute(text("ALTER TABLE system_settings ADD COLUMN landing_body TEXT NOT NULL DEFAULT 'Khám phá cơ hội phát triển sự nghiệp ngay trong nội bộ, đóng góp giá trị và cùng phát triển tiến xa hơn mỗi ngày.'"))
    if "landing_image" not in setting_columns:
        connection.execute(text("ALTER TABLE system_settings ADD COLUMN landing_image TEXT"))
    competency_columns = {column["name"] for column in inspect(engine).get_columns("competencies")}
    if "weight" not in competency_columns:
        connection.execute(text("ALTER TABLE competencies ADD COLUMN weight FLOAT NOT NULL DEFAULT 0"))
    interview_columns = {column["name"] for column in inspect(engine).get_columns("interview_schedules")}
    if "candidate_response" not in interview_columns:
        connection.execute(text("ALTER TABLE interview_schedules ADD COLUMN candidate_response VARCHAR(30) NOT NULL DEFAULT 'pending'"))
    if "candidate_response_at" not in interview_columns:
        timestamp_type = "TIMESTAMP" if engine.dialect.name == "postgresql" else "DATETIME"
        connection.execute(text(f"ALTER TABLE interview_schedules ADD COLUMN candidate_response_at {timestamp_type}"))
    application_columns = {column["name"] for column in inspect(engine).get_columns("job_applications")}
    for name, definition in {
        "cv_filename": "VARCHAR(255)",
        "cv_content_type": "VARCHAR(120)",
        "cv_extracted_data": "TEXT",
        "tags": "TEXT",
        "recruiter_notes": "TEXT",
    }.items():
        if name not in application_columns:
            connection.execute(text(f"ALTER TABLE job_applications ADD COLUMN {name} {definition}"))

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
        has_hr_manager = db.query(User).filter(User.role.ilike("%hr_manager%")).first()
        if not has_hr_manager:
            db.add(User(
                email=settings.DEV_HR_EMAIL,
                hashed_password=hash_password(settings.DEV_HR_PASSWORD),
                full_name="Trưởng phòng Nhân sự",
                role="hr_manager",
                is_active=True,
                account_status="active",
            ))
            db.commit()
        has_manager = db.query(User).filter(User.role.ilike("%manager%")).filter(~User.role.ilike("%hr_manager%")).first()
        if not has_manager:
            db.add(User(
                email=settings.DEV_MANAGER_EMAIL,
                hashed_password=hash_password(settings.DEV_MANAGER_PASSWORD),
                full_name="Trưởng bộ phận Kỹ thuật",
                role="manager",
                is_active=True,
                account_status="active",
            ))
            db.commit()
        has_recruiter = db.query(User).filter(User.role.ilike("%recruiter%")).first()
        if not has_recruiter and not db.query(User).filter_by(email=settings.DEV_RECRUITER_EMAIL).first():
            db.add(User(email=settings.DEV_RECRUITER_EMAIL, hashed_password=hash_password(settings.DEV_RECRUITER_PASSWORD), full_name="Nhân viên tuyển dụng", role="recruiter", is_active=True, account_status="active"))
            db.commit()
    finally:
        db.close()

app = FastAPI(
    title="Internal Recruitment System API",
    version="1.0.0",
    description="FastAPI Backend connected with PostgreSQL Database",
)

UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")

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
app.include_router(headcount_router, prefix="/api/v1/headcount", tags=["Headcount budgets"])
app.include_router(requisition_router, prefix="/api/v1/requisitions", tags=["Job Requisitions"])
app.include_router(job_router, prefix="/api/v1/jobs", tags=["Job Postings"])
app.include_router(application_router, prefix="/api/v1/applications", tags=["Job Applications"])
app.include_router(referral_eval_router, prefix="/api/v1", tags=["Internal Referrals & Evaluations"])
app.include_router(interview_router, prefix="/api/v1", tags=["Interview Scheduling & Panel"])
app.include_router(offer_onboarding_router, prefix="/api/v1", tags=["Offer Management & Onboarding"])
app.include_router(analytics_router, prefix="/api/v1", tags=["Recruitment Analytics & Reports"])

# Keep existing service contracts while sharing the canonical database models.
from app.api.v1.requisitions import router as legacy_requisitions
from app.api.v1.jobs import router as legacy_jobs
from app.api.v1.applications import router as legacy_applications
from app.api.v1.interviews import router as legacy_interviews
from app.api.v1.legacy_offer_onboarding import router as legacy_offers
from app.api.v1.legacy_referral_eval import router as legacy_referrals
from app.api.v1.legacy_analytics import router as legacy_analytics
from app.api.v1.email_automation import router as email_automation_router
app.include_router(legacy_requisitions, prefix="/api/v1/legacy/requisitions", tags=["Existing requisition views"])
app.include_router(legacy_jobs, prefix="/api/v1/legacy/jobs", tags=["Existing job views"])
app.include_router(legacy_applications, prefix="/api/v1/legacy/applications", tags=["Existing candidate views"])
app.include_router(legacy_interviews, prefix="/api/v1/legacy/interviews", tags=["Existing interview views"])
app.include_router(legacy_offers, prefix="/api/v1/legacy/offers", tags=["Existing offers and onboarding"])
app.include_router(legacy_referrals, prefix="/api/v1/legacy/referrals", tags=["Existing referrals and evaluations"])
app.include_router(legacy_analytics, prefix="/api/v1/legacy/analytics", tags=["Existing report views"])
app.include_router(email_automation_router, prefix="/api/v1/email-automation", tags=["Email automation"])
