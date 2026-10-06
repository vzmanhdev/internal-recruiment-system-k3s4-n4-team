"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Star,
  Users,
  UserCheck,
  Building2,
  Calendar,
  Laptop,
  Key,
  ShieldCheck,
  History,
  Lock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  X,
  RotateCcw,
  Check,
  Layers,
  AlertTriangle,
  Info,
  HelpCircle,
  Award,
  Briefcase,
  ExternalLink,
  CheckSquare,
} from "lucide-react";

// =========================================================================
// 1. DATA MODELS: PHIẾU ĐÁNH GIÁ PHỎNG VẤN (IMMUTABLE EVALUATION SNAPSHOT)
// =========================================================================

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // Trọng số (%) tại thời điểm đánh giá
  score: number; // Điểm chấm (thang 1 - 5)
  comment: string; // Nhận xét của người phỏng vấn
}

export interface InterviewEvaluationRecord {
  id: string;
  code: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  interviewRound: string;
  interviewerName: string;
  interviewerRole: string;
  interviewDate: string;
  snapshotVersion: string; // Phiên bản khung năng lực lúc lưu phiếu
  snapshotDescription: string;
  criteria: EvaluationCriterion[];
  overallConclusion: string;
  recommendation: "offer" | "consider" | "reject";
  isLocked: boolean; // Read-only / Bất biến
}

// =========================================================================
// 2. DATA MODELS: CHECKLIST TIẾP NHẬN (ONBOARDING WORKFLOW)
// =========================================================================

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: "account" | "device" | "workplace" | "compliance" | "orientation";
  assignee: string; // Người phụ trách
  assigneeRole: string;
  dueDate: string; // Hạn hoàn thành
  isCompleted: boolean;
  completedAt?: string;
}

export interface OnboardingCandidate {
  id: string;
  name: string;
  employeeCode: string;
  jobTitle: string;
  department: string;
  startDate: string;
  avatarText: string;
  tasks: OnboardingTask[];
}

// =========================================================================
// 3. MOCK DATA: PHIẾU A (BẢN CŨ 60/40) & PHIẾU B (BẢN MỚI 50/50)
// =========================================================================

/**
 * Phiếu A: Được tạo khi hệ thống áp dụng Khung năng lực v1.0 (Trọng số 60% Chuyên môn / 40% Kỹ năng mềm).
 * Điểm tổng = (4 * 0.60) + (5 * 0.40) = 2.40 + 2.00 = 4.40 / 5.0 (88 / 100).
 */
export const MOCK_EVALUATION_A: InterviewEvaluationRecord = {
  id: "eval-a",
  code: "EVAL-2026-0815",
  candidateName: "Lê Hoàng Nam",
  candidateEmail: "nam.le@example.com",
  jobTitle: "Senior Frontend Engineer (React/Next.js)",
  department: "Trung Tâm Phát Triển Phần Mềm (Software Center)",
  interviewRound: "Vòng 2 - Phỏng Vấn Chuyên Môn & Văn Hóa",
  interviewerName: "Trần Minh Quân",
  interviewerRole: "Technical Lead & Hội đồng Tuyển dụng",
  interviewDate: "15/08/2026",
  snapshotVersion: "Khung năng lực v1.0 (Lưu ngày 15/08/2026)",
  snapshotDescription: "Cấu hình lịch sử: Chuyên môn kỹ thuật (60%) + Kỹ năng mềm & Văn hóa (40%)",
  criteria: [
    {
      id: "crit-1",
      name: "Kiến thức Chuyên môn Kỹ thuật & Tư duy Thuật toán",
      description: "Thành thạo TypeScript, React Server Components, tối ưu render hiệu năng cao và giải quyết bài toán UI phức tạp.",
      weight: 60, // 60%
      score: 4, // 4/5
      comment: "Nắm rất chắc kiến trúc React hiện đại, trả lời tốt câu hỏi tối ưu Core Web Vitals và thiết kế state quản lý tập trung. Code mẫu sạch đẹp và có tư duy viết unit test tốt.",
    },
    {
      id: "crit-2",
      name: "Kỹ năng Mềm, Làm việc Nhóm & Hòa nhập Văn hóa",
      description: "Giao tiếp mạch lạc, kỹ năng lắng nghe, tinh thần chủ động đóng góp cho đội ngũ và thái độ cầu thị.",
      weight: 40, // 40%
      score: 5, // 5/5
      comment: "Rất cởi mở, chia sẻ câu chuyện vượt khó trong dự án cũ rất thuyết phục. Tinh thần trách nhiệm cao, rất phù hợp với phong cách văn hóa Agile và tinh thần làm chủ công việc của công ty.",
    },
  ],
  overallConclusion: "Ứng viên thể hiện năng lực chuyên môn xuất sắc và thái độ tích cực vượt trội. Đề xuất phát hành Thư mời nhận việc (Offer) cấp bậc Senior II.",
  recommendation: "offer",
  isLocked: true,
};

