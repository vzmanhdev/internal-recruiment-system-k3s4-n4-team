from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.email_automation import EmailTemplate, EmailLog
from app.schemas.email_automation import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplatePreviewRequest,
    EmailTemplateResponse,
    EmailLogResponse
)

router = APIRouter(prefix="/email-automation", tags=["email-automation"])

DEFAULT_TEMPLATES = [
    {
        "code": "CONFIRM_APPLICATION",
        "name": "Xác nhận đã nhận hồ sơ ứng tuyển",
        "category": "Tuyển dụng",
        "subject": "[{company_name}] Xác nhận đã nhận hồ sơ ứng tuyển vị trí {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">Kính gửi {candidate_name},</h2>
<p>Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí <strong>{job_title}</strong> tại {company_name}.</p>
<p>Bộ phận Tuyển dụng đã nhận được hồ sơ của bạn và đang tiến hành đánh giá. Chúng tôi sẽ liên hệ lại với bạn trong vòng 3-5 ngày làm việc nếu hồ sơ phù hợp.</p>
<p>Trân trọng,<br/><strong>Phòng Nhân sự - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "INVITE_INTERVIEW",
        "name": "Thư mời phỏng vấn",
        "category": "Phỏng vấn",
        "subject": "[{company_name}] Thư mời phỏng vấn vị trí {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">Thư mời phỏng vấn - {candidate_name}</h2>
<p>Chào <strong>{candidate_name}</strong>,</p>
<p>Chúc mừng bạn đã vượt qua vòng lọc hồ sơ vị trí <strong>{job_title}</strong> tại {company_name}. Trân trọng mời bạn tham gia buổi phỏng vấn chuyên môn với thông tin chi tiết như sau:</p>
<ul>
  <li><strong>Thời gian:</strong> {interview_time}</li>
  <li><strong>Địa điểm / Link họp:</strong> {interview_location}</li>
  <li><strong>Người phỏng vấn:</strong> {interviewer_name}</li>
</ul>
<p>Vui lòng xác nhận sự tham gia của bạn qua email này hoặc cổng thông tin ứng viên tại: <a href="{portal_link}">{portal_link}</a>.</p>
<p>Trân trọng,<br/><strong>{interviewer_name} & Bộ phận Tuyển dụng</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "THANK_INTERVIEW",
        "name": "Cảm ơn sau phỏng vấn",
        "category": "Phỏng vấn",
        "subject": "[{company_name}] Cảm ơn bạn đã tham gia phỏng vấn vị trí {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">Kính gửi {candidate_name},</h2>
<p>Cảm ơn bạn đã dành thời gian tham gia buổi phỏng vấn vị trí <strong>{job_title}</strong> vừa qua với hội đồng tuyển dụng của {company_name}.</p>
<p>Kết quả đánh giá phỏng vấn đang được tổng hợp. Chúng tôi sẽ phản hồi chính thức cho bạn trong thời gian sớm nhất.</p>
<p>Trân trọng,<br/><strong>Bộ phận Tuyển dụng - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "REJECT_CANDIDATE",
        "name": "Thư cảm ơn & Từ chối",
        "category": "Tuyển dụng",
        "subject": "[{company_name}] Thông báo kết quả ứng tuyển vị trí {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #475569;">Kính gửi {candidate_name},</h2>
<p>Cảm ơn bạn đã dành thời gian quan tâm và tham gia quy trình tuyển dụng vị trí <strong>{job_title}</strong> tại {company_name}.</p>
<p>Hội đồng tuyển dụng rất ấn tượng với hồ sơ của bạn, tuy nhiên tại thời điểm này chúng tôi đã chọn được ứng viên có tiêu chí phù hợp hơn với vị trí này. Hồ sơ của bạn sẽ được lưu giữ tại Kho tiềm năng (Talent Pool) của công ty cho các cơ hội phù hợp trong tương lai.</p>
<p>Chúc bạn luôn thành công trên con đường sự nghiệp!</p>
<p>Trân trọng,<br/><strong>Bộ phận Tuyển dụng - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "OFFER_LETTER",
        "name": "Thư mời nhận việc (Offer)",
        "category": "Offer",
        "subject": "[{company_name}] Thư mời nhận việc (Offer Letter) - {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #16a34a;">Chúc mừng {candidate_name}!</h2>
<p>Thay mặt <strong>{company_name}</strong>, chúng tôi rất vui mừng được gửi tới bạn Thư mời nhận việc (Offer Letter) cho vị trí <strong>{job_title}</strong>.</p>
<div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
  <p style="margin: 5px 0;"><strong>Mức lương chính thức:</strong> {offer_salary}</p>
  <p style="margin: 5px 0;"><strong>Thời gian bắt đầu:</strong> Chi tiết trong file đính kèm / Cổng phản hồi</p>
</div>
<p>Vui lòng xem chi tiết điều khoản offer và phản hồi Chấp nhận / Từ chối qua cổng thông tin: <a href="{portal_link}">{portal_link}</a>.</p>
<p>Trân trọng,<br/><strong>Ban Giám Đốc & Phòng HR - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "REQ_APPROVED",
        "name": "Thông báo phê duyệt Tờ trình Tuyển dụng",
        "category": "Hệ thống",
        "subject": "[Hệ thống ATS] Tờ trình tuyển dụng {requisition_code} đã được phê duyệt thành công",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">Thông báo Phê duyệt Tờ trình</h2>
<p>Tờ trình tuyển dụng mã <strong>{requisition_code}</strong> cho vị trí <strong>{job_title}</strong> đã hoàn tất phê duyệt qua tất cả các cấp.</p>
<p>Chuyên viên tuyển dụng được phân công có thể tiến hành tạo tin tuyển dụng và mở tiếp nhận hồ sơ.</p>
<p>Truy cập trung tâm điều hành: <a href="{portal_link}">{portal_link}</a>.</p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    }
]

