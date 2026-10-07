from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter()

# 1. LANDING PAGE DISPLAY & PORTAL CONFIG API
@router.get("/landing")
def get_landing_config(db: Session = Depends(get_db)):
    return {
        "portalTitle": "Cổng Thông Tin Tuyển Dụng Nội Bộ - Tập Đoàn",
        "heroTitle": "Khám Phá Cơ Hội Phát Triển Sự Nghiệp Không Giới Hạn",
        "heroSubtitle": "Môi trường làm việc đổi mới sáng tạo, dải lương cạnh tranh và lộ trình thăng tiến rõ ràng dành riêng cho CBNV.",
        "featuredJobsCount": 6,
        "isPortalActive": True,
        "primaryThemeColor": "#4285F4",
    }

# 2. EMAIL TEMPLATES API
@router.get("/email-templates")
def get_email_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "hr_manager"))
):
    return [
        {
            "id": "tpl-1",
            "name": "Mẫu Email Mời Phỏng Vấn (Interview Invitation)",
            "code": "EMAIL_INTERVIEW_INVITE",
            "subject": "[Tập đoàn] Thư mời phỏng vấn vị trí {{JOB_TITLE}} - {{CANDIDATE_NAME}}",
            "category": "Tuyển dụng",
            "lastUpdated": "10/09/2026",
        },
        {
            "id": "tpl-2",
            "name": "Mẫu Email Thư Mời Nhận Việc (Job Offer Letter)",
            "code": "EMAIL_OFFER_LETTER",
            "subject": "[Tập đoàn] Thư mời nhận việc (Job Offer) - Vị trí {{JOB_TITLE}}",
            "category": "Offer",
            "lastUpdated": "15/09/2026",
        },
        {
            "id": "tpl-3",
            "name": "Mẫu Email Thư Cảm Ơn & Từ Chối (Rejection Letter)",
            "code": "EMAIL_REJECTION",
            "subject": "[Tập đoàn] Thư cảm ơn tham gia ứng tuyển vị trí {{JOB_TITLE}}",
            "category": "Từ chối",
            "lastUpdated": "01/10/2026",
        }
    ]