/**
 * Phiếu B: Được tạo khi hệ thống nâng cấp Khung năng lực v2.0 (Trọng số 50% Chuyên môn / 50% Kỹ năng mềm).
 * Điểm tổng = (5 * 0.50) + (4 * 0.50) = 2.50 + 2.00 = 4.50 / 5.0 (90 / 100).
 */
export const MOCK_EVALUATION_B: InterviewEvaluationRecord = {
  id: "eval-b",
  code: "EVAL-2026-1005",
  candidateName: "Trần Mai Anh",
  candidateEmail: "maianh.tran@example.com",
  jobTitle: "Senior Frontend Engineer (React/Next.js)",
  department: "Trung Tâm Phát Triển Phần Mềm (Software Center)",
  interviewRound: "Vòng 2 - Phỏng Vấn Chuyên Môn & Khả Năng Thích Ứng",
  interviewerName: "Phạm Hồng Đức",
  interviewerRole: "Director of Engineering & Trưởng nhóm Tuyển dụng",
  interviewDate: "05/10/2026",
  snapshotVersion: "Khung năng lực v2.0 (Lưu ngày 05/10/2026)",
  snapshotDescription: "Cấu hình lịch sử: Chuyên môn kỹ thuật (50%) + Kỹ năng Quản lý & Thích ứng (50%)",
  criteria: [
    {
      id: "crit-1",
      name: "Kiến thức Chuyên môn Kỹ thuật & Giải quyết Vấn đề",
      description: "Tư duy thiết kế hệ thống Frontend (Frontend System Design), khả năng xử lý bài toán chịu tải cao và kiến trúc Micro-Frontend.",
      weight: 50, // 50%
      score: 5, // 5/5
      comment: "Giải quyết xuất sắc case study thiết kế Dashboard thời gian thực với WebSocket và caching nhiều tầng. Trả lời sắc bén về các trade-off kỹ thuật.",
    },
    {
      id: "crit-2",
      name: "Kỹ năng Quản lý, Giao tiếp & Khả năng Thích ứng",
      description: "Khả năng phối hợp đa phòng ban, hướng dẫn (mentoring) nhân sự trẻ và thích ứng nhanh với thay đổi yêu cầu kinh doanh.",
      weight: 50, // 50%
      score: 4, // 4/5
      comment: "Giao tiếp gãy gọn, có kinh nghiệm lead nhóm 4 kỹ sư tại công ty trước. Thể hiện sự bình tĩnh và tư duy giải quyết xung đột ý kiến kỹ thuật rất tốt.",
    },
  ],
  overallConclusion: "Ứng viên toàn diện cả về chiều sâu kỹ thuật lẫn khả năng dẫn dắt. Đạt chuẩn cao của công ty, đề xuất Offer vị trí Senior Frontend Engineer.",
  recommendation: "offer",
  isLocked: true,
};

// =========================================================================
// 4. MOCK DATA: CHECKLIST TIẾP NHẬN THEO MẪU PHÒNG BAN (ONBOARDING TEMPLATES)
// =========================================================================

