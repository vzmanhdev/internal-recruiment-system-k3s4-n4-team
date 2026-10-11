from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification, NotificationPreference
from app.api.deps import get_current_user_obj
from app.services.notification_service import NOTIFICATION_TYPES

router = APIRouter()


class PreferenceItem(BaseModel):
    type: str
    in_app_enabled: bool = True
    email_enabled: bool = True


class PreferencesUpdate(BaseModel):
    items: List[PreferenceItem]


@router.get("")
def list_my_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user_obj),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.recipient_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)  # noqa: E712
    items = query.order_by(Notification.created_at.desc(), Notification.id.desc()).limit(max(1, min(limit, 200))).all()
    unread = db.query(Notification).filter(Notification.recipient_id == current_user.id, Notification.is_read == False).count()  # noqa: E712
    return {"items": [n.to_dict() for n in items], "unread_count": unread}


@router.get("/unread-count")
def unread_count(current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.recipient_id == current_user.id, Notification.is_read == False).count()  # noqa: E712
    return {"unread_count": count}


@router.post("/{notification_id}/read")
def mark_read(notification_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    item = db.query(Notification).filter(Notification.id == notification_id, Notification.recipient_id == current_user.id).first()
    if not item:  # also hides other users' notifications (no existence disclosure)
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")
    if not item.is_read:
        item.is_read = True
        item.read_at = datetime.utcnow()
        db.commit()
        db.refresh(item)
    return item.to_dict()


@router.post("/read-all")
def mark_all_read(current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    updated = db.query(Notification).filter(
        Notification.recipient_id == current_user.id, Notification.is_read == False  # noqa: E712
    ).update({Notification.is_read: True, Notification.read_at: datetime.utcnow()}, synchronize_session=False)
    db.commit()
    return {"updated": updated}


@router.get("/preferences")
def get_preferences(current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    saved = {p.type: p for p in db.query(NotificationPreference).filter(NotificationPreference.user_id == current_user.id).all()}
    return [
        {
            "type": code,
            "label": label,
            "mandatory": mandatory,
            "in_app_enabled": True if mandatory else (saved[code].in_app_enabled if code in saved else True),
            "email_enabled": True if mandatory else (saved[code].email_enabled if code in saved else True),
        }
        for code, (label, mandatory) in NOTIFICATION_TYPES.items()
    ]


@router.put("/preferences")
def update_preferences(payload: PreferencesUpdate, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    for item in payload.items:
        if item.type not in NOTIFICATION_TYPES:
            raise HTTPException(status_code=422, detail=f"Loại thông báo '{item.type}' không tồn tại.")
        if NOTIFICATION_TYPES[item.type][1] and not (item.in_app_enabled and item.email_enabled):
            raise HTTPException(status_code=422, detail=f"Thông báo bắt buộc '{NOTIFICATION_TYPES[item.type][0]}' không thể tắt.")
        pref = db.query(NotificationPreference).filter(
            NotificationPreference.user_id == current_user.id, NotificationPreference.type == item.type
        ).first()
        if not pref:
            pref = NotificationPreference(user_id=current_user.id, type=item.type)
            db.add(pref)
        pref.in_app_enabled = item.in_app_enabled
        pref.email_enabled = item.email_enabled
    db.commit()
    return get_preferences(current_user, db)
