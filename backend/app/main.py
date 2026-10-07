import uuid
from typing import Dict
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine, Base
from app.db.init_db import init_db
from app.models.user import User
from app.models.master_data import Department, SalaryBand
from app.models.requisition import Requisition
from app.models.job import JobPosting
from app.models.candidate import Candidate, Application
from app.models.interview import InterviewSchedule, EvaluationScorecard
from app.models.offer import Offer, OnboardingTask
from app.models.competency import CompetencyFramework, CompetencyCriteria, InterviewQuestion

from app.api.v1.auth import router as auth_router
from app.api.v1.master_data import router as master_data_router
from app.api.v1.requisitions import router as requisitions_router
from app.api.v1.jobs import router as jobs_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.candidates import router as candidates_router
from app.api.v1.interviews import router as interviews_router
from app.api.v1.offers import router as offers_router
from app.api.v1.competencies import router as competencies_router
from app.api.v1.execution import router as execution_router
from app.api.v1.settings import router as settings_router

# Create database tables automatically and seed initial data
Base.metadata.create_all(bind=engine)
init_db()

app = FastAPI(
    title="Internal Recruitment System API",
    version="1.0.0",
    description="FastAPI Backend connected with SQLite/PostgreSQL Database",
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

    req_id = f"req-{uuid.uuid4().hex[:8]}"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Dữ liệu gửi lên chưa đúng định dạng hoặc thiếu trường thông tin bắt buộc.",
                "details": field_errors
            },
            "detail": "Dữ liệu nhập vào chưa chính xác hoặc thiếu trường thông tin bắt buộc.",
            "field_errors": field_errors,
            "request_id": req_id
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN_PERMISSION",
        404: "RESOURCE_NOT_FOUND",
        409: "RESOURCE_CONFLICT",
        422: "VALIDATION_ERROR",
        423: "ACCOUNT_LOCKED",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_ERROR",
        503: "SERVICE_UNAVAILABLE"
    }
    err_code = getattr(exc, "code", code_map.get(exc.status_code, "ERROR"))
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": err_code,
                "message": exc.detail if isinstance(exc.detail, str) else "Đã xảy ra lỗi khi xử lý yêu cầu.",
                "details": getattr(exc, "details", None)
            },
            "detail": exc.detail,
            "request_id": req_id
        },
        headers=getattr(exc, "headers", None)
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    req_id = f"req-{uuid.uuid4().hex[:8]}"
    print(f"[ERROR SERVER {req_id}] {request.method} {request.url.path}: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ Quản trị viên.",
                "details": None
            },
            "detail": "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.",
            "request_id": req_id
        }
    )

@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok", "message": "Backend connected & database ready"}

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(master_data_router, prefix="/api/v1/master-data", tags=["Master Data"])
app.include_router(competencies_router, prefix="/api/v1/competencies", tags=["Competency Frameworks & Criteria"])
app.include_router(requisitions_router, prefix="/api/v1/requisitions", tags=["Requisitions"])
app.include_router(jobs_router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(candidates_router, prefix="/api/v1/candidates", tags=["Candidates & Applications"])
app.include_router(interviews_router, prefix="/api/v1/interviews", tags=["Interviews & Scorecards"])
app.include_router(offers_router, prefix="/api/v1/offers", tags=["Offers & Onboarding"])
app.include_router(execution_router, prefix="/api/v1/execution", tags=["Execution & Evaluations"])
app.include_router(settings_router, prefix="/api/v1/settings", tags=["Settings & Templates"])
