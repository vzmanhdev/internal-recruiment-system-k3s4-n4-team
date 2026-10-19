"""Default email templates (S8-01 stages) and idempotent seeding by code."""
from sqlalchemy.orm import Session

from app.models.email_automation import EmailTemplate

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
    },
    {
        "code": "INTERVIEW_CANCELLED",
        "name": "Thông báo huỷ / dời lịch phỏng vấn",
        "category": "Phỏng vấn",
        "subject": "[{company_name}] Thay đổi lịch phỏng vấn vị trí {job_title}",
        "body_html": """<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
<h2 style="color: #2563eb;">Kính gửi {candidate_name},</h2>
<p>Buổi phỏng vấn vị trí <strong>{job_title}</strong> của bạn đã được huỷ. Lý do: {cancel_reason}.</p>
<p>Bộ phận Tuyển dụng sẽ liên hệ lại để sắp xếp lịch mới nếu phù hợp. Xin lỗi vì sự bất tiện này.</p>
<p>Trân trọng,<br/><strong>Phòng Nhân sự - {company_name}</strong></p>
</div>""",
        "is_auto_send": True,
        "is_active": True
    }
]


def ensure_default_templates(db: Session) -> int:
    """Insert any default template whose code is missing (never overwrites HR edits). Caller commits."""
    existing = {c for (c,) in db.query(EmailTemplate.code).all()}
    added = 0
    for item in DEFAULT_TEMPLATES:
        if item["code"] not in existing:
            db.add(EmailTemplate(**item))
            added += 1
    if added:
        db.flush()
    return added