DEFAULT_LOGS = [
    {
        "template_code": "CONFIRM_APPLICATION",
        "recipient_name": "Nguyễn Văn An",
        "recipient_email": "nguyenvanan.dev@gmail.com",
        "subject": "[Enterprise ATS] Xác nhận đã nhận hồ sơ ứng tuyển vị trí Senior Frontend Engineer",
        "body_html": "<p>Kính gửi Nguyễn Văn An, cảm ơn bạn đã ứng tuyển vị trí Senior Frontend Engineer...</p>",
        "status": "sent",
        "sent_at": datetime.utcnow()
    },
    {
        "template_code": "INVITE_INTERVIEW",
        "recipient_name": "Trần Thị Mai",
        "recipient_email": "trammai99@gmail.com",
        "subject": "[Enterprise ATS] Thư mời phỏng vấn vị trí Product Designer",
        "body_html": "<p>Chào Trần Thị Mai, trân trọng mời bạn tham gia phỏng vấn lúc 14:00 ngày 10/10/2026...</p>",
        "status": "sent",
        "sent_at": datetime.utcnow()
    },
    {
        "template_code": "OFFER_LETTER",
        "recipient_name": "Lê Hoàng Long",
        "recipient_email": "hoanglong.tech@gmail.com",
        "subject": "[Enterprise ATS] Thư mời nhận việc (Offer Letter) - Backend Developer",
        "body_html": "<p>Chúc mừng Lê Hoàng Long! Chúng tôi rất vui mừng gửi offer letter mức lương 35,000,000 VNĐ...</p>",
        "status": "sent",
        "sent_at": datetime.utcnow()
    },
    {
        "template_code": "REJECT_CANDIDATE",
        "recipient_name": "Phạm Quốc Bảo",
        "recipient_email": "baopq.marketing@gmail.com",
        "subject": "[Enterprise ATS] Thông báo kết quả ứng tuyển vị trí Content Specialist",
        "body_html": "<p>Kính gửi Phạm Quốc Bảo, cảm ơn bạn đã tham gia ứng tuyển...</p>",
        "status": "failed",
        "error_message": "SMTP Connection Timeout (541 Mailbox unavailable)",
        "sent_at": datetime.utcnow()
    }
]

