"""Validated file storage (S2-03 avatar, S4-03 CV). Type is detected from the bytes, never trusted from the client."""
import base64
import hashlib
import io
import os
import uuid
import zipfile
from typing import Optional, Tuple

from fastapi import HTTPException

from app.core.config import settings

LIMITS = {"cv": 10 * 1024 * 1024, "avatar": 2 * 1024 * 1024}
ALLOWED = {"cv": {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
           "avatar": {"image/png", "image/jpeg"}}
EXTENSIONS = {"application/pdf": ".pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
              "image/png": ".png", "image/jpeg": ".jpg"}


def storage_dir() -> str:
    path = os.path.abspath(settings.FILE_STORAGE_DIR)
    os.makedirs(path, exist_ok=True)
    return path


def detect_type(data: bytes) -> Optional[str]:
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                if "word/document.xml" in z.namelist():
                    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        except zipfile.BadZipFile:
            return None
    return None


def validate(kind: str, data: bytes) -> str:
    if kind not in LIMITS:
        raise HTTPException(status_code=422, detail="Loại tệp chỉ nhận 'cv' hoặc 'avatar'.")
    if not data:
        raise HTTPException(status_code=422, detail="Tệp tải lên bị rỗng.")
    if len(data) > LIMITS[kind]:
        mb = LIMITS[kind] // (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"Tệp vượt quá dung lượng cho phép ({mb}MB).")
    content_type = detect_type(data)
    if content_type not in ALLOWED[kind]:
        allowed = "PDF hoặc DOCX" if kind == "cv" else "JPG hoặc PNG"
        raise HTTPException(status_code=415, detail=f"Định dạng tệp không được hỗ trợ — chỉ nhận {allowed}.")
    return content_type


def write_bytes(data: bytes, content_type: str) -> Tuple[str, str]:
    name = uuid.uuid4().hex + EXTENSIONS[content_type]
    with open(os.path.join(storage_dir(), name), "wb") as fh:
        fh.write(data)
    return name, hashlib.sha256(data).hexdigest()


def read_bytes(storage_name: str) -> bytes:
    path = os.path.join(storage_dir(), os.path.basename(storage_name))  # basename: no path traversal
    with open(path, "rb") as fh:
        return fh.read()


def decode_avatar_data_url(value: str) -> bytes:
    """Legacy clients send the cropped avatar as a data URL; validate it like an upload (JPG/PNG, ≤ 2MB)."""
    header, _, payload = value.partition(",")
    if not header.startswith("data:image/") or ";base64" not in header:
        raise HTTPException(status_code=415, detail="Ảnh đại diện chỉ nhận JPG hoặc PNG.")
    try:
        data = base64.b64decode(payload, validate=True)
    except ValueError:
        raise HTTPException(status_code=422, detail="Dữ liệu ảnh đại diện không hợp lệ.")
    validate("avatar", data)
    return data
