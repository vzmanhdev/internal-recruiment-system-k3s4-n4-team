"""In-app notification fan-out for business events (S8-03 / S8-04).

``notify`` only adds rows to the caller's session; the caller's commit persists the business change and its
notifications atomically (no lost notifications if the request fails half-way, no orphan notifications).
"""
from typing import Dict, Iterable, Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationPreference
from app.models.rbac import Role, UserRole
from app.models.user import User

# type -> (label, mandatory). Mandatory notifications cannot be disabled (S8-04).
NOTIFICATION_TYPES: Dict[str, tuple] = {
    "approval_pending": ("Yêu cầu chờ bạn duyệt", True),
    "requisition_decision": ("Kết quả duyệt yêu cầu tuyển dụng", False),
    "recruiter_assigned": ("Được phân công vị trí tuyển dụng", True),
    "interview_invited": ("Được mời tham gia phỏng vấn", True),
    "offer_response": ("Ứng viên phản hồi offer", False),
    "application_withdrawn": ("Ứng viên rút hồ sơ", False),
    "sla_overdue": ("Nhắc việc hồ sơ quá hạn SLA", True),
    "interview_response": ("Ứng viên phản hồi lịch phỏng vấn", False),
    "evaluation_pending": ("Phiếu đánh giá cần nộp", False),
}


def users_with_roles(db: Session, role_codes: Iterable[str], exclude_user_id: Optional[int] = None) -> list:
    codes = list(role_codes)
    q = (
        db.query(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .filter(Role.code.in_(codes), User.account_status == "active")
        .distinct()
    )
    ids = [r[0] for r in q.all()]
    return [i for i in ids if i != exclude_user_id]


def _in_app_enabled(db: Session, user_id: int, ntype: str) -> bool:
    if NOTIFICATION_TYPES.get(ntype, ("", False))[1]:
        return True
    pref = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == user_id, NotificationPreference.type == ntype
    ).first()
    return pref.in_app_enabled if pref else True


def notify(db: Session, recipient_ids: Iterable[int], ntype: str, title: str, message: str = "",
           link: Optional[str] = None, entity_type: Optional[str] = None, entity_id=None) -> int:
    created = 0
    for uid in dict.fromkeys(i for i in recipient_ids if i):
        if not _in_app_enabled(db, uid, ntype):
            continue
        db.add(Notification(recipient_id=uid, type=ntype, title=title, message=message, link=link,
                            entity_type=entity_type, entity_id=str(entity_id) if entity_id is not None else None))
        created += 1
    return created
