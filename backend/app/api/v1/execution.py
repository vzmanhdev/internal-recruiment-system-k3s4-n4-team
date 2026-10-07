from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db

router = APIRouter()

# 1. INTERVIEW EVALUATION FORMS & AUDIT TRAIL SNAPSHOTS API
@router.get("/evaluations")
def get_evaluation_forms(db: Session = Depends(get_db)):
    return {
        "snapshots": [
            {
                "id": "A",
                "label": "Phiếu A (Bản cũ 60/40) v1.0",
                "candidate": "Lê Hoàng Nam",
                "position": "Senior Frontend Engineer (React/Next.js)",
                "department": "Trung Tâm Phát Triển Phần Mềm (Software Center)",
                "interviewDate": "15/08/2026",
                "round": "Vòng 2 - Phỏng Vấn Chuyên Môn & Văn Hóa",
                "interviewer": "Trần Minh Quân (Technical Lead & Hội đồng Tuyển dụng)",
                "snapshotConfig": "Khung năng lực v1.0 (Lưu ngày 15/08/2026)",
                "totalScore": 4.40,
                "maxScore": 5.0,
                "convertedScore": "88/100 điểm",
                "rank": "XẾP LOẠI: XUẤT SẮC",
                "status": "Đã Phê Duyệt Kết Quả",
                "weights": "60% / 40%",
                "isImmutable": True
            },
            {
                "id": "B",
                "label": "Phiếu B (Bản mới 50/50) v2.0",
                "candidate": "Trần Mai Anh",
                "position": "Senior Data Scientist",
                "department": "Viện Nghiên cứu Trí tuệ Nhân tạo",
                "interviewDate": "01/10/2026",
                "round": "Vòng 2 - Phỏng Vấn Chuyên Môn & Văn Hóa",
                "interviewer": "Nguyễn Hoàng Long (AI Lead)",
                "snapshotConfig": "Khung năng lực v2.0 (Lưu ngày 01/10/2026)",
                "totalScore": 4.60,
                "maxScore": 5.0,
                "convertedScore": "92/100 điểm",
                "rank": "XẾP LOẠI: XUẤT SẮC",
                "status": "Đã Phê Duyệt Kết Quả",
                "weights": "50% / 50%",
                "isImmutable": True
            }
        ]
    }

# 2. CHECKLIST TIẾP NHẬN NHÂN SỰ (ONBOARDING CHECKLIST) API
@router.get("/onboarding")
def get_onboarding_checklists(db: Session = Depends(get_db)):
    return {
        "checklist": [
            {
                "id": "ob-1",
                "step": 1,
                "title": "Tạo Tài Khoản Hệ Thống & Email Công Ty",
                "department": "Ban CNTT & Hạ Tầng",
                "assignee": "Lê Văn Tuấn (IT Support Lead)",
                "status": "completed",
                "dueDate": "Ngày 1 trước Onboarding"
            },
            {
                "id": "ob-2",
                "step": 2,
                "title": "Cấp Phát Thiết Bị (Laptop, Thẻ Từ & Chìa Khóa Tủ)",
                "department": "Ban Hành Chính - Quản Trị Hậu Cần",
                "assignee": "Nguyễn Thị Hoa (Admin Sup)",
                "status": "completed",
                "dueDate": "Ngày 1 Onboarding"
            },
            {
                "id": "ob-3",
                "step": 3,
                "title": "Ký Hợp Đồng Lao Động & Hoàn Thiện Hồ Sơ Nhân Sự",
                "department": "Ban C&B & Pháp Chế",
                "assignee": "Phạm Thị Loan (C&B Specialist)",
                "status": "in_progress",
                "dueDate": "Trong tuần đầu tiên"
            },
            {
                "id": "ob-4",
                "step": 4,
                "title": "Đào Tạo Hội Nhập & Giới Thiệu Văn Hóa Công Ty",
                "department": "Ban Đào Tạo & Phát Triển Nguồn Nhân Lực",
                "assignee": "Vũ Anh Khoa (L&D Manager)",
                "status": "pending",
                "dueDate": "Trong tuần đầu tiên"
            }
        ]
    }
