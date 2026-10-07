import sys
from app.core.config import settings

def test_smtp_configuration():
    print("==================================================")
    print("TESTING GMAIL SMTP ENVIRONMENT CONFIGURATION")
    print("==================================================")
    print(f"SMTP Host: {settings.SMTP_HOST}")
    print(f"SMTP Port: {settings.SMTP_PORT}")
    print(f"SMTP Username Configured: {bool(settings.SMTP_USERNAME)}")
    print(f"SMTP Password Configured: {bool(settings.SMTP_APP_PASSWORD)}")
    print(f"SMTP TLS: {settings.SMTP_USE_TLS}")

    assert settings.SMTP_HOST == "smtp.gmail.com", "SMTP Host must be smtp.gmail.com"
    assert settings.SMTP_PORT == 587, "SMTP Port must be 587"
    assert settings.SMTP_USE_TLS is True, "SMTP TLS must be True"

    print("\n==================================================")
    print("SETTINGS CONFIGURATION PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    test_smtp_configuration()
