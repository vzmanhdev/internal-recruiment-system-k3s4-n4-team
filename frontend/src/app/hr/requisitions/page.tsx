"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pagination } from "@/components/ui/Pagination";
import { requisitionService, type RequisitionItem } from "@/services/requisition.service";
import { masterDataService } from "@/services/master-data.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";
import { getSearchScore } from "@/utils/vietnameseSearch";
import { SearchAutocompleteInput } from "@/components/ui/SearchAutocompleteInput";
import Link from "next/link";
import {
  FileCheck,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Clock,
  Users,
  UserPlus,
  PauseCircle,
  PlayCircle,
  XCircle,
  CheckCircle2,
  Eye,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Building2,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  GitBranch,
  Layers,
  Sparkles,
  Check,
  X,
  UserCheck,
  ShieldCheck,
  Briefcase,
  HelpCircle,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Info,
} from "lucide-react";

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export interface Requisition {
  id: string;
  code: string;
  title: string;
  department: string;
  headcount: number;
  salaryMin: number;
  salaryMax: number;
  salaryRangeDisplay: string;
  targetDate: string;
  status: "pending_approval" | "in_progress" | "paused" | "cancelled" | "completed";
  rawStatus: string;
  slaStatus: "normal" | "warning" | "overdue";
  delayDays: number;
  pendingSinceDays: number; // Số ngày bị kẹt chờ duyệt
  primaryRecruiter: string;
  primaryRecruiterId?: number;
  primaryRecruiterAccountStatus?: string;
  createdAt: string;
  createdDateRaw: string;
  daysOpen: number;
  daysRemaining: number | null;
  isOverdue: boolean;
  urgency: "Bình thường" | "Khẩn cấp" | "Chiến lược";
  needsHandover?: boolean;
  handoverReasonFlag?: string | null;
  recruiters?: Array<{ recruiter_id: number; full_name: string; assignment_type: string; account_status?: string; is_active?: boolean }>;
}

export interface DepartmentBudget {
  id: string;
  departmentName: string;
  code: string;
  managerName: string;
  allocatedHeadcount: number; // Định biên được duyệt
  currentStaff: number; // Nhân sự hiện tại
  openRequisitionsCount: number; // Số nhân sự đang tuyển trong các REQ
  monthlyBudgetVND: number;
  currentSalaryUsedVND: number;
}

export interface WorkflowRule {
  id: string;
  name: string;
  conditionDescription: string;
  salaryThresholdMax?: number;
  isHeadcountExceededTrigger: boolean;
  steps: {
    stepNumber: number;
    approverRole: string;
    approverName: string;
    slaHours: number;
  }[];
}

