"""S5-06 talent pool (also used by S7-07 when a candidate declines an offer)."""
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_obj
from app.db.session import get_db
from app.models.application import JobApplication
from app.models.master_data import TalentPoolEntry
from app.models.requisition import JobRequisition
from app.models.user import User
from app.services.access_scope import ensure_can_manage_application, require_any_permission

from app.core.search import build_search_filter, build_search_score

router = APIRouter()


class TalentPoolIn(BaseModel):
    application_id: int
    reason: str = Field(..., min_length=1)
    interested_title: Optional[str] = None
    skills: Optional[str] = None


@router.get("")
def search_pool(q: Optional[str] = None, title: Optional[str] = None, current_user: User = Depends(get_current_user_obj),
                db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "candidate:view")
    query = db.query(TalentPoolEntry).filter(TalentPoolEntry.is_active == True)  # noqa: E712
    if title:
        query = query.filter(TalentPoolEntry.interested_title.ilike(f"%{title}%"))
    search_score = None
    if q and q.strip():
        search_cols = [TalentPoolEntry.skills, TalentPoolEntry.full_name, TalentPoolEntry.interested_title]
        query = query.filter(build_search_filter(search_cols, q.strip()))
        search_score = build_search_score(search_cols, q.strip())
    if search_score is not None:
        return [e.to_dict() for e in query.order_by(search_score.desc(), TalentPoolEntry.created_at.desc()).all()]
    return [e.to_dict() for e in query.order_by(TalentPoolEntry.created_at.desc()).all()]


@router.post("", status_code=201)
def add_to_pool(payload: TalentPoolIn, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "candidate:evaluate")
    app = db.query(JobApplication).filter(JobApplication.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ ứng tuyển")
    ensure_can_manage_application(db, current_user, app)
    key = app.person_key or app.email
    if db.query(TalentPoolEntry.id).filter(TalentPoolEntry.person_key == key, TalentPoolEntry.is_active == True).first():  # noqa: E712
        raise HTTPException(status_code=409, detail="Ứng viên đã có trong kho tiềm năng.")
    entry = TalentPoolEntry(person_key=key, application_id=app.id, full_name=app.full_name, email=app.email, phone=app.phone,
                            interested_title=payload.interested_title or (app.job_posting.title if app.job_posting else None),
                            skills=payload.skills or app.current_position, reason=payload.reason, added_by_id=current_user.id)
    db.add(entry); db.commit(); db.refresh(entry)
    return entry.to_dict()


@router.get("/suggestions")
def suggest_for_requisition(requisition_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    """S5-06 AC3: when a new position opens, suggest pool candidates whose interested title/skills match."""
    require_any_permission(db, current_user, "candidate:view")
    req = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Không tìm thấy tờ trình")
    words = {w for w in re.split(r"\W+", f"{req.title} {req.job_title_name or ''} {req.requirements or ''}".lower()) if len(w) > 2}
    scored = []
    for e in db.query(TalentPoolEntry).filter(TalentPoolEntry.is_active == True).all():  # noqa: E712
        text = f"{e.interested_title or ''} {e.skills or ''}".lower()
        score = sum(1 for w in words if w in text)
        if score:
            scored.append({**e.to_dict(), "match": score})
    return sorted(scored, key=lambda x: -x["match"])[:20]


@router.delete("/{entry_id}")
def remove_from_pool(entry_id: int, current_user: User = Depends(get_current_user_obj), db: Session = Depends(get_db)):
    require_any_permission(db, current_user, "candidate:evaluate")
    entry = db.query(TalentPoolEntry).filter(TalentPoolEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Không tìm thấy ứng viên trong kho")
    entry.is_active = False
    db.commit()
    return {"success": True}
