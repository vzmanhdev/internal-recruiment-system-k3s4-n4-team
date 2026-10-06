"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase,
  Users,
  UserCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  History,
  Plus,
  Search,
  Filter,
  X,
  Save,
  ArrowRight,
  Lock,
  Building2,
  Check,
  Sliders,
  ExternalLink,
  ChevronDown,
  Info,
} from "lucide-react";

// =========================================================================
// DATA MODELS & INTERFACES
// =========================================================================

export interface DepartmentHeadcountData {
  id: string;
  name: string;
  headcountBudget: number; // Chỉ tiêu được duyệt
  headcountCurrent: number; // Nhân sự hiện có
  remainingHeadcount: number; // Chỉ tiêu còn lại
  standardMaxSalary: number; // Mức lương tối đa chuẩn (VND)
}

export interface HandoverRecord {
  id: string;
  timestamp: string; // DD/MM/YYYY HH:mm
  fromRecruiter: string;
  toRecruiter: string;
  changedBy: string;
  reason: string;
}

export interface RequisitionItem {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  departmentName: string;
  targetCount: number; // Số lượng cần tuyển
  minSalary: number;
  maxSalary: number;
  primaryRecruiter: string; // Recruiter chính
  supportingRecruiters: string[]; // Recruiter hỗ trợ
  targetDate: string; // YYYY-MM-DD
  createdAt: string; // YYYY-MM-DD
  openDays: number; // Số ngày mở
  status: "open" | "draft" | "closed" | "on_hold" | "cancelled";
  closedReason?: "filled" | "on_hold" | "cancelled";
  pipeline_candidates: number; // Số ứng viên đang trong phễu
  isOverridden: boolean; // Ghi đè ngoại lệ
  overrideReason?: string; // Lý do ghi đè
  handoverHistory: HandoverRecord[];
}

// =========================================================================
// MOCK DATA DEPARTMENTS & HEADCOUNT (S2 & S3)
// =========================================================================

export const MOCK_DEPARTMENTS: DepartmentHeadcountData[] = [
  {
    id: "dept-dev",
    name: "Trung Tâm Phát Triển Phần Mềm (Software Center)",
    headcountBudget: 22,
    headcountCurrent: 18,
    remainingHeadcount: 4,
    standardMaxSalary: 35000000,
  },
  {
    id: "dept-infra",
    name: "Phòng Hạ Tầng & Bảo Mật Đám Mây (Cloud & DevOps)",
    headcountBudget: 8,
    headcountCurrent: 6,
    remainingHeadcount: 2,
    standardMaxSalary: 45000000,
  },
  {
    id: "dept-design",
    name: "Phòng Thiết Kế Trải Nghiệm (UI/UX)",
    headcountBudget: 5,
    headcountCurrent: 4,
    remainingHeadcount: 1,
    standardMaxSalary: 30000000,
  },
  {
    id: "dept-hr",
    name: "Phòng Nhân Sự & Đào Tạo (HR)",
    headcountBudget: 6,
    headcountCurrent: 6,
    remainingHeadcount: 0, // ĐÃ HẾT CHỈ TIÊU -> Test ngoại lệ Headcount
    standardMaxSalary: 28000000,
  },
  {
    id: "dept-sales",
    name: "Khối Kinh Doanh & Tiếp Thị (Sales & Marketing)",
    headcountBudget: 15,
    headcountCurrent: 12,
    remainingHeadcount: 3,
    standardMaxSalary: 25000000,
  },
];

export const MOCK_RECRUITERS = [
  "Nguyễn Tuyển Dụng",
  "Trần Thu Hà",
  "Lê Hoàng Yến",
  "Phạm Minh Tâm",
  "Đỗ Văn Lâm",
];

