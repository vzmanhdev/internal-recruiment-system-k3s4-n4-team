"use client";

import React, { useMemo, useState } from "react";
import { masterDataService, type OnboardingTemplateItem, type OnboardingTemplateRow } from "@/services/master-data.service";
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

const PHASES: OnboardingTaskItem["phase"][] = ["Pre-boarding (Trước Day 1)", "Day 1 (Ngày đầu tiên)", "Week 1 (Tuần đầu)", "Month 1 (Tháng đầu)"];
// due date of each phase relative to the start date (days before start; negative = after)
const PHASE_DAYS: Record<OnboardingTaskItem["phase"], number> = {
  "Pre-boarding (Trước Day 1)": 3, "Day 1 (Ngày đầu tiên)": 0, "Week 1 (Tuần đầu)": -5, "Month 1 (Tháng đầu)": -20,
};
const ASSIGNEES: OnboardingTaskItem["assignee"][] = ["IT Support", "HR Operations", "Hiring Manager", "Buddy / Mentor"];
const phaseOf = (i: OnboardingTemplateItem): OnboardingTaskItem["phase"] =>
  (PHASES.find((ph) => ph === i.phase)
    || (i.days_before_start > 0 ? PHASES[0] : i.days_before_start === 0 ? PHASES[1] : i.days_before_start >= -7 ? PHASES[2] : PHASES[3]));
const assigneeOf = (role: string): OnboardingTaskItem["assignee"] =>
  ASSIGNEES.find((a) => a === role) || (/it/i.test(role) ? "IT Support" : /manager|quản lý/i.test(role) ? "Hiring Manager" : /buddy|mentor/i.test(role) ? "Buddy / Mentor" : "HR Operations");

function toTasks(tpl: OnboardingTemplateRow | undefined): OnboardingTaskItem[] {
  return (tpl?.items || []).map((i, idx) => ({
    id: `${tpl?.id}-${idx}`,
    title: i.task_name,
    phase: phaseOf(i),
    assignee: assigneeOf(i.assigned_role),
    isMandatory: i.is_mandatory ?? true,
    slaDeadline: i.sla_note || (i.days_before_start > 0 ? `Trước ngày nhận việc ${i.days_before_start} ngày` : i.days_before_start === 0 ? "Trong ngày đầu tiên" : `Sau ngày nhận việc ${-i.days_before_start} ngày`),
    description: i.description || "",
    isCompleted: false,
    order: idx + 1,
  }));
}

