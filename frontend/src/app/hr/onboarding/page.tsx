"use client";

import React, { useMemo, useState } from "react";
import { masterDataService, type OnboardingTemplateItem, type OnboardingTemplateRow } from "@/services/master-data.service";
import { offerService, type OfferItem, type OnboardingItem } from "@/services/offer.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";
import {
  UserPlus,
  CheckCircle2,
  Circle,
  Laptop,
  Mail,
  FileText,
  Users,
  Compass,
  Calendar,
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Briefcase,
  Sparkles,
  Layers,
  ChevronRight,
  X,
  Check,
  Building,
  UserCheck,
  AlertTriangle,
  ArrowRightLeft,
  RefreshCw,
  Search,
} from "lucide-react";

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export interface OnboardingTaskItem {
  id: string;
  title: string;
  phase: "Pre-boarding (Trước Day 1)" | "Day 1 (Ngày đầu tiên)" | "Week 1 (Tuần đầu)" | "Month 1 (Tháng đầu)";
  assignee: "IT Support" | "HR Operations" | "Hiring Manager" | "Buddy / Mentor";
  isMandatory: boolean;
  slaDeadline: string;
  description: string;
  isCompleted: boolean;
  order: number;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  department: string;
  description: string;
  tasksCount: number;
}

// =============================================================================
// REAL ONBOARDING TEMPLATES (per department, versioned on save — S7-08)
// =============================================================================

const PHASES: OnboardingTaskItem["phase"][] = [
  "Pre-boarding (Trước Day 1)",
  "Day 1 (Ngày đầu tiên)",
  "Week 1 (Tuần đầu)",
  "Month 1 (Tháng đầu)",
];

const PHASE_DAYS: Record<OnboardingTaskItem["phase"], number> = {
  "Pre-boarding (Trước Day 1)": 3,
  "Day 1 (Ngày đầu tiên)": 0,
  "Week 1 (Tuần đầu)": -5,
  "Month 1 (Tháng đầu)": -20,
};

const ASSIGNEES: OnboardingTaskItem["assignee"][] = [
  "IT Support",
  "HR Operations",
  "Hiring Manager",
  "Buddy / Mentor",
];

const phaseOf = (i: OnboardingTemplateItem): OnboardingTaskItem["phase"] =>
  PHASES.find((ph) => ph === i.phase) ||
  (i.days_before_start > 0
    ? PHASES[0]
    : i.days_before_start === 0
    ? PHASES[1]
    : i.days_before_start >= -7
    ? PHASES[2]
    : PHASES[3]);

const assigneeOf = (role: string): OnboardingTaskItem["assignee"] =>
  ASSIGNEES.find((a) => a === role) ||
  (/it/i.test(role)
    ? "IT Support"
    : /manager|quản lý/i.test(role)
    ? "Hiring Manager"
    : /buddy|mentor/i.test(role)
    ? "Buddy / Mentor"
    : "HR Operations");

function toTasks(tpl: OnboardingTemplateRow | undefined): OnboardingTaskItem[] {
  return (tpl?.items || []).map((i, idx) => ({
    id: `${tpl?.id}-${idx}`,
    title: i.task_name,
    phase: phaseOf(i),
    assignee: assigneeOf(i.assigned_role),
    isMandatory: i.is_mandatory ?? true,
    slaDeadline:
      i.sla_note ||
      (i.days_before_start > 0
        ? `Trước ngày nhận việc ${i.days_before_start} ngày`
        : i.days_before_start === 0
        ? "Trong ngày đầu tiên"
        : `Sau ngày nhận việc ${-i.days_before_start} ngày`),
    description: i.description || "",
    isCompleted: false,
    order: idx + 1,
  }));
}

const toItems = (tasks: OnboardingTaskItem[]): OnboardingTemplateItem[] =>
  tasks.map((t) => ({
    task_name: t.title,
    assigned_role: t.assignee,
    days_before_start: PHASE_DAYS[t.phase],
    phase: t.phase,
    is_mandatory: t.isMandatory,
    description: t.description || null,
    sla_note: t.slaDeadline || null,
  }));

function getPillarStatus(items: OnboardingItem[] | undefined, pattern: RegExp) {
  if (!items || items.length === 0) return { exists: false, completed: false, count: 0, doneCount: 0 };
  const matched = items.filter((i) => pattern.test(i.task_name));
  if (matched.length === 0) return { exists: false, completed: false, count: 0, doneCount: 0 };
  const allDone = matched.every((i) => i.is_completed);
  return { exists: true, completed: allDone, count: matched.length, doneCount: matched.filter((i) => i.is_completed).length };
}

