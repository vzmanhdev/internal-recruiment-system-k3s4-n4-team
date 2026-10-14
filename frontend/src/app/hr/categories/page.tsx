"use client";

import React, { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { masterDataService, type Department, type JobTitle, type Category } from "@/services/master-data.service";
import { requisitionService } from "@/services/requisition.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";
import {
  Network,
  Award,
  BookOpen,
  Plus,
  Search,
  Building2,
  Users,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Check,
  X,
  Coins,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Filter,
  Layers,
  Sparkles,
  Briefcase,
  UserCheck,
  FolderPlus,
  Sliders,
  DollarSign,
  ArrowUpDown,
  Tag,
  Building,
} from "lucide-react";

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export interface DepartmentNode {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  managerName: string;
  managerEmail: string;
  currentMembers: number;
  targetHeadcount: number;
  description: string;
  children?: DepartmentNode[];
}

export interface JobPosition {
  id: string;
  title: string;
  code: string;
  level: "Intern" | "Junior" | "Middle" | "Senior" | "Lead" | "Manager" | "Director";
  department: string;
  minSalary: number;
  maxSalary: number;
  isOfferLocked: boolean;
  activeOpenings: number;
}

export interface DictionaryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  usageCount: number;
  isActive: boolean;
}

// =============================================================================
// REAL MASTER DATA -> PAGE MODELS
// =============================================================================

type DeptRow = Department & { head_name?: string | null; member_count?: number };
type CategoryRow = Category & { usage_count?: number };
const LEVELS: JobPosition["level"][] = ["Intern", "Junior", "Middle", "Senior", "Lead", "Manager", "Director"];
// dictionary tab -> shared category type used by the workflow
const DICT_TYPES = { sources: "candidate_source", reasons: "rejection_reason", contractTypes: "contract_type" } as const;
const codeOf = (description?: string | null) => /^\[([^\]]+)\]/.exec(description || "")?.[1] || "";
const slug = (name: string) => name.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/[^A-Z0-9]+/g, "_").slice(0, 20);

function buildTree(rows: DeptRow[], budgets: Map<number, number>): DepartmentNode[] {
  const byParent = new Map<number | null, DeptRow[]>();
  const ids = new Set(rows.map((d) => d.id));
  rows.forEach((d) => {
    const key = d.parent_id && ids.has(d.parent_id) ? d.parent_id : null;
    byParent.set(key, [...(byParent.get(key) || []), d]);
  });
  const node = (d: DeptRow): DepartmentNode => ({
    id: String(d.id),
    name: d.name,
    code: d.code,
    parentId: d.parent_id ? String(d.parent_id) : "",
    managerName: d.head_name || "Chưa gán",
    managerEmail: "",
    currentMembers: d.member_count || 0,
    targetHeadcount: budgets.get(d.id) || 0,
    description: "",
    children: (byParent.get(d.id) || []).map(node),
  });
  return (byParent.get(null) || []).map(node);
}

function toDictItem(c: CategoryRow): DictionaryItem {
  return { id: String(c.id), name: c.name, code: slug(c.name), description: "", usageCount: c.usage_count || 0, isActive: c.is_active };
}

async function loadMasterData() {
  const year = new Date().getFullYear();
  const [depts, titles, categories, budgets, reqs, hm, hr] = await Promise.all([
    masterDataService.departments(true) as Promise<DeptRow[]>,
    masterDataService.jobTitles(),
    masterDataService.categories() as Promise<CategoryRow[]>,
    masterDataService.headcounts().catch(() => []),
    requisitionService.getRequisitions().catch(() => []),
    masterDataService.people("hiring_manager").catch(() => []),
    masterDataService.people("hr_manager").catch(() => []),
  ]);
  return {
    year, depts, titles, categories, reqs,
    budgets: new Map(budgets.filter((b) => b.year === year).map((b) => [b.department_id, b.budget_quantity])),
    managers: [...hm, ...hr.filter((u) => !hm.some((x) => x.id === u.id))],
  };
}

