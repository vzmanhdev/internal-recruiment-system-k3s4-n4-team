import sys
import io
import os

from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal, engine, Base
from app.models.user import User
from app.models.password_reset_otp import PasswordResetOTP
from app.core.security import hash_password, verify_password, verify_otp_hash
from seed_users import seed_system_roles

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("STARTING FULL FORGOT PASSWORD & SEED SAFETY INTEGRATION TEST")
    print("==================================================")

    db = SessionLocal()
    target_email = "tuyendung@company.com"

    try:
        # 0. Ensure target user exists and has initial password
        user = db.query(User).filter(User.email == target_email).first()
        if not user:
            print(f"[PRE-TEST] Creating test user {target_email}")
            user = User(
                email=target_email,
                full_name="Nguyễn Tuyển Dụng",
                hashed_password=hash_password("company123"),
                role="recruiter",
                is_active=True
            )
            db.add(user)
            db.commit()

        # TEST 1: Request OTP for non-existing email (Enumeration security)
        print("\n--- TEST 1: Request OTP for non-existing email ---")
        res1 = client.post("/api/v1/auth/password-reset/request", json={"email": "nonexistent_12345@company.com"})
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
        assert "Nếu email tồn tại" in res1.json()["message"]
        # Verify no OTP created for non-existent email
        no_otp = db.query(PasswordResetOTP).filter(PasswordResetOTP.email == "nonexistent_12345@company.com").first()
        assert no_otp is None, "OTP row should NOT be created for non-existent email"
        print("PASS: Generic response returned & no OTP created for non-existent email.")

        # TEST 2: Request OTP for existing email
        print("\n--- TEST 2: Request OTP for existing user ---")
        res2 = client.post("/api/v1/auth/password-reset/request", json={"email": target_email})
        assert res2.status_code == 200, f"Expected 200, got {res2.status_code}"
        
        # Verify OTP record in DB
        otp_row = db.query(PasswordResetOTP).filter(PasswordResetOTP.user_id == user.id).order_by(PasswordResetOTP.id.desc()).first()
        assert otp_row is not None, "PasswordResetOTP row should exist in DB"
        assert otp_row.otp_hash is not None, "otp_hash must NOT be null"
        assert otp_row.attempt_count == 0, "attempt_count should start at 0"
        print(f"PASS: OTP created in DB (id: {otp_row.id}, user_id: {otp_row.user_id}, hash: {otp_row.otp_hash[:16]}...)")

        # TEST 3: Resend Cooldown (Within 60s)
        print("\n--- TEST 3: Resend Cooldown within 60s ---")
        res3 = client.post("/api/v1/auth/password-reset/request", json={"email": target_email})
        assert res3.status_code == 429, f"Expected 429 Too Many Requests, got {res3.status_code}"
        print(f"PASS: Rate limit cooldown enforced (Response: {res3.json()['detail']})")

        # TEST 4: Verify OTP with WRONG OTP code
        print("\n--- TEST 4: Verify OTP with wrong code ---")
        res4 = client.post("/api/v1/auth/password-reset/verify", json={"email": target_email, "otp": "000000"})
        assert res4.status_code == 400, f"Expected 400, got {res4.status_code}"
        db.refresh(otp_row)
        assert otp_row.attempt_count == 1, "attempt_count should be incremented to 1"
        print(f"PASS: Wrong OTP rejected & attempt count incremented ({otp_row.attempt_count}/5)")

        # TEST 5: Verify OTP with VALID OTP code (Simulated using DB hash verification)
        print("\n--- TEST 5: Verify OTP with valid code ---")
        # Find a valid 6-digit number that matches otp_row.otp_hash
        valid_otp_code = None
        for candidate in range(1000000):
            cand_str = f"{candidate:06d}"
            if verify_otp_hash(cand_str, otp_row.otp_hash):
                valid_otp_code = cand_str
                break
        
        assert valid_otp_code is not None, "Failed to find matching OTP code from hash"
        print(f"Found matching OTP code from DB hash: {valid_otp_code}")

        res5 = client.post("/api/v1/auth/password-reset/verify", json={"email": target_email, "otp": valid_otp_code})
        assert res5.status_code == 200, f"Expected 200, got {res5.status_code}"
        reset_token = res5.json().get("reset_token")
        assert reset_token is not None, "reset_token must be returned upon successful OTP verification"
        print(f"PASS: OTP verified successfully. Received reset_token: {reset_token[:20]}...")

        # TEST 6: Confirm new password
        new_pass = "RecruiterPass@2026"
        print("\n--- TEST 6: Confirm new password ---")
        res6 = client.post("/api/v1/auth/password-reset/confirm", json={
            "reset_token": reset_token,
            "new_password": new_pass,
            "confirm_password": new_pass
        })
        assert res6.status_code == 200, f"Expected 200, got {res6.status_code}"
        print("PASS: Password reset confirmation succeeded!")

        # TEST 7: Verify OLD password fails login
        print("\n--- TEST 7: Verify OLD password (company123) login FAILS ---")
        login_old = client.post("/api/v1/auth/login", json={"email": target_email, "password": "company123"})
        assert login_old.status_code == 400, f"Expected 400 for old password login, got {login_old.status_code}"
        print("PASS: Old password login rejected!")

        # TEST 8: Verify NEW password succeeds login
        print("\n--- TEST 8: Verify NEW password (RecruiterPass@2026) login SUCCEEDS ---")
        login_new = client.post("/api/v1/auth/login", json={"email": target_email, "password": new_pass})
        assert login_new.status_code == 200, f"Expected 200 for new password login, got {login_new.status_code}"
        token_type = login_new.json().get("token_type")
        assert token_type == "bearer", "Must return valid bearer token"
        print("PASS: New password login succeeded with access_token!")

        # TEST 9: Seed Safety Test (Re-run seed_system_roles & verify password is NOT overwritten)
        print("\n--- TEST 9: Seed Safety Test (Running seed_system_roles) ---")
        seed_system_roles()
        
        login_post_seed = client.post("/api/v1/auth/login", json={"email": target_email, "password": new_pass})
        assert login_post_seed.status_code == 200, "NEW password MUST STILL WORK after seeding!"
        print("PASS: Seed script preserved updated password! Idempotent seed verified.")

        # Cleanup: Reset target user password back to company123 for default environment use
        user_db = db.query(User).filter(User.email == target_email).first()
        user_db.hashed_password = hash_password("company123")
        db.commit()
        print("\n[CLEANUP] Restored test account password back to default 'company123'.")

        print("\n==================================================")
        print("ALL 9 INTEGRATION TESTS PASSED 100% SUCCESSFULLY!")
        print("==================================================")

    except Exception as e:
        db.rollback()
        print(f"\n[TEST ERROR] Integration test failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