const toItems = (tasks: OnboardingTaskItem[]): OnboardingTemplateItem[] => tasks.map((t) => ({
  task_name: t.title, assigned_role: t.assignee, days_before_start: PHASE_DAYS[t.phase], phase: t.phase,
  is_mandatory: t.isMandatory, description: t.description || null, sla_note: t.slaDeadline || null,
}));

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HROnboardingPage() {
  const { data: od, error, loading, reload } = useApiData(async () => {
    const [templates, depts] = await Promise.all([masterDataService.onboardingTemplates(), masterDataService.departments(false)]);
    return { templates: templates.filter((t) => t.is_active), depts };
  }, []);
  const templateCards: OnboardingTemplate[] = useMemo(() => (od?.templates || []).map((t) => ({
    id: String(t.id),
    name: t.name,
    department: od?.depts.find((d) => d.id === t.department_id)?.name || "Toàn bộ khối phòng ban",
    description: `${t.items.filter((i) => i.is_mandatory ?? true).length} đầu việc bắt buộc · tự sinh checklist khi ứng viên nhận offer`,
    tasksCount: t.items.length,
  })), [od]);
  const [pickedTemplateId, setSelectedTemplateId] = useState("");
  const selectedTemplateId = pickedTemplateId || templateCards[0]?.id || "";
  const selectedTemplate = od?.templates.find((t) => String(t.id) === selectedTemplateId);
  const tasks = useMemo(() => toTasks(selectedTemplate), [selectedTemplate]);
  // per-session preview ticks (not stored: real progress is tracked per hire on the offer's checklist)
  const [previewDone, setPreviewDone] = useState<Record<string, boolean>>({});

  // Every edit saves a new active version of the template
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Filter phase
  const [phaseFilter, setPhaseFilter] = useState("all");

  // Modal State: Thêm / Sửa task
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

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Toggle completed status
  const toggleTaskCompleted = (id: string) => {
    setPreviewDone((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Move task up/down
  const moveTask = (index: number, direction: "up" | "down") => {
    const newTasks = [...tasks];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newTasks.length) return;

    const temp = newTasks[index];
    newTasks[index] = newTasks[targetIndex];
    newTasks[targetIndex] = temp;

    void persist(newTasks, `Đã di chuyển công việc "${temp.title}"!`);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
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

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Handle Save Task (Create / Edit)
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
      slaDeadline: formData.slaDeadline.trim(),
      description: formData.description.trim(),
      isCompleted: false,
      order: editingTask?.order || tasks.length + 1,
    };
    const next = modalMode === "edit" && editingTask ? tasks.map((t) => (t.id === editingTask.id ? edited : t)) : [...tasks, edited];
    await persist(next, modalMode === "edit" ? `Cập nhật công việc "${edited.title}" thành công!` : `Đã thêm mới công việc "${edited.title}" vào quy trình!`);
    setIsModalOpen(false);
  };

  // Handle Delete Task
  const handleDeleteTask = (id: string, title: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa công việc "${title}" khỏi mẫu onboarding này?`)) {
      void persist(tasks.filter((t) => t.id !== id), `Đã xóa công việc "${title}"!`);
    }
  };

  // Filtered tasks by Phase
  const displayedTasks = tasks.map((t) => ({ ...t, isCompleted: !!previewDone[t.id] })).filter((t) => {
    if (phaseFilter === "all") return true;
    return t.phase === phaseFilter;
  });

  const mandatoryCount = tasks.filter((t) => t.isMandatory).length;
  const completedCount = tasks.filter((t) => previewDone[t.id]).length;

  if (loading) return <LoadingState />;
  if (error || !od) return <ErrorState error={error} onRetry={reload} />;

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

      {/* Main Container Card: bg-white rounded-2xl shadow-sm border border-slate-100 */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header Tiêu đề */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-100">
                New Hire Readiness & Onboarding
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Lộ trình hòa nhập 30 ngày
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Quản Trị Mẫu Checklist Onboarding
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập danh mục công việc chuẩn bị thiết bị, tài khoản IT, ký hợp đồng và đào tạo hội nhập. Kéo thả để sắp xếp thứ tự ưu tiên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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
              <span>Thêm công việc mới</span>
            </button>
          </div>
        </div>

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
              Tuần đầu (Week 1)
            </button>
            <button
              type="button"
              onClick={() => setPhaseFilter("Month 1 (Tháng đầu)")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                phaseFilter === "Month 1 (Tháng đầu)"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Tháng đầu (Month 1)
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <span>
              Bắt buộc: <strong className="text-rose-600">{mandatoryCount}</strong> việc
            </span>
            <span>
              Demo hoàn thành:{" "}
              <strong className="text-emerald-600">
                {completedCount}/{tasks.length}
              </strong>
            </span>
          </div>
        </div>

        {/* DRAG & DROP TO-DO LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-2">
            <span>KÉO THẢ BẰNG BIỂU TƯỢNG HOẶC DÙNG NÚT MŨI TÊN ĐỂ ĐỔI THỨ TỰ THỰC HIỆN</span>
            <span>{displayedTasks.length} CÔNG VIỆC</span>
          </div>

          <div className="space-y-2.5">
            {displayedTasks.map((task, index) => {
              const isDragging = draggedIndex === index;

              return (
                <div
                  key={task.id}
                  draggable={phaseFilter === "all"}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                    isDragging
                      ? "opacity-50 border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  {/* Left Column: Drag Handle, Step Number, Checkbox, Info */}
                  <div className="flex items-start sm:items-center gap-3 flex-1">
                    {/* Drag Handle Icon */}
                    <div
                      className={`p-1.5 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0 ${
                        phaseFilter === "all" ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-30"
                      }`}
                      title={
                        phaseFilter === "all"
                          ? "Kéo thả để sắp xếp thứ tự công việc"
                          : "Chuyển về bộ lọc 'Tất cả' để kéo thả sắp xếp"
                      }
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Step Order Badge */}
                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {String(task.order).padStart(2, "0")}
                    </span>

                    {/* Checkbox Complete */}
                    <button
                      type="button"
                      onClick={() => toggleTaskCompleted(task.id)}
                      className="mt-0.5 sm:mt-0 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                      title="Đánh dấu hoàn thành"
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Title & Metadata */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-black text-xs md:text-sm text-slate-900 ${
                            task.isCompleted ? "line-through text-slate-400" : ""
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.isMandatory ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            Bắt buộc
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-600">
                            Khuyến khích
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {task.phase}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-normal">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          Phụ trách: <strong>{task.assignee}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-amber-700">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          Hạn chót: {task.slaDeadline}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Move Up/Down Buttons, Edit, Delete */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveTask(index, "up")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      title="Di chuyển lên trên"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={index === tasks.length - 1}
                      onClick={() => moveTask(index, "down")}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      title="Di chuyển xuống dưới"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Edit */}
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Chỉnh sửa công việc"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa khỏi checklist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Quy trình chuẩn hóa sẵn sàng tự động đồng bộ khi ứng viên ký chấp nhận Offer tuyển dụng.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                showToast("Đã lưu mẫu quy trình Onboarding vào hệ thống core!");
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
            >
              Lưu mẫu quy trình này
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL: THÊM / SỬA CÔNG VIỆC ONBOARDING */}
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
                  Tên công việc / Đầu việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cấp phát Laptop & Tạo tài khoản Slack/Email"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giai đoạn (Phase)
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phase: e.target.value as OnboardingTaskItem["phase"],
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  >
                    <option value="Pre-boarding (Trước Day 1)">Pre-boarding (Trước Day 1)</option>
                    <option value="Day 1 (Ngày đầu tiên)">Day 1 (Ngày đầu tiên)</option>
                    <option value="Week 1 (Tuần đầu)">Week 1 (Tuần đầu)</option>
                    <option value="Month 1 (Tháng đầu)">Month 1 (Tháng đầu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bộ phận / Người phụ trách
                  </label>
                  <select
                    value={formData.assignee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignee: e.target.value as OnboardingTaskItem["assignee"],
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  >
                    <option value="IT Support">IT Support (Hạ tầng thiết bị & Tài khoản)</option>
                    <option value="HR Operations">HR Operations (Hồ sơ & Hợp đồng)</option>
                    <option value="Hiring Manager">Hiring Manager (Quản lý trực tiếp)</option>
                    <option value="Buddy / Mentor">Buddy / Mentor (Hướng dẫn hội nhập)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hạn chót hoàn thành (SLA)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Trước 17:00 ngày Day 1"
                    value={formData.slaDeadline}
                    onChange={(e) => setFormData({ ...formData, slaDeadline: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.isMandatory}
                      onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Công việc bắt buộc (Mandatory)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả hướng dẫn chi tiết
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể các bước thực hiện, tài liệu cần chuẩn bị..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
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
                  {modalMode === "create" ? "Thêm vào danh sách" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