// Mock Requisitions ban đầu với đầy đủ trạng thái SLA (Còn hạn, Hôm nay, Quá hạn)
export const INITIAL_REQUISITIONS: RequisitionItem[] = [
  {
    id: "req-1",
    code: "REQ-2026-001",
    title: "Senior Backend Engineer (Python/FastAPI)",
    departmentId: "dept-dev",
    departmentName: "Trung Tâm Phát Triển Phần Mềm (Software Center)",
    targetCount: 2,
    minSalary: 25000000,
    maxSalary: 35000000,
    primaryRecruiter: "Nguyễn Tuyển Dụng",
    supportingRecruiters: ["Trần Thu Hà"],
    targetDate: "2026-10-18", // Tương lai -> Còn hạn
    createdAt: "2026-09-20",
    openDays: 17,
    status: "open",
    pipeline_candidates: 3, // Có 3 ứng viên đang trong phễu
    isOverridden: false,
    handoverHistory: [
      {
        id: "ho-1",
        timestamp: "22/09/2026 09:30",
        fromRecruiter: "Lê Hoàng Yến",
        toRecruiter: "Nguyễn Tuyển Dụng",
        changedBy: "Trưởng Phòng Nhân Sự",
        reason: "Chuyển giao vị trí kỹ thuật cấp cao cho Lead Technical Recruiter phụ trách.",
      },
    ],
  },
  {
    id: "req-2",
    code: "REQ-2026-002",
    title: "Lead DevOps & Cloud Security Architect",
    departmentId: "dept-infra",
    departmentName: "Phòng Hạ Tầng & Bảo Mật Đám Mây (Cloud & DevOps)",
    targetCount: 1,
    minSalary: 35000000,
    maxSalary: 45000000,
    primaryRecruiter: "Trần Thu Hà",
    supportingRecruiters: ["Nguyễn Tuyển Dụng", "Lê Hoàng Yến"],
    targetDate: "2026-10-07", // HÔM NAY -> days_left == 0 (Tô màu cam)
    createdAt: "2026-09-15",
    openDays: 22,
    status: "open",
    pipeline_candidates: 1,
    isOverridden: false,
    handoverHistory: [],
  },
  {
    id: "req-3",
    code: "REQ-2026-003",
    title: "Senior UI/UX Product Designer",
    departmentId: "dept-design",
    departmentName: "Phòng Thiết Kế Trải Nghiệm (UI/UX)",
    targetCount: 1,
    minSalary: 20000000,
    maxSalary: 32000000,
    primaryRecruiter: "Lê Hoàng Yến",
    supportingRecruiters: [],
    targetDate: "2026-10-02", // QUÁ HẠN -> days_left < 0 (Highlight đỏ nổi bật)
    createdAt: "2026-09-01",
    openDays: 36,
    status: "open",
    pipeline_candidates: 2,
    isOverridden: true,
    overrideReason: "Dự án cấp thiết cần designer có portfolio xuất sắc trong mảng Fintech.",
    handoverHistory: [],
  },
  {
    id: "req-4",
    code: "REQ-2026-004",
    title: "Chuyên viên Tuyển dụng IT (Technical Recruiter)",
    departmentId: "dept-hr",
    departmentName: "Phòng Nhân Sự & Đào Tạo (HR)",
    targetCount: 1,
    minSalary: 15000000,
    maxSalary: 25000000,
    primaryRecruiter: "Phạm Minh Tâm",
    supportingRecruiters: ["Trần Thu Hà"],
    targetDate: "2026-10-25", // Còn hạn
    createdAt: "2026-09-28",
    openDays: 9,
    status: "open",
    pipeline_candidates: 0, // Đã hết ứng viên trong phễu -> Đóng an toàn
    isOverridden: true,
    overrideReason: "Tuyển bổ sung thay thế nhân sự nghỉ thai sản ngoài kế hoạch đầu năm.",
    handoverHistory: [],
  },
];

