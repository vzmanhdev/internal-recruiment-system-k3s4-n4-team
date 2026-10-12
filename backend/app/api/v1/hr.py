import json
import logging
from typing import List, Optional, Union
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.orm import Session

from app.api.v1.auth import require_roles
from app.db.session import get_db
from app.models.user import User
from app.models.competency import CompetencyFramework, CompetencyCriteria
from app.models.hr import Competency, Department, JobTitle, SharedCategory, HeadcountBudget, ApprovalFlow
from app.models.job import JobPosting
from app.models.requisition import JobRequisition
from app.models.system import SystemSetting
from app.schemas.competency import FrameworkCreate, FrameworkUpdate, CriteriaItemCreate
from app.schemas.hr import CategoryCreate, CompanyContentUpdate, CompetencyCreate, DepartmentCreate, JobTitleCreate, ReorderCategories
from app.services.audit import write_audit_log
from app.core.security import decode_access_token

logger = logging.getLogger("uvicorn")
router = APIRouter()
HR_ROLES = {"hr_manager", "admin"}

def authorize(authorization: Optional[str], db: Session):
    return require_roles(authorization, db, HR_ROLES)

def get_current_hr_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    user_id = decode_access_token(token)
    if not user_id:
        return None
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user

def require_hr_or_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Vui lòng đăng nhập với vai trò Trưởng phòng Nhân sự hoặc Quản trị viên."
        )
    token = authorization.split(" ")[1]
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập đã hết hạn hoặc không hợp lệ."
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại hoặc đã bị khóa."
        )
    roles = [r.strip() for r in user.role.split(",") if r.strip()]
    if not any(r in {"hr_manager", "admin", "recruiter", "manager"} for r in roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền thực hiện chức năng này. Yêu cầu quyền: Trưởng phòng Nhân sự hoặc Quản trị viên."
        )
    return user

