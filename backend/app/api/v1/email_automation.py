from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.v1.auth import require_roles
from app.models.email_automation import EmailTemplate, EmailLog
from app.schemas.email_automation import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplatePreviewRequest,
    EmailTemplateResponse,
    EmailLogResponse
)

router = APIRouter(prefix="/email-automation", tags=["email-automation"])

def require_email_admin(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    return require_roles(authorization, db, allowed_roles={"admin", "hr_manager"})

DEFAULT_TEMPLATES = [
    {
        "code": "CONFIRM_APPLICATION",
        "name": "XÃ¡c nháº­n Ä‘Ã£ nháº­n há»“ sÆ¡ á»©ng tuyá»ƒn",
        "category": "Tuyá»ƒn dá»¥ng",
        "subject": "[{company_name}] XÃ¡c nháº­n Ä‘Ã£ nháº­n há»“ sÆ¡ á»©ng tuyá»ƒn vá»‹ trÃ­ {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">KÃ­nh gá»­i {candidate_name},</h2>
<p>Cáº£m Æ¡n báº¡n Ä‘Ã£ quan tÃ¢m vÃ  á»©ng tuyá»ƒn vÃ o vá»‹ trÃ­ <strong>{job_title}</strong> táº¡i {company_name}.</p>
<p>Bá»™ pháº­n Tuyá»ƒn dá»¥ng Ä‘Ã£ nháº­n Ä‘Æ°á»£c há»“ sÆ¡ cá»§a báº¡n vÃ  Ä‘ang tiáº¿n hÃ nh Ä‘Ã¡nh giÃ¡. ChÃºng tÃ´i sáº½ liÃªn há»‡ láº¡i vá»›i báº¡n trong vÃ²ng 3-5 ngÃ y lÃ m viá»‡c náº¿u há»“ sÆ¡ phÃ¹ há»£p.</p>
<p>TrÃ¢n trá»ng,<br/><strong>PhÃ²ng NhÃ¢n sá»± - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "INVITE_INTERVIEW",
        "name": "ThÆ° má»i phá»ng váº¥n",
        "category": "Phá»ng váº¥n",
        "subject": "[{company_name}] ThÆ° má»i phá»ng váº¥n vá»‹ trÃ­ {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">ThÆ° má»i phá»ng váº¥n - {candidate_name}</h2>
<p>ChÃ o <strong>{candidate_name}</strong>,</p>
<p>ChÃºc má»«ng báº¡n Ä‘Ã£ vÆ°á»£t qua vÃ²ng lá»c há»“ sÆ¡ vá»‹ trÃ­ <strong>{job_title}</strong> táº¡i {company_name}. TrÃ¢n trá»ng má»i báº¡n tham gia buá»•i phá»ng váº¥n chuyÃªn mÃ´n vá»›i thÃ´ng tin chi tiáº¿t nhÆ° sau:</p>
<ul>
  <li><strong>Thá»i gian:</strong> {interview_time}</li>
  <li><strong>Äá»‹a Ä‘iá»ƒm / Link há»p:</strong> {interview_location}</li>
  <li><strong>NgÆ°á»i phá»ng váº¥n:</strong> {interviewer_name}</li>
</ul>
<p>Vui lÃ²ng xÃ¡c nháº­n sá»± tham gia cá»§a báº¡n qua email nÃ y hoáº·c cá»•ng thÃ´ng tin á»©ng viÃªn táº¡i: <a href="{portal_link}">{portal_link}</a>.</p>
<p>TrÃ¢n trá»ng,<br/><strong>{interviewer_name} & Bá»™ pháº­n Tuyá»ƒn dá»¥ng</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "THANK_INTERVIEW",
        "name": "Cáº£m Æ¡n sau phá»ng váº¥n",
        "category": "Phá»ng váº¥n",
        "subject": "[{company_name}] Cáº£m Æ¡n báº¡n Ä‘Ã£ tham gia phá»ng váº¥n vá»‹ trÃ­ {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">KÃ­nh gá»­i {candidate_name},</h2>
<p>Cáº£m Æ¡n báº¡n Ä‘Ã£ dÃ nh thá»i gian tham gia buá»•i phá»ng váº¥n vá»‹ trÃ­ <strong>{job_title}</strong> vá»«a qua vá»›i há»™i Ä‘á»“ng tuyá»ƒn dá»¥ng cá»§a {company_name}.</p>
<p>Káº¿t quáº£ Ä‘Ã¡nh giÃ¡ phá»ng váº¥n Ä‘ang Ä‘Æ°á»£c tá»•ng há»£p. ChÃºng tÃ´i sáº½ pháº£n há»“i chÃ­nh thá»©c cho báº¡n trong thá»i gian sá»›m nháº¥t.</p>
<p>TrÃ¢n trá»ng,<br/><strong>Bá»™ pháº­n Tuyá»ƒn dá»¥ng - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "REJECT_CANDIDATE",
        "name": "ThÆ° cáº£m Æ¡n & Tá»« chá»‘i",
        "category": "Tuyá»ƒn dá»¥ng",
        "subject": "[{company_name}] ThÃ´ng bÃ¡o káº¿t quáº£ á»©ng tuyá»ƒn vá»‹ trÃ­ {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #475569;">KÃ­nh gá»­i {candidate_name},</h2>
<p>Cáº£m Æ¡n báº¡n Ä‘Ã£ dÃ nh thá»i gian quan tÃ¢m vÃ  tham gia quy trÃ¬nh tuyá»ƒn dá»¥ng vá»‹ trÃ­ <strong>{job_title}</strong> táº¡i {company_name}.</p>
<p>Há»™i Ä‘á»“ng tuyá»ƒn dá»¥ng ráº¥t áº¥n tÆ°á»£ng vá»›i há»“ sÆ¡ cá»§a báº¡n, tuy nhiÃªn táº¡i thá»i Ä‘iá»ƒm nÃ y chÃºng tÃ´i Ä‘Ã£ chá»n Ä‘Æ°á»£c á»©ng viÃªn cÃ³ tiÃªu chÃ­ phÃ¹ há»£p hÆ¡n vá»›i vá»‹ trÃ­ nÃ y. Há»“ sÆ¡ cá»§a báº¡n sáº½ Ä‘Æ°á»£c lÆ°u giá»¯ táº¡i Kho tiá»m nÄƒng (Talent Pool) cá»§a cÃ´ng ty cho cÃ¡c cÆ¡ há»™i phÃ¹ há»£p trong tÆ°Æ¡ng lai.</p>
<p>ChÃºc báº¡n luÃ´n thÃ nh cÃ´ng trÃªn con Ä‘Æ°á»ng sá»± nghiá»‡p!</p>
<p>TrÃ¢n trá»ng,<br/><strong>Bá»™ pháº­n Tuyá»ƒn dá»¥ng - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "OFFER_LETTER",
        "name": "ThÆ° má»i nháº­n viá»‡c (Offer)",
        "category": "Offer",
        "subject": "[{company_name}] ThÆ° má»i nháº­n viá»‡c (Offer Letter) - {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #16a34a;">ChÃºc má»«ng {candidate_name}!</h2>
<p>Thay máº·t <strong>{company_name}</strong>, chÃºng tÃ´i ráº¥t vui má»«ng Ä‘Æ°á»£c gá»­i tá»›i báº¡n ThÆ° má»i nháº­n viá»‡c (Offer Letter) cho vá»‹ trÃ­ <strong>{job_title}</strong>.</p>
<div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 15px 0;">
  <p style="margin: 5px 0;"><strong>Má»©c lÆ°Æ¡ng chÃ­nh thá»©c:</strong> {offer_salary}</p>
  <p style="margin: 5px 0;"><strong>Thá»i gian báº¯t Ä‘áº§u:</strong> Chi tiáº¿t trong file Ä‘Ã­nh kÃ¨m / Cá»•ng pháº£n há»“i</p>
</div>
<p>Vui lÃ²ng xem chi tiáº¿t Ä‘iá»u khoáº£n offer vÃ  pháº£n há»“i Cháº¥p nháº­n / Tá»« chá»‘i qua cá»•ng thÃ´ng tin: <a href="{portal_link}">{portal_link}</a>.</p>
<p>TrÃ¢n trá»ng,<br/><strong>Ban GiÃ¡m Äá»‘c & PhÃ²ng HR - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    },
    {
        "code": "REQ_APPROVED",
        "name": "ThÃ´ng bÃ¡o phÃª duyá»‡t Tá» trÃ¬nh Tuyá»ƒn dá»¥ng",
        "category": "Há»‡ thá»‘ng",
        "subject": "[Há»‡ thá»‘ng ATS] Tá» trÃ¬nh tuyá»ƒn dá»¥ng {requisition_code} Ä‘Ã£ Ä‘Æ°á»£c phÃª duyá»‡t thÃ nh cÃ´ng",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">ThÃ´ng bÃ¡o PhÃª duyá»‡t Tá» trÃ¬nh</h2>
<p>Tá» trÃ¬nh tuyá»ƒn dá»¥ng mÃ£ <strong>{requisition_code}</strong> cho vá»‹ trÃ­ <strong>{job_title}</strong> Ä‘Ã£ hoÃ n táº¥t phÃª duyá»‡t qua táº¥t cáº£ cÃ¡c cáº¥p.</p>
<p>ChuyÃªn viÃªn tuyá»ƒn dá»¥ng Ä‘Æ°á»£c phÃ¢n cÃ´ng cÃ³ thá»ƒ tiáº¿n hÃ nh táº¡o tin tuyá»ƒn dá»¥ng vÃ  má»Ÿ tiáº¿p nháº­n há»“ sÆ¡.</p>
<p>Truy cáº­p trung tÃ¢m Ä‘iá»u hÃ nh: <a href="{portal_link}">{portal_link}</a>.</p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    }
]

DEFAULT_LOGS = [
    {
        "template_code": "CONFIRM_APPLICATION",
        "recipient_name": "Nguyá»…n VÄƒn An",
        "recipient_email": "nguyenvanan.dev@gmail.com",
        "subject": "[Enterprise ATS] XÃ¡c nháº­n Ä‘Ã£ nháº­n há»“ sÆ¡ á»©ng tuyá»ƒn vá»‹ trÃ­ Senior Frontend Engineer",
        "body_html": "<p>KÃ­nh gá»­i Nguyá»…n VÄƒn An, cáº£m Æ¡n báº¡n Ä‘Ã£ á»©ng tuyá»ƒn vá»‹ trÃ­ Senior Frontend Engineer...</p>",
        "status": "sent",
        "sent_at": datetime.utcnow()
    },
    {
        "template_code": "INVITE_INTERVIEW",
        "recipient_name": "Tráº§n Thá»‹ Mai",
        "recipient_email": "trammai99@gmail.com",
        "subject": "[Enterprise ATS] ThÆ° má»i phá»ng váº¥n vá»‹ trÃ­ Product Designer",
        "body_html": "<p>ChÃ o Tráº§n Thá»‹ Mai, trÃ¢n trá»ng má»i báº¡n tham gia phá»ng váº¥n lÃºc 14:00 ngÃ y 10/10/2026...</p>",
        "status": "sent",
        "sent_at": datetime.utcnow()
    },
    {
        "template_code": "OFFER_LETTER",
        "recipient_name": "LÃª HoÃ ng Long",
        "recipient_email": "hoanglong.tech@gmail.com",
        "subject": "[Enterprise ATS] ThÆ° má»i nháº­n viá»‡c (Offer Letter) - Backend Developer",
        "body_html": "<p>ChÃºc má»«ng LÃª HoÃ ng Long! ChÃºng tÃ´i ráº¥t vui má»«ng gá»­i offer letter má»©c lÆ°Æ¡ng 35,000,000 VNÄ...</p>",
        "status": "sent",
        "sent_at": datetime.utcnow()
    },
    {
        "template_code": "REJECT_CANDIDATE",
        "recipient_name": "Pháº¡m Quá»‘c Báº£o",
        "recipient_email": "baopq.marketing@gmail.com",
        "subject": "[Enterprise ATS] ThÃ´ng bÃ¡o káº¿t quáº£ á»©ng tuyá»ƒn vá»‹ trÃ­ Content Specialist",
        "body_html": "<p>KÃ­nh gá»­i Pháº¡m Quá»‘c Báº£o, cáº£m Æ¡n báº¡n Ä‘Ã£ tham gia á»©ng tuyá»ƒn...</p>",
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
def get_email_templates(db: Session = Depends(get_db), _: None = Depends(require_email_admin)):
    seed_defaults_if_empty(db)
    templates = db.query(EmailTemplate).order_by(EmailTemplate.id.asc()).all()
    return [t.to_dict() for t in templates]

@router.post("/templates", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_email_template(payload: EmailTemplateCreate, db: Session = Depends(get_db), _: None = Depends(require_email_admin)):
    existing = db.query(EmailTemplate).filter(EmailTemplate.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Máº«u email vá»›i mÃ£ '{payload.code}' Ä‘Ã£ tá»“n táº¡i.")
    
    template = EmailTemplate(**payload.dict())
    db.add(template)
    db.commit()
    db.refresh(template)
    return template.to_dict()

@router.put("/templates/{template_id}", response_model=EmailTemplateResponse)
def update_email_template(template_id: int, payload: EmailTemplateUpdate, db: Session = Depends(get_db), _: None = Depends(require_email_admin)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="KhÃ´ng tÃ¬m tháº¥y máº«u email.")
    
    update_data = payload.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(template, field, val)
    
    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)
    return template.to_dict()

@router.delete("/templates/{template_id}")
def delete_email_template(template_id: int, db: Session = Depends(get_db), _: None = Depends(require_email_admin)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="KhÃ´ng tÃ¬m tháº¥y máº«u email.")
    
    db.delete(template)
    db.commit()
    return {"message": "ÄÃ£ xÃ³a máº«u email thÃ nh cÃ´ng"}

@router.post("/templates/{template_id}/preview")
def preview_email_template(template_id: int, payload: Optional[EmailTemplatePreviewRequest] = None, db: Session = Depends(get_db), _: None = Depends(require_email_admin)):
    template = db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="KhÃ´ng tÃ¬m tháº¥y máº«u email.")
    
    subject = (payload.subject if payload and payload.subject else template.subject)
    body_html = (payload.body_html if payload and payload.body_html else template.body_html)

    sample_replacements = {
        "{candidate_name}": "Tá»‘ng Thá»‹ Quá»³nh Ngoo",
        "{job_title}": "Senior Software Engineer",
        "{company_name}": "CÃ´ng ty Cá»• pháº§n CÃ´ng nghá»‡ Enterprise",
        "{interview_time}": "09:30 - 15/10/2026",
        "{interview_location}": "PhÃ²ng Há»p A3 / Google Meet: https://meet.google.com/abc-xyz",
        "{interviewer_name}": "Tráº§n Thá»‹ Thu HÃ  (HR Director)",
        "{offer_salary}": "38,000,000 VNÄ / thÃ¡ng",
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
    db: Session = Depends(get_db),
    _: None = Depends(require_email_admin),
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
def retry_failed_email_log(log_id: int, db: Session = Depends(get_db), _: None = Depends(require_email_admin)):
    log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="KhÃ´ng tÃ¬m tháº¥y nháº­t kÃ½ gá»­i email.")
    
    log.status = "sent"
    log.error_message = None
    log.retried_at = datetime.utcnow()
    db.commit()
    db.refresh(log)
    return log.to_dict()