// =========================================================================
// HELPER: TÍNH TOÁN SLA NGÀY CÒN LẠI KHÔNG BỊ LỆCH MÚI GIỜ (UTC NORMALIZE)
// =========================================================================
export function calculateDaysLeftUTC(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  let year = 0, month = 0, day = 0;
  if (targetDateStr.includes("/")) {
    const parts = targetDateStr.split("/");
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else {
    const parts = targetDateStr.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  }

  const targetUtc = Date.UTC(year, month, day);
  const now = new Date();
  // Sử dụng ngày lịch địa phương của trình duyệt để so sánh với ngày mục tiêu, chuyển đổi sang UTC midnight
  // để tránh lệch múi giờ hoặc sai số do giờ mùa hè (DST)
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = targetUtc - todayUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function RequisitionManagementView() {
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>(INITIAL_REQUISITIONS);

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterSlaStatus, setFilterSlaStatus] = useState<"all" | "ontrack" | "today" | "overdue">("all");
  const [filterJobStatus, setFilterJobStatus] = useState<string>("all");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // 1. MODAL TẠO MỚI / CHỈNH SỬA & KIỂM SOÁT HEADCOUNT
  // =========================================================================
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState<RequisitionItem | null>(null);

  // Form State
  const [formDeptId, setFormDeptId] = useState<string>(MOCK_DEPARTMENTS[0].id);
  const [formTitle, setFormTitle] = useState("");
  const [formTargetCount, setFormTargetCount] = useState<number>(1);
  const [formMinSalary, setFormMinSalary] = useState<number>(20000000);
  const [formMaxSalary, setFormMaxSalary] = useState<number>(30000000);
  const [formPrimaryRecruiter, setFormPrimaryRecruiter] = useState<string>(MOCK_RECRUITERS[0]);
  const [formSupportingRecruiters, setFormSupportingRecruiters] = useState<string[]>([]);
  const [formTargetDate, setFormTargetDate] = useState<string>("2026-10-30");

  // Checkbox đỏ & Textarea ghi đè ngoại lệ
  const [isOverrideChecked, setIsOverrideChecked] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  // Lấy dữ liệu headcount phòng ban đang chọn
  const selectedDeptData = useMemo(() => {
    return MOCK_DEPARTMENTS.find((d) => d.id === formDeptId) || MOCK_DEPARTMENTS[0];
  }, [formDeptId]);

  // Kiểm tra vi phạm Headcount hoặc Vượt dải lương chuẩn
  const isHeadcountExceeded = formTargetCount > selectedDeptData.remainingHeadcount;
  const isSalaryExceeded = formMaxSalary > selectedDeptData.standardMaxSalary;
  const hasException = isHeadcountExceeded || isSalaryExceeded;

  // Điều kiện được phép bấm Lưu Form:
  // - Nếu KHÔNG vượt ngoại lệ: Được phép lưu
  // - Nếu CÓ vượt ngoại lệ: BẮT BUỘC tick checkbox đỏ VÀ có lý do ghi đè
  const canSubmitForm = useMemo(() => {
    if (!formTitle.trim()) return false;
    if (formTargetCount <= 0) return false;
    if (formMinSalary >= formMaxSalary) return false;

    if (hasException) {
      return isOverrideChecked && overrideReason.trim().length > 0;
    }
    return true;
  }, [formTitle, formTargetCount, formMinSalary, formMaxSalary, hasException, isOverrideChecked, overrideReason]);

  const handleOpenCreateModal = () => {
    setEditingRequisition(null);
    setFormDeptId(MOCK_DEPARTMENTS[0].id);
    setFormTitle("");
    setFormTargetCount(1);
    setFormMinSalary(20000000);
    setFormMaxSalary(30000000);
    setFormPrimaryRecruiter(MOCK_RECRUITERS[0]);
    setFormSupportingRecruiters([]);
    setFormTargetDate("2026-10-30");
    setIsOverrideChecked(false);
    setOverrideReason("");
    setIsFormModalOpen(true);
  };

  const handleSaveRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitForm) {
      alert("Vui lòng hoàn tất đầy đủ thông tin hoặc xác nhận ghi đè ngoại lệ kèm lý do!");
      return;
    }

    const newReq: RequisitionItem = {
      id: `req-${Date.now()}`,
      code: `REQ-2026-${String(requisitions.length + 1).padStart(3, "0")}`,
      title: formTitle.trim(),
      departmentId: selectedDeptData.id,
      departmentName: selectedDeptData.name,
      targetCount: formTargetCount,
      minSalary: formMinSalary,
      maxSalary: formMaxSalary,
      primaryRecruiter: formPrimaryRecruiter,
      supportingRecruiters: formSupportingRecruiters,
      targetDate: formTargetDate,
      createdAt: "2026-10-07",
      openDays: 0,
      status: "open",
      pipeline_candidates: 0,
      isOverridden: hasException,
      overrideReason: hasException ? overrideReason.trim() : undefined,
      handoverHistory: [],
    };

    setRequisitions((prev) => [newReq, ...prev]);
    setIsFormModalOpen(false);
    showToast(`Đã tạo thành công yêu cầu tuyển dụng "${newReq.code}"!`);
  };

  // =========================================================================
  // 2. MODAL PHÂN CÔNG RECRUITER & XEM LỊCH SỬ BÀN GIAO
  // =========================================================================
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedReqForHandover, setSelectedReqForHandover] = useState<RequisitionItem | null>(null);
  const [newPrimaryRecruiter, setNewPrimaryRecruiter] = useState("");
  const [newSupportingRecruiters, setNewSupportingRecruiters] = useState<string[]>([]);
  const [handoverReasonInput, setHandoverReasonInput] = useState("");

  const handleOpenHandoverModal = (req: RequisitionItem) => {
    setSelectedReqForHandover(req);
    setNewPrimaryRecruiter(req.primaryRecruiter);
    setNewSupportingRecruiters([...req.supportingRecruiters]);
    setHandoverReasonInput("");
    setIsHandoverModalOpen(true);
  };

  const handleSaveHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForHandover) return;

    const isPrimaryChanged = newPrimaryRecruiter !== selectedReqForHandover.primaryRecruiter;
    if (isPrimaryChanged && !handoverReasonInput.trim()) {
      alert("Vui lòng nhập lý do bàn giao người phụ trách chính!");
      return;
    }

    const newHistoryRecord: HandoverRecord | null = isPrimaryChanged
      ? {
          id: `ho-${Date.now()}`,
          timestamp: "07/10/2026 10:45",
          fromRecruiter: selectedReqForHandover.primaryRecruiter,
          toRecruiter: newPrimaryRecruiter,
          changedBy: "Trưởng Phòng Nhân Sự",
          reason: handoverReasonInput.trim() || "Cân đối lại khối lượng phân công tuyển dụng.",
        }
      : null;

    setRequisitions((prev) =>
      prev.map((item) => {
        if (item.id === selectedReqForHandover.id) {
          return {
            ...item,
            primaryRecruiter: newPrimaryRecruiter,
            supportingRecruiters: newSupportingRecruiters,
            handoverHistory: newHistoryRecord
              ? [newHistoryRecord, ...item.handoverHistory]
              : item.handoverHistory,
          };
        }
        return item;
      })
    );

    setIsHandoverModalOpen(false);
    showToast(`Đã cập nhật phân công phụ trách cho yêu cầu "${selectedReqForHandover.code}"!`);
  };

  const toggleSupportingRecruiter = (rec: string) => {
    setNewSupportingRecruiters((prev) =>
      prev.includes(rec) ? prev.filter((r) => r !== rec) : [...prev, rec]
    );
  };

  // =========================================================================
  // 3. MODAL ĐÓNG YÊU CẦU (CLOSE JOB & PIPELINE WARNING)
  // =========================================================================
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedReqForClose, setSelectedReqForClose] = useState<RequisitionItem | null>(null);
  const [closeReason, setCloseReason] = useState<"filled" | "on_hold" | "cancelled">("filled");
  const [isConfirmPipelineClear, setIsConfirmPipelineClear] = useState(false);

  const handleOpenCloseModal = (req: RequisitionItem) => {
    setSelectedReqForClose(req);
    setCloseReason("filled");
    setIsConfirmPipelineClear(false);
    setIsCloseModalOpen(true);
  };

  const handleExecuteCloseJob = () => {
    if (!selectedReqForClose) return;

    // Nếu còn ứng viên trong pipeline, bắt buộc tick xác nhận
    if (selectedReqForClose.pipeline_candidates > 0 && !isConfirmPipelineClear) {
      alert("Vui lòng xác nhận phương án giải quyết các ứng viên còn kẹt trong pipeline trước khi đóng!");
      return;
    }

    setRequisitions((prev) =>
      prev.map((item) => {
        if (item.id === selectedReqForClose.id) {
          return {
            ...item,
            status: closeReason === "on_hold" ? "on_hold" : "closed",
            closedReason: closeReason,
          };
        }
        return item;
      })
    );

    setIsCloseModalOpen(false);
    showToast(
      `Đã đóng yêu cầu "${selectedReqForClose.code}". Hệ thống đã tự động gỡ tin tuyển dụng trên các cổng thông tin!`
    );
  };

  // =========================================================================
  // FILTERING & METRICS COMPUTATION
  // =========================================================================
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchSearch =
        req.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        req.code.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        req.primaryRecruiter.toLowerCase().includes(searchKeyword.toLowerCase());

      const matchDept = filterDepartment === "all" || req.departmentId === filterDepartment;
      const matchStatus = filterJobStatus === "all" || req.status === filterJobStatus;

      const daysLeft = calculateDaysLeftUTC(req.targetDate);
      let matchSla = true;
      if (filterSlaStatus === "ontrack") matchSla = daysLeft > 0;
      else if (filterSlaStatus === "today") matchSla = daysLeft === 0;
      else if (filterSlaStatus === "overdue") matchSla = daysLeft < 0;

      return matchSearch && matchDept && matchStatus && matchSla;
    });
  }, [requisitions, searchKeyword, filterDepartment, filterJobStatus, filterSlaStatus]);

  // SLA KPI Metrics
  const slaMetrics = useMemo(() => {
    let ontrack = 0;
    let dueToday = 0;
    let overdue = 0;
    let openCount = 0;

    requisitions.forEach((r) => {
      if (r.status === "open") {
        openCount++;
        const dl = calculateDaysLeftUTC(r.targetDate);
        if (dl > 0) ontrack++;
        else if (dl === 0) dueToday++;
        else overdue++;
      }
    });

    return { ontrack, dueToday, overdue, openCount };
  }, [requisitions]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-medium shadow-2xl animate-fade-in border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER KHU VỰC NỘI DUNG */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            <span>QUẢN TRỊ TUYỂN DỤNG (REQUISITION WORKSPACE)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản Lý Yêu Cầu Tuyển Dụng & Phân Công
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm soát chỉ tiêu Headcount, phân công Recruiter chịu trách nhiệm và giám sát SLA thời hạn tuyển dụng
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo Yêu Cầu Mới</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. THẺ CHỈ SỐ SLA NHANH (KPI METRICS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng yêu cầu đang mở */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>YÊU CẦU ĐANG MỞ</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{slaMetrics.openCount}</div>
          <p className="text-[11px] text-slate-400">Đang tiếp nhận hồ sơ tuyển dụng</p>
        </div>

        {/* Card 2: Còn trong hạn SLA */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>TRONG HẠN SLA</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{slaMetrics.ontrack}</div>
          <p className="text-[11px] text-slate-400">Tiến độ tuyển dụng đúng kế hoạch</p>
        </div>

        {/* Card 3: Đến hạn hôm nay */}
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-1 bg-amber-50/20">
          <div className="flex items-center justify-between text-xs font-bold text-amber-700">
            <span>ĐẾN HẠN HÔM NAY</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-800">{slaMetrics.dueToday}</div>
          <p className="text-[11px] text-amber-600 font-semibold">Cần đôn đốc chốt ứng viên ngay</p>
        </div>

        {/* Card 4: Quá hạn SLA */}
        <div className="bg-white p-5 rounded-3xl border border-rose-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-1 bg-rose-50/20">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600">
            <span>QUÁ HẠN SLA</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700">{slaMetrics.overdue}</div>
          <p className="text-[11px] text-rose-600 font-semibold">Cần can thiệp gỡ nghẽn phễu</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BẢNG DANH SÁCH YÊU CẦU & BỘ LỌC */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
        {/* Filter Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo chức danh, mã REQ, recruiter..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
              />
            </div>

            {/* Filter Phòng ban */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
            >
              <option value="all">Tất cả phòng ban</option>
              {MOCK_DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Filter Trạng thái SLA */}
            <select
              value={filterSlaStatus}
              onChange={(e) => setFilterSlaStatus(e.target.value as any)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
            >
              <option value="all">Tất cả SLA</option>
              <option value="ontrack">Còn trong hạn</option>
              <option value="today">Hôm nay (Đến hạn)</option>
              <option value="overdue">Quá hạn SLA</option>
            </select>

            {/* Filter Trạng thái Job */}
            <select
              value={filterJobStatus}
              onChange={(e) => setFilterJobStatus(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="open">Đang mở tuyển</option>
              <option value="closed">Đã đóng</option>
              <option value="on_hold">Tạm dừng</option>
            </select>
          </div>

          {(searchKeyword || filterDepartment !== "all" || filterSlaStatus !== "all" || filterJobStatus !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword("");
                setFilterDepartment("all");
                setFilterSlaStatus("all");
                setFilterJobStatus("all");
              }}
              className="text-xs text-[#4285F4] font-bold hover:underline self-end md:self-auto cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Requisitions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4 w-28">Mã REQ</th>
                <th className="py-3.5 px-4 min-w-[240px]">Chức danh & Phòng ban</th>
                <th className="py-3.5 px-4 min-w-[180px]">Recruiter Phụ Trách</th>
                <th className="py-3.5 px-4 text-center">Chỉ tiêu</th>
                <th className="py-3.5 px-4 text-center min-w-[150px]">SLA Thời Gian</th>
                <th className="py-3.5 px-4 text-center">Pipeline</th>
                <th className="py-3.5 px-4 text-center w-36">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy yêu cầu tuyển dụng phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredRequisitions.map((req) => {
                  const daysLeft = calculateDaysLeftUTC(req.targetDate);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Cột 1: Mã REQ */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-slate-800 block">
                          {req.code}
                        </span>
                        {req.isOverridden && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            Ghi đè
                          </span>
                        )}
                      </td>

                      {/* Cột 2: Chức danh & Phòng ban */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 leading-snug">
                          {req.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {req.departmentName}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Lương: {(req.minSalary / 1000000).toFixed(0)} - {(req.maxSalary / 1000000).toFixed(0)} triệu VNĐ
                        </p>
                      </td>

                      {/* Cột 3: Recruiter Phụ trách & Lịch sử bàn giao */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs">
                            {req.primaryRecruiter}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenHandoverModal(req)}
                            className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Đổi phụ trách / Xem lịch sử bàn giao"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {req.supportingRecruiters.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <span>Hỗ trợ:</span>
                            <span className="font-medium text-slate-700">
                              {req.supportingRecruiters.join(", ")}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Cột 4: Chỉ tiêu tuyển */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-800 text-xs">
                          {req.targetCount} vị trí
                        </span>
                      </td>

                      {/* Cột 5: SLA Thời Gian (Xử lý không lệch múi giờ UTC) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-[11px] text-slate-500">
                          Mở {req.openDays} ngày
                        </div>
                        {/* Highlight SLA Theo 3 mức: >0 Còn hạn, ==0 Hôm nay (Cam), <0 Quá hạn (Đỏ) */}
                        <div className="mt-1">
                          {daysLeft > 0 && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              Còn {daysLeft} ngày
                            </span>
                          )}
                          {daysLeft === 0 && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
                              Hôm nay (Đến hạn)
                            </span>
                          )}
                          {daysLeft < 0 && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 border border-rose-300 shadow-xs animate-pulse">
                              Trễ {Math.abs(daysLeft)} ngày
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 6: Pipeline candidates */}
                      <td className="py-3.5 px-4 text-center">
                        {req.pipeline_candidates > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Users className="w-3 h-3" />
                            <span>{req.pipeline_candidates}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">0</span>
                        )}
                      </td>

                      {/* Cột 7: Thao tác (Đóng Job & Phân công) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {req.status === "open" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCloseModal(req)}
                              className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                              title="Đóng yêu cầu tuyển dụng này"
                            >
                              Đóng Job
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              {req.closedReason === "filled"
                                ? "Đã tuyển đủ"
                                : req.closedReason === "on_hold"
                                ? "Tạm dừng"
                                : "Đã hủy"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO MỚI YÊU CẦU & KIỂM SOÁT HEADCOUNT / OVERRIDE EXCEPTION */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Tạo Yêu Cầu Tuyển Dụng Mới (Job Requisition)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động kiểm soát định biên headcount và dải lương ngân sách theo phòng ban
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRequisition} className="space-y-5">
              {/* Chọn Phòng ban */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phòng ban tuyển dụng *
                </label>
                <select
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                >
                  {MOCK_DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* KHỐI HIỂN THỊ CHỈ TIÊU HEADCOUNT CÒN LẠI CỦA PHÒNG BAN ĐƯỢC CHỌN */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-xl bg-white shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Chỉ tiêu duyệt</span>
                  <strong className="text-sm font-extrabold text-slate-800">{selectedDeptData.headcountBudget}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Hiện có</span>
                  <strong className="text-sm font-extrabold text-slate-800">{selectedDeptData.headcountCurrent}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white shadow-2xs">
                  <span className="text-[10px] text-blue-600 font-bold block uppercase">Headcount Còn Lại</span>
                  <strong className={`text-base font-black ${selectedDeptData.remainingHeadcount <= 0 ? "text-rose-600" : "text-blue-600"}`}>
                    {selectedDeptData.remainingHeadcount} chỉ tiêu
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Lương trần chuẩn</span>
                  <strong className="text-xs font-extrabold text-slate-700">
                    {(selectedDeptData.standardMaxSalary / 1000000).toFixed(0)} triệu
                  </strong>
                </div>
              </div>

              {/* Tên vị trí tuyển dụng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên vị trí tuyển dụng (Job Title) *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Senior Backend Engineer (Python/FastAPI)"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              {/* Số lượng tuyển & Lương Min - Max */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số lượng tuyển *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formTargetCount}
                    onChange={(e) => setFormTargetCount(Number(e.target.value) || 1)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lương tối thiểu (VND)
                  </label>
                  <input
                    type="number"
                    step={1000000}
                    value={formMinSalary}
                    onChange={(e) => setFormMinSalary(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lương tối đa (VND) *
                  </label>
                  <input
                    type="number"
                    step={1000000}
                    value={formMaxSalary}
                    onChange={(e) => setFormMaxSalary(Number(e.target.value) || 0)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phân công Recruiter & Hạn chót */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Recruiter Chính phụ trách *
                  </label>
                  <select
                    value={formPrimaryRecruiter}
                    onChange={(e) => setFormPrimaryRecruiter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800"
                  >
                    {MOCK_RECRUITERS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hạn chót tuyển dụng (Target SLA) *
                  </label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* =================================================================== */}
              {/* LOGIC CẢNH BÁO GHI ĐÈ NGOẠI LỆ (VƯỢT HEADCOUNT HOẶC VƯỢT DẢI LƯƠNG) */}
              {/* =================================================================== */}
              {hasException && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/80 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-rose-800">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block text-rose-900 font-extrabold">
                        CẢNH BÁO VI PHẠM ĐỊNH BIÊN / NGÂN SÁCH CHUẨN:
                      </strong>
                      {isHeadcountExceeded && (
                        <p>
                          • Số lượng tuyển ({formTargetCount}) vượt quá chỉ tiêu Headcount còn lại của phòng ban ({selectedDeptData.remainingHeadcount} chỉ tiêu).
                        </p>
                      )}
                      {isSalaryExceeded && (
                        <p>
                          • Mức lương tối đa ({formMaxSalary.toLocaleString()} VNĐ) vượt quá khung trần chuẩn của vị trí ({selectedDeptData.standardMaxSalary.toLocaleString()} VNĐ).
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Checkbox Đỏ: Xác nhận ghi đè ngoại lệ */}
                  <div className="pt-2 border-t border-rose-200/80">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isOverrideChecked}
                        onChange={(e) => setIsOverrideChecked(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-rose-900">
                        Xác nhận ghi đè ngoại lệ (Dành cho Trưởng phòng)
                      </span>
                    </label>
                  </div>

                  {/* Khi tick vào: Mở textarea bắt buộc nhập lý do */}
                  {isOverrideChecked && (
                    <div className="space-y-1 pt-1 animate-fade-in">
                      <label className="block text-[11px] font-bold text-rose-800 uppercase">
                        Lý do ghi đè ngoại lệ (Bắt buộc) *
                      </label>
                      <textarea
                        rows={2}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Nhập lý do phê duyệt vượt ngân sách / headcount (VD: Dự án trọng điểm cấp bách, cần chuyên gia đặc thù...)"
                        required
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Nút hành động */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!canSubmitForm}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-md ${
                    canSubmitForm
                      ? "bg-[#4285F4] hover:bg-blue-600 text-white shadow-blue-500/20 cursor-pointer"
                      : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                  }`}
                  title={
                    canSubmitForm
                      ? "Đủ điều kiện lưu yêu cầu"
                      : "Vui lòng nhập đầy đủ hoặc xác nhận ghi đè ngoại lệ kèm lý do"
                  }
                >
                  Tạo Yêu Cầu Tuyển Dụng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PHÂN CÔNG RECRUITER & XEM LỊCH SỬ BÀN GIAO */}
      {/* ========================================================================= */}
      {isHandoverModalOpen && selectedReqForHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                  {selectedReqForHandover.code}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Phân Công Phụ Trách & Lịch Sử Bàn Giao
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHandoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHandover} className="space-y-5">
              {/* Recruiter Chính (1 người) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recruiter Chính phụ trách (Chịu trách nhiệm SLA) *
                </label>
                <select
                  value={newPrimaryRecruiter}
                  onChange={(e) => setNewPrimaryRecruiter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800"
                >
                  {MOCK_RECRUITERS.map((r) => (
                    <option key={r} value={r}>
                      {r} {r === selectedReqForHandover.primaryRecruiter ? "(Hiện tại)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-select Recruiter Hỗ Trợ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recruiter Hỗ trợ (Tùy chọn)
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {MOCK_RECRUITERS.filter((r) => r !== newPrimaryRecruiter).map((r) => {
                      const isSelected = newSupportingRecruiters.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleSupportingRecruiter(r)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          <span>{r}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Lý do bàn giao (Nếu đổi Recruiter chính) */}
              {newPrimaryRecruiter !== selectedReqForHandover.primaryRecruiter && (
                <div className="space-y-1.5 p-4 rounded-2xl bg-amber-50 border border-amber-200 animate-fade-in">
                  <label className="block text-xs font-bold text-amber-900">
                    Lý do bàn giao người phụ trách chính *
                  </label>
                  <textarea
                    rows={2}
                    value={handoverReasonInput}
                    onChange={(e) => setHandoverReasonInput(e.target.value)}
                    placeholder="VD: Cân đối lại khối lượng công việc, chuyên viên chuyển sang dự án mới..."
                    required
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}

              {/* KHU VỰC XEM LỊCH SỬ BÀN GIAO */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Nhật Ký Chuyển Giao Công Việc</span>
                </div>

                {selectedReqForHandover.handoverHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Chưa có lịch sử chuyển giao nào cho yêu cầu tuyển dụng này.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                    {selectedReqForHandover.handoverHistory.map((ho) => (
                      <div
                        key={ho.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>{ho.timestamp}</span>
                          <span className="font-semibold text-slate-700">Thực hiện: {ho.changedBy}</span>
                        </div>
                        <div className="font-bold text-slate-800">
                          {ho.fromRecruiter} → <span className="text-blue-600">{ho.toRecruiter}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Lý do: {ho.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nút hành động */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  Lưu Phân Công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ĐÓNG YÊU CẦU & CẢNH BÁO PIPELINE CANDIDATES */}
      {/* ========================================================================= */}
      {isCloseModalOpen && selectedReqForClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  !
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Xác Nhận Đóng Yêu Cầu Tuyển Dụng
                  </h3>
                  <p className="text-xs text-slate-500">[{selectedReqForClose.code}] - {selectedReqForClose.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Chọn 1 trong 3 lý do đóng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chọn lý do đóng vị trí *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="close_reason"
                      checked={closeReason === "filled"}
                      onChange={() => setCloseReason("filled")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-800 block">1. Đã tuyển đủ</strong>
                      <span className="text-[11px] text-slate-500">Đã chốt xong toàn bộ chỉ tiêu ứng viên mong muốn.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="close_reason"
                      checked={closeReason === "on_hold"}
                      onChange={() => setCloseReason("on_hold")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-800 block">2. Tạm dừng (On-hold)</strong>
                      <span className="text-[11px] text-slate-500">Tạm hoãn đợt tuyển do thay đổi kế hoạch dự án.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="close_reason"
                      checked={closeReason === "cancelled"}
                      onChange={() => setCloseReason("cancelled")}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-xs font-bold text-slate-800 block">3. Hủy bỏ (Cancelled)</strong>
                      <span className="text-[11px] text-slate-500">Hủy yêu cầu tuyển dụng này vĩnh viễn.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* DÒNG TEXT GHI CHÚ BẮT BUỘC: TỰ ĐỘNG GỠ TIN TUYỂN DỤNG ĐANG ĐĂNG */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Hệ thống tự động:</strong> Khi xác nhận đóng, hệ thống sẽ tự động gỡ tin tuyển dụng đang đăng trên tất cả các kênh tuyển dụng nội bộ và website công ty.
                </span>
              </div>

              {/* CẢNH BÁO PIPELINE CANDIDATES (NẾU > 0) */}
              {selectedReqForClose.pipeline_candidates > 0 ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-rose-800 font-bold">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-rose-900 block font-extrabold">
                        CẢNH BÁO PHỄU ỨNG VIÊN (PIPELINE):
                      </span>
                      Còn <span className="text-rose-700 text-sm font-black underline">{selectedReqForClose.pipeline_candidates}</span> ứng viên đang trong quá trình xử lý phỏng vấn/xét duyệt. Cần giải quyết trước khi đóng!
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-200">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isConfirmPipelineClear}
                        onChange={(e) => setIsConfirmPipelineClear(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-rose-900">
                        Xác nhận đã giải quyết xong ứng viên & đồng ý đóng vị trí
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Phễu ứng viên đã sạch (0 ứng viên đang kẹt). Đảm bảo đóng an toàn.</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsCloseModalOpen(false)}
                className="px-4 py-2 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteCloseJob}
                disabled={selectedReqForClose.pipeline_candidates > 0 && !isConfirmPipelineClear}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md ${
                  selectedReqForClose.pipeline_candidates === 0 || isConfirmPipelineClear
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer"
                    : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                }`}
              >
                Xác Nhận Đóng Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequisitionManagementView;