def seed_defaults_if_empty(db: Session):
    count_tpl = db.query(EmailTemplate).count()
    if count_tpl == 0:
        for item in DEFAULT_TEMPLATES:
            tpl = EmailTemplate(**item)
            db.add(tpl)
        db.commit()

    count_logs = db.query(EmailLog).count()
    if count_logs == 0:
        for item in DEFAULT_LOGS:
            log = EmailLog(**item)
            db.add(log)
        db.commit()

@router.get("/templates", response_model=List[EmailTemplateResponse])
def get_email_templates(db: Session = Depends(get_db)):
    seed_defaults_if_empty(db)
    templates = db.query(EmailTemplate).order_by(EmailTemplate.id.asc()).all()
    return [t.to_dict() for t in templates]

@router.post("/templates", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_email_template(payload: EmailTemplateCreate, db: Session = Depends(get_db)):
    existing = db.query(EmailTemplate).filter(EmailTemplate.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Mẫu email với mã '{payload.code}' đã tồn tại.")
    
    template = EmailTemplate(**payload.dict())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template.to_dict()

@router.put("/templates/{template_id}", response_model=EmailTemplateResponse)
def update_email_template(template_id: int, payload: EmailTemplateUpdate, db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Không tìm thấy mẫu email.")
    
    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(template, field, val)
    
    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)
    return template.to_dict()

@router.delete("/templates/{template_id}")
def delete_email_template(template_id: int, db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Không tìm thấy mẫu email.")
    
    db.delete(template)
    db.commit()
    return {"message": "Đã xóa mẫu email thành công"}

@router.post("/templates/{template_id}/preview")
def preview_email_template(template_id: int, payload: Optional[EmailTemplatePreviewRequest] = None, db: Session = Depends(get_db)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Không tìm thấy mẫu email.")
    
    subject = (payload.subject if payload and payload.subject else template.subject)
    body_html = (payload.body_html if payload and payload.body_html else template.body_html)

    sample_replacements = {
        "{candidate_name}": "Tống Thị Quỳnh Ngoo",
        "{job_title}": "Senior Software Engineer",
        "{company_name}": "Công ty Cổ phần Công nghệ Enterprise",
        "{interview_time}": "09:30 - 15/10/2026",
        "{interview_location}": "Phòng Họp A3 / Google Meet: https://meet.google.com/abc-xyz",
        "{interviewer_name}": "Trần Thị Thu Hà (HR Director)",
        "{offer_salary}": "38,000,000 VNĐ / tháng",
        "{requisition_code}": "REQ-2026-IT-004",
        "{portal_link}": "http://localhost:3000/employee/portal"
    }

    if payload and payload.sample_data:
        sample_replacements.update(payload.sample_data)
    
    rendered_subject = subject
    rendered_body = body_html

    for key, val in sample_replacements.items():
        rendered_subject = rendered_subject.replace(key, str(val))
        rendered_body = rendered_body.replace(key, str(val))

    return {
        "template_id": template.id,
        "code": template.code,
        "name": template.name,
        "rendered_subject": rendered_subject,
        "rendered_body_html": rendered_body,
        "available_variables": list(sample_replacements.keys())
    }

@router.get("/logs", response_model=List[EmailLogResponse])
def get_email_logs(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    seed_defaults_if_empty(db)
    query = db.query(EmailLog)
    
    if status_filter and status_filter.lower() != "all":
        query = query.filter(EmailLog.status == status_filter.lower())
    
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (EmailLog.recipient_name.ilike(pattern)) |
            (EmailLog.recipient_email.ilike(pattern)) |
            (EmailLog.subject.ilike(pattern))
        )
    
    logs = query.order_by(EmailLog.sent_at.desc()).all()
    return [log.to_dict() for log in logs]

@router.post("/logs/{log_id}/retry", response_model=EmailLogResponse)
def retry_failed_email_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhật ký gửi email.")
    
    log.status = "sent"
    log.error_message = None
    log.retried_at = datetime.utcnow()
    db.commit()
    db.refresh(log)
    return log.to_dict()
