from typing import List, Optional, Callable
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_access_token

class StandardAPIException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, details: Optional[dict] = None):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.details = details

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
        )

    token = authorization.split(" ")[1]
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
        )

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không tìm thấy tài khoản người dùng tương ứng trong hệ thống."
        )

    if not user.is_active or user.account_status in ["inactive", "disabled", "locked"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản của bạn hiện đang bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ Quản trị viên."
        )

    return user

def require_roles(*allowed_roles: str) -> Callable:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "").lower()
        normalized_allowed = [r.lower() for r in allowed_roles]

        # Support 'admin' having overarching access if appropriate or strict role checking
        if user_role not in normalized_allowed and user_role != "admin":
            role_labels = {
                "admin": "Quản trị viên hệ thống (Admin)",
                "hr_manager": "Trưởng phòng Nhân sự (HR Manager)",
                "department_manager": "Trưởng bộ phận (Department Manager)",
                "recruiter": "Chuyên viên tuyển dụng (Recruiter)",
                "approver": "Người phê duyệt (Approver)",
                "employee": "Nhân viên (Employee)",
                "candidate": "Ứng viên (Candidate)"
            }
            allowed_names = [role_labels.get(r, r) for r in normalized_allowed]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bạn không có quyền thực hiện thao tác này. Chức năng yêu cầu vai trò: {', '.join(allowed_names)}."
            )
        return current_user
    return role_checker