// =============================================================================
// REAL REQUISITIONS / BUDGETS / APPROVAL FLOWS -> PAGE MODELS
// =============================================================================

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDateVN(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const UNASSIGNED = "Chưa phân công";
// an approval waiting longer than this is flagged on this board (same threshold as the overdue filter)
const APPROVAL_REMINDER_DAYS = 3;
const DAY_MS = 86_400_000;
const STEP_ROLE: Record<string, string> = {
  manager: "Trưởng phòng Chuyên môn (Hiring Manager)", hr: "Trưởng phòng Nhân sự (HR Manager)", executive: "Ban Giám Đốc (Executive)",
};

function toStatus(st: string): Requisition["status"] {
  if (st === "approved") return "in_progress";
  if (st === "paused") return "paused";
  if (st === "filled") return "completed";
  if (st === "cancelled" || st === "rejected") return "cancelled";
  return "pending_approval"; // draft, changes_requested, pending_*
}

function toRequisition(r: RequisitionItem & { updated_at?: string | null; days_open?: number | null; days_remaining?: number | null; priority?: string | null; is_overdue?: boolean }, now: number): Requisition {
  const status = toStatus(r.status);
  const since = r.updated_at || r.created_at;
  const pendingSinceDays = status === "pending_approval" && since ? Math.floor((now - new Date(since).getTime()) / DAY_MS) : 0;
  const daysOpen = r.days_open !== undefined && r.days_open !== null
    ? r.days_open
    : r.created_at ? Math.max(0, Math.floor((now - new Date(r.created_at).getTime()) / DAY_MS)) : 0;
  const remaining = r.days_remaining !== undefined ? r.days_remaining : null;
  const isOverdue = Boolean(r.is_overdue || (remaining !== null && remaining < 0 && status !== "completed" && status !== "cancelled"));
  const fmt = (n?: number | null) => (n ? `${Math.round(n / 1_000_000)}` : "?");
  const primary = (r.recruiters || []).find((x) => x.assignment_type === "primary") || (r.recruiters || [])[0];
  return {
    id: String(r.id),
    code: r.code,
    title: r.title,
    department: r.department_name || "",
    headcount: r.quantity,
    salaryMin: r.min_salary || 0,
    salaryMax: r.max_salary || 0,
    salaryRangeDisplay: r.is_salary_negotiable ? "Thỏa thuận" : `${fmt(r.min_salary)} - ${fmt(r.max_salary)} Triệu`,
    targetDate: r.target_onboard_date || "",
    status,
    rawStatus: r.status,
    slaStatus: isOverdue ? "overdue" : remaining !== null && remaining <= 7 ? "warning" : "normal",
    delayDays: remaining !== null && remaining < 0 ? -remaining : 0,
    pendingSinceDays,
    daysOpen,
    daysRemaining: remaining,
    isOverdue,
    primaryRecruiter: primary?.full_name || UNASSIGNED,
    primaryRecruiterId: primary?.recruiter_id,
    primaryRecruiterAccountStatus: primary?.account_status,
    createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : "",
    createdDateRaw: r.created_at ? r.created_at.slice(0, 10) : "",
    urgency: r.priority === "urgent" || r.priority === "high" ? "Khẩn cấp" : r.priority === "strategic" ? "Chiến lược" : "Bình thường",
    needsHandover: r.needs_handover,
    handoverReasonFlag: r.handover_reason_flag,
    recruiters: r.recruiters,
  };
}

async function loadBoard() {
  const year = new Date().getFullYear();
  const [reqs, depts, budgets, flows, recruiters, handoverHistory] = await Promise.all([
    requisitionService.getRequisitions(),
    masterDataService.departments(false) as Promise<Array<{ id: number; name: string; code: string; head_name?: string | null; member_count?: number }>>,
    masterDataService.headcounts().catch(() => []),
    masterDataService.approvalFlows().catch(() => []),
    masterDataService.people("recruiter").catch(() => []),
    requisitionService.getHandoverHistory().catch(() => []),
  ]);
  const open = new Set(["pending_manager", "pending_hr", "pending_executive", "approved"]);
  const departmentBudgets: DepartmentBudget[] = budgets.filter((b) => b.year === year && b.budget_quantity > 0).map((b) => {
    const d = depts.find((x) => x.id === b.department_id);
    const deptReqs = reqs.filter((r) => r.department_id === b.department_id && open.has(r.status));
    return {
      id: `bgt-${b.id}`,
      departmentName: d?.name || `#${b.department_id}`,
      code: d?.code || "",
      managerName: d?.head_name || "Chưa gán",
      allocatedHeadcount: b.budget_quantity,
      currentStaff: d?.member_count || 0,
      openRequisitionsCount: deptReqs.reduce((n, r) => n + (r.quantity || 0), 0),
      // salary cost range of the open requisitions (approved bands)
      monthlyBudgetVND: deptReqs.reduce((n, r) => n + (r.max_salary || 0) * (r.quantity || 0), 0),
      currentSalaryUsedVND: deptReqs.reduce((n, r) => n + (r.min_salary || 0) * (r.quantity || 0), 0),
    };
  });
  const workflowRules: WorkflowRule[] = flows.filter((f) => f.status === "active").map((f) => {
    const dept = depts.find((d) => d.id === f.department_id)?.name;
    return {
      id: `rule-${f.id}`,
      name: f.name,
      conditionDescription: `Áp dụng khi mức lương đề xuất từ ${Math.round(f.min_salary_threshold / 1_000_000)} đến ${Math.round(f.max_salary_threshold / 1_000_000)} Triệu VNĐ${dept ? ` — phòng ban ${dept}` : " — toàn doanh nghiệp"}`,
      salaryThresholdMax: f.max_salary_threshold,
      isHeadcountExceededTrigger: false,
      steps: f.steps.map((code, i) => ({ stepNumber: i + 1, approverRole: STEP_ROLE[code] || code, approverName: "Theo phân quyền", slaHours: APPROVAL_REMINDER_DAYS * 24 })),
    };
  });
  return { reqs, depts, departmentBudgets, workflowRules, recruiters, handoverHistory, now: Date.now() };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HRRequisitionsPage() {
  const [activeTab, setActiveTab] = useState<"requisitions" | "headcount" | "handover">("requisitions");

  // Requisitions data
  const { data: board, error, loading, reload } = useApiData(loadBoard, []);
  const requisitions: Requisition[] = useMemo(() => (board?.reqs || []).map((r) => toRequisition(r, board?.now || 0)), [board]);
  const RECRUITER_LIST = useMemo(() => [...(board?.recruiters || []).map((u) => u.full_name), UNASSIGNED], [board]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isOverdueOnly, setIsOverdueOnly] = useState<boolean>(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Headcount data
  const budgets = board?.departmentBudgets || [];

  // Workflow data & modal
  const workflowRules = board?.workflowRules || [];
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  // Status Change Modal (Tạm dừng / Hủy / Đổi trạng thái)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedReqForStatus, setSelectedReqForStatus] = useState<Requisition | null>(null);
  const [targetStatus, setTargetStatus] = useState<Requisition["status"]>("paused");
  const [statusReason, setStatusReason] = useState("");

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Requisition Handover Modal (S1-10 & S3-06)
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverReq, setHandoverReq] = useState<Requisition | null>(null);
  const [handoverRecruiterId, setHandoverRecruiterId] = useState<number | null>(null);
  const [handoverReason, setHandoverReason] = useState("");
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  const openHandoverModal = (req: Requisition) => {
    setHandoverReq(req);
    setHandoverReason(req.handoverReasonFlag || "");
    const firstActiveRecruiter = board?.recruiters.find((u) => u.id !== req.primaryRecruiterId);
    setHandoverRecruiterId(firstActiveRecruiter ? firstActiveRecruiter.id : board?.recruiters[0]?.id || null);
    setIsHandoverModalOpen(true);
  };

  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverReq || !handoverRecruiterId) {
      showToast("Vui lòng chọn Recruiter tiếp nhận bàn giao!", "error");
      return;
    }
    if (!handoverReason.trim()) {
      showToast("Bắt buộc nhập lý do bàn giao (S1-10 & S3-06)!", "error");
      return;
    }
    setIsSubmittingHandover(true);
    try {
      await requisitionService.assignRecruiter(
        Number(handoverReq.id),
        handoverRecruiterId,
        "primary",
        handoverReason.trim()
      );
      showToast(`Đã bàn giao vị trí "${handoverReq.code}" thành công!`, "success");
      setIsHandoverModalOpen(false);
      setHandoverReq(null);
      setHandoverReason("");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thể bàn giao vị trí tuyển dụng.", "error");
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  // Handle assign recruiter dropdown change (primary recruiter, S3-06)
  const handleAssignRecruiter = async (reqId: string, newRecruiter: string) => {
    const person = board?.recruiters.find((u) => u.full_name === newRecruiter);
    if (!person) {
      showToast("Chọn một recruiter cụ thể để phân công.", "error");
      return;
    }
    try {
      await requisitionService.assignRecruiter(Number(reqId), person.id, "primary");
      showToast(`Đã phân công Recruiter "${newRecruiter}" cho yêu cầu!`, "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không phân công được recruiter.", "error");
    }
  };

  // Every status change asks for a reason (kept in the approval history)
  const handleQuickStatusChange = (req: Requisition, newStatus: Requisition["status"]) => {
    setSelectedReqForStatus(req);
    setTargetStatus(newStatus);
    setStatusReason("");
    setIsStatusModalOpen(true);
  };

  // Submit status modal change with reason
  const handleSubmitStatusModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForStatus) return;

    if (!statusReason.trim()) {
      showToast("Vui lòng nhập lý do thay đổi trạng thái!", "error");
      return;
    }
    const id = Number(selectedReqForStatus.id);
    try {
      if (targetStatus === "in_progress") {
        await requisitionService.resumeRequisition(id, statusReason.trim());
      } else {
        const target = targetStatus === "paused" ? "paused" : targetStatus === "cancelled" ? "cancelled" : "filled";
        try {
          await requisitionService.closeRequisition(id, target, statusReason.trim());
        } catch (err) {
          // candidates still in the pipeline: ask once, then close with explicit confirmation
          if (err instanceof ApiError && err.status === 409 && err.code === "ACTIVE_CANDIDATES_IN_PIPELINE"
              && confirm(`${err.message}\nVẫn tiếp tục?`)) {
            await requisitionService.closeRequisition(id, target, statusReason.trim(), true);
          } else {
            throw err;
          }
        }
      }
      const actionText =
        targetStatus === "paused" ? "Tạm dừng tuyển dụng"
          : targetStatus === "cancelled" ? "Hủy yêu cầu tuyển dụng"
            : targetStatus === "in_progress" ? "Mở lại tuyển dụng" : "Đóng tờ trình (đã tuyển đủ)";
      showToast(`Đã ${actionText} cho tờ trình ${selectedReqForStatus.code}! Lý do: ${statusReason}`, "success");
      setIsStatusModalOpen(false);
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không đổi được trạng thái.", "error");
    }
  };

  // Filtered requisitions list
  const filteredRequisitions = useMemo(() => {
    const q = searchQuery.trim();
    return requisitions.filter((r) => {
      const matchSearch =
        !q ||
        getSearchScore(r.title, q) > 0 ||
        getSearchScore(r.code, q) > 0 ||
        getSearchScore(r.department, q) > 0;

      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "needs_handover"
          ? Boolean(r.needsHandover)
          : selectedStatus === "overdue"
          ? r.isOverdue || r.pendingSinceDays >= 3 || r.slaStatus === "overdue"
          : selectedStatus === "overdue_target"
          ? r.isOverdue
          : r.status === selectedStatus);

      const matchDept = selectedDept === "all" || r.department === selectedDept;
      const matchRecruiter = selectedRecruiter === "all" || r.primaryRecruiter === selectedRecruiter;
      const matchOverdueOnly = !isOverdueOnly || r.isOverdue;
      const matchDateFrom = !dateFrom || (r.createdDateRaw && r.createdDateRaw >= dateFrom);
      const matchDateTo = !dateTo || (r.createdDateRaw && r.createdDateRaw <= dateTo);

      return matchSearch && matchStatus && matchDept && matchRecruiter && matchOverdueOnly && matchDateFrom && matchDateTo;
    }).sort((a, b) => {
      // Prioritize overdue items at the top
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (q) {
        const scoreA = Math.max(getSearchScore(a.title, q), getSearchScore(a.code, q), getSearchScore(a.department, q));
        const scoreB = Math.max(getSearchScore(b.title, q), getSearchScore(b.code, q), getSearchScore(b.department, q));
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      return 0;
    });
  }, [requisitions, searchQuery, selectedStatus, selectedDept, selectedRecruiter, isOverdueOnly, dateFrom, dateTo]);

  // Pagination states & slices
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedDept, selectedRecruiter, isOverdueOnly, dateFrom, dateTo, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRequisitions.length / pageSize));
  const paginatedRequisitions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequisitions.slice(start, start + pageSize);
  }, [filteredRequisitions, currentPage, pageSize]);

  // Statistics
  const totalOpenHeadcount = useMemo(() => {
    return requisitions
      .filter((r) => r.status === "in_progress" || r.status === "pending_approval")
      .reduce((sum, r) => sum + r.headcount, 0);
  }, [requisitions]);

  const overdueCount = useMemo(() => {
    return requisitions.filter(
      (r) => (r.status === "pending_approval" && r.pendingSinceDays >= 3) || r.slaStatus === "overdue"
    ).length;
  }, [requisitions]);

  const overdueTargetCount = useMemo(() => {
    return requisitions.filter((r) => r.isOverdue).length;
  }, [requisitions]);

  const handoverCount = useMemo(() => {
    return requisitions.filter((r) => r.needsHandover).length;
  }, [requisitions]);

  const inProgressCount = useMemo(() => {
    return requisitions.filter((r) => r.status === "in_progress").length;
  }, [requisitions]);

  const pendingApprovalCount = useMemo(() => {
    return requisitions.filter((r) => r.status === "pending_approval").length;
  }, [requisitions]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedStatus !== "all" ||
    selectedDept !== "all" ||
    selectedRecruiter !== "all" ||
    isOverdueOnly ||
    dateFrom ||
    dateTo
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedDept("all");
    setSelectedRecruiter("all");
    setIsOverdueOnly(false);
    setDateFrom("");
    setDateTo("");
    showToast(`Đã đặt lại toàn bộ bộ lọc. Hiển thị tất cả ${requisitions.length} yêu cầu tuyển dụng.`, "info");
  };

  if (loading) return <LoadingState />;
  if (error || !board) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {mounted && toast && createPortal(
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : toast.type === "info"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : toast.type === "warning"
              ? "bg-amber-50 text-amber-800 border-amber-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : toast.type === "info" ? (
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
          ) : toast.type === "warning" ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>,
        document.body
      )}

      {/* Main Container Card: bg-white rounded-xl shadow-xs border border-slate-200 p-5 md:p-6 space-y-4 */}
      <div className="w-full bg-white rounded-xl shadow-xs border border-slate-200 p-5 md:p-6 space-y-4">
        {/* Header Tiêu đề phân hệ: Gọn gàng, chuẩn Enterprise SaaS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Quản Lý Yêu Cầu Tuyển Dụng
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                Requisitions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Giám sát tiến độ phê duyệt tờ trình, cảnh báo SLA và phân công Recruiter phụ trách.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Nút Cấu hình Luồng phê duyệt */}
            <button
              type="button"
              onClick={() => setIsWorkflowModalOpen(true)}
              className="flex items-center gap-1.5 h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cấu hình Luồng phê duyệt</span>
            </button>
          </div>
        </div>

        {/* 3 TABS SWITCHER: Underline Tabs chuẩn SaaS (Linear / GitHub / Jira) */}
        <div className="flex items-center gap-6 border-b border-slate-200 text-xs">
          {/* Tab 1: Danh sách Yêu cầu */}
          <button
            type="button"
            onClick={() => setActiveTab("requisitions")}
            className={`flex items-center gap-1.5 pb-2.5 font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === "requisitions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Danh sách Yêu cầu</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                activeTab === "requisitions" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {requisitions.length}
            </span>
            {overdueTargetCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {overdueTargetCount} quá hạn
              </span>
            )}
            {handoverCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {handoverCount} cần bàn giao
              </span>
            )}
          </button>

          {/* Tab 2: Ngân sách Headcount */}
          <button
            type="button"
            onClick={() => setActiveTab("headcount")}
            className={`flex items-center gap-1.5 pb-2.5 font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === "headcount"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Định biên Headcount</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                activeTab === "headcount" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {budgets.length} phòng ban
            </span>
          </button>

          {/* Tab 3: Lịch sử Bàn giao */}
          <button
            type="button"
            onClick={() => setActiveTab("handover")}
            className={`flex items-center gap-1.5 pb-2.5 font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === "handover"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Lịch sử Bàn giao</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                activeTab === "handover" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {board?.handoverHistory?.length || 0}
            </span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: BẢNG DANH SÁCH YÊU CẦU TUYỂN DỤNG (REQUISITIONS LIST) */}
        {/* =================================================================== */}
        {activeTab === "requisitions" && (
          <div className="space-y-3">
            {/* Notice Strip: Gọn gàng, tinh tế, tiết kiệm diện tích */}
            {(overdueTargetCount > 0 || handoverCount > 0) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Cảnh báo vận hành:</span>
                  <div className="flex items-center gap-2 text-slate-700 text-xs flex-wrap">
                    {overdueTargetCount > 0 && (
                      <span className="font-medium text-rose-700">
                        <strong className="font-bold">{overdueTargetCount}</strong> vị trí quá hạn cần người
                      </span>
                    )}
                    {overdueTargetCount > 0 && handoverCount > 0 && (
                      <span className="text-slate-300">•</span>
                    )}
                    {handoverCount > 0 && (
                      <span className="font-medium text-amber-800">
                        <strong className="font-bold">{handoverCount}</strong> vị trí cần bàn giao Recruiter
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {overdueTargetCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isOverdueOnly;
                        setIsOverdueOnly(next);
                        showToast(
                          next
                            ? `Đang lọc hiển thị ${overdueTargetCount} yêu cầu quá hạn!`
                            : "Đã hủy lọc quá hạn.",
                          next ? "warning" : "info"
                        );
                      }}
                      className={`h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                        isOverdueOnly
                          ? "bg-rose-700 text-white border-rose-700 shadow-xs"
                          : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                      }`}
                    >
                      {isOverdueOnly ? "✕ Đang xem quá hạn" : `Xem quá hạn (${overdueTargetCount})`}
                    </button>
                  )}
                  {handoverCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = selectedStatus === "needs_handover" ? "all" : "needs_handover";
                        setSelectedStatus(next);
                        showToast(
                          next === "needs_handover"
                            ? `Đang lọc ${handoverCount} vị trí cần bàn giao`
                            : "Hiển thị tất cả trạng thái",
                          "info"
                        );
                      }}
                      className={`h-6.5 px-2.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                        selectedStatus === "needs_handover"
                          ? "bg-amber-700 text-white border-amber-700 shadow-xs"
                          : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
                      }`}
                    >
                      {selectedStatus === "needs_handover" ? "✕ Đang xem cần bàn giao" : `Xem cần bàn giao (${handoverCount})`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filter Bar: Compact toolbar, không bo tròn lồng nhau, chuẩn UI tiếng Việt dd/mm/yyyy */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {/* Search Box */}
                <div className="w-48 sm:w-52 lg:w-56">
                  <SearchAutocompleteInput
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                    onSelectSuggestion={(item) => setSearchQuery(item.title)}
                    placeholder="Tìm theo mã, chức danh..."
                    size="sm"
                    localSuggestions={requisitions.map((r) => ({
                      id: r.id,
                      title: r.title,
                      subtitle: `Mã: ${r.code} • Phòng ban: ${r.department}`,
                      category: "requisition",
                      category_label: "Tờ trình",
                    }))}
                  />
                </div>

                {/* Filter Phòng ban */}
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    showToast(`Đã lọc phòng ban: ${e.target.value === "all" ? "Tất cả" : e.target.value}`, "info");
                  }}
                  className="h-8 text-xs bg-white border border-slate-200 rounded-lg px-2.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden transition-colors cursor-pointer"
                >
                  <option value="all">Phòng ban: Tất cả</option>
                  {(board?.depts || []).map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                {/* Filter Recruiter */}
                <select
                  value={selectedRecruiter}
                  onChange={(e) => {
                    setSelectedRecruiter(e.target.value);
                    showToast(`Đã lọc recruiter: ${e.target.value === "all" ? "Tất cả" : e.target.value}`, "info");
                  }}
                  className="h-8 text-xs bg-white border border-slate-200 rounded-lg px-2.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden transition-colors cursor-pointer"
                >
                  <option value="all">Recruiter: Tất cả</option>
                  {RECRUITER_LIST.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* Filter Trạng thái */}
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    showToast(`Đã lọc trạng thái: ${e.target.options[e.target.selectedIndex].text}`, "info");
                  }}
                  className="h-8 text-xs bg-white border border-slate-200 rounded-lg px-2.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden transition-colors cursor-pointer"
                >
                  <option value="all">Trạng thái: Tất cả</option>
                  <option value="in_progress">🟢 Đang tuyển</option>
                  <option value="pending_approval">🟡 Chờ duyệt</option>
                  <option value="needs_handover">⚠️ Cần bàn giao</option>
                  <option value="overdue">🔴 Quá hạn SLA</option>
                  <option value="paused">⏸ Tạm dừng</option>
                  <option value="cancelled">✕ Đã hủy</option>
                </select>

                {/* Flat Date Range Filter: dd/mm/yyyy - dd/mm/yyyy */}
                <div className="relative flex items-center gap-1.5 h-8 bg-white border border-slate-200 rounded-lg px-2.5 text-xs text-slate-700 hover:border-slate-300 transition-colors">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">Ngày tạo:</span>

                  {/* Từ ngày */}
                  <div className="relative flex items-center">
                    <span className={`text-xs ${dateFrom ? "font-mono font-medium text-slate-800" : "text-slate-400"}`}>
                      {dateFrom ? formatDateVN(dateFrom) : "dd/mm/yyyy"}
                    </span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => {
                        setDateFrom(e.target.value);
                        if (e.target.value) showToast(`Lọc từ ngày ${formatDateVN(e.target.value)}`, "info");
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Chọn từ ngày (dd/mm/yyyy)"
                    />
                  </div>

                  <span className="text-slate-300 font-bold">–</span>

                  {/* Đến ngày */}
                  <div className="relative flex items-center">
                    <span className={`text-xs ${dateTo ? "font-mono font-medium text-slate-800" : "text-slate-400"}`}>
                      {dateTo ? formatDateVN(dateTo) : "dd/mm/yyyy"}
                    </span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => {
                        setDateTo(e.target.value);
                        if (e.target.value) showToast(`Lọc đến ngày ${formatDateVN(e.target.value)}`, "info");
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Chọn đến ngày (dd/mm/yyyy)"
                    />
                  </div>

                  {(dateFrom || dateTo) && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                        showToast("Đã xóa bộ lọc ngày tạo", "info");
                      }}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-1 transition-colors cursor-pointer"
                      title="Xóa bộ lọc ngày"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Reset button if active */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="h-8 px-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200 flex items-center gap-1"
                    title="Xóa toàn bộ bộ lọc"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>

              {/* Counter hiển thị bên phải */}
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2 shrink-0 self-end xl:self-center">
                <span>
                  Hiển thị <strong className="text-slate-900 font-bold">{filteredRequisitions.length}</strong>/{requisitions.length} yêu cầu
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  Mở tuyển: <strong className="text-blue-700 font-bold">{totalOpenHeadcount}</strong> chỉ tiêu
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3.5 w-[30%]">Vị trí & Mã REQ</th>
                      <th className="py-2.5 px-3 w-[15%]">Phòng ban</th>
                      <th className="py-2.5 px-3 text-center w-[10%]">Chỉ tiêu</th>
                      <th className="py-2.5 px-3 w-[15%]">Thời hạn</th>
                      <th className="py-2.5 px-3 w-[15%]">Recruiter</th>
                      <th className="py-2.5 px-3 text-center w-[10%]">Trạng thái</th>
                      <th className="py-2.5 px-3.5 text-right w-[15%]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {paginatedRequisitions.map((req) => {
                      const isStuckOverdue =
                        req.status === "pending_approval" && req.pendingSinceDays >= 3;

                      return (
                        <tr
                          key={req.id}
                          className={`transition-colors ${
                            req.isOverdue
                              ? "bg-rose-50/40 hover:bg-rose-50/70 border-l-4 border-l-rose-500"
                              : "hover:bg-slate-50/60"
                          }`}
                        >
                          {/* Mã & Chức danh */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 text-xs">{req.title}</span>
                              {req.isOverdue && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-600 text-white shrink-0">
                                  QUÁ HẠN
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                              <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                {req.code}
                              </span>
                              <span>•</span>
                              <span className="text-slate-600">Lương: {req.salaryRangeDisplay}</span>
                            </div>
                          </td>

                          {/* Phòng ban */}
                          <td className="py-3 px-3 text-slate-700 text-xs font-medium">
                            {req.department}
                          </td>

                          {/* Headcount */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              {req.headcount} nhân sự
                            </span>
                          </td>

                          {/* Thời hạn */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                <span className="font-medium text-slate-800">
                                  Mở {req.daysOpen ?? req.pendingSinceDays} ngày
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">
                                  Hạn: {req.targetDate ? formatDateVN(req.targetDate) : "Chưa đặt"}
                                </span>
                              </div>

                              {req.isOverdue ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Quá hạn {Math.abs(req.daysRemaining ?? 0)} ngày</span>
                                </span>
                              ) : req.daysRemaining === 0 ? (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  Hạn hôm nay
                                </span>
                              ) : req.daysRemaining !== null && req.daysRemaining > 0 && req.daysRemaining <= 7 ? (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Còn {req.daysRemaining} ngày
                                </span>
                              ) : req.daysRemaining !== null && req.daysRemaining > 7 ? (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Còn {req.daysRemaining} ngày
                                </span>
                              ) : isStuckOverdue ? (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Kẹt duyệt {req.pendingSinceDays} ngày
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* Recruiter */}
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-between gap-1 max-w-[160px]">
                              {req.primaryRecruiter === UNASSIGNED ? (
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md truncate">
                                  Chưa phân công
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 min-w-0" title={req.primaryRecruiter}>
                                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {req.primaryRecruiter.charAt(0)}
                                  </div>
                                  <span className="text-xs font-medium text-slate-800 truncate">
                                    {req.primaryRecruiter}
                                  </span>
                                </div>
                              )}

                              {/* Nút bàn giao / đổi recruiter với tooltip rõ ràng */}
                              <button
                                type="button"
                                title="Bàn giao phụ trách (kèm lý do và lưu vết kiểm toán)"
                                onClick={() => openHandoverModal(req)}
                                className={`p-1 rounded-md border text-xs transition-colors cursor-pointer shrink-0 ${
                                  req.needsHandover
                                    ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                                    : "bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-slate-200"
                                }`}
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {req.needsHandover && req.handoverReasonFlag && (
                              <span className="text-[10px] text-amber-700 font-medium block mt-0.5 truncate" title={req.handoverReasonFlag}>
                                ⚠️ {req.handoverReasonFlag}
                              </span>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-3 px-3 text-center">
                            {req.status === "in_progress" && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Đang tuyển
                              </span>
                            )}
                            {req.status === "pending_approval" && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Chờ duyệt
                              </span>
                            )}
                            {req.status === "paused" && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                Tạm dừng
                              </span>
                            )}
                            {req.status === "cancelled" && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                                Đã hủy
                              </span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Primary: Chi tiết */}
                              <Link
                                href={`/hr/requisitions/${req.id}`}
                                className="h-7 px-2.5 flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors cursor-pointer"
                                title="Xem chi tiết và luồng phê duyệt"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0" />
                                <span>Chi tiết</span>
                              </Link>

                              {/* Secondary: Tạm dừng / Mở lại */}
                              {req.status === "in_progress" ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(req, "paused")}
                                  className="h-7 px-2 flex items-center gap-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                                  title="Tạm dừng tin tuyển dụng để rà soát"
                                >
                                  <PauseCircle className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Tạm dừng</span>
                                </button>
                              ) : req.status === "paused" ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(req, "in_progress")}
                                  className="h-7 px-2 flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                                  title="Kích hoạt mở lại tuyển dụng"
                                >
                                  <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Mở lại</span>
                                </button>
                              ) : null}

                              {/* Icon Action: Hủy bỏ */}
                              {req.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickStatusChange(req, "cancelled")}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                                  title="Hủy bỏ yêu cầu này"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phân Trang Requisitions */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredRequisitions.length}
                  pageSize={pageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  onPageSizeChange={(sz) => {
                    setPageSize(sz);
                    setCurrentPage(1);
                  }}
                  onPageChange={(p) => setCurrentPage(p)}
                  itemLabel="yêu cầu tuyển dụng"
                />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: NGÂN SÁCH HEADCOUNT & THEO DÕI QUỸ NHÂN SỰ TỪNG PHÒNG BAN */}
        {/* =================================================================== */}
        {activeTab === "headcount" && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-blue-900">
                  Bảng Điều Khiển Quỹ Định Biên & Ngân Sách Tuyển Dụng
                </h3>
                <p className="text-xs text-blue-700 mt-0.5">
                  Tự động so khớp số lượng nhân sự đang mở tuyển trong các YC với hạn mức định biên đã được BOD phê duyệt hàng năm.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                  Tổng định biên toàn công ty: <strong>{budgets.reduce((sum, b) => sum + (b.allocatedHeadcount || 0), 0)} nhân sự</strong>
                </span>
              </div>
            </div>

            {/* Grid các phòng ban với Progress Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.map((b) => {
                const totalCommitted = b.currentStaff + b.openRequisitionsCount;
                const isExceeded = totalCommitted > b.allocatedHeadcount;
                const percentUsed = Math.round((totalCommitted / b.allocatedHeadcount) * 100);

                return (
                  <div
                    key={b.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 shadow-2xs ${
                      isExceeded
                        ? "bg-rose-50/30 border-rose-300 ring-2 ring-rose-500/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300"
                    }`}
                  >
                    {/* Header Card Phòng ban */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-900">
                            {b.departmentName}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-bold">
                            {b.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Trưởng khối: <strong className="text-slate-700 font-semibold">{b.managerName}</strong>
                        </p>
                      </div>

                      {/* Badge cảnh báo vượt định biên */}
                      {isExceeded ? (
                        <div className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>VƯỢT ĐỊNH BIÊN (+{totalCommitted - b.allocatedHeadcount})</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Trong hạn mức</span>
                        </div>
                      )}
                    </div>

                    {/* Chỉ số Headcount */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Hiện có:</span>
                        <strong className="text-slate-800 text-sm">{b.currentStaff}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-600 block font-medium">Đang mở tuyển:</span>
                        <strong className="text-blue-700 text-sm font-black">+{b.openRequisitionsCount}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Hạn mức duyệt:</span>
                        <strong className="text-slate-800 text-sm">{b.allocatedHeadcount}</strong>
                      </div>
                    </div>

                    {/* Progress Bar quỹ nhân sự */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">
                          Tiến độ lấp đầy định biên:
                        </span>
                        <span
                          className={`font-mono font-black ${
                            isExceeded ? "text-rose-600" : "text-slate-900"
                          }`}
                        >
                          {totalCommitted} / {b.allocatedHeadcount} ({percentUsed}%)
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                        {/* Phần nhân sự hiện có */}
                        <div
                          className="bg-blue-600 h-full"
                          style={{
                            width: `${Math.min(
                              Math.round((b.currentStaff / b.allocatedHeadcount) * 100),
                              100
                            )}%`,
                          }}
                          title={`Hiện có: ${b.currentStaff}`}
                        />
                        {/* Phần đang tuyển thêm */}
                        <div
                          className={`h-full ${
                            isExceeded ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              Math.round((b.openRequisitionsCount / b.allocatedHeadcount) * 100),
                              100
                            )}%`,
                          }}
                          title={`Đang tuyển: ${b.openRequisitionsCount}`}
                        />
                      </div>
                    </div>

                    {/* Ngân sách lương tháng */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Ngân sách lương tháng:</span>
                      <span className="font-mono font-extrabold text-slate-800">
                        {formatVND(b.currentSalaryUsedVND)} / {formatVND(b.monthlyBudgetVND)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: LỊCH SỬ CHUYỂN GIAO PHỤ TRÁCH (S3-06 & S1-10) */}
        {/* =================================================================== */}
        {activeTab === "handover" && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-blue-900">
                  Nhật Ký Chuyển Giao Phụ Trách & Bàn Giao Vị Trí Tuyển Dụng
                </h3>
                <p className="text-xs text-blue-700 mt-0.5">
                  Lưu vết kiểm toán toàn bộ thao tác phân công, thay đổi người phụ trách và bàn giao khi Recruiter nghỉ việc / khoá tài khoản (S1-10 & S3-06).
                </p>
              </div>
              <button
                type="button"
                onClick={() => reload()}
                className="px-3.5 py-1.5 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới nhật ký</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-40">Thời gian</th>
                      <th className="py-3.5 px-4 w-44">Tờ trình / Vị trí</th>
                      <th className="py-3.5 px-3 w-40">Người thực hiện</th>
                      <th className="py-3.5 px-3 w-36">Thao tác</th>
                      <th className="py-3.5 px-4">Chi tiết & Lý do chuyển giao</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {(!board?.handoverHistory || board.handoverHistory.length === 0) ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                          Chưa có lịch sử chuyển giao phụ trách nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      board.handoverHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {item.created_at ? new Date(item.created_at).toLocaleString("vi-VN") : "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[10px] mr-1.5">
                              {item.requisition_code}
                            </span>
                            <span className="font-bold text-slate-900 block mt-0.5">
                              {item.requisition_title}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-700">
                            {item.approver_name}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              item.action === "recruiter_handover"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {item.action === "recruiter_handover" ? "Bàn giao phụ trách" : "Phân công mới"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {item.comment || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: CẤU HÌNH LUỒNG PHÊ DUYỆT (APPROVAL WORKFLOW BUILDER) */}
      {/* =================================================================== */}
      {isWorkflowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <GitBranch className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Quy tắc Luồng Phê Duyệt
                    </span>
                    <span className="text-xs text-slate-400">
                      Cấu hình tự động định tuyến tờ trình
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight mt-0.5">
                    Cấu Hình Luồng Phê Duyệt Yêu Cầu Tuyển Dụng
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsWorkflowModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
                Hệ thống tự động kiểm tra điều kiện (Mức lương đề xuất và Quỹ định biên Headcount) khi Hiring Manager tạo tờ trình để gán chính xác các cấp duyệt theo ma trận phân quyền.
              </div>

              {/* Các khối điều kiện (If/Then) */}
              <div className="space-y-6">
                {workflowRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 shadow-2xs"
                  >
                    {/* Header Khối quy tắc */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                            {index + 1}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900">
                            {rule.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                          {rule.conditionDescription}
                        </p>
                      </div>

                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                        Đang kích hoạt
                      </span>
                    </div>

                    {/* Chuỗi các bước phê duyệt nối tiếp (Workflow Steps Visual) */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                        Trình tự các bước duyệt:
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {rule.steps.map((step, stepIdx) => (
                          <div
                            key={stepIdx}
                            className="relative p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                BƯỚC {step.stepNumber}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> SLA: {step.slaHours}h
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <div className="font-extrabold text-xs text-slate-900 leading-snug">
                                {step.approverRole}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {step.approverName}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Cấu hình áp dụng trực tiếp cho các luồng duyệt tờ trình theo bậc lương & phòng ban.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWorkflowModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <Link
                  href="/hr/master-data/approval-flows"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Quản trị Ma trận Phê duyệt</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: TẠM DỪNG / HỦY YÊU CẦU (BẮT BUỘC NHẬP LÝ DO) */}
      {/* =================================================================== */}
      {isStatusModalOpen && selectedReqForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {targetStatus === "paused"
                      ? "Tạm dừng đăng tin tuyển dụng"
                      : "Hủy bỏ yêu cầu tuyển dụng"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bắt buộc nhập lý do để lưu vết kiểm toán (Audit Trail)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStatusModal} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">
                  {selectedReqForStatus.title} ({selectedReqForStatus.code})
                </div>
                <div className="text-slate-500">
                  Phòng ban: {selectedReqForStatus.department}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập lý do chi tiết (VD: Tạm dừng do phòng ban điều chỉnh kế hoạch kinh doanh Q4...)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                >
                  Xác nhận thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: BÀN GIAO PHỤ TRÁCH RECRUITER (S1-10 & S3-06) */}
      {/* =================================================================== */}
      {isHandoverModalOpen && handoverReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Bàn Giao Phụ Trách Tuyển Dụng
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Chuyển giao quyền quản lý pipeline ứng viên & lưu vết kiểm toán (Audit Trail)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHandoverModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmHandover} className="p-6 space-y-4">
              {/* Position Info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {handoverReq.code}
                  </span>
                  <span className="text-slate-500 font-semibold">{handoverReq.department}</span>
                </div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {handoverReq.title}
                </div>
                <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-2 border-t border-slate-200/60">
                  <span>Phụ trách hiện tại:</span>
                  <strong className={handoverReq.needsHandover ? "text-amber-700 font-bold" : "text-slate-800"}>
                    {handoverReq.primaryRecruiter}
                  </strong>
                  {handoverReq.needsHandover && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-extrabold">
                      Cần bàn giao
                    </span>
                  )}
                </div>
              </div>

              {/* Recruiter Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chuyên viên Tuyển dụng (Recruiter) tiếp nhận <span className="text-rose-500">*</span>
                </label>
                <select
                  value={handoverRecruiterId || ""}
                  onChange={(e) => setHandoverRecruiterId(Number(e.target.value))}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>-- Chọn Recruiter tiếp nhận --</option>
                  {(board?.recruiters || [])
                    .filter((u) => u.id !== handoverReq.primaryRecruiterId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              {/* Handover Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do bàn giao / chuyển giao phụ trách <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={handoverReason}
                  onChange={(e) => setHandoverReason(e.target.value)}
                  placeholder="Ví dụ: Recruiter cũ nghỉ việc/khoá tài khoản (S1-10); Điều phối lại tải công việc giữa các thành viên (S3-06)..."
                  className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHandover}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isSubmittingHandover ? "Đang xử lý..." : "Xác nhận bàn giao"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