def get_or_create_settings(db: Session) -> SystemSetting:
    settings = db.query(SystemSetting).filter(SystemSetting.id == 1).first()
    if not settings:
        settings = SystemSetting(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def content_dict(settings: SystemSetting):
    return {"title": settings.landing_title, "body": settings.landing_body, "image": settings.landing_image}

# ----------------------------------------------------------------------
# 1. Company Content Endpoints (Landing Page)
# ----------------------------------------------------------------------
@router.get("/company-content/public")
def get_public_company_content(db: Session = Depends(get_db)):
    return content_dict(get_or_create_settings(db))

@router.get("/company-content")
def get_company_content(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return content_dict(get_or_create_settings(db))

@router.put("/company-content")
def update_company_content(payload: CompanyContentUpdate, request: Request, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    current_user = authorize(authorization, db)
    settings = get_or_create_settings(db)
    settings.landing_title = payload.title.strip()
    settings.landing_body = payload.body.strip()
    settings.landing_image = payload.image
    db.commit()
    db.refresh(settings)
    write_audit_log(db, action="Cập nhật nội dung tuyển dụng", module="Nội dung", request=request, user=current_user, details=settings.landing_title)
    return content_dict(settings)

# ----------------------------------------------------------------------
# 2. Departments Endpoints
# ----------------------------------------------------------------------
@router.get("/departments")
def list_departments(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(Department).order_by(Department.sort_order, Department.name).all()]

@router.post("/departments", status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if db.query(Department).filter(Department.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Mã phòng ban đã tồn tại", headers={"X-Field-Error": "code"})
    if payload.parent_id and not db.query(Department).filter(Department.id == payload.parent_id).first():
        raise HTTPException(status_code=400, detail="Phòng ban cha không tồn tại")
    item = Department(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item.to_dict()

@router.put("/departments/{department_id}")
def update_department(department_id: int, payload: DepartmentCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = db.query(Department).filter(Department.id == department_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Không tìm thấy phòng ban")
    if payload.parent_id == department_id:
        raise HTTPException(status_code=400, detail="Phòng ban không thể là cha của chính nó")
    for key, value in payload.model_dump().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item.to_dict()

# ----------------------------------------------------------------------
# 3. Job Titles Endpoints
# ----------------------------------------------------------------------
STANDARD_JOB_TITLES = [
    "Backend Developer",
    "Frontend Developer",
    "Fullstack Engineer",
    "DevOps Engineer",
    "QA/QC Automation Engineer",
    "UI/UX Designer",
    "Product Owner (PO)",
    "Scrum Master",
    "Technical Lead",
    "Solution Architect",
    "Chuyên viên Tuyển dụng (Recruiter)",
    "Trưởng nhóm Tuyển dụng",
    "Chuyên viên Nhân sự C&B",
    "Business Analyst (BA)",
    "Data Engineer"
]

@router.get("/job-titles")
def list_job_titles(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    db_items = db.query(JobTitle).order_by(JobTitle.name).all()
    if db_items:
        return [item.to_dict() for item in db_items]
    
    # Fallback/dynamic standard list if DB hasn't been seeded yet
    db_titles = set()
    try:
        postings = db.query(JobPosting.title).all()
        for p in postings:
            if p[0]:
                db_titles.add(p[0].strip())
    except Exception:
        pass
    all_titles = sorted(list(db_titles.union(set(STANDARD_JOB_TITLES))))
    return [{"id": idx + 1, "name": title} for idx, title in enumerate(all_titles)]

@router.post("/job-titles", status_code=status.HTTP_201_CREATED)
def create_job_title(payload: JobTitleCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    if payload.department_id and not db.query(Department).filter(Department.id == payload.department_id).first():
        raise HTTPException(status_code=400, detail="Phòng ban không tồn tại")
    item = JobTitle(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item.to_dict()

# ----------------------------------------------------------------------
# 4. Shared Categories Endpoints
# ----------------------------------------------------------------------
@router.get("/categories")
def list_categories(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(SharedCategory).order_by(SharedCategory.category_type, SharedCategory.sort_order).all()]

@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    item = SharedCategory(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item.to_dict()

@router.put("/categories/reorder")
def reorder_categories(payload: ReorderCategories, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    items = db.query(SharedCategory).filter(SharedCategory.id.in_(payload.ids)).all()
    by_id = {item.id: item for item in items}
    for index, item_id in enumerate(payload.ids):
        if item_id in by_id:
            by_id[item_id].sort_order = index
    db.commit()
    return [item.to_dict() for item in db.query(SharedCategory).order_by(SharedCategory.category_type, SharedCategory.sort_order).all()]

# ----------------------------------------------------------------------
# 5. Headcount Budgets & Approval Flows APIs
# ----------------------------------------------------------------------
@router.get("/headcounts")
def list_headcount_budgets(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(HeadcountBudget).order_by(HeadcountBudget.year.desc()).all()]

@router.get("/approval-flows")
def list_approval_flows(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    authorize(authorization, db)
    return [item.to_dict() for item in db.query(ApprovalFlow).order_by(ApprovalFlow.id.asc()).all()]

# ----------------------------------------------------------------------
# 6. Competency Frameworks & Scorecards (Sprint 6)
# ----------------------------------------------------------------------
def ensure_seed_competencies(db: Session):
    existing_count = db.query(CompetencyFramework).count()
    if existing_count > 0:
        return

    seed_items = [
        {
            "code": "COMP-TECH-01",
            "name": "Khung Năng Lực Kỹ Sư Phát Triển Phần Mềm (Software Engineer)",
            "category": "Công nghệ & Kỹ thuật",
            "description": "Bộ tiêu chí đánh giá chuẩn hóa cho các vị trí Lập trình viên Backend, Frontend và Fullstack. Sử dụng để chấm điểm phỏng vấn chuyên môn và đánh giá định kỳ.",
            "job_titles": ["Backend Developer", "Frontend Developer", "Fullstack Engineer"],
            "criteria": [
                {
                    "code": "TECH-ARCH",
                    "name": "Kiến trúc hệ thống & Thiết kế mã nguồn (System Design & Clean Code)",
                    "category": "Chuyên môn",
                    "weight": 40.0,
                    "required_level": 4,
                    "description": "Khả năng phân tích thiết kế CSDL, áp dụng Clean Architecture, RESTful API và tối ưu hiệu năng.",
                    "rubric_scale": {
                        "1": "Hiểu cấu trúc mã cơ bản, viết code chưa tối ưu, cần hướng dẫn chi tiết.",
                        "2": "Viết code theo chuẩn dự án, hiểu cấu trúc MVC/Clean Architecture cơ bản.",
                        "3": "Thiết kế độc lập các module, CSDL chuẩn hóa, viết API tối ưu và bảo mật.",
                        "4": "Làm chủ kiến trúc vi dịch vụ, Caching, xử lý bất đồng bộ và chống nghẽn hệ thống.",
                        "5": "Chuyên gia kiến trúc hệ thống phân tán chịu tải lớn hàng triệu CCU, định hình chuẩn toàn công ty."
                    },
                    "interview_questions": [
                        "Bạn tổ chức kiến trúc một dịch vụ Backend xử lý 10.000 giao dịch/giây như thế nào?",
                        "Chiến lược Caching (Redis) và xử lý cache invalidation bạn áp dụng là gì?"
                    ],
                    "sort_order": 0
                },
                {
                    "code": "PROBLEM-SOLVE",
                    "name": "Tư duy logic & Giải quyết sự cố (Troubleshooting & Debugging)",
                    "category": "Tư duy & Kỹ năng",
                    "weight": 30.0,
                    "required_level": 3,
                    "description": "Kỹ năng cô lập lỗi, tìm nguyên nhân gốc rễ (Root Cause Analysis) và xử lý sự cố trong thời gian ngắn.",
                    "rubric_scale": {
                        "1": "Chỉ fix được lỗi quen thuộc, cần mentor hỗ trợ khi gặp bug mới.",
                        "2": "Tự tra cứu log và debug lỗi thông thường trong phạm vi module đảm nhận.",
                        "3": "Chủ động phân tích root cause từ log hệ thống, viết script kiểm tra và khắc phục dứt điểm.",
                        "4": "Xử lý sự cố production phức tạp, đề xuất biện pháp phòng ngừa triệt để.",
                        "5": "Dẫn dắt ứng phó khủng hoảng kỹ thuật toàn hệ thống, tự động hóa cảnh báo và phục hồi."
                    },
                    "interview_questions": [
                        "Hãy kể về một sự cố production khó nhất bạn từng xử lý và cách bạn tìm ra nguyên nhân gốc rễ?"
                    ],
                    "sort_order": 1
                },
                {
                    "code": "AGILE-COLLAB",
                    "name": "Hợp tác nhóm & Tinh thần Agile (Teamwork & Communication)",
                    "category": "Văn hóa & Thái độ",
                    "weight": 15.0,
                    "required_level": 3,
                    "description": "Lắng nghe, phản biện mang tính xây dựng, chủ động giao tiếp với PM, PO, QA.",
                    "rubric_scale": {
                        "1": "Thụ động, ít trao đổi công việc, khó tiếp nhận phản hồi đóng góp.",
                        "2": "Giao tiếp rõ ràng trong daily meeting, hoàn thành công việc theo phân công.",
                        "3": "Chủ động phối hợp liên phòng ban, hỗ trợ đồng nghiệp, đón nhận đóng góp xây dựng.",
                        "4": "Khả năng điều phối và tháo gỡ bất đồng kỹ thuật trong team, thúc đẩy tiến độ sprint.",
                        "5": "Truyền cảm hứng, xây dựng văn hóa hợp tác tin cậy và gắn kết cao trong tổ chức."
                    },
                    "interview_questions": [
                        "Khi bạn và Tech Lead bất đồng quan điểm về giải pháp công nghệ, bạn sẽ xử lý thế nào?"
                    ],
                    "sort_order": 2
                },
                {
                    "code": "CULTURE-FIT",
                    "name": "Cam kết trách nhiệm & Tinh thần học hỏi liên tục (Continuous Learning)",
                    "category": "Văn hóa & Thái độ",
                    "weight": 15.0,
                    "required_level": 3,
                    "description": "Tinh thần làm chủ công việc (Ownership), ham học hỏi công nghệ mới và chia sẻ tri thức.",
                    "rubric_scale": {
                        "1": "Ít quan tâm cập nhật công nghệ, ngại thay đổi quy trình làm việc.",
                        "2": "Có ý thức tự học khi được yêu cầu, trách nhiệm vừa đủ với task được giao.",
                        "3": "Chủ động nghiên cứu tài liệu kỹ thuật mới, tinh thần Ownership cao với sản phẩm.",
                        "4": "Thường xuyên tổ chức tech-sharing, đề xuất ứng dụng công nghệ cải tiến năng suất.",
                        "5": "Hình mẫu văn hóa học tập đổi mới sáng tạo, thúc đẩy chuyển đổi công nghệ toàn diện."
                    },
                    "interview_questions": [
                        "Công nghệ hoặc kiến thức mới nhất bạn tự tìm hiểu trong 3 tháng qua là gì?"
                    ],
                    "sort_order": 3
                }
            ]
        },
        {
            "code": "COMP-QA-01",
            "name": "Khung Năng Lực Kỹ Sư Đảm Bảo Chất Lượng (QA/QC Engineer)",
            "category": "Kiểm thử & Chất lượng",
            "description": "Bộ tiêu chí đánh giá chuẩn cho kỹ sư kiểm thử phần mềm thủ công và tự động hóa.",
            "job_titles": ["QA/QC Automation Engineer"],
            "criteria": [
                {
                    "code": "TEST-DESIGN",
                    "name": "Thiết kế ma trận kiểm thử & Test Case (Test Design & Execution)",
                    "category": "Chuyên môn",
                    "weight": 40.0,
                    "required_level": 4,
                    "description": "Thiết kế bao phủ các kịch bản kiểm thử biên, luồng nghiệp vụ phức tạp.",
                    "rubric_scale": {
                        "1": "Chỉ chạy test case có sẵn, sót nhiều kịch bản rủi ro.",
                        "2": "Viết được test case cơ bản cho các tính năng đơn giản.",
                        "3": "Thiết kế ma trận test case bao phủ tốt luồng chính, luồng biên và ngoại lệ.",
                        "4": "Xây dựng chiến lược kiểm thử toàn diện từ đơn vị, tích hợp đến chấp nhận người dùng.",
                        "5": "Định nghĩa khung quy chuẩn chất lượng phần mềm áp dụng cho toàn bộ dự án."
                    },
                    "interview_questions": [
                        "Bạn áp dụng kỹ thuật phân vùng tương đương và phân tích giá trị biên như thế nào trong bài test phức tạp?"
                    ],
                    "sort_order": 0
                },
                {
                    "code": "AUTO-TEST",
                    "name": "Kỹ năng kiểm thử tự động & CI/CD (Automation Testing)",
                    "category": "Chuyên môn",
                    "weight": 30.0,
                    "required_level": 3,
                    "description": "Xây dựng kịch bản kiểm thử tự động API và giao diện, tích hợp pipeline.",
                    "rubric_scale": {
                        "1": "Chưa có kinh nghiệm viết kịch bản test tự động.",
                        "2": "Chạy và chỉnh sửa được các script automation có sẵn.",
                        "3": "Viết độc lập test script tự động cho API và Web UI bằng Playwright/Cypress/Selenium.",
                        "4": "Thiết kế Automation Framework hoàn chỉnh, tích hợp báo cáo và CI/CD pipeline.",
                        "5": "Kiến trúc sư hệ thống kiểm thử tự động đa nền tảng tối ưu thời gian chạy test."
                    },
                    "interview_questions": [
                        "Bạn lựa chọn công cụ kiểm thử tự động nào cho ứng dụng web và lý do lựa chọn?"
                    ],
                    "sort_order": 1
                },
                {
                    "code": "BUG-REPORT",
                    "name": "Kỹ năng mô tả & Theo dõi lỗi (Defect Reporting & Tracking)",
                    "category": "Tư duy & Kỹ năng",
                    "weight": 15.0,
                    "required_level": 3,
                    "description": "Ghi nhận lỗi chuẩn xác, cung cấp đủ dữ liệu tái hiện, phối hợp dev sửa lỗi.",
                    "rubric_scale": {
                        "1": "Báo cáo lỗi sơ sài, thiếu log hoặc các bước tái hiện.",
                        "2": "Báo lỗi đủ các bước, có hình ảnh hoặc video minh họa.",
                        "3": "Báo lỗi chi tiết kèm log, phân tích mức độ nghiêm trọng và nguyên nhân nghi ngờ.",
                        "4": "Phân tích xu hướng phát sinh lỗi, đề xuất phòng ngừa lỗi tương tự cho team dev.",
                        "5": "Xây dựng quy trình quản lý vòng đời lỗi tối ưu thời gian sửa lỗi toàn dự án."
                    },
                    "interview_questions": [
                        "Khi một lập trình viên từ chối nhận bug vì không tái hiện được, bạn sẽ làm gì?"
                    ],
                    "sort_order": 2
                },
                {
                    "code": "ACCURACY",
                    "name": "Độ cẩn thận, tỉ mỉ & Tư duy phản biện",
                    "category": "Văn hóa & Thái độ",
                    "weight": 15.0,
                    "required_level": 4,
                    "description": "Tỉ mỉ từng chi tiết, tư duy phản biện người dùng, bảo vệ chất lượng sản phẩm.",
                    "rubric_scale": {
                        "1": "Dễ bỏ sót lỗi giao diện hoặc lỗi trải nghiệm nhỏ.",
                        "2": "Tập trung phát hiện lỗi chức năng chính.",
                        "3": "Rất tỉ mỉ, luôn đặt mình vào vị trí người dùng cuối để tìm kiếm rủi ro tiềm ẩn.",
                        "4": "Tư duy phản biện sắc bén, tư vấn cải tiến trải nghiệm người dùng ngay từ khâu thiết kế.",
                        "5": "Người bảo vệ tiêu chuẩn chất lượng cao nhất của sản phẩm, không thỏa hiệp với chất lượng kém."
                    },
                    "interview_questions": [
                        "Bạn làm thế nào để đảm bảo không bị bỏ sót các lỗi biên trong các đợt release gấp?"
                    ],
                    "sort_order": 3
                }
            ]
        }
    ]

    for item in seed_items:
        fw = CompetencyFramework(
            code=item["code"],
            name=item["name"],
            category=item["category"],
            description=item["description"],
            job_titles=json.dumps(item["job_titles"], ensure_ascii=False),
            status="active"
        )
        db.add(fw)
        db.flush()

        for crit in item["criteria"]:
            c = CompetencyCriteria(
                framework_id=fw.id,
                code=crit["code"],
                name=crit["name"],
                category=crit["category"],
                weight=crit["weight"],
                required_level=crit["required_level"],
                description=crit["description"],
                rubric_scale=json.dumps(crit.get("rubric_scale", {}), ensure_ascii=False),
                interview_questions=json.dumps(crit.get("interview_questions", []), ensure_ascii=False),
                sort_order=crit["sort_order"]
            )
            db.add(c)
    
    db.commit()
    logger.info("Successfully seeded initial Competency Frameworks (S2-06)!")

@router.get("/competencies")
def list_competencies(
    search: Optional[str] = None,
    job_title: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    ensure_seed_competencies(db)
    query = db.query(CompetencyFramework)
    
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (CompetencyFramework.name.ilike(s)) |
            (CompetencyFramework.code.ilike(s)) |
            (CompetencyFramework.description.ilike(s))
        )
    
    frameworks = query.order_by(CompetencyFramework.id.desc()).all()
    results = [f.to_dict() for f in frameworks]

    if job_title:
        results = [f for f in results if job_title.lower() in [jt.lower() for jt in f.get("job_titles", [])]]

    if results:
        return results

    # Fallback to simple Competency table if any exist
    simple_competencies = db.query(Competency).order_by(Competency.category, Competency.sort_order).all()
    if simple_competencies:
        return [item.to_dict() for item in simple_competencies]
    return []

@router.get("/competencies/{framework_id}")
def get_competency_framework(
    framework_id: int,
    db: Session = Depends(get_db)
):
    fw = db.query(CompetencyFramework).filter(CompetencyFramework.id == framework_id).first()
    if not fw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy khung năng lực có ID {framework_id}."
        )
    return fw.to_dict()

@router.post("/competencies", status_code=status.HTTP_201_CREATED)
def create_competency_endpoint(
    payload: dict,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    current_user = get_current_hr_user(authorization, db)
    
    # Check if this is a FrameworkCreate payload (has criteria or job_titles)
    if "criteria" in payload or "job_titles" in payload:
        data = FrameworkCreate(**payload)
        if not data.code:
            import uuid
            data.code = f"COMP-{uuid.uuid4().hex[:6].upper()}"
        else:
            existing = db.query(CompetencyFramework).filter(CompetencyFramework.code == data.code.strip()).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Mã khung năng lực '{data.code}' đã tồn tại trên hệ thống. Vui lòng chọn mã khác."
                )

        fw = CompetencyFramework(
            code=data.code.strip(),
            name=data.name.strip(),
            category=data.category or "Chuyên môn kỹ thuật",
            description=data.description or "",
            job_titles=json.dumps(data.job_titles, ensure_ascii=False),
            status="active"
        )
        db.add(fw)
        db.flush()

        for idx, crit in enumerate(data.criteria):
            c_code = crit.code or f"{fw.code}-C{idx+1}"
            c = CompetencyCriteria(
                framework_id=fw.id,
                code=c_code,
                name=crit.name.strip(),
                category=crit.category or "Chuyên môn",
                weight=crit.weight,
                required_level=crit.required_level,
                description=crit.description or "",
                rubric_scale=json.dumps(crit.rubric_scale or {}, ensure_ascii=False),
                interview_questions=json.dumps(crit.interview_questions or [], ensure_ascii=False),
                sort_order=crit.sort_order if crit.sort_order is not None else idx
            )
            db.add(c)

        db.commit()
        db.refresh(fw)
        return fw.to_dict()

    # Otherwise, simple CompetencyCreate
    authorize(authorization, db)
    simple_data = CompetencyCreate(**payload)
    item = Competency(**simple_data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item.to_dict()

@router.put("/competencies/{framework_id}")
def update_competency_framework(
    framework_id: int,
    payload: FrameworkUpdate,
    current_user: Optional[User] = Depends(get_current_hr_user),
    db: Session = Depends(get_db)
):
    fw = db.query(CompetencyFramework).filter(CompetencyFramework.id == framework_id).first()
    if not fw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy khung năng lực có ID {framework_id}."
        )

    if payload.name is not None:
        fw.name = payload.name.strip()
    if payload.category is not None:
        fw.category = payload.category
    if payload.description is not None:
        fw.description = payload.description
    if payload.job_titles is not None:
        fw.job_titles = json.dumps(payload.job_titles, ensure_ascii=False)
    if payload.status is not None:
        fw.status = payload.status
    fw.updated_at = datetime.utcnow()

    if payload.criteria is not None:
        db.query(CompetencyCriteria).filter(CompetencyCriteria.framework_id == fw.id).delete()
        for idx, crit in enumerate(payload.criteria):
            c_code = crit.code or f"{fw.code}-C{idx+1}"
            c = CompetencyCriteria(
                framework_id=fw.id,
                code=c_code,
                name=crit.name.strip(),
                category=crit.category or "Chuyên môn",
                weight=crit.weight,
                required_level=crit.required_level,
                description=crit.description or "",
                rubric_scale=json.dumps(crit.rubric_scale or {}, ensure_ascii=False),
                interview_questions=json.dumps(crit.interview_questions or [], ensure_ascii=False),
                sort_order=crit.sort_order if crit.sort_order is not None else idx
            )
            db.add(c)

    db.commit()
    db.refresh(fw)
    return fw.to_dict()

@router.delete("/competencies/{framework_id}", status_code=status.HTTP_200_OK)
def delete_competency_framework(
    framework_id: int,
    current_user: Optional[User] = Depends(get_current_hr_user),
    db: Session = Depends(get_db)
):
    fw = db.query(CompetencyFramework).filter(CompetencyFramework.id == framework_id).first()
    if not fw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy khung năng lực có ID {framework_id}."
        )

    deleted_name = fw.name
    db.delete(fw)
    db.commit()
    return {"message": f"Đã xóa thành công khung năng lực '{deleted_name}'.", "id": framework_id}

@router.get("/competencies/{framework_id}/interview-scorecard")
def generate_interview_scorecard_preview(
    framework_id: int,
    job_title: Optional[str] = None,
    candidate_name: Optional[str] = "Nguyễn Văn Ứng Viên",
    db: Session = Depends(get_db)
):
    fw = db.query(CompetencyFramework).filter(CompetencyFramework.id == framework_id).first()
    if not fw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy khung năng lực có ID {framework_id}."
        )

    data = fw.to_dict()
    selected_job = job_title or (data["job_titles"][0] if data["job_titles"] else "Chức danh tuyển dụng")

    return {
        "scorecard_id": f"SCORECARD-{fw.code}-{datetime.utcnow().strftime('%Y%m%d')}",
        "framework_name": fw.name,
        "framework_code": fw.code,
        "target_job_title": selected_job,
        "candidate_name": candidate_name,
        "evaluation_date": datetime.utcnow().strftime("%d/%m/%Y"),
        "total_criteria": len(data["criteria"]),
        "total_weight": data["total_weight"],
        "criteria": [
            {
                "id": c["id"],
                "code": c["code"],
                "name": c["name"],
                "category": c["category"],
                "weight": c["weight"],
                "required_level": c["required_level"],
                "rubric_scale": c["rubric_scale"],
                "suggested_questions": c["interview_questions"],
                "default_score": c["required_level"]
            } for c in data["criteria"]
        ],
        "scoring_instruction": "Hội đồng phỏng vấn chấm điểm từ 1 đến 5 sao cho từng tiêu chí. Điểm tổng kết = Tổng(Điểm x Trọng số) / 100. Điểm sàn yêu cầu tối thiểu: 3.0 / 5.0.",
        "generated_for_sprint": "Sprint 6 - Phiếu Đánh Giá Phỏng Vấn Tuyển Dụng Chuẩn Hóa (S2-06-AC04)"
    }
