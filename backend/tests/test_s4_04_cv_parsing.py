"""Comprehensive test suite for User Story S4-04 (EP-04 / Sprint 4):
'Là Nhân viên tuyển dụng, tôi muốn có thông tin cơ bản của ứng viên được điền sẵn từ tệp CV, để không phải gõ lại họ tên và số điện thoại của hàng trăm hồ sơ.'

AC1 (TC-S4-04-01): Hệ thống bóc tách họ tên, email, số điện thoại từ CV dạng PDF
AC2 (TC-S4-04-02): Kết quả bóc tách hiển thị để recruiter xác nhận hoặc sửa, không tự ghi đè
AC3 (TC-S4-04-03): Bóc tách thất bại không làm hỏng việc nộp hồ sơ
QA-EXTRA (TC-S4-04-X01): Không để lỗi bóc tách CV gây mất hồ sơ gốc & bảo mật tệp gốc
"""
import hashlib
from datetime import datetime
import pytest
from app.models.application import JobApplication
from app.models.master_data import StoredFile
from tests.test_feature_completion import client, TestingSessionLocal, db_get, apply, upload, w, override_get_db, PDF

SAMPLE_CV_PDF = (
    b"%PDF-1.4\n1 0 obj\nstream\n"
    b"BT\n(Nguyen Minh An) Tj\n"
    b"(minh.an@example.com) Tj\n"
    b"(0912345678) Tj\n"
    b"(Ky su Backend voi kinh nghiem Python FastAPI PostgreSQL Docker) Tj\n"
    b"(Tot nghiep Dai hoc Bach Khoa) Tj\n"
    b"ET\n"
    b"endstream\n%%EOF"
)

SCANNED_IMAGE_PDF = (
    b"%PDF-1.4\n1 0 obj\nstream\n"
    b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00"
    b"\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19"
    b"\nendstream\n%%EOF"
)


def test_tc_s4_04_01_pdf_cv_parsing_extracts_contact_info(w):
    """TC-S4-04-01: Hệ thống bóc tách họ tên, email, số điện thoại từ CV dạng PDF."""
    resp = upload(content=SAMPLE_CV_PDF, name="NguyenMinhAn_CV.pdf")
    assert resp.status_code == 201
    data = resp.json()

    assert "parsed" in data
    parsed = data["parsed"]
    assert parsed["status"] == "parsed"
    assert parsed["full_name"] == "Nguyen Minh An"
    assert parsed["email"] == "minh.an@example.com"
    assert parsed["phone"] == "0912345678"
    assert "Python" in parsed["skills"]
    assert "FastAPI" in parsed["skills"]
    assert "PostgreSQL" in parsed["skills"]
    assert "Dai hoc Bach Khoa" in parsed["education"]


def test_tc_s4_04_02_recruiter_can_confirm_or_edit_parsed_data(w):
    """TC-S4-04-02: Kết quả bóc tách hiển thị để recruiter xác nhận hoặc sửa, không tự ghi đè."""
    # 1. Recruiter upload CV, trích xuất được "Nguyen Minh An"
    upload_res = upload(content=SAMPLE_CV_PDF, name="NguyenMinhAn_CV.pdf")
    assert upload_res.status_code == 201
    parsed = upload_res.json()["parsed"]
    assert parsed["full_name"] == "Nguyen Minh An"
    cv_url = upload_res.json()["url"]

    # 2. Recruiter quyết định chỉnh sửa họ tên thành tiếng Việt có dấu và đổi số điện thoại
    edited_name = "Nguyễn Minh An (Chính thức)"
    edited_phone = "0987654321"

    create_res = client.post(
        "/api/v1/applications",
        json={
            "job_posting_id": w["job"],
            "full_name": edited_name,
            "email": parsed["email"],
            "phone": edited_phone,
            "cv_url": cv_url,
            "years_of_experience": 3,
            "current_position": "Backend Developer",
        },
        headers=w["h"]["rec"],
    )
    assert create_res.status_code == 201
    app_data = create_res.json()

    # Xác minh dữ liệu trong DB lưu đúng thông tin recruiter đã sửa, không bị text gốc ghi đè
    app_db = db_get(JobApplication, id=app_data["id"])
    assert app_db.full_name == edited_name
    assert app_db.phone == edited_phone
    assert app_db.email == "minh.an@example.com"
    assert app_db.cv_url == cv_url

    # parsed_cv_json vẫn lưu lại dữ liệu bóc tách gốc để đối chiếu khi cần
    parsed_json = app_db.parsed_cv()
    assert parsed_json["full_name"] == "Nguyen Minh An"


def test_tc_s4_04_03_failed_parsing_does_not_break_application(w):
    """TC-S4-04-03: Bóc tách thất bại (PDF scan/ảnh) không làm hỏng việc nộp hồ sơ."""
    # 1. Upload tệp PDF scan không chứa text
    upload_res = upload(content=SCANNED_IMAGE_PDF, name="Scanned_CV.pdf")
    # Tệp vẫn được lưu thành công vào storage (HTTP 201), không lỗi 500
    assert upload_res.status_code == 201
    data = upload_res.json()
    cv_url = data["url"]

    # Parser ghi nhận status = "failed"
    assert data["parsed"]["status"] == "failed"
    assert data["parsed"]["full_name"] is None
    assert data["parsed"]["email"] is None

    # 2. Recruiter hoặc ứng viên tự nhập tay thông tin vào form
    manual_name = "Trần Thị Lan"
    manual_email = "lan.tran@example.com"
    manual_phone = "0933445566"

    create_res = client.post(
        "/api/v1/applications",
        json={
            "job_posting_id": w["job"],
            "full_name": manual_name,
            "email": manual_email,
            "phone": manual_phone,
            "cv_url": cv_url,
            "years_of_experience": 2,
            "current_position": "Tester",
        },
        headers=w["h"]["rec"],
    )
    # Hồ sơ vẫn tạo thành công bình thường (HTTP 201)
    assert create_res.status_code == 201
    app_id = create_res.json()["id"]

    app_db = db_get(JobApplication, id=app_id)
    assert app_db.status == "submitted"
    assert app_db.full_name == manual_name
    assert app_db.email == manual_email
    assert app_db.cv_url == cv_url
    assert app_db.parsed_cv()["status"] == "failed"


def test_tc_s4_04_x01_cv_original_file_preserved_and_safe(w):
    """TC-S4-04-X01: Tệp CV gốc được lưu trữ toàn vẹn, bảo mật, đối chiếu mã SHA-256."""
    raw_content = SAMPLE_CV_PDF
    expected_sha256 = hashlib.sha256(raw_content).hexdigest()

    upload_res = upload(content=raw_content, name="NguyenMinhAn_CV.pdf", headers=w["h"]["rec"])
    assert upload_res.status_code == 201
    file_id = upload_res.json()["id"]
    file_url = upload_res.json()["url"]

    # Kiểm tra bản ghi StoredFile trong Database
    stored = db_get(StoredFile, id=file_id)
    assert stored is not None
    assert stored.original_name == "NguyenMinhAn_CV.pdf"
    assert stored.sha256 == expected_sha256
    assert stored.size_bytes == len(raw_content)

    # Recruiter có quyền tải tệp về và byte stream khớp 100% tệp gốc
    download_res = client.get(file_url, headers=w["h"]["rec"])
    assert download_res.status_code == 200
    assert download_res.content == raw_content