function getStartCountdown(dateStr: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(dateStr.slice(0, 10));
    start.setHours(0, 0, 0, 0);
    const diffDays = Math.round((start.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return { text: `Đã nhận việc (${Math.abs(diffDays)}d trước)`, isUrgent: false, isPast: true, days: diffDays };
    if (diffDays === 0) return { text: "Hôm nay (Day 1) 🚀", isUrgent: true, isPast: false, days: diffDays };
    if (diffDays <= 3) return { text: `Còn ${diffDays} ngày nữa (Gấp)`, isUrgent: true, isPast: false, days: diffDays };
    if (diffDays <= 7) return { text: `Còn ${diffDays} ngày nữa`, isUrgent: false, isPast: false, days: diffDays };
    return { text: `Còn ${diffDays} ngày`, isUrgent: false, isPast: false, days: diffDays };
  } catch {
    return { text: dateStr, isUrgent: false, isPast: false, days: 99 };
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HROnboardingPage() {
  const [activeTab, setActiveTab] = useState<"tracking" | "templates">("tracking");

  // Load data for both tracking (accepted hires) and templates
  const { data: pageData, error, loading, reload } = useApiData(async () => {
    const [templates, depts, offers] = await Promise.all([
      masterDataService.onboardingTemplates(),
      masterDataService.departments(false),
      offerService.getOffers().catch(() => []),
    ]);
    const acceptedOffers = offers.filter((o) => o.status === "accepted" || o.status === "onboarded");
    return {
      templates: templates.filter((t) => t.is_active),
      depts,
      acceptedOffers,
    };
  }, []);

  // Tracking Filter States
  const [trackingSearch, setTrackingSearch] = useState("");
  const [trackingDept, setTrackingDept] = useState("all");
  const [trackingStatus, setTrackingStatus] = useState("all");

  // Checklist Detail Drawer / Modal for Active Hire
  const [selectedOfferForChecklist, setSelectedOfferForChecklist] = useState<OfferItem | null>(null);
  const [isUpdatingChecklist, setIsUpdatingChecklist] = useState<Record<number, boolean>>({});

  // Template builder states
  const templateCards: OnboardingTemplate[] = useMemo(
    () =>
      (pageData?.templates || []).map((t) => ({
        id: String(t.id),
        name: t.name,
        department: pageData?.depts.find((d) => d.id === t.department_id)?.name || "Toàn bộ khối phòng ban",
        description: `${t.items.filter((i) => i.is_mandatory ?? true).length} đầu việc bắt buộc · tự sinh checklist khi ứng viên nhận offer`,
        tasksCount: t.items.length,
      })),
    [pageData]
  );
  const [pickedTemplateId, setSelectedTemplateId] = useState("");
  const selectedTemplateId = pickedTemplateId || templateCards[0]?.id || "";
  const selectedTemplate = pageData?.templates.find((t) => String(t.id) === selectedTemplateId);
  const tasks = useMemo(() => toTasks(selectedTemplate), [selectedTemplate]);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Save template
  const persist = async (next: OnboardingTaskItem[], message: string) => {
    if (!next.length) {
      showToast("Mẫu onboarding phải có ít nhất một công việc.", "error");
      return;
    }
    try {
      const saved = await masterDataService.saveOnboardingTemplate({
        name: selectedTemplate?.name || "Mẫu Hội Nhập Chuẩn Chung",
        department_id: selectedTemplate?.department_id ?? null,
        items: toItems(next),
      });
      setSelectedTemplateId(String(saved.id));
      showToast(message);
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không lưu được mẫu onboarding.", "error");
    }
  };

  // Toggle checklist item completion on real accepted candidate
  const handleToggleChecklistItem = async (offerId: number, item: OnboardingItem) => {
    setIsUpdatingChecklist((prev) => ({ ...prev, [item.id]: true }));
    try {
      const updatedOffer = await offerService.updateOnboardingItem(offerId, item.id, {
        is_completed: !item.is_completed,
      });
      showToast(`Đã cập nhật mục "${item.task_name}"!`, "success");
      // Update selected offer state
      setSelectedOfferForChecklist(updatedOffer);
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thể cập nhật mục onboarding.", "error");
    } finally {
      setIsUpdatingChecklist((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // Drag & drop state for templates
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [phaseFilter, setPhaseFilter] = useState("all");

  // Modal State: Thêm / Sửa task mẫu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<OnboardingTaskItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    phase: "Pre-boarding (Trước Day 1)" as OnboardingTaskItem["phase"],
    assignee: "IT Support" as OnboardingTaskItem["assignee"],
    isMandatory: true,
    slaDeadline: "Trước Day 1",
    description: "",
  });

  const moveTask = (index: number, direction: "up" | "down") => {
    const newTasks = [...tasks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTasks.length) return;
    const temp = newTasks[index];
    newTasks[index] = newTasks[targetIndex];
    newTasks[targetIndex] = temp;
    void persist(newTasks, `Đã di chuyển công việc "${temp.title}"!`);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newTasks = [...tasks];
    const draggedItem = newTasks[draggedIndex];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedItem);
    setDraggedIndex(null);
    void persist(newTasks, `Đã sắp xếp lại thứ tự công việc qua kéo thả!`);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Vui lòng nhập tên công việc onboarding", "error");
      return;
    }
    const edited: OnboardingTaskItem = {
      id: editingTask?.id || `new-${tasks.length}`,
      title: formData.title.trim(),
      phase: formData.phase,
      assignee: formData.assignee,
      isMandatory: formData.isMandatory,
      slaDeadline: formData.slaDeadline,
      description: formData.description,
      isCompleted: false,
      order: editingTask?.order || tasks.length + 1,
    };
    const next =
      modalMode === "create"
        ? [...tasks, edited]
        : tasks.map((t) => (t.id === editingTask?.id ? edited : t));
    await persist(next, modalMode === "create" ? "Đã thêm công việc mới!" : "Đã cập nhật công việc!");
    setIsModalOpen(false);
  };

  const deleteTask = async (id: string) => {
    const next = tasks.filter((t) => t.id !== id);
    await persist(next, "Đã xóa công việc khỏi mẫu!");
  };

  // Filtered Tracking Hires
  const filteredHires = useMemo(() => {
    const hires = pageData?.acceptedOffers || [];
    const q = trackingSearch.trim().toLowerCase();
    return hires.filter((h) => {
      const matchSearch =
        !q ||
        (h.candidate_name && h.candidate_name.toLowerCase().includes(q)) ||
        (h.candidate_email && h.candidate_email.toLowerCase().includes(q)) ||
        (h.job_title && h.job_title.toLowerCase().includes(q));
      const matchDept = trackingDept === "all" || h.department === trackingDept;
      const matchStatus =
        trackingStatus === "all" ||
        (trackingStatus === "completed" ? (h.onboarding_progress || 0) >= 100 : (h.onboarding_progress || 0) < 100);
      return matchSearch && matchDept && matchStatus;
    });
  }, [pageData?.acceptedOffers, trackingSearch, trackingDept, trackingStatus]);

  // KPI calculations for Tracking Tab
  const trackingKpis = useMemo(() => {
    const hires = pageData?.acceptedOffers || [];
    const total = hires.length;
    const startingSoon = hires.filter((h) => {
      const cd = getStartCountdown(h.start_date);
      return !cd.isPast && cd.days <= 7;
    }).length;
    const avgProgress = total
      ? Math.round(hires.reduce((sum, h) => sum + (h.onboarding_progress || 0), 0) / total)
      : 0;
    const completedAll = hires.filter((h) => (h.onboarding_progress || 0) >= 100).length;
    return { total, startingSoon, avgProgress, completedAll };
  }, [pageData?.acceptedOffers]);

  if (loading) return <LoadingState />;
  if (error || !pageData) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header Tiêu đề phân hệ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-100">
                New Hire Readiness & Onboarding Hub
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                S7-08 Tiêu chuẩn chuẩn bị gia nhập
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Quản Trị Bàn Giao & Onboarding Nhân Sự Mới
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chuẩn bị thiết bị, tài khoản IT, hợp đồng lao động cho ứng viên đã nhận Offer và thiết lập mẫu quy trình hội nhập.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeTab === "templates" ? (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: "",
                    phase: "Pre-boarding (Trước Day 1)",
                    assignee: "IT Support",
                    isMandatory: true,
                    slaDeadline: "Trước Day 1",
                    description: "",
                  });
                  setModalMode("create");
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm công việc mẫu</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => reload()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới tiến độ</span>
              </button>
            )}
          </div>
        </div>

        {/* 2 TABS SWITCHER: THEO DÕI BÀN GIAO vs CẤU HÌNH MẪU */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("tracking")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "tracking"
                ? "bg-white text-blue-600 shadow-sm shadow-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Theo dõi Nhân sự mới ({pageData.acceptedOffers.length})</span>
            {trackingKpis.startingSoon > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-800 font-extrabold border border-amber-200">
                {trackingKpis.startingSoon} sắp Day 1
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "templates"
                ? "bg-white text-blue-600 shadow-sm shadow-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cấu hình Mẫu Quy trình Hội nhập ({pageData.templates.length})</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: THEO DÕI BÀN GIAO & CHUẨN BỊ GIA NHẬP (S7-08) */}
        {/* =================================================================== */}
        {activeTab === "tracking" && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Nhân sự đã ký Offer</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-slate-900">{trackingKpis.total}</div>
                <p className="text-[11px] text-slate-500 font-medium">Sẵn sàng chờ ngày gia nhập</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-amber-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Day 1 trong 7 ngày tới</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-slate-900">{trackingKpis.startingSoon}</div>
                <p className="text-[11px] text-amber-800 font-medium">Cần hoàn tất gấp thiết bị & tài khoản</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-purple-100/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-purple-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Tiến độ chuẩn bị TB</span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-slate-900">{trackingKpis.avgProgress}%</div>
                <p className="text-[11px] text-slate-500 font-medium">Tỷ lệ đầu việc sẵn sàng bình quân</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/40 border border-emerald-100/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-xs font-bold uppercase tracking-wider">Đã hoàn tất 100%</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-black text-slate-900">{trackingKpis.completedAll}</div>
                <p className="text-[11px] text-slate-500 font-medium">Hồ sơ đã sẵn sàng cho ngày đầu</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trackingSearch}
                    onChange={(e) => setTrackingSearch(e.target.value)}
                    placeholder="Tìm tên nhân sự, email, chức danh..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <select
                  value={trackingDept}
                  onChange={(e) => setTrackingDept(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="all">Tất cả phòng ban</option>
                  {(pageData.depts || []).map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={trackingStatus}
                  onChange={(e) => setTrackingStatus(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden"
                >
                  <option value="all">Tất cả tiến độ</option>
                  <option value="pending">🟡 Đang chuẩn bị (&lt;100%)</option>
                  <option value="completed">🟢 Đã hoàn tất 100%</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 font-bold">
                Hiển thị <strong className="text-slate-900">{filteredHires.length}</strong> nhân sự
              </div>
            </div>

            {/* Table of New Hires & Handover Pillars */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-3/12">Nhân sự & Chức danh</th>
                      <th className="py-3.5 px-3">Phòng ban</th>
                      <th className="py-3.5 px-3">Ngày nhận việc (Day 1)</th>
                      <th className="py-3.5 px-3">4 Trụ cột chuẩn bị (S7-08)</th>
                      <th className="py-3.5 px-3 text-center w-36">Tiến độ</th>
                      <th className="py-3.5 px-4 text-right w-36">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {filteredHires.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          Không tìm thấy nhân sự mới nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredHires.map((offer) => {
                        const countdown = getStartCountdown(offer.start_date);
                        const contractPillar = getPillarStatus(offer.onboarding, /hợp đồng|hồ sơ|thử việc/i);
                        const itHardwarePillar = getPillarStatus(offer.onboarding, /máy tính|thiết bị|laptop/i);
                        const itSoftwarePillar = getPillarStatus(offer.onboarding, /email|tài khoản|slack|jira|phần mềm/i);
                        const deskPillar = getPillarStatus(offer.onboarding, /chỗ ngồi|thẻ|bàn làm việc/i);
                        const progress = offer.onboarding_progress || 0;

                        return (
                          <tr key={offer.id} className="hover:bg-blue-50/20 transition-colors">
                            {/* Candidate info */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 text-xs">
                                {offer.candidate_name || `Ứng viên #${offer.application_id}`}
                              </div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {offer.job_title || "Vị trí tuyển dụng"}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {offer.candidate_email}
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-3 text-slate-700 text-xs">
                              {offer.department || "Chưa phân bổ"}
                            </td>

                            {/* Start date & Countdown */}
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-900 text-xs">
                                {offer.start_date ? new Date(offer.start_date).toLocaleDateString("vi-VN") : "—"}
                              </div>
                              <span
                                className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 border ${
                                  countdown.isUrgent
                                    ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                                    : countdown.isPast
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                              >
                                {countdown.text}
                              </span>
                            </td>

                            {/* 4 Pillars Badges */}
                            <td className="py-3.5 px-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* Hợp đồng */}
                                <span
                                  title="Hợp đồng thử việc & Hồ sơ nhân sự"
                                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                    contractPillar.completed
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>HĐ/Hồ sơ</span>
                                  {contractPillar.completed ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                                </span>

                                {/* Máy tính */}
                                <span
                                  title="Máy tính & Thiết bị làm việc"
                                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                    itHardwarePillar.completed
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  <Laptop className="w-3 h-3" />
                                  <span>Laptop/TB</span>
                                  {itHardwarePillar.completed ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                                </span>

                                {/* Email/IT */}
                                <span
                                  title="Email & Tài khoản phần mềm"
                                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                    itSoftwarePillar.completed
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>Tài khoản IT</span>
                                  {itSoftwarePillar.completed ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                                </span>

                                {/* Chỗ ngồi */}
                                <span
                                  title="Chỗ ngồi & Thẻ nhân viên"
                                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                    deskPillar.completed
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  <Building className="w-3 h-3" />
                                  <span>Chỗ ngồi</span>
                                  {deskPillar.completed ? <Check className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                                </span>
                              </div>
                            </td>

                            {/* Progress bar */}
                            <td className="py-3.5 px-3">
                              <div className="w-full space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-extrabold">
                                  <span className={progress >= 100 ? "text-emerald-700" : "text-blue-700"}>
                                    {progress}%
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {(offer.onboarding || []).filter((i) => i.is_completed).length}/
                                    {(offer.onboarding || []).length} mục
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      progress >= 100 ? "bg-emerald-500" : "bg-blue-600"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedOfferForChecklist(offer)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 cursor-pointer shadow-2xs"
                              >
                                Chi tiết checklist
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: CẤU HÌNH MẪU QUY TRÌNH HỘI NHẬP (TEMPLATE BUILDER) */}
        {/* =================================================================== */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            {/* Template Switcher */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templateCards.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      showToast(`Đã chuyển sang xem "${tpl.name}"!`);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-slate-50/50 border-slate-200/90 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-slate-900">
                        {tpl.name}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-2">
                      {tpl.description}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-[10px] font-bold text-slate-600">
                      <span>Phòng: {tpl.department}</span>
                      <span className="text-blue-700">{tpl.tasksCount} đầu việc</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter Bar & Quick Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Giai đoạn:</span>
                <button
                  type="button"
                  onClick={() => setPhaseFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    phaseFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Tất cả ({tasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPhaseFilter("Pre-boarding (Trước Day 1)")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    phaseFilter === "Pre-boarding (Trước Day 1)"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Trước Day 1
                </button>
                <button
                  type="button"
                  onClick={() => setPhaseFilter("Day 1 (Ngày đầu tiên)")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    phaseFilter === "Day 1 (Ngày đầu tiên)"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Ngày đầu (Day 1)
                </button>
                <button
                  type="button"
                  onClick={() => setPhaseFilter("Week 1 (Tuần đầu)")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    phaseFilter === "Week 1 (Tuần đầu)"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  Tuần đầu
                </button>
              </div>

              <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
                <span>
                  Bắt buộc:{" "}
                  <strong className="text-rose-600">
                    {tasks.filter((t) => t.isMandatory).length}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Tổng đầu việc: <strong className="text-slate-900">{tasks.length}</strong>
                </span>
              </div>
            </div>

            {/* List Tasks with Drag-and-Drop */}
            <div className="space-y-2.5">
              {tasks
                .filter((t) => phaseFilter === "all" || t.phase === phaseFilter)
                .map((task, index) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-start gap-3 shadow-2xs group cursor-grab active:cursor-grabbing"
                  >
                    <div className="text-slate-300 hover:text-slate-600 pt-1">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          {task.title}
                        </span>
                        {task.isMandatory && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Bắt buộc
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {task.phase}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-slate-500">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 pt-1">
                        <span>Phụ trách: <strong className="text-slate-700">{task.assignee}</strong></span>
                        <span>•</span>
                        <span>Hạn SLA: <strong className="text-slate-700">{task.slaDeadline}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => moveTask(index, "up")}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTask(index, "down")}
                        disabled={index === tasks.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(task);
                          setFormData({
                            title: task.title,
                            phase: task.phase,
                            assignee: task.assignee,
                            isMandatory: task.isMandatory,
                            slaDeadline: task.slaDeadline,
                            description: task.description,
                          });
                          setModalMode("edit");
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Footer action with real save */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Quy trình chuẩn hóa tự động áp dụng và sinh checklist khi ứng viên nhận Offer tuyển dụng.
              </div>
              <button
                type="button"
                onClick={() => void persist(tasks, "Đã lưu mẫu quy trình Onboarding thành công!")}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
              >
                Lưu cấu hình mẫu này
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* DRAWER / MODAL: CHI TIẾT CHECKLIST ONBOARDING ỨNG VIÊN (S7-08) */}
      {/* =================================================================== */}
      {selectedOfferForChecklist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  New Hire Checklist
                </span>
                <h3 className="text-base font-extrabold tracking-tight mt-1">
                  Checklist Bàn Giao: {selectedOfferForChecklist.candidate_name || `Ứng viên #${selectedOfferForChecklist.application_id}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedOfferForChecklist.job_title} • {selectedOfferForChecklist.department} • Ngày nhận việc:{" "}
                  {selectedOfferForChecklist.start_date
                    ? new Date(selectedOfferForChecklist.start_date).toLocaleDateString("vi-VN")
                    : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOfferForChecklist(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Progress Summary Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tiến độ hoàn tất chuẩn bị
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedOfferForChecklist.onboarding_progress || 0}% Hoàn tất
                  </div>
                </div>
                <div className="w-48 space-y-1">
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${selectedOfferForChecklist.onboarding_progress || 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 block text-right">
                    {(selectedOfferForChecklist.onboarding || []).filter((i) => i.is_completed).length} /{" "}
                    {(selectedOfferForChecklist.onboarding || []).length} mục
                  </span>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Danh mục bàn giao trang thiết bị & thủ tục
                </h4>
                {(!selectedOfferForChecklist.onboarding || selectedOfferForChecklist.onboarding.length === 0) ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
                    Chưa có danh mục checklist nào được khởi tạo cho ứng viên này.
                  </div>
                ) : (
                  selectedOfferForChecklist.onboarding.map((item) => {
                    const isBusy = Boolean(isUpdatingChecklist[item.id]);

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 shadow-2xs ${
                          item.is_completed
                            ? "bg-emerald-50/40 border-emerald-200"
                            : "bg-white border-slate-200/90 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.is_completed}
                          disabled={isBusy}
                          onChange={() => handleToggleChecklistItem(selectedOfferForChecklist.id, item)}
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />

                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-extrabold ${
                                item.is_completed ? "text-emerald-950 line-through" : "text-slate-900"
                              }`}
                            >
                              {item.task_name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {item.assigned_role}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500 pt-0.5">
                            {item.due_date && (
                              <span>Hạn: <strong className="text-slate-700">{item.due_date}</strong></span>
                            )}
                            {item.is_completed && item.completed_at && (
                              <span className="text-emerald-700 font-bold">
                                • Đã hoàn tất lúc: {new Date(item.completed_at).toLocaleString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>

                        {item.is_completed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            Xong
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            Đang chờ
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tự động đánh dấu ứng viên là Đã Onboard khi hoàn thành 100% checklist.
              </span>
              <button
                type="button"
                onClick={() => setSelectedOfferForChecklist(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: THÊM / SỬA CÔNG VIỆC MẪU TRONG TEMPLATE */}
      {/* =================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {modalMode === "create" ? "Thêm mới công việc Onboarding" : "Chỉnh sửa công việc Onboarding"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Quy định rõ người phụ trách, mốc thời gian và tính bắt buộc
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên công việc onboarding <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cấp phát Laptop cấu hình cao & chuột không dây"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giai đoạn (Phase)
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value as OnboardingTaskItem["phase"] })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold"
                  >
                    {PHASES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bộ phận phụ trách
                  </label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value as OnboardingTaskItem["assignee"] })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold"
                  >
                    {ASSIGNEES.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời hạn hoàn thành (SLA)
                </label>
                <input
                  type="text"
                  placeholder="VD: Trước Day 1 ít nhất 24h"
                  value={formData.slaDeadline}
                  onChange={(e) => setFormData({ ...formData, slaDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả hướng dẫn chi tiết
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả các bước thực hiện, tài liệu biểu mẫu đính kèm..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isMandatory"
                  checked={formData.isMandatory}
                  onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isMandatory" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Đánh dấu là công việc bắt buộc (Bắt buộc hoàn thành trước khi chốt Onboarding)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {modalMode === "create" ? "Tạo công việc" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
