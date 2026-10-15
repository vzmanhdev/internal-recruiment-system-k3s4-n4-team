from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.exceptions import HTTPException as FastAPIHTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import authenticate_bearer
from app.db.session import get_db
from app.models.application import JobApplication
from app.models.master_data import StoredFile
from app.models.referral_eval import InternalReferral
from app.models.user import User
from app.services import file_storage
from app.services.access_scope import role_codes, visible_applications, FULL_ACCESS_ROLES
from app.services.cv_parser import parse_cv

router = APIRouter()
ANONYMOUS_UPLOADS_PER_HOUR = 10


def _optional_user(authorization: Optional[str], db: Session) -> Optional[User]:
    if not authorization:
        return None
    try:
        return authenticate_bearer(authorization, db)[0]
    except FastAPIHTTPException:
        return None


@router.post("", status_code=201)
async def upload_file(
    request: Request,
    kind: str = Form(...),
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user = _optional_user(authorization, db)
    if kind == "avatar" and not user:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập để tải ảnh đại diện.")
    ip = request.client.host if request.client else None
    if not user:
        recent = db.query(StoredFile).filter(StoredFile.uploader_ip == ip, StoredFile.owner_id.is_(None),
                                             StoredFile.created_at >= datetime.utcnow() - timedelta(hours=1)).count()
        if recent >= ANONYMOUS_UPLOADS_PER_HOUR:
            raise HTTPException(status_code=429, detail="Bạn đã tải lên quá nhiều tệp. Vui lòng thử lại sau 1 giờ.",
                                headers={"Retry-After": "3600"})
    data = await file.read(file_storage.LIMITS.get(kind, 0) + 1)
    content_type = file_storage.validate(kind, data)
    storage_name, digest = file_storage.write_bytes(data, content_type)
    item = StoredFile(kind=kind, owner_id=user.id if user else None, original_name=(file.filename or "file")[:255],
                      content_type=content_type, size_bytes=len(data), sha256=digest, storage_name=storage_name, uploader_ip=ip)
    db.add(item)
    db.commit()
    db.refresh(item)
    out = item.to_dict()
    if kind == "cv":
        out["parsed"] = parse_cv(data, content_type)  # S4-04: shown for confirmation, never auto-applied
    return out


def _can_download(db: Session, user: Optional[User], item: StoredFile) -> bool:
    if item.kind == "avatar":
        return user is not None
    if user is None:
        return False
    if item.owner_id == user.id or role_codes(db, user) & FULL_ACCESS_ROLES:
        return True
    if visible_applications(db, user).filter(JobApplication.cv_url == item.url).first():
        return True
    return db.query(InternalReferral.id).filter(InternalReferral.cv_url == item.url, InternalReferral.referrer_id == user.id).first() is not None


@router.get("/{file_id}")
def download_file(file_id: str, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    item = db.query(StoredFile).filter(StoredFile.id == file_id).first()
    user = _optional_user(authorization, db)
    if not item or not _can_download(db, user, item):
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp")  # no existence disclosure
    data = file_storage.read_bytes(item.storage_name)
    safe_name = "".join(ch for ch in item.original_name if ch.isalnum() or ch in "._- ") or "file"
    return Response(content=data, media_type=item.content_type, headers={
        "Content-Disposition": f'inline; filename="{safe_name}"', "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store"})
