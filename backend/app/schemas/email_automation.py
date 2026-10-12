from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class EmailTemplateCreate(BaseModel):
    code: str
    name: str
    category: Optional[str] = "Tuyển dụng"
    subject: str
    body_html: str
    is_auto_send: bool = True
    is_active: bool = True

class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    is_auto_send: Optional[bool] = None
    is_active: Optional[bool] = None

class EmailTemplatePreviewRequest(BaseModel):
    body_html: Optional[str] = None
    subject: Optional[str] = None
    sample_data: Optional[dict] = None

class EmailTemplateResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str
    subject: str
    body_html: str
    is_auto_send: bool
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class EmailLogResponse(BaseModel):
    id: int
    template_code: Optional[str] = None
    recipient_name: str
    recipient_email: str
    subject: str
    body_html: str
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[str] = None
    retried_at: Optional[str] = None

    class Config:
        from_attributes = True
