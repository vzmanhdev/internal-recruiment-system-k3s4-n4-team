"""Route-level authorization decisions for page navigation (used by the frontend proxy).

The frontend owns only the *declaration* of which permissions a route needs (one central registry);
the decision is always made here, from the database-driven effective permissions of the user.
"""
import re
from typing import Iterable, List, Optional, Set

from sqlalchemy.orm import Session

from app.models.user import User
from app.services.rbac_service import get_effective_permissions, get_user_roles

_CODE = re.compile(r"^[a-z_]+(:[a-z_]+){1,2}$")

WORKSPACE_LABELS = {
    "admin": "Quản trị hệ thống",
    "hr": "Quản lý Nhân sự",
    "recruiter": "Chuyên viên tuyển dụng",
    "manager": "Trưởng bộ phận",
    "interviewer": "Người phỏng vấn",
    "approver": "Phê duyệt",
    "employee": "Cổng nhân viên",
    "candidate": "Cổng ứng viên",
}


def parse_codes(raw: Optional[str]) -> List[str]:
    codes = [c.strip() for c in (raw or "").split(",") if c.strip()]
    return [c for c in codes if _CODE.match(c)]


def is_admin(db: Session, user: User) -> bool:
    return any(r["code"] == "admin" for r in get_user_roles(db, user))


def decide(db: Session, user: User, required_all: Iterable[str], required_any: Iterable[str]) -> bool:
    """Admin = full allow (backend rule). Otherwise every ``required_all`` and at least one ``required_any``."""
    if is_admin(db, user):
        return True
    granted: Set[str] = set(get_effective_permissions(db, user))
    required_all, required_any = list(required_all), list(required_any)
    if any(code not in granted for code in required_all):
        return False
    if required_any and not any(code in granted for code in required_any):
        return False
    return True


def denial(workspace: Optional[str]) -> dict:
    if workspace == "hr":
        return {
            "code": "HR_WORKSPACE_ACCESS_DENIED",
            "message": ("Bạn không có quyền truy cập khu vực Quản lý Nhân sự. Tài khoản hiện tại chưa được cấp quyền "
                        "sử dụng phân hệ này. Vui lòng liên hệ Quản trị hệ thống nếu bạn cần được cấp quyền."),
        }
    label = WORKSPACE_LABELS.get(workspace or "")
    if label:
        return {
            "code": f"{workspace.upper()}_WORKSPACE_ACCESS_DENIED",
            "message": (f"Bạn không có quyền truy cập khu vực {label}. Tài khoản hiện tại chưa được cấp quyền sử dụng "
                        "chức năng này. Vui lòng liên hệ Quản trị hệ thống nếu bạn cần được cấp quyền."),
        }
    return {
        "code": "ROUTE_ACCESS_DENIED",
        "message": "Bạn không có quyền truy cập trang này. Vui lòng liên hệ Quản trị hệ thống nếu bạn cần được cấp quyền.",
    }
