import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("email_service")

class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str, expire_minutes: int = 5) -> bool:
        """
        Gửi email chứa mã OTP 6 chữ số qua Gmail SMTP.
        Trả về True nếu gửi thành công hoặc đã xử lý an toàn.
        Ném ra Exception nếu có lỗi hệ thống SMTP nghiêm trọng.
        """
        smtp_username = settings.SMTP_USERNAME
        smtp_password = settings.SMTP_APP_PASSWORD
        from_email = settings.SMTP_FROM_EMAIL or smtp_username or "noreply@company.com"
        from_name = settings.SMTP_FROM_NAME or "Tuyển Dụng Nội Bộ"

        # Đề phòng trường hợp chưa cấu hình Gmail App Password trên môi trường local
        if not smtp_username or not smtp_password:
            logger.warning(
                f"[DEVELOPMENT MODE] Chưa cấu hình SMTP_USERNAME / SMTP_APP_PASSWORD trong .env. "
                f"Mã OTP cho {to_email} là: {otp_code} (Hạn dùng: {expire_minutes} phút)"
            )
            print(
                f"\n==================================================\n"
                f"[GMAIL SMTP SIMULATION / LOCAL DEV]\n"
                f"Gửi đến: {to_email}\n"
                f"Mã OTP xác thực: {otp_code}\n"
                f"Hạn sử dụng: {expire_minutes} phút\n"
                f"==================================================\n"
            )
            return True

        # Khởi tạo Email HTML + Plain Text Fallback
        subject = f"[{from_name}] Mã xác thực đặt lại mật khẩu: {otp_code}"
        
        text_content = (
            f"Chào bạn,\n\n"
            f"Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản {to_email} trên hệ thống Tuyển Dụng Nội Bộ.\n\n"
            f"Mã xác thực (OTP) của bạn là: {otp_code}\n\n"
            f"Mã này có hiệu lực trong vòng {expire_minutes} phút.\n"
            f"Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email và không chia sẻ mã này với bất kỳ ai.\n\n"
            f"Trân trọng,\n"
            f"Ban Quản Trị Hệ Thống {from_name}"
        )

        html_content = f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 560px; background: #ffffff; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }}
                .header {{ text-align: center; padding-bottom: 24px; border-b: 1px solid #f1f5f9; }}
                .logo-title {{ font-size: 20px; font-weight: 800; color: #1e293b; margin-top: 8px; }}
                .badge {{ display: inline-block; background-color: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; border: 1px solid #dbeafe; }}
                .content {{ padding: 24px 0; text-align: left; color: #334155; font-size: 14px; line-height: 1.6; }}
                .otp-box {{ background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
                .otp-code {{ font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #1d4ed8; margin: 0; font-family: monospace; }}
                .expire-note {{ font-size: 12px; color: #64748b; margin-top: 8px; }}
                .footer {{ border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <span class="badge">{from_name}</span>
                    <div class="logo-title">Yêu Cầu Đặt Lại Mật Khẩu</div>
                </div>
                <div class="content">
                    <p>Xin chào,</p>
                    <p>Hệ thống vừa nhận được yêu cầu khôi phục mật khẩu cho tài khoản <strong>{to_email}</strong>.</p>
                    <p>Vui lòng nhập mã xác thực OTP dưới đây để hoàn tất quá trình:</p>
                    
                    <div class="otp-box">
                        <div class="otp-code">{otp_code}</div>
                        <div class="expire-note">Mã xác thực có hiệu lực trong <strong>{expire_minutes} phút</strong></div>
                    </div>

                    <p style="color: #64748b; font-size: 13px;">
                        ⚠️ <strong>Lưu ý an toàn:</strong> Không chia sẻ mã xác thực này với bất kỳ ai, kể cả nhân viên hỗ trợ hệ thống. 
                        Nếu bạn không thực hiện yêu cầu này, tài khoản của bạn vẫn an toàn và bạn có thể bỏ qua qua email này.
                    </p>
                </div>
                <div class="footer">
                    &copy; 2026 {from_name}. Hệ thống Tuyển Dụng Nội Bộ Enterprise.
                </div>
            </div>
        </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email

        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                if settings.SMTP_USE_TLS:
                    server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(from_email, [to_email], msg.as_string())
            logger.info(f"Đã gửi thành công email OTP tới {to_email}")
            return True
        except Exception as e:
            # Tuyệt đối không log credentials hay secret trong traceback
            logger.error(f"Lỗi gửi Gmail SMTP tới {to_email}: {type(e).__name__} - {str(e)}")
            raise RuntimeError("Không thể kết nối đến máy chủ email SMTP. Vui lòng thử lại sau.")