export const INITIAL_ONBOARDING_CANDIDATES: OnboardingCandidate[] = [
  {
    id: "onb-1",
    name: "Nguyễn Hải Đăng",
    employeeCode: "EMP-2026-108",
    jobTitle: "Senior Backend Engineer (Python/FastAPI)",
    department: "Trung Tâm Phát Triển Phần Mềm",
    startDate: "10/10/2026",
    avatarText: "HĐ",
    // Ban đầu có 3/4 task hoàn thành = 75% -> Trạng thái: "Chưa onboard"
    tasks: [
      {
        id: "task-1",
        title: "Cấp tài khoản Email công ty, SSO & tài khoản GitLab nội bộ",
        description: "Khởi tạo Google Workspace (haidang.nguyen@company.com), nhóm mail nội bộ và quyền truy cập repository phần mềm.",
        category: "account",
        assignee: "Đặng Tuấn Minh",
        assigneeRole: "IT System Admin",
        dueDate: "08/10/2026 12:00",
        isCompleted: true,
        completedAt: "07/10/2026 09:15",
      },
      {
        id: "task-2",
        title: "Cấp phát laptop (MacBook Pro M3), màn hình phụ & thiết bị ngoại vi",
        description: "Bàn giao máy tính xách tay cấu hình tiêu chuẩn dev, chuột công thái học, bàn phím và ký biên bản bàn giao tài sản.",
        category: "device",
        assignee: "Hoàng Đức Anh",
        assigneeRole: "IT Helpdesk Lead",
        dueDate: "08/10/2026 16:00",
        isCompleted: true,
        completedAt: "07/10/2026 14:30",
      },
      {
        id: "task-3",
        title: "Bố trí vị trí ngồi làm việc, thẻ từ ra vào & bộ quà chào mừng (Welcome Kit)",
        description: "Bàn làm việc khu vực D-04 Tầng 4, thẻ nhân viên ra vào tòa nhà, sổ tay và áo thun đồng phục công ty.",
        category: "workplace",
        assignee: "Vũ Thị Mai",
        assigneeRole: "Chuyên viên Hành chính",
        dueDate: "09/10/2026 10:00",
        isCompleted: true,
        completedAt: "07/10/2026 16:00",
      },
      {
        id: "task-4",
        title: "Ký kết Hợp đồng lao động chính thức & Kích hoạt hồ sơ nhân sự (C&B)",
        description: "Hoàn tất hợp đồng lao động số, kích hoạt tài khoản bảo hiểm xã hội, tài khoản thuế TNCN và mở thẻ ngân hàng chi lương.",
        category: "compliance",
        assignee: "Lê Thu Trang",
        assigneeRole: "Chuyên viên Nhân sự C&B",
        dueDate: "09/10/2026 17:00",
        isCompleted: false, // Task cuối cùng để người dùng kích hoạt đạt 100%!
      },
    ],
  },
  {
    id: "onb-2",
    name: "Phạm Quỳnh Trang",
    employeeCode: "EMP-2026-109",
    jobTitle: "Chuyên viên Kinh Doanh Doanh Nghiệp (B2B Sales)",
    department: "Khối Kinh Doanh & Tiếp Thị",
    startDate: "12/10/2026",
    avatarText: "QT",
    // 2/4 task hoàn thành = 50%
    tasks: [
      {
        id: "task-sales-1",
        title: "Cấp tài khoản CRM Salesforce, Email công ty & Hotline tổng đài",
        description: "Phân quyền người dùng trên hệ thống CRM, tài khoản tổng đài ảo VoIP và cấp số máy lẻ bàn giao.",
        category: "account",
        assignee: "Đặng Tuấn Minh",
        assigneeRole: "IT System Admin",
        dueDate: "10/10/2026 12:00",
        isCompleted: true,
        completedAt: "07/10/2026 10:00",
      },
      {
        id: "task-sales-2",
        title: "Cấp phát laptop mỏng nhẹ, điện thoại hotline & Sim công ty",
        description: "Laptop doanh nhân Dell XPS, smartphone hotline kèm gói cước 4G thoại doanh nghiệp.",
        category: "device",
        assignee: "Hoàng Đức Anh",
        assigneeRole: "IT Helpdesk",
        dueDate: "10/10/2026 16:00",
        isCompleted: true,
        completedAt: "07/10/2026 11:30",
      },
      {
        id: "task-sales-3",
        title: "Bố trí chỗ ngồi tại sàn Sales Tầng 2 & Danh thiếp in ấn",
        description: "Bàn làm việc khu vực S-12, thẻ nhân viên và hộp danh thiếp chức danh B2B Account Executive.",
        category: "workplace",
        assignee: "Vũ Thị Mai",
        assigneeRole: "Hành chính",
        dueDate: "11/10/2026 11:00",
        isCompleted: false,
      },
      {
        id: "task-sales-4",
        title: "Bàn giao bộ tài liệu bán hàng, bảng giá & Phân công Buddy hướng dẫn",
        description: "Tài liệu sản phẩm chuẩn, quy chế hoa hồng kinh doanh và chỉ định Mentor đồng hành 1 tháng đầu.",
        category: "orientation",
        assignee: "Nguyễn Minh Tuấn",
        assigneeRole: "Trưởng phòng Kinh doanh",
        dueDate: "11/10/2026 17:00",
        isCompleted: false,
      },
    ],
  },
  {
    id: "onb-3",
    name: "Trần Quốc Huy",
    employeeCode: "EMP-2026-110",
    jobTitle: "Chuyên viên Tuyển Dụng & Đào Tạo (HR Recruiter)",
    department: "Phòng Nhân Sự & Đào Tạo",
    startDate: "06/10/2026",
    avatarText: "QH",
    // 4/4 task hoàn thành = 100% -> Đã Onboard
    tasks: [
      {
        id: "task-hr-1",
        title: "Cấp tài khoản Hệ thống Tuyển dụng Nội bộ (ATS) & Email",
        description: "Phân quyền vai trò Recruiter trên hệ thống nội bộ, cấp email và nhóm trao đổi tuyển dụng.",
        category: "account",
        assignee: "Đặng Tuấn Minh",
        assigneeRole: "IT System Admin",
        dueDate: "05/10/2026 12:00",
        isCompleted: true,
        completedAt: "05/10/2026 09:00",
      },
      {
        id: "task-hr-2",
        title: "Cấp phát laptop làm việc & thiết bị văn phòng",
        description: "Laptop tiêu chuẩn HR, tai nghe tổng đài phỏng vấn và tài khoản Zoom Pro phỏng vấn ứng viên.",
        category: "device",
        assignee: "Hoàng Đức Anh",
        assigneeRole: "IT Helpdesk",
        dueDate: "05/10/2026 15:00",
        isCompleted: true,
        completedAt: "05/10/2026 11:00",
      },
      {
        id: "task-hr-3",
        title: "Bố trí chỗ ngồi tại Phòng Nhân sự Tầng 3",
        description: "Vị trí bàn HR-06, thẻ nhân viên và tủ hồ sơ tài liệu ứng viên mật.",
        category: "workplace",
        assignee: "Vũ Thị Mai",
        assigneeRole: "Hành chính",
        dueDate: "05/10/2026 17:00",
        isCompleted: true,
        completedAt: "05/10/2026 14:00",
      },
      {
        id: "task-hr-4",
        title: "Bàn giao luồng tuyển dụng, mẫu đánh giá & Quy trình Onboarding",
        description: "Tập huấn các tính năng trong hệ thống tuyển dụng nội bộ và bàn giao phụ trách 3 vị trí kỹ thuật đang mở.",
        category: "orientation",
        assignee: "Trưởng Phòng Nhân Sự",
        assigneeRole: "HR Manager",
        dueDate: "06/10/2026 10:00",
        isCompleted: true,
        completedAt: "06/10/2026 09:30",
      },
    ],
  },
];

