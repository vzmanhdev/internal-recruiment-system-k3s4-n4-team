"""
Seed script for Interview & Evaluation module:
- Competency Frameworks & Criteria
- Standardized Question Bank (InterviewQuestion)
- Realistic Interview Schedules across multiple rounds and statuses (scheduled, completed, cancelled)
- Evaluation Scorecards (CandidateEvaluation) with 1-5 criteria ratings, weighted scores, and recommendations
"""
import json
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.user import User
from app.models.application import JobApplication
from app.models.job import JobPosting
from app.models.interview import InterviewSchedule, InterviewInterviewer
from app.models.referral_eval import CandidateEvaluation
from app.models.master_data import CompetencyFramework, CompetencyCriterion, InterviewQuestion

def seed_interviews_and_evaluations():
    db = SessionLocal()
    try:
        print("[1/4] Ensuring Users...")
        hr_manager = db.query(User).filter(User.email == "hrmanager@company.com").first()
        recruiter = db.query(User).filter(User.email == "recruiter@company.com").first()
        interviewer = db.query(User).filter(User.email == "interviewer@company.com").first()
        approver = db.query(User).filter(User.email == "approver@company.com").first()
        manager = db.query(User).filter(User.email == "truongbophan@company.com").first()

        creator = hr_manager or recruiter or db.query(User).first()
        assert creator, "At least one user must exist"

        print("[2/4] Ensuring Competency Frameworks & Criteria...")
        cf = db.query(CompetencyFramework).filter(CompetencyFramework.code == "CF-IT-01").first()
        if not cf:
            cf = CompetencyFramework(
                id="cf-software-eng",
                code="CF-IT-01",
                name="Khung Năng Lực Kỹ Sư Phần Mềm (Software Engineer)",
                department="Công nghệ thông tin",
                applied_job_titles_json=json.dumps(["Senior Python Backend Engineer", "Frontend Developer", "Fullstack Developer", "Kỹ sư phần mềm"]),
                status="active",
                updated_at="2026-10-18",
            )
            db.add(cf)
            db.flush()

        criteria_defs = [
            ("CRIT-TECH", "Kiến thức Chuyên Môn & Architecture", "Nắm vững kiến trúc phần mềm, ngôn ngữ lập trình, Clean Code và Design Patterns", 35, "Technical"),
            ("CRIT-PROBLEM", "Tư Duy Giải Quyết Vấn Đề", "Khả năng phân tích bài toán phức tạp, debug logic và đề xuất giải pháp tối ưu", 25, "Problem Solving"),
            ("CRIT-TEAM", "Văn Hóa & Tinh Thần Đồng Đội", "Giao tiếp cởi mở, lắng nghe phản hồi, phối hợp tốt trong nhóm Agile/Scrum", 20, "Culture Fit"),
            ("CRIT-COMM", "Kỹ Năng Giao Tiếp & Thuyết Trình", "Diễn đạt rõ ràng, trình bày giải pháp kỹ thuật mạch lạc cho các bên liên quan", 20, "Communication"),
        ]

        saved_criteria = []
        for code, name, desc, weight, cat in criteria_defs:
            c = db.query(CompetencyCriterion).filter(CompetencyCriterion.framework_id == cf.id, CompetencyCriterion.code == code).first()
            if not c:
                c = CompetencyCriterion(
                    id=f"c-{code.lower()}",
                    framework_id=cf.id,
                    code=code,
                    name=name,
                    description=desc,
                    weight=weight,
                    category=cat,
                    benchmark_low="Chưa nắm vững nguyên lý cơ bản, thụ động khi đối mặt sự cố.",
                    benchmark_mid="Thực hiện tốt các tác vụ thông thường, chủ động tìm kiếm giải pháp.",
                    benchmark_high="Chuyên gia trong lĩnh vực, dẫn dắt đội ngũ và giải quyết vấn đề xuất sắc.",
                )
                db.add(c)
                db.flush()
            saved_criteria.append(c)

        print("[3/4] Ensuring Standardized Interview Question Bank...")
        questions_defs = [
            ("Q-BE-01", "Hãy giải thích cơ chế GIL (Global Interpreter Lock) trong Python và các giải pháp xử lý concurrency?", "Senior Python Backend Engineer", "hard", saved_criteria[0],
             "Ứng viên cần nêu được: GIL ngăn các native thread thực thi Python bytecode đồng thời. Giải pháp: Multiprocessing, AsyncIO cho I/O-bound, hoặc C-extension."),
            ("Q-BE-02", "Cách thiết kế hệ thống caching đa tầng với Redis để giải quyết bài toán Cache Breakdown và Cache Avalanche?", "Senior Python Backend Engineer", "hard", saved_criteria[0],
             "Ứng viên cần giải thích: Mutex lock cho cache breakdown, thêm jitter/random time cho TTL để tránh avalanche, bloom filter cho cache penetration."),
            ("Q-BE-03", "Kể về một sự cố production nghiêm trọng gần đây nhất bạn gặp phải và cách bạn điều tra nguyên nhân gốc rễ (RCA)?", "Senior Python Backend Engineer", "medium", saved_criteria[1],
             "Đánh giá theo phương pháp STAR: Tình huống, Nhiệm vụ, Hành động (log analysis, metrics, rollback), Kết quả & bài học đúc kết."),
            ("Q-BE-04", "Khi có sự bất đồng quan điểm kỹ thuật gay gắt giữa bạn và đồng nghiệp về giải pháp kiến trúc, bạn xử lý thế nào?", "Senior Python Backend Engineer", "medium", saved_criteria[2],
             "Lắng nghe, làm rõ pros/cons dựa trên dữ liệu và prototype thử nghiệm thay vì tranh cãi cảm tính; tuân thủ quyết định của lead sau khi chốt."),
            ("Q-BE-05", "Làm thế nào để bạn giải thích một kiến trúc vi dịch vụ (Microservices) phức tạp cho một Product Owner phi kỹ thuật?", "Senior Python Backend Engineer", "easy", saved_criteria[3],
             "Sử dụng phép ẩn dụ đời thường (ví dụ: các phòng ban chuyên trách trong công ty), tập trung vào giá trị nghiệp vụ, thời gian giao hàng và độ ổn định."),
            ("Q-FE-01", "Sự khác biệt giữa SSR (Server-Side Rendering), SSG (Static Site Generation) và ISR (Incremental Static Regeneration) trong Next.js?", "Frontend Developer", "medium", saved_criteria[0],
             "Trình bày rõ thời điểm render HTML: lúc request, lúc build time, và cập nhật ngầm theo chu kỳ revalidate."),
            ("Q-FE-02", "Cách bạn tối ưu chỉ số Core Web Vitals (LCP, FID/INP, CLS) trên một ứng dụng web phức tạp?", "Frontend Developer", "hard", saved_criteria[0],
             "Tối ưu ảnh (Next/Image, webp), code-splitting, dynamic import, reserve layout space để tránh CLS, giảm main thread work."),
            ("Q-QA-01", "Quy trình thiết kế ma trận kiểm thử (Test Matrix) và phân loại Boundary Value Analysis kết hợp Equivalence Partitioning?", "QA Engineer", "medium", saved_criteria[1],
             "Giải thích cách chọn giá trị biên min, max, min-1, max+1 và phân vùng giá trị hợp lệ/không hợp lệ."),
            ("Q-PM-01", "Cách bạn ưu tiên Product Backlog khi các bên liên quan (Sales, Tech, Executive) đều khẳng định tính năng của mình là gấp nhất?", "Product Manager", "hard", saved_criteria[1],
             "Sử dụng framework RICE (Reach, Impact, Confidence, Effort) hoặc Kano model, đối chiếu với OKRs chiến lược của công ty."),
            ("Q-HR-01", "Phương pháp xây dựng khung năng lực và tiêu chuẩn hóa bảng lương (Salary Band) dựa trên khảo sát thị trường?", "HR Specialist", "medium", saved_criteria[0],
             "Phương pháp định giá công việc (Hay group), khảo sát thị trường (Mercer, Navigos), phân bậc năng lực từ Junior đến Principal."),
        ]

        for qcode, content, jtitle, diff, crit, sug in questions_defs:
            q = db.query(InterviewQuestion).filter(InterviewQuestion.code == qcode).first()
            if not q:
                q = InterviewQuestion(
                    id=f"q-{qcode.lower()}",
                    code=qcode,
                    content=content,
                    criteria_id=crit.id,
                    criteria_name=crit.name,
                    job_title=jtitle,
                    difficulty=diff,
                    suggested_answer=sug,
                    status="active",
                    times_used=2,
                )
                db.add(q)

        db.commit()

        print("[4/4] Ensuring Realistic Interview Sessions & Evaluations...")
        apps = db.query(JobApplication).all()
        if not apps:
            print("No job applications found in DB!")
            return

        now = datetime.now()

        # Clean existing test interviews that might conflict with our clear test suite
        # but keep existing if valid
        app1 = apps[0] # App 1
        app2 = apps[1] if len(apps) > 1 else apps[0]
        app3 = apps[2] if len(apps) > 2 else apps[0]
        app4 = apps[3] if len(apps) > 3 else apps[0]

        # Let's check or create a rich schedule set
        # 1. Completed Interview Round 1 for App 1
        i1 = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == app1.id, InterviewSchedule.round_number == 1).first()
        if not i1:
            i1 = InterviewSchedule(
                application_id=app1.id,
                round_number=1,
                round_name="Vòng 1: HR Screening & Sàng lọc văn hóa",
                scheduled_time=now - timedelta(days=5, hours=3),
                duration_minutes=45,
                location="Google Meet Online",
                meeting_link="https://meet.google.com/abc-hr-screen",
                status="completed",
                score=8,
                passed=True,
                feedback_notes="Ứng viên giao tiếp lưu loát, trả lời rõ ràng về định hướng sự nghiệp, phù hợp văn hóa.",
                created_by_id=creator.id,
            )
            db.add(i1)
            db.flush()
            if hr_manager:
                db.add(InterviewInterviewer(interview_id=i1.id, interviewer_id=hr_manager.id))

        # 2. Completed Interview Round 2 for App 1 (Technical)
        i2 = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == app1.id, InterviewSchedule.round_number == 2).first()
        if not i2:
            i2 = InterviewSchedule(
                application_id=app1.id,
                round_number=2,
                round_name="Vòng 2: Phỏng vấn chuyên môn Technical Backend",
                scheduled_time=now - timedelta(days=2, hours=1),
                duration_minutes=60,
                location="Phòng Họp 302 - Tầng 3",
                meeting_link=None,
                status="completed",
                score=9,
                passed=True,
                feedback_notes="Kiến thức Python, SQL và Microservices rất chắc chắn. Live coding xử lý giải thuật tối ưu O(N).",
                created_by_id=creator.id,
            )
            db.add(i2)
            db.flush()
            if interviewer:
                db.add(InterviewInterviewer(interview_id=i2.id, interviewer_id=interviewer.id))
            if manager:
                db.add(InterviewInterviewer(interview_id=i2.id, interviewer_id=manager.id))

        # 3. Scheduled Interview Round 3 for App 1 (Upcoming Final)
        i3 = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == app1.id, InterviewSchedule.round_number == 3).first()
        if not i3:
            i3 = InterviewSchedule(
                application_id=app1.id,
                round_number=3,
                round_name="Vòng 3: Phỏng vấn Ban Giám Đốc & Deal Offer",
                scheduled_time=now + timedelta(days=2, hours=4),
                duration_minutes=45,
                location="Phòng Hội Thảo VIP - Tầng 10",
                meeting_link="https://meet.google.com/ceo-board-interview",
                status="scheduled",
                candidate_response="confirmed",
                created_by_id=creator.id,
            )
            db.add(i3)
            db.flush()
            if approver:
                db.add(InterviewInterviewer(interview_id=i3.id, interviewer_id=approver.id))
            if hr_manager:
                db.add(InterviewInterviewer(interview_id=i3.id, interviewer_id=hr_manager.id))

        # 4. Scheduled Upcoming Interview for App 2
        i4 = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == app2.id, InterviewSchedule.round_number == 1).first()
        if not i4:
            i4 = InterviewSchedule(
                application_id=app2.id,
                round_number=1,
                round_name="Vòng 1: HR Screening & Đánh giá sơ bộ",
                scheduled_time=now + timedelta(days=1, hours=2),
                duration_minutes=45,
                location="Trực tuyến Google Meet",
                meeting_link="https://meet.google.com/xyz-online-hr",
                status="scheduled",
                created_by_id=creator.id,
            )
            db.add(i4)
            db.flush()
            if hr_manager:
                db.add(InterviewInterviewer(interview_id=i4.id, interviewer_id=hr_manager.id))

        # 5. Completed Interview for App 3 with Mixed Score
        i5 = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == app3.id, InterviewSchedule.round_number == 1).first()
        if not i5:
            i5 = InterviewSchedule(
                application_id=app3.id,
                round_number=1,
                round_name="Vòng 1: Đánh giá Năng lực Kỹ thuật",
                scheduled_time=now - timedelta(days=3),
                duration_minutes=60,
                location="Phòng Họp 201",
                meeting_link=None,
                status="completed",
                score=6,
                passed=False,
                feedback_notes="Nắm được framework nhưng hổng kiến thức nền tảng và tối ưu hiệu năng.",
                created_by_id=creator.id,
            )
            db.add(i5)
            db.flush()
            if interviewer:
                db.add(InterviewInterviewer(interview_id=i5.id, interviewer_id=interviewer.id))

        # 6. Cancelled Interview for App 4
        i6 = db.query(InterviewSchedule).filter(InterviewSchedule.application_id == app4.id, InterviewSchedule.round_number == 1).first()
        if not i6:
            i6 = InterviewSchedule(
                application_id=app4.id,
                round_number=1,
                round_name="Vòng 1: Phỏng vấn Chuyên môn Sơ bộ",
                scheduled_time=now - timedelta(days=1),
                duration_minutes=45,
                location="Google Meet",
                meeting_link="https://meet.google.com/can-req-01",
                status="cancelled",
                cancel_reason="Ứng viên phản hồi xin hủy do đã nhận offer từ công ty khác.",
                created_by_id=creator.id,
            )
            db.add(i6)
            db.flush()
            if interviewer:
                db.add(InterviewInterviewer(interview_id=i6.id, interviewer_id=interviewer.id))

        db.commit()

        # Now Add Candidate Evaluations for completed interviews
        print("[4b] Creating Candidate Evaluations...")
        eval_defs = [
            # For i1 (App 1, Round 1 - HR Manager)
            (app1.id, i1.id, hr_manager.id if hr_manager else creator.id, 8, 8, 9, 8, 82.5, "hire",
             "Giao tiếp tự tin, phong thái chuyên nghiệp, tiếng Anh lưu loát.",
             "Chưa có nhiều kinh nghiệm quản lý nhóm lớn.",
             "Đề xuất cho ứng viên tiếp tục vào Vòng 2 Technical với Hội đồng chuyên môn.",
             [
                 {"name": saved_criteria[0].name, "score": 4, "comment": "Hiểu tổng quan công nghệ."},
                 {"name": saved_criteria[1].name, "score": 4, "comment": "Tư duy mạch lạc."},
                 {"name": saved_criteria[2].name, "score": 5, "comment": "Rất phù hợp văn hóa năng động."},
                 {"name": saved_criteria[3].name, "score": 4, "comment": "Trình bày rõ ràng, thiện chí."},
             ]),
            # For i2 (App 1, Round 2 - Interviewer)
            (app1.id, i2.id, interviewer.id if interviewer else creator.id, 9, 9, 8, 9, 88.0, "hire",
             "Kỹ năng lập trình Python xuất sắc, nắm sâu SQLAlchemy, tối ưu indexing database.",
             "Cần thời gian làm quen thêm với hạ tầng Kubernetes nội bộ.",
             "Đánh giá RẤT TỐT (Strong Hire). Đề xuất mức lương Senior dải trên.",
             [
                 {"name": saved_criteria[0].name, "score": 5, "comment": "Kiến thức chuyên sâu, trả lời chính xác câu hỏi hóc búa."},
                 {"name": saved_criteria[1].name, "score": 4, "comment": "Giải thuật tối ưu, clean code."},
                 {"name": saved_criteria[2].name, "score": 4, "comment": "Hợp tác tốt."},
                 {"name": saved_criteria[3].name, "score": 4, "comment": "Giải thích luồng dữ liệu dễ hiểu."},
             ]),
            # For i2 (App 1, Round 2 - Hiring Manager)
            (app1.id, i2.id, manager.id if manager else creator.id, 9, 8, 9, 9, 86.5, "hire",
             "Kinh nghiệm thực chiến phong phú, tư duy phân tích yêu cầu sát với sản phẩm thực tế.",
             "Cần thêm định hướng về quy trình Release nội bộ.",
             "Đồng ý tuyển dụng cho dự án trọng điểm quý 4.",
             [
                 {"name": saved_criteria[0].name, "score": 4, "comment": "Đáp ứng tốt yêu cầu dự án."},
                 {"name": saved_criteria[1].name, "score": 5, "comment": "Giải quyết bài toán nghiệp vụ xuất sắc."},
                 {"name": saved_criteria[2].name, "score": 4, "comment": "Thái độ tích cực, chủ động."},
                 {"name": saved_criteria[3].name, "score": 4, "comment": "Tương tác tốt với lead."},
             ]),
            # For i5 (App 3, Round 1 - Interviewer - Hold)
            (app3.id, i5.id, interviewer.id if interviewer else creator.id, 6, 6, 7, 6, 62.0, "hold",
             "Biết sử dụng công nghệ phổ biến, tinh thần học hỏi tốt.",
             "Kiến thức cốt lõi chưa vững, lúng túng khi xử lý concurrency và memory leak.",
             "Cân nhắc xếp vào vị trí Middle hoặc thử việc có người hướng dẫn sát sao.",
             [
                 {"name": saved_criteria[0].name, "score": 3, "comment": "Mức độ trung bình, thiếu chiều sâu."},
                 {"name": saved_criteria[1].name, "score": 3, "comment": "Cần gợi ý mới giải được bài toán."},
                 {"name": saved_criteria[2].name, "score": 4, "comment": "Lắng nghe và cầu thị."},
                 {"name": saved_criteria[3].name, "score": 3, "comment": "Đôi lúc diễn đạt chưa gãy gọn."},
             ]),
        ]

        for aid, iid, uid, tech, cult, comm, overall, weighted, rec, strg, weak, comment, crit_snapshot in eval_defs:
            existing = db.query(CandidateEvaluation).filter(
                CandidateEvaluation.application_id == aid,
                CandidateEvaluation.interview_id == iid,
                CandidateEvaluation.evaluator_id == uid,
            ).first()
            if not existing:
                eval_record = CandidateEvaluation(
                    application_id=aid,
                    interview_id=iid,
                    evaluator_id=uid,
                    technical_score=tech,
                    culture_fit_score=cult,
                    communication_score=comm,
                    overall_score=overall,
                    weighted_score=weighted,
                    recommendation=rec,
                    strengths=strg,
                    weaknesses=weak,
                    comments=comment,
                    framework_id=cf.id,
                    criteria_json=json.dumps(crit_snapshot, ensure_ascii=False),
                    created_at=now - timedelta(days=2),
                )
                db.add(eval_record)

        db.commit()
        print("SEED COMPLETED SUCCESSFULLY!")
        print(f"Total Interviews now: {db.query(InterviewSchedule).count()}")
        print(f"Total Candidate Evaluations now: {db.query(CandidateEvaluation).count()}")
        print(f"Total Interview Questions now: {db.query(InterviewQuestion).count()}")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_interviews_and_evaluations()
