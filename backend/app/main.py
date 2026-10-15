import logging
import time
import uuid
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.db.session import engine, Base
import app.models  # Register all SQLAlchemy models
import app.models.rbac, app.models.auth_session, app.models.password_reset  # noqa: F401,E401
from app.db.bootstrap import ensure_schema
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
from app.api.v1.notifications import router as notifications_router
from app.api.v1.files import router as files_router
from app.api.v1.public import router as public_router
from app.api.v1.talent_pool import router as talent_pool_router

logger = logging.getLogger("app")

# Development convenience only: production schema is managed exclusively by "alembic upgrade head".
if settings.AUTO_CREATE_SCHEMA and not settings.is_production:
    ensure_schema(engine, Base.metadata)

app = FastAPI(
    title="Internal Recruitment System API",
    version="1.0.0",
    description="FastAPI Backend connected with PostgreSQL Database",
)

# CORS: explicit allowlist only. A wildcard origin is never combined with credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)


@app.on_event("startup")
def _start_worker() -> None:
    if settings.BACKGROUND_WORKER_ENABLED and settings.APP_ENV.strip().lower() != "test":
        from app.db.session import SessionLocal
        from app.services.scheduled_jobs import start_background_worker
        start_background_worker(SessionLocal)


@app.middleware("http")
async def request_context(request: Request, call_next):
    incoming = request.headers.get("X-Request-ID", "")
    request_id = incoming if 0 < len(incoming) <= 64 and incoming.replace("-", "").replace("_", "").isalnum() else f"req_{uuid.uuid4().hex[:16]}"
    request.state.request_id = request_id
    started = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_id=%s method=%s path=%s status=%s duration_ms=%.1f",
        request_id, request.method, request.url.path, response.status_code, (time.perf_counter() - started) * 1000,
    )
    return response


ERROR_CODES = {
    400: "BAD_REQUEST", 401: "UNAUTHENTICATED", 403: "PERMISSION_DENIED", 404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED", 409: "CONFLICT", 410: "GONE", 413: "PAYLOAD_TOO_LARGE",
    415: "UNSUPPORTED_MEDIA_TYPE", 422: "VALIDATION_ERROR", 423: "LOCKED", 429: "RATE_LIMITED",
    500: "INTERNAL_ERROR", 502: "BAD_GATEWAY", 503: "SERVICE_UNAVAILABLE", 504: "GATEWAY_TIMEOUT",
}
DEFAULT_MESSAGES = {
    401: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    403: "Bạn không có quyền thực hiện chức năng này.",
    404: "Không tìm thấy tài nguyên yêu cầu.",
    405: "Phương thức không được hỗ trợ cho đường dẫn này.",
    429: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
    500: "Hệ thống gặp sự cố nội bộ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
}


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", None) or f"req_{uuid.uuid4().hex[:16]}"


def error_response(request: Request, status_code: int, detail: Any, field_errors: Optional[Dict[str, str]] = None,
                   headers: Optional[Dict[str, str]] = None) -> JSONResponse:
    """Uniform error envelope. "detail" is preserved verbatim for existing frontend callers."""
    code = (headers or {}).get("X-Error-Code") or ERROR_CODES.get(status_code, "ERROR")
    if isinstance(detail, dict):
        code = detail.get("code") or code
        message = detail.get("message") or DEFAULT_MESSAGES.get(status_code, "")
    elif isinstance(detail, str) and detail and detail not in ("Not Found", "Method Not Allowed"):
        message = detail
    else:
        message = DEFAULT_MESSAGES.get(status_code, str(detail or ""))
        if detail in ("Not Found", "Method Not Allowed"):
            detail = message
    body = {
        "success": False,
        "detail": detail,
        "error": {
            "code": code,
            "message": message,
            "details": None,
            "field_errors": [{"field": k, "message": v} for k, v in (field_errors or {}).items()],
        },
        "request_id": _request_id(request),
    }
    if field_errors is not None:
        body["field_errors"] = field_errors
    out_headers = dict(headers or {})
    out_headers["X-Request-ID"] = body["request_id"]
    return JSONResponse(status_code=status_code, content=body, headers=out_headers)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return error_response(request, exc.status_code, exc.detail, headers=getattr(exc, "headers", None))


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.warning("request_id=%s integrity_error=%s", _request_id(request), type(exc.orig).__name__)
    return error_response(request, status.HTTP_409_CONFLICT,
                          {"code": "DATA_CONFLICT", "message": "Dữ liệu bị trùng hoặc vi phạm ràng buộc toàn vẹn. Vui lòng kiểm tra lại."})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log full details server-side; never return raw exception text or stack traces to clients.
    logger.exception("request_id=%s unhandled_error=%s", _request_id(request), type(exc).__name__)
    return error_response(request, status.HTTP_500_INTERNAL_SERVER_ERROR, DEFAULT_MESSAGES[500])


# Override Pydantic validation exception handler for precise field-level errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    field_errors = {}
    for error in exc.errors():
        loc = error.get("loc", [])
        msg = error.get("msg", "")
        field_name = ".".join(str(part) for part in loc[1:]) if len(loc) > 1 else (str(loc[-1]) if loc else "general")

        if "value is not a valid email address" in msg:
            msg_str = "Địa chỉ Email không đúng định dạng (Ví dụ: name@company.com)."
        elif "field required" in msg.lower():
            msg_str = "Trường này là bắt buộc, không được để trống."
        elif "String should have at least" in msg:
            msg_str = msg.replace("String should have at least", "Độ dài tối thiểu là")
        elif msg.startswith("Value error,"):
            msg_str = msg.replace("Value error,", "").strip()
        else:
            msg_str = msg

        field_errors[field_name or "general"] = msg_str

    return error_response(
        request,
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        "Dữ liệu nhập vào chưa chính xác hoặc thiếu trường thông tin bắt buộc.",
        field_errors=field_errors,
    )


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok", "message": "Backend is running"}


@app.get("/health/ready")
def readiness_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unavailable", "database": "down"})
    return {"status": "ok", "database": "up", "dialect": engine.dialect.name}


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
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(files_router, prefix="/api/v1/files", tags=["Files"])
app.include_router(public_router, prefix="/api/v1/public", tags=["Candidate self-service"])
app.include_router(talent_pool_router, prefix="/api/v1/talent-pool", tags=["Talent pool"])