// =========================================================================
// 5. HELPER FUNCTIONS: TÍNH ĐIỂM TỔNG CỦA PHIẾU ĐÁNH GIÁ
// =========================================================================

/**
 * Tính điểm tổng = Sum(Điểm * Trọng số)
 * Ví dụ thang 5: (Điểm_1 * Trọng_số_1 / 100) + (Điểm_2 * Trọng_số_2 / 100)
 */
export function calculateEvaluationTotalScore(criteria: EvaluationCriterion[]): {
  weightedScoreOutOf5: number;
  scoreOutOf100: number;
  totalWeight: number;
} {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const crit of criteria) {
    weightedSum += crit.score * (crit.weight / 100);
    totalWeight += crit.weight;
  }

  // Làm tròn 2 chữ số thập phân
  const weightedScoreOutOf5 = Math.round(weightedSum * 100) / 100;
  const scoreOutOf100 = Math.round((weightedScoreOutOf5 / 5) * 100);

  return {
    weightedScoreOutOf5,
    scoreOutOf100,
    totalWeight,
  };
}

// =========================================================================
// 6. MAIN COMPONENT: HRExecution
// =========================================================================

export function HRExecution() {
  // Tabs điều hướng chính: 1. Phiếu đánh giá phỏng vấn | 2. Checklist Tiếp nhận (Onboarding)
  const [activeMainTab, setActiveMainTab] = useState<"evaluation" | "onboarding">("evaluation");

  // =======================================================================
  // TAB 1: PHIẾU ĐÁNH GIÁ PHỎNG VẤN (IMMUTABLE EVALUATION SNAPSHOT)
  // =======================================================================
  // Chọn giữa Phiếu A (bản cũ 60/40) và Phiếu B (bản mới 50/50)
  const [selectedEvalTab, setSelectedEvalTab] = useState<"eval_a" | "eval_b">("eval_a");

  // Hiển thị khung so sánh bất biến
  const [showImmutabilityGuide, setShowImmutabilityGuide] = useState(true);

  // Lấy dữ liệu phiếu đang chọn
  const currentEvaluation = selectedEvalTab === "eval_a" ? MOCK_EVALUATION_A : MOCK_EVALUATION_B;

  // Tính điểm tổng tự động theo đúng trọng số lưu trong phiếu
  const evalScoreResult = useMemo(() => {
    return calculateEvaluationTotalScore(currentEvaluation.criteria);
  }, [currentEvaluation]);

  // =======================================================================
  // TAB 2: CHECKLIST TIẾP NHẬN (ONBOARDING WORKFLOW)
  // =======================================================================
  const [onboardingCandidates, setOnboardingCandidates] = useState<OnboardingCandidate[]>(
    INITIAL_ONBOARDING_CANDIDATES
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("onb-1");

  // Lấy thông tin ứng viên onboarding hiện tại
  const currentCandidate = useMemo(() => {
    return (
      onboardingCandidates.find((c) => c.id === selectedCandidateId) ||
      onboardingCandidates[0]
    );
  }, [onboardingCandidates, selectedCandidateId]);

  // Tính % tiến độ hoàn thành realtime
  const { totalTasks, completedTasks, percentCompleted, isOnboarded } = useMemo(() => {
    const total = currentCandidate.tasks.length;
    const completed = currentCandidate.tasks.filter((t) => t.isCompleted).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    // Đạt đúng 100% mới chuyển trạng thái sang "Đã Onboard", nếu 75% trạng thái vẫn là "Chưa onboard"
    const isDone = percent === 100;

    return {
      totalTasks: total,
      completedTasks: completed,
      percentCompleted: percent,
      isOnboarded: isDone,
    };
  }, [currentCandidate]);

  // =======================================================================
  // TOAST NOTIFICATION REALTIME KHI ĐẠT 100% TIẾP NHẬN
  // =======================================================================
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showOnboardSuccessToast = (candidateName: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(`Chuyển trạng thái ứng viên sang Đã Onboard thành công! (${candidateName})`);

    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Toggle trạng thái hoàn thành của từng task trong checklist
  const handleToggleTask = (taskId: string) => {
    setOnboardingCandidates((prevCandidates) =>
      prevCandidates.map((candidate) => {
        if (candidate.id !== currentCandidate.id) return candidate;

        const updatedTasks = candidate.tasks.map((task) => {
          if (task.id === taskId) {
            const nextCompleted = !task.isCompleted;
            return {
              ...task,
              isCompleted: nextCompleted,
              completedAt: nextCompleted ? "07/10/2026 10:00" : undefined,
            };
          }
          return task;
        });

        // Kiểm tra xem hành động vừa rồi có làm tiến độ đạt 100% không
        const allCompleted = updatedTasks.every((t) => t.isCompleted);
        const wasPreviouslyCompleted = candidate.tasks.every((t) => t.isCompleted);

        // Kích hoạt Toast notification ngay khi vừa chạm mốc 100%
        if (allCompleted && !wasPreviouslyCompleted) {
          showOnboardSuccessToast(candidate.name);
        }

        return {
          ...candidate,
          tasks: updatedTasks,
        };
      })
    );
  };

  // Reset về trạng thái 75% để tiện kiểm thử thao tác người dùng
  const handleResetTo75Percent = () => {
    setOnboardingCandidates((prevCandidates) =>
      prevCandidates.map((candidate) => {
        if (candidate.id !== currentCandidate.id) return candidate;

        // Đặt lại: 3 task đầu xong, task cuối chưa xong (75%)
        const resetTasks = candidate.tasks.map((task, idx) => ({
          ...task,
          isCompleted: idx < candidate.tasks.length - 1,
        }));

        return {
          ...candidate,
          tasks: resetTasks,
        };
      })
    );
    setToastMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* ======================================================================= */}
      {/* TOAST NOTIFICATION MÀU XANH Ở GÓC PHẢI MÀN HÌNH (KHI ĐẠT 100%) */}
      {/* ======================================================================= */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[9999] max-w-md w-full animate-fade-in shadow-2xl rounded-2xl bg-white border border-emerald-300 p-4 flex items-start gap-3.5 ring-4 ring-emerald-500/10">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-extrabold text-emerald-900 leading-tight">
              Chuyển trạng thái ứng viên sang Đã Onboard thành công!
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Ứng viên <strong>{currentCandidate.name}</strong> đã hoàn thành đủ 100% checklist tiếp nhận và sẵn sàng bắt đầu công việc chính thức.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <Check className="w-3 h-3 stroke-[3]" />
                Đã đồng bộ hồ sơ nhân viên
              </span>
              <span className="text-[10px] text-slate-400">Vừa xong</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 1. HEADER CHÍNH CỦA COMPONENT THỰC THI TUYỂN DỤNG */}
      {/* ======================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4285F4]">
              <Sparkles className="w-4 h-4" />
              <span>GIAI ĐOẠN THỰC THI & HOÀN TẤT TUYỂN DỤNG (EXECUTION & ONBOARDING)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Thực Thi Đánh Giá Phỏng Vấn & Tiếp Nhận Nhân Sự
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Bảo toàn lịch sử đánh giá phỏng vấn bất biến và tự động hóa quy trình checklist tiếp nhận nhân viên mới
            </p>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveMainTab("evaluation")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeMainTab === "evaluation"
                  ? "bg-white text-[#4285F4] shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Phiếu Đánh Giá Phỏng Vấn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("onboarding")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeMainTab === "onboarding"
                  ? "bg-white text-[#4285F4] shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>2. Checklist Tiếp Nhận (Onboarding)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* NỘI DUNG TAB 1: PHIẾU ĐÁNH GIÁ PHỎNG VẤN (READ-ONLY / LỊCH SỬ BẤT BIẾN) */}
      {/* ======================================================================= */}
      {activeMainTab === "evaluation" && (
        <div className="space-y-6 animate-fade-in">
          {/* Card chọn Phiếu A (60/40) vs Phiếu B (50/50) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Chọn Phiếu Đánh Giá Kiểm Thử Tính Bất Biến (Audit Trail)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mỗi phiếu được chụp lại (snapshot) cùng cấu hình khung năng lực tại thời điểm đánh giá, độc lập với cấu hình hiện tại
                </p>
              </div>

              {/* Selector giữa 2 phiếu mock data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lựa chọn Phiếu A */}
                <button
                  type="button"
                  onClick={() => setSelectedEvalTab("eval_a")}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                    selectedEvalTab === "eval_a"
                      ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      selectedEvalTab === "eval_a"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    A
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-slate-900">Phiếu A (Bản cũ 60/40)</strong>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        v1.0
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ứng viên: Lê Hoàng Nam • Trọng số 60% / 40%
                    </p>
                  </div>
                </button>

                {/* Lựa chọn Phiếu B */}
                <button
                  type="button"
                  onClick={() => setSelectedEvalTab("eval_b")}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                    selectedEvalTab === "eval_b"
                      ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      selectedEvalTab === "eval_b"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    B
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-bold text-slate-900">Phiếu B (Bản mới 50/50)</strong>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                        v2.0
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ứng viên: Trần Mai Anh • Trọng số 50% / 50%
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Khối giải thích cơ chế bảo toàn lịch sử bất biến */}
            {showImmutabilityGuide && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-extrabold">
                      Nguyên Tắc Bất Biến Lịch Sử (Audit Immutability Principle):
                    </strong>
                    <button
                      type="button"
                      onClick={() => setShowImmutabilityGuide(false)}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Đóng
                    </button>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Khi Trưởng phòng Nhân sự điều chỉnh Khung năng lực từ <strong>Phiên bản cũ (60/40)</strong> sang <strong>Phiên bản mới (50/50)</strong> trong Master Data, hệ thống tự động khóa cứng (freeze snapshot) tiêu chí và trọng số của các phiếu đánh giá cũ.
                    Màn hình cam kết <strong>render chính xác điểm và trọng số gốc của từng phiếu</strong>, không lấy cấu hình hiện hành đè lên, đảm bảo tính minh bạch và giá trị pháp lý của biên bản phỏng vấn.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* GIAO DIỆN PHIẾU ĐÁNH GIÁ CHI TIẾT (READ-ONLY) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            {/* Header thông tin phiếu */}
            <div className="flex flex-col md:flex-row md:items-start justify-between pb-6 border-b border-gray-100 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                    {currentEvaluation.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Bản Ghi Bất Biến (Read-only)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đã Phê Duyệt Kết Quả
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Phiếu Đánh Giá Ứng Viên: {currentEvaluation.candidateName}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-1 gap-x-6 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Vị trí: </span>
                    <strong className="text-slate-800">{currentEvaluation.jobTitle}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Phòng ban: </span>
                    <strong className="text-slate-800">{currentEvaluation.department}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Ngày phỏng vấn: </span>
                    <strong className="text-slate-800">{currentEvaluation.interviewDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Vòng đánh giá: </span>
                    <strong className="text-slate-800">{currentEvaluation.interviewRound}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Người đánh giá: </span>
                    <strong className="text-slate-800">{currentEvaluation.interviewerName}</strong> ({currentEvaluation.interviewerRole})
                  </div>
                  <div>
                    <span className="text-slate-400">Cấu hình snapshot: </span>
                    <strong className="text-blue-600">{currentEvaluation.snapshotVersion}</strong>
                  </div>
                </div>
              </div>

              {/* Box Điểm Tổng Tự Động Tính */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-center shrink-0 min-w-[200px] shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                  ĐIỂM TỔNG TỰ ĐỘNG TÍNH
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {evalScoreResult.weightedScoreOutOf5.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">/ 5.0</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
                  <span>Quy đổi: {evalScoreResult.scoreOutOf100}/100 điểm</span>
                </div>
                <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500 text-white shadow-xs">
                  Xếp loại: Xuất Sắc
                </span>
              </div>
            </div>

            {/* BẢNG ĐÁNH GIÁ DẠNG BẢNG GỒM CÁC TIÊU CHÍ, Ô CHẤM ĐIỂM (RADIO/SAO) & TEXTAREA NHẬN XÉT */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-4 min-w-[240px]">Tiêu Chí Năng Lực</th>
                    <th className="py-3 px-3 text-center w-28">Trọng Số</th>
                    <th className="py-3 px-4 text-center min-w-[170px]">Chấm Điểm (1 - 5)</th>
                    <th className="py-3 px-3 text-center w-28">Điểm Quy Đổi</th>
                    <th className="py-3 px-4 min-w-[260px]">Nhận Xét Của Phỏng Vấn Viên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentEvaluation.criteria.map((crit, index) => {
                    const weightedCriteriaScore = (crit.score * (crit.weight / 100)).toFixed(2);

                    return (
                      <tr key={crit.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* STT */}
                        <td className="py-4 px-3 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>

                        {/* Tiêu chí & Mô tả */}
                        <td className="py-4 px-4 align-top">
                          <strong className="text-sm font-extrabold text-slate-900 block">
                            {crit.name}
                          </strong>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {crit.description}
                          </p>
                        </td>

                        {/* Trọng số bất biến của phiếu */}
                        <td className="py-4 px-3 align-top text-center">
                          <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                            {crit.weight}%
                          </span>
                        </td>

                        {/* Ô chấm điểm (Radio/Ngôi sao thang 1-5) */}
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {/* Hiển thị ngôi sao trực quan */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((starValue) => {
                                const isFilled = starValue <= crit.score;
                                return (
                                  <Star
                                    key={starValue}
                                    className={`w-4 h-4 ${
                                      isFilled
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-200 fill-slate-100"
                                    }`}
                                  />
                                );
                              })}
                            </div>

                            {/* Ô Radio Buttons thang 1 - 5 (Read-only checked) */}
                            <div className="flex items-center gap-1.5 pt-1">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <label
                                  key={val}
                                  className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                                    crit.score === val
                                      ? "bg-[#4285F4] text-white shadow-2xs font-extrabold"
                                      : "bg-slate-100 text-slate-400 opacity-60"
                                  }`}
                                  title={`Điểm: ${val}/5`}
                                >
                                  <input
                                    type="radio"
                                    name={`score_${crit.id}`}
                                    value={val}
                                    checked={crit.score === val}
                                    disabled
                                    className="hidden"
                                    readOnly
                                  />
                                  <span>{val}</span>
                                </label>
                              ))}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600 mt-0.5">
                              {crit.score === 5
                                ? "Xuất sắc (5/5)"
                                : crit.score === 4
                                ? "Khá tốt (4/5)"
                                : crit.score === 3
                                ? "Đạt yêu cầu (3/5)"
                                : "Chưa đạt"}
                            </span>
                          </div>
                        </td>

                        {/* Điểm quy đổi: Score * Weight */}
                        <td className="py-4 px-3 align-top text-center font-mono">
                          <strong className="text-sm font-extrabold text-slate-800">
                            {weightedCriteriaScore}
                          </strong>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ({crit.score} × {crit.weight}%)
                          </span>
                        </td>

                        {/* Textarea nhận xét */}
                        <td className="py-4 px-4 align-top">
                          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                            <span className="font-semibold text-slate-900 block mb-1">
                              Đánh giá của phỏng vấn viên:
                            </span>
                            <p>{crit.comment}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Hàng Footer Tổng Điểm Tự Động Tính */}
                <tfoot>
                  <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-300">
                    <td colSpan={2} className="py-4 px-4 text-slate-800 uppercase tracking-wider text-xs">
                      TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ:
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className="text-xs font-black text-slate-900">
                        {evalScoreResult.totalWeight}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-slate-500">
                      Sum(Điểm × Trọng số)
                    </td>
                    <td className="py-4 px-3 text-center font-mono">
                      <strong className="text-base font-black text-[#4285F4]">
                        {evalScoreResult.weightedScoreOutOf5.toFixed(2)}
                      </strong>
                      <span className="text-[10px] text-slate-400 block">/ 5.0</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Quyết định:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Đề xuất Offer tuyển dụng
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Khối kết luận chung của hội đồng */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-800">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>KẾT LUẬN & ĐỀ XUẤT CỦA HỘI ĐỒNG PHỎNG VẤN</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                "{currentEvaluation.overallConclusion}"
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-blue-100/80">
                <span>
                  Chữ ký điện tử: <strong>{currentEvaluation.interviewerName}</strong>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  Hash xác thực bất biến: SHA256:{currentEvaluation.id}-9d82fa31-locked
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* NỘI DUNG TAB 2: CHECKLIST TIẾP NHẬN (ONBOARDING WORKFLOW) */}
      {/* ======================================================================= */}
      {activeMainTab === "onboarding" && (
        <div className="space-y-6 animate-fade-in">
          {/* Card Thông tin ứng viên & Thanh tiến độ Onboarding Realtime */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-100">
              {/* Chọn ứng viên onboarding */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    ỨNG VIÊN ĐANG ONBOARDING THEO PHÒNG BAN:
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {onboardingCandidates.map((cand) => {
                    const isSelected = cand.id === currentCandidate.id;
                    const cTotal = cand.tasks.length;
                    const cDone = cand.tasks.filter((t) => t.isCompleted).length;
                    const cPercent = Math.round((cDone / cTotal) * 100);

                    return (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => setSelectedCandidateId(cand.id)}
                        className={`px-4 py-2.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {cand.avatarText}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-slate-900">{cand.name}</span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full ${
                                cPercent === 100
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {cPercent === 100 ? "Đã Onboard" : "Chưa onboard"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                            {cand.jobTitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KHỐI TRẠNG THÁI ONBOARDING VÀ PROGRESS BAR REALTIME */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 min-w-[300px] sm:min-w-[340px] space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Tiến độ tiếp nhận:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-slate-900">{percentCompleted}%</span>
                    <span className="text-xs text-slate-400">
                      ({completedTasks}/{totalTasks} việc)
                    </span>
                  </div>
                </div>

                {/* THANH PROGRESS BAR REALTIME */}
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentCompleted === 100
                        ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                        : percentCompleted >= 75
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${percentCompleted}%` }}
                  />
                </div>

                {/* LOGIC TRẠNG THÁI: NẾU 75% VẪN LÀ "CHƯA ONBOARD", CHỈ 100% MỚI LÀ "ĐÃ ONBOARD" */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">Trạng thái nhân sự:</span>
                  <div>
                    {isOnboarded ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs animate-fade-in">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ĐÃ ONBOARD (Chính thức)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        CHƯA ONBOARD ({percentCompleted}%)
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  {isOnboarded
                    ? "✓ Đã hoàn tất 100% danh mục tiếp nhận. Nhân sự được tự động kích hoạt vào sơ đồ tổ chức."
                    : `⚠️ Tiến độ đạt ${percentCompleted}%. Hệ thống yêu cầu đủ 100% mới chuyển sang trạng thái Đã Onboard.`}
                </p>
              </div>
            </div>

            {/* Banner hướng dẫn test nhanh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Quy tắc tự động:</strong> Khi tick chọn task cuối cùng để đạt đúng <strong>100%</strong>, hệ thống sẽ tự động bật <strong>Toast Notification góc phải</strong> và chuyển trạng thái sang <strong>"Đã Onboard"</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetTo75Percent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Đặt lại mốc 75%</span>
              </button>
            </div>

            {/* DANH SÁCH TASK SINH TỰ ĐỘNG THEO MẪU PHÒNG BAN */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Danh Sách Công Việc Tiếp Nhận (Mẫu: {currentCandidate.department})</span>
                </h4>
                <span className="text-xs text-slate-500">
                  {completedTasks}/{totalTasks} hạng mục đã hoàn thành
                </span>
              </div>

              <div className="space-y-2.5">
                {currentCandidate.tasks.map((task, index) => {
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        task.isCompleted
                          ? "bg-emerald-50/40 border-emerald-200"
                          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs"
                      }`}
                    >
                      {/* Left: Checkbox & Task Info */}
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Custom Checkbox */}
                        <div className="pt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={task.isCompleted}
                            onChange={() => {}} // Đã xử lý ở onClick cấp container
                            className="w-5 h-5 rounded-lg text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                            <span
                              className={`text-sm font-extrabold ${
                                task.isCompleted
                                  ? "text-slate-600 line-through decoration-slate-400"
                                  : "text-slate-900"
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Người phụ trách & Hạn hoàn thành */}
                      <div className="flex flex-wrap sm:flex-col items-start sm:items-end justify-between gap-2 shrink-0 sm:min-w-[190px] border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span className="text-slate-400">Phụ trách:</span>
                          <strong className="text-slate-800">{task.assignee}</strong>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Hạn: {task.dueDate}</span>
                        </div>
                        <div>
                          {task.isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Đã hoàn tất
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                              <Clock className="w-3 h-3" />
                              Đang chờ xử lý
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRExecution;