// Format Currency Utility
function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function HRCategoriesContent() {
  // ?type=<category_type> (from the lookup overview) opens the dictionary tab for that group
  const requestedType = useSearchParams().get("type");
  const [activeTab, setActiveTab] = useState<"org" | "salary" | "dictionary">(requestedType ? "dictionary" : "org");
  const { data: md, error, loading, reload } = useApiData(loadMasterData, []);
  const [saving, setSaving] = useState(false);

  // State: Tab 1 (Sơ đồ phòng ban)
  const orgData = useMemo(() => (md ? buildTree(md.depts, md.budgets) : []), [md]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [deptSearch, setDeptSearch] = useState("");
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptModalMode, setDeptModalMode] = useState<"create" | "edit">("create");
  const [editingDept, setEditingDept] = useState<DepartmentNode | null>(null);
  const [deptFormData, setDeptFormData] = useState({
    name: "",
    code: "",
    parentId: "",
    managerName: "",
    managerEmail: "",
    targetHeadcount: 10,
    description: "",
  });

  // State: Tab 2 (Chức danh & Dải lương)
  const jobPositions: JobPosition[] = useMemo(() => (md?.titles || []).map((t: JobTitle) => ({
    id: String(t.id),
    title: t.name,
    code: codeOf(t.description) || `JT-${t.id}`,
    level: (LEVELS.find((l) => t.level.toLowerCase().includes(l.toLowerCase())) || "Middle"),
    department: md?.depts.find((d) => d.id === t.department_id)?.name || "Tất cả phòng ban",
    minSalary: t.min_salary || 0,
    maxSalary: t.max_salary || 0,
    isOfferLocked: true, // offers outside the band always need the escalation approval (S7-04)
    activeOpenings: (md?.reqs || []).filter((r) => r.job_title_id === t.id && r.status === "approved").reduce((n, r) => n + (r.quantity || 0), 0),
  })), [md]);
  const [posSearch, setPosSearch] = useState("");
  const [posLevelFilter, setPosLevelFilter] = useState("all");
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posModalMode, setPosModalMode] = useState<"create" | "edit">("create");
  const [editingPos, setEditingPos] = useState<JobPosition | null>(null);
  const [posFormData, setPosFormData] = useState({
    title: "",
    code: "",
    level: "Senior" as JobPosition["level"],
    department: "",
    minSalary: 0,
    maxSalary: 0,
    isOfferLocked: true,
  });
  const [posFormError, setPosFormError] = useState<string | null>(null);

  // State: Tab 3 (Danh mục chung)
  const [activeDictionaryType, setActiveDictionaryType] = useState<"sources" | "reasons" | "contractTypes">(
    requestedType === "rejection_reason" ? "reasons" : requestedType === "contract_type" ? "contractTypes" : "sources",
  );
  const dictionaries = useMemo(() => {
    const of = (type: string) => (md?.categories || []).filter((c) => c.category_type === type).map(toDictItem);
    return { sources: of(DICT_TYPES.sources), reasons: of(DICT_TYPES.reasons), contractTypes: of(DICT_TYPES.contractTypes) };
  }, [md]);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState({ name: "", code: "", description: "" });
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddCode, setQuickAddCode] = useState("");

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Toggle expand node in tree
  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allIds: Record<string, boolean> = {};
    const traverse = (nodes: DepartmentNode[]) => {
      nodes.forEach((n) => {
        allIds[n.id] = true;
        if (n.children) traverse(n.children);
      });
    };
    traverse(orgData);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Flattened department options for Parent Dept selector
  const allDepartmentsFlat = useMemo(() => {
    const list: { id: string; name: string }[] = [{ id: "", name: "— Trực thuộc công ty (cấp 1) —" }];
    const traverse = (nodes: DepartmentNode[]) => {
      nodes.forEach((n) => {
        list.push({ id: n.id, name: n.name });
        if (n.children) traverse(n.children);
      });
    };
    traverse(orgData);
    return list;
  }, [orgData]);

  // Handle Save Department (head of department must be an existing manager account)
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormData.name || !deptFormData.code || !deptFormData.managerName) {
      showToast("Vui lòng điền đầy đủ các thông tin bắt buộc (*)", "error");
      return;
    }
    const wanted = deptFormData.managerName.trim().toLowerCase();
    const head = deptFormData.managerName === "Chưa gán" ? null
      : (md?.managers || []).find((u) => u.full_name.toLowerCase() === wanted || u.email.toLowerCase() === wanted);
    if (deptFormData.managerName !== "Chưa gán" && !head) {
      showToast("Không tìm thấy Trưởng phòng / Hiring Manager có tên hoặc email này trong hệ thống.", "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await masterDataService.saveDepartment({
        name: deptFormData.name.trim(),
        code: deptFormData.code.trim().toUpperCase(),
        parent_id: deptFormData.parentId ? Number(deptFormData.parentId) : null,
        head_user_id: head ? head.id : null,
        sort_order: 0,
        is_active: true,
      }, deptModalMode === "edit" && editingDept ? Number(editingDept.id) : undefined);
      if (md && deptFormData.targetHeadcount > 0 && deptFormData.targetHeadcount !== md.budgets.get(saved.id)) {
        await masterDataService.saveHeadcount({ department_id: saved.id, year: md.year, budget_quantity: deptFormData.targetHeadcount });
      }
      if (deptFormData.parentId) setExpandedNodes((prev) => ({ ...prev, [deptFormData.parentId]: true }));
      showToast(deptModalMode === "create" ? `Đã thêm mới phòng ban "${saved.name}" thành công!` : `Đã cập nhật phòng ban "${saved.name}" thành công!`, "success");
      setIsDeptModalOpen(false);
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không lưu được phòng ban.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle Save Job Position (with Min < Max check)
  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosFormError(null);

    const min = Number(posFormData.minSalary);
    const max = Number(posFormData.maxSalary);

    if (!posFormData.title || !posFormData.code) {
      setPosFormError("Vui lòng nhập đầy đủ tên và mã chức danh.");
      return;
    }

    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
      setPosFormError("Mức lương Min và Max phải là số dương hợp lệ.");
      return;
    }

    if (min >= max) {
      setPosFormError("Mức lương tối thiểu (Min) BẮT BUỘC phải nhỏ hơn mức tối đa (Max)!");
      return;
    }

    setSaving(true);
    try {
      await masterDataService.saveJobTitle({
        name: posFormData.title.trim(),
        level: posFormData.level,
        department_id: md?.depts.find((d) => d.name === posFormData.department)?.id ?? null,
        min_salary: min,
        max_salary: max,
        description: `[${posFormData.code.trim().toUpperCase()}]`,
      }, posModalMode === "edit" && editingPos ? Number(editingPos.id) : undefined);
      showToast(posModalMode === "create"
        ? `Đã thiết lập chức danh "${posFormData.title}" với dải lương được phê duyệt!`
        : `Cập nhật dải lương chức danh "${posFormData.title}" thành công!`, "success");
      setIsPosModalOpen(false);
      reload();
    } catch (err) {
      setPosFormError(err instanceof ApiError ? err.message : "Không lưu được chức danh.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered Positions
  const filteredPositions = useMemo(() => {
    const q = posSearch.trim().toLowerCase();
    return jobPositions.filter((p) => {
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q);
      const matchLevel = posLevelFilter === "all" || p.level === posLevelFilter;
      return matchSearch && matchLevel;
    });
  }, [jobPositions, posSearch, posLevelFilter]);

  // Tab 3: Quick Add item to active dictionary
  const handleQuickAddDictionary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) return;
    const type = activeDictionaryType === "sources" && requestedType && !Object.values(DICT_TYPES).includes(requestedType as never)
      ? requestedType : DICT_TYPES[activeDictionaryType];
    try {
      const created = await masterDataService.createCategory({
        category_type: type, name: quickAddName.trim(), sort_order: dictionaries[activeDictionaryType].length,
      });
      setQuickAddName("");
      setQuickAddCode("");
      showToast(`Đã thêm mới mục "${created.name}" vào từ điển hệ thống!`, "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thêm được mục.", "error");
    }
  };

  // Tab 3: Inline edit save (renaming is blocked by the server while the value is referenced)
  const handleSaveInlineEdit = async (id: string) => {
    if (!inlineEditValue.name.trim()) return;
    const current = dictionaries[activeDictionaryType].find((i) => i.id === id);
    try {
      await masterDataService.updateCategory(Number(id), { name: inlineEditValue.name.trim(), is_active: current?.isActive ?? true });
      setInlineEditingId(null);
      showToast("Cập nhật thông tin từ điển thành công!", "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không cập nhật được mục.", "error");
    }
  };

  // Tab 3: Delete dictionary item (values in use cannot be deleted — deactivate them instead)
  const handleDeleteDictionaryItem = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mục "${name}" khỏi từ điển không?`)) return;
    try {
      await masterDataService.deleteCategory(Number(id));
      showToast(`Đã xóa mục "${name}"!`, "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không xóa được mục.", "error");
    }
  };

  // Recursive Tree Node Renderer for Tab 1
  const renderDepartmentNode = (node: DepartmentNode, depth: number = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = depth === 0;

    return (
      <div key={node.id} className="relative">
        {/* Node Card */}
        <div
          className={`group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all duration-200 mb-2.5 shadow-2xs ${
            isRoot
              ? "bg-blue-50/70 border-blue-200 ring-1 ring-blue-500/20"
              : depth === 1
              ? "bg-slate-50/90 border-slate-200 hover:border-blue-300 hover:bg-blue-50/20"
              : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
          }`}
          style={{ marginLeft: `${Math.min(depth * 28, 140)}px` }}
        >
          {/* Left Column: Expand toggle, Name, Code, Manager */}
          <div className="flex items-start md:items-center gap-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors shrink-0 shadow-2xs cursor-pointer mt-0.5 md:mt-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-7 h-7 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
              </div>
            )}

            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              {isRoot ? (
                <Building className="w-5 h-5 text-blue-600" />
              ) : depth === 1 ? (
                <Layers className="w-4 h-4 text-indigo-600" />
              ) : (
                <Building2 className="w-4 h-4 text-slate-600" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {node.name}
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  {node.code}
                </span>
                {hasChildren && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-700">
                    {node.children?.length} nhánh con
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-medium flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  Trưởng bộ phận: <strong className="text-slate-700 font-bold">{node.managerName}</strong>
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-slate-400">{node.description}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Headcount Progress & Action Buttons */}
          <div className="flex items-center justify-between md:justify-end gap-4 mt-3 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            {/* Headcount Stat */}
            <div className="text-right">
              <div className="text-xs font-extrabold text-slate-900">
                {node.currentMembers} / {node.targetHeadcount} nhân sự
              </div>
              <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(
                      Math.round((node.currentMembers / (node.targetHeadcount || 1)) * 100),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setDeptFormData({
                    name: "",
                    code: "",
                    parentId: node.id,
                    managerName: "",
                    managerEmail: "",
                    targetHeadcount: 10,
                    description: "",
                  });
                  setDeptModalMode("create");
                  setIsDeptModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100/70 transition-colors cursor-pointer"
                title="Thêm phòng ban con trực thuộc"
              >
                <FolderPlus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingDept(node);
                  setDeptFormData({
                    name: node.name,
                    code: node.code,
                    parentId: node.parentId || "",
                    managerName: node.managerName,
                    managerEmail: node.managerEmail,
                    targetHeadcount: node.targetHeadcount,
                    description: node.description,
                  });
                  setDeptModalMode("edit");
                  setIsDeptModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Chỉnh sửa thông tin phòng ban"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map((child) => renderDepartmentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <LoadingState />;
  if (error || !md) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification Alert */}
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
        {/* Header Tiêu đề phân hệ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-100">
                HR Manager Control Panel
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
              <Network className="w-7 h-7 text-blue-600" />
              Danh Mục & Cơ Cấu Tổ Chức
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Quản trị cây sơ đồ phòng ban, ma trận chức danh & dải lương khóa chặn, và các từ điển danh mục dùng chung.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
              Cơ cấu: <strong className="text-blue-600 font-extrabold">{allDepartmentsFlat.length}</strong> đơn vị
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
              Dải lương: <strong className="text-emerald-600 font-extrabold">{jobPositions.length}</strong> chức danh
            </div>
          </div>
        </div>

        {/* 3 TABS NAVIGATION BUTTONS */}
        <div className="flex border-b border-slate-200/80 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("org")}
            className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "org"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Network className="w-4 h-4" />
            <span>1. Sơ đồ phòng ban (Org Tree)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("salary")}
            className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "salary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>2. Chức danh & Dải lương phê duyệt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("dictionary")}
            className={`flex items-center gap-2 pb-3.5 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "dictionary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>3. Danh mục chung & Từ điển</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SƠ ĐỒ PHÒNG BAN (TREE VIEW)                                        */}
        {/* ========================================================================= */}
        {activeTab === "org" && (
          <div className="space-y-6">
            {/* Top Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Mở rộng tất cả
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Thu gọn
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeptFormData({
                    name: "",
                    code: "",
                    parentId: "",
                    managerName: "",
                    managerEmail: "",
                    targetHeadcount: 10,
                    description: "",
                  });
                  setDeptModalMode("create");
                  setIsDeptModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm phòng ban mới</span>
              </button>
            </div>

            {/* Tree View Container */}
            <div className="p-4 md:p-6 bg-slate-50/40 rounded-2xl border border-slate-200/80 space-y-1">
              {orgData.map((rootNode) => renderDepartmentNode(rootNode, 0))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CHỨC DANH & DẢI LƯƠNG                                              */}
        {/* ========================================================================= */}
        {activeTab === "salary" && (
          <div className="space-y-6">
            {/* Action Bar & Filter */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Tên chức danh, Mã hoặc Phòng ban..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                <select
                  value={posLevelFilter}
                  onChange={(e) => setPosLevelFilter(e.target.value)}
                  className="h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả cấp bậc</option>
                  <option value="Junior">Junior</option>
                  <option value="Middle">Middle</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setPosFormData({
                      title: "",
                      code: "",
                      level: "Senior",
                      department: allDepartmentsFlat[0]?.name || "Khối Kỹ Thuật",
                      minSalary: 25000000,
                      maxSalary: 40000000,
                      isOfferLocked: true,
                    });
                    setPosFormError(null);
                    setPosModalMode("create");
                    setIsPosModalOpen(true);
                  }}
                  className="h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm chức danh & dải lương</span>
                </button>
              </div>
            </div>

            {/* Warning Rule Note */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-900">Quy tắc Khóa Chặn Mức Offer:</strong>{" "}
                Dải lương Min - Max được lưu làm trần ngân sách cho từng vị trí tuyển dụng. Khi chuyên viên HR tạo Offer,
                mức offer bắt buộc phải nằm trong khoảng Min - Max này để ngăn ngừa chi tiêu vượt ngân sách.
              </div>
            </div>

            {/* Table */}
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-5">Tên Chức Danh & Mã</th>
                      <th className="py-3.5 px-5">Cấp Bậc (Level)</th>
                      <th className="py-3.5 px-5">Phòng Ban Trực Thuộc</th>
                      <th className="py-3.5 px-5">Dải Lương Phê Duyệt (Min - Max)</th>
                      <th className="py-3.5 px-5 text-center">Khóa Chặn Offer</th>
                      <th className="py-3.5 px-5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredPositions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {p.title}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                            {p.code}
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
                              p.level === "Senior"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : p.level === "Lead" || p.level === "Manager"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {p.level}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-slate-600">
                          {p.department}
                        </td>

                        {/* Approved Salary Range */}
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {formatVND(p.minSalary)} <span className="text-slate-400 font-normal">đến</span> {formatVND(p.maxSalary)}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            <Coins className="w-3 h-3" />
                            Dải biên độ: {formatVND(p.maxSalary - p.minSalary)}
                          </div>
                        </td>

                        {/* Lock status */}
                        <td className="py-3.5 px-5 text-center">
                          {p.isOfferLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã khóa chặn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              Linh hoạt
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPos(p);
                                setPosFormData({
                                  title: p.title,
                                  code: p.code,
                                  level: p.level,
                                  department: p.department,
                                  minSalary: p.minSalary,
                                  maxSalary: p.maxSalary,
                                  isOfferLocked: p.isOfferLocked,
                                });
                                setPosFormError(null);
                                setPosModalMode("edit");
                                setIsPosModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Sửa dải lương"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn ngừng áp dụng chức danh "${p.title}" không?`)) {
                                  masterDataService.deactivateJobTitle(Number(p.id))
                                    .then(() => { showToast(`Đã ngừng áp dụng chức danh "${p.title}"!`, "success"); reload(); })
                                    .catch((err) => showToast(err instanceof ApiError ? err.message : "Không cập nhật được chức danh.", "error"));
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa chức danh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DANH MỤC CHUNG & TỪ ĐIỂN                                           */}
        {/* ========================================================================= */}
        {activeTab === "dictionary" && (
          <div className="space-y-6">
            {/* Dictionary Selector Sub-Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setActiveDictionaryType("sources")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  activeDictionaryType === "sources"
                    ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
                  <span>1. Nguồn ứng viên</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {dictionaries.sources.length} mục
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  LinkedIn, Referral, VietnamWorks, TopCV, Sự kiện...
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveDictionaryType("reasons")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  activeDictionaryType === "reasons"
                    ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
                  <span>2. Lý do loại / từ chối</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {dictionaries.reasons.length} mục
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Trượt phỏng vấn kỹ thuật, lương vượt trần, văn hóa...
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveDictionaryType("contractTypes")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                  activeDictionaryType === "contractTypes"
                    ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
                  <span>3. Loại hình hợp đồng</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                    {dictionaries.contractTypes.length} mục
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Thử việc, xác định thời hạn 1 năm, không xác định thời hạn...
                </p>
              </button>
            </div>

            {/* Quick Add Bar */}
            <form onSubmit={handleQuickAddDictionary} className="flex flex-col sm:flex-row gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
              <input
                type="text"
                placeholder={`Nhập tên mục mới cho từ điển ${
                  activeDictionaryType === "sources"
                    ? "Nguồn ứng viên"
                    : activeDictionaryType === "reasons"
                    ? "Lý do loại"
                    : "Loại hợp đồng"
                }...`}
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <input
                type="text"
                placeholder="Mã code (Tùy chọn)"
                value={quickAddCode}
                onChange={(e) => setQuickAddCode(e.target.value)}
                className="w-full sm:w-44 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm nhanh</span>
              </button>
            </form>

            {/* Dictionary Items List with Inline Editing */}
            <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-5">Tên Danh Mục (Hiển Thị)</th>
                    <th className="py-3 px-5">Mã Hệ Thống (Code)</th>
                    <th className="py-3 px-5">Mô Tả / Ghi Chú</th>
                    <th className="py-3 px-5 text-center">Lượt Sử Dụng</th>
                    <th className="py-3 px-5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dictionaries[activeDictionaryType].map((item) => {
                    const isEditing = inlineEditingId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name Column */}
                        <td className="py-3.5 px-5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={inlineEditValue.name}
                              onChange={(e) =>
                                setInlineEditValue({ ...inlineEditValue, name: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-blue-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                            />
                          ) : (
                            <span className="font-extrabold text-slate-900">{item.name}</span>
                          )}
                        </td>

                        {/* Code Column */}
                        <td className="py-3.5 px-5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={inlineEditValue.code}
                              onChange={(e) =>
                                setInlineEditValue({ ...inlineEditValue, code: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-blue-400 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none uppercase"
                            />
                          ) : (
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                              {item.code}
                            </span>
                          )}
                        </td>

                        {/* Description Column */}
                        <td className="py-3.5 px-5 text-slate-500">
                          {isEditing ? (
                            <input
                              type="text"
                              value={inlineEditValue.description}
                              onChange={(e) =>
                                setInlineEditValue({
                                  ...inlineEditValue,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-blue-400 rounded-lg text-xs text-slate-700 focus:outline-none"
                            />
                          ) : (
                            item.description || "---"
                          )}
                        </td>

                        {/* Usage Count */}
                        <td className="py-3.5 px-5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                            {item.usageCount} hồ sơ
                          </span>
                        </td>

                        {/* Actions (Inline Edit / Save) */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSaveInlineEdit(item.id)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold transition-colors cursor-pointer"
                                  title="Lưu thay đổi"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInlineEditingId(null)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="Hủy"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInlineEditingId(item.id);
                                    setInlineEditValue({
                                      name: item.name,
                                      code: item.code,
                                      description: item.description || "",
                                    });
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Sửa nhanh (Inline edit)"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDictionaryItem(item.id, item.name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Xóa mục"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: THÊM / SỬA PHÒNG BAN                                              */}
      {/* ========================================================================= */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                    {deptModalMode === "create" ? "Thêm Phòng Ban Mới" : "Cập Nhật Phòng Ban"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Thiết lập phân cấp phòng ban và định biên nhân sự (Headcount)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Tên phòng ban *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phòng Tuyển Dụng & Đào Tạo"
                    value={deptFormData.name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Mã phòng ban *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: DEPT-TA-01"
                    value={deptFormData.code}
                    onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Phòng ban cha (Cấp trên trực tiếp)
                </label>
                <select
                  value={deptFormData.parentId}
                  onChange={(e) => setDeptFormData({ ...deptFormData, parentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-blue-600"
                >
                  {allDepartmentsFlat.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Họ và tên Trưởng phòng / Lead *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Trần Thị HR Manager"
                    value={deptFormData.managerName}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, managerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Định biên nhân sự mục tiêu (Headcount)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ví dụ: 15"
                    value={deptFormData.targetHeadcount}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, targetHeadcount: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Mô tả chức năng & nhiệm vụ
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt vai trò và trách nhiệm của đơn vị..."
                  value={deptFormData.description}
                  onChange={(e) =>
                    setDeptFormData({ ...deptFormData, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                >
                  {deptModalMode === "create" ? "Xác nhận tạo phòng ban" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: THÊM / SỬA CHỨC DANH & DẢI LƯƠNG (KHÓA CHẶN OFFER)                */}
      {/* ========================================================================= */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                    {posModalMode === "create"
                      ? "Thiết Lập Chức Danh & Dải Lương Mới"
                      : "Điều Chỉnh Dải Lương Phê Duyệt"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Khóa chặn dải lương trần và sàn để bảo vệ ngân sách tuyển dụng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPosModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePosition} className="p-6 space-y-4 text-xs">
              {posFormError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{posFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Tên chức danh vị trí *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Senior Backend Developer"
                    value={posFormData.title}
                    onChange={(e) => setPosFormData({ ...posFormData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Mã chức vụ (Job Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: TECH-BE-SR"
                    value={posFormData.code}
                    onChange={(e) => setPosFormData({ ...posFormData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Cấp bậc (Level)
                  </label>
                  <select
                    value={posFormData.level}
                    onChange={(e) =>
                      setPosFormData({ ...posFormData, level: e.target.value as JobPosition["level"] })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Intern">Intern / Thực tập sinh</option>
                    <option value="Junior">Junior</option>
                    <option value="Middle">Middle</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead / Chuyên gia trưởng</option>
                    <option value="Manager">Manager / Trưởng phòng</option>
                    <option value="Director">Director / Giám đốc khối</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Phòng ban trực thuộc
                  </label>
                  <select
                    value={posFormData.department}
                    onChange={(e) => setPosFormData({ ...posFormData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-blue-600"
                  >
                    {allDepartmentsFlat.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dải lương Min - Max Phê Duyệt */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="font-extrabold text-emerald-900 text-xs flex items-center justify-between">
                  <span>DẢI LƯƠNG PHÊ DUYỆT (BẮT BUỘC NHẬP MIN - MAX)</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Khóa chặn Offer SLA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mức lương TỐI THIỂU - MIN (VND) *
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      required
                      placeholder="Ví dụ: 30000000"
                      value={posFormData.minSalary}
                      onChange={(e) =>
                        setPosFormData({ ...posFormData, minSalary: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600 text-sm"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      = {formatVND(posFormData.minSalary || 0)}
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mức lương TỐI ĐA - MAX (VND) *
                    </label>
                    <input
                      type="number"
                      step="1000000"
                      required
                      placeholder="Ví dụ: 50000000"
                      value={posFormData.maxSalary}
                      onChange={(e) =>
                        setPosFormData({ ...posFormData, maxSalary: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-extrabold text-emerald-700 focus:outline-none focus:border-emerald-600 text-sm"
                    />
                    <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                      = {formatVND(posFormData.maxSalary || 0)}
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-1 text-slate-700 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={posFormData.isOfferLocked}
                    onChange={(e) =>
                      setPosFormData({ ...posFormData, isOfferLocked: e.target.checked })
                    }
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <span>
                    Bật cơ chế kiểm tra tự động: Cấm phát hành thư mời (Offer Letter) vượt quá mức Max
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPosModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
                >
                  {posModalMode === "create" ? "Phê duyệt chức danh" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// useSearchParams (?type=) needs a Suspense boundary for static rendering
export default function HRCategoriesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HRCategoriesContent />
    </Suspense>
  );
}
