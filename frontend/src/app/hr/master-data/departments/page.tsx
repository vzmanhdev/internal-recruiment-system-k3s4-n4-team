"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Building,
  Layers,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  FolderPlus,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Users,
  Briefcase,
  FileText,
  ShieldAlert,
  Power,
  RotateCcw,
} from "lucide-react";
import { masterDataService, type Department, type Person } from "@/services/master-data.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export interface DepartmentNode extends Department {
  depth: number;
  targetHeadcount?: number;
  children?: DepartmentNode[];
}

function buildDepartmentTree(
  rows: Department[],
  budgets: Map<number, number>,
  statusFilter: "all" | "active" | "inactive"
): DepartmentNode[] {
  // Filter rows based on status if needed, but keep parents if children match
  const filteredRows = rows.filter((d) => {
    if (statusFilter === "active") return d.is_active;
    if (statusFilter === "inactive") return !d.is_active;
    return true;
  });

  const byParent = new Map<number | null, Department[]>();
  const allIds = new Set(rows.map((d) => d.id));

  rows.forEach((d) => {
    const parentKey = d.parent_id && allIds.has(d.parent_id) ? d.parent_id : null;
    byParent.set(parentKey, [...(byParent.get(parentKey) || []), d]);
  });

  const buildSubtree = (item: Department, depth: number): DepartmentNode => {
    const rawChildren = byParent.get(item.id) || [];
    const childrenNodes = rawChildren
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map((c) => buildSubtree(c, depth + 1));

    return {
      ...item,
      depth,
      targetHeadcount: budgets.get(item.id) || 0,
      children: childrenNodes,
    };
  };

  const roots = (byParent.get(null) || []).sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  );

  return roots.map((r) => buildSubtree(r, 0));
}

// Helper: Get all descendant IDs of a department (used to prevent cycles)
function getDescendantIds(deptId: number, allDepts: Department[]): Set<number> {
  const result = new Set<number>();
  const traverse = (currentId: number) => {
    const children = allDepts.filter((d) => d.parent_id === currentId);
    for (const child of children) {
      result.add(child.id);
      traverse(child.id);
    }
  };
  traverse(deptId);
  return result;
}

export default function HRDepartmentsPage() {
  const [includeInactive, setIncludeInactive] = useState(true);
  const [statusTab, setStatusTab] = useState<"all" | "active" | "inactive">("all");

  const { data, error, loading, reload } = useApiData(async () => {
    const year = new Date().getFullYear();
    const [depts, budgets, managers] = await Promise.all([
      masterDataService.departments(true),
      masterDataService.headcounts().catch(() => []),
      masterDataService.people("all_managers").catch(async () => {
        return masterDataService.people().catch(() => []);
      }),
    ]);

    return {
      depts,
      year,
      budgets: new Map(budgets.filter((b) => b.year === year).map((b) => [b.department_id, b.budget_quantity])),
      managers: managers as Person[],
    };
  }, []);

  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [deptSearch, setDeptSearch] = useState("");

  // Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptModalMode, setDeptModalMode] = useState<"create" | "edit">("create");
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    parentId: "" as string,
    headUserId: "" as string,
    description: "",
    sortOrder: 0,
    targetHeadcount: 10,
  });

  // Conflict / Warning Modal
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    deptName: string;
    deptId: number;
    message: string;
  }>({
    isOpen: false,
    deptName: "",
    deptId: 0,
    message: "",
  });

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Build tree
  const orgTree = useMemo(() => {
    if (!data?.depts) return [];
    return buildDepartmentTree(data.depts, data.budgets, statusTab);
  }, [data, statusTab]);

  // Counts
  const counts = useMemo(() => {
    if (!data?.depts) return { total: 0, active: 0, inactive: 0 };
    const total = data.depts.length;
    const active = data.depts.filter((d) => d.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [data]);

  // Expand / Collapse
  const toggleNode = (id: number) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    if (!data?.depts) return;
    const map: Record<number, boolean> = {};
    data.depts.forEach((d) => {
      map[d.id] = true;
    });
    setExpandedNodes(map);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Valid parent department options for Modal (Anti-Cycle: excludes editingDept & its descendants)
  const availableParents = useMemo(() => {
    if (!data?.depts) return [];

    let disallowedIds = new Set<number>();
    if (deptModalMode === "edit" && editingDeptId !== null) {
      disallowedIds.add(editingDeptId);
      const descendants = getDescendantIds(editingDeptId, data.depts);
      descendants.forEach((id) => disallowedIds.add(id));
    }

    // Format list with hierarchy indentations
    const list: { id: string; name: string; level: number }[] = [
      { id: "", name: "— Trực thuộc công ty (Cấp 1 cao nhất) —", level: 0 },
    ];

    const traverse = (nodes: DepartmentNode[]) => {
      nodes.forEach((n) => {
        if (!disallowedIds.has(n.id)) {
          const indent = "— ".repeat(n.depth);
          list.push({
            id: String(n.id),
            name: `${indent}${n.name} (${n.code})`,
            level: n.depth,
          });
        }
        if (n.children && n.children.length > 0) {
          traverse(n.children);
        }
      });
    };

    traverse(orgTree);
    return list;
  }, [data?.depts, orgTree, deptModalMode, editingDeptId]);

  // Open Create Modal
  const openCreateModal = (parentId?: number) => {
    setDeptModalMode("create");
    setEditingDeptId(null);
    setFormData({
      name: "",
      code: "",
      parentId: parentId ? String(parentId) : "",
      headUserId: data?.managers?.[0]?.id ? String(data.managers[0].id) : "",
      description: "",
      sortOrder: 0,
      targetHeadcount: 10,
    });
    setIsDeptModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (node: DepartmentNode) => {
    setDeptModalMode("edit");
    setEditingDeptId(node.id);
    setFormData({
      name: node.name,
      code: node.code,
      parentId: node.parent_id ? String(node.parent_id) : "",
      headUserId: node.head_user_id ? String(node.head_user_id) : "",
      description: node.description || "",
      sortOrder: node.sort_order || 0,
      targetHeadcount: node.targetHeadcount || 10,
    });
    setIsDeptModalOpen(true);
  };

  // Save Department Form
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast("Vui lòng nhập Tên phòng ban và Mã phòng ban.", "error");
      return;
    }
    if (!formData.headUserId) {
      showToast("Bắt buộc phải chọn Người phụ trách / Trưởng bộ phận theo quy định AC2.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        parent_id: formData.parentId ? Number(formData.parentId) : null,
        head_user_id: Number(formData.headUserId),
        description: formData.description.trim() || undefined,
        sort_order: formData.sortOrder,
        is_active: true,
      };

      const saved = await masterDataService.saveDepartment(
        payload,
        deptModalMode === "edit" && editingDeptId !== null ? editingDeptId : undefined
      );

      // Save headcount if modified
      if (formData.targetHeadcount > 0 && data?.year) {
        await masterDataService
          .saveHeadcount({
            department_id: saved.id,
            year: data.year,
            budget_quantity: formData.targetHeadcount,
          })
          .catch(() => {});
      }

      if (formData.parentId) {
        setExpandedNodes((prev) => ({ ...prev, [Number(formData.parentId)]: true }));
      }

      showToast(
        deptModalMode === "create"
          ? `Đã thêm mới phòng ban "${saved.name}" thành công!`
          : `Đã cập nhật phòng ban "${saved.name}" thành công!`,
        "success"
      );
      setIsDeptModalOpen(false);
      reload();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Không thể lưu thông tin phòng ban.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // Deactivate Department (AC3)
  const handleDeactivate = async (node: DepartmentNode) => {
    if (!confirm(`Bạn có chắc chắn muốn ngừng áp dụng phòng ban "${node.name}" không?\nPhòng ban sẽ không còn xuất hiện khi tạo yêu cầu tuyển dụng mới.`)) {
      return;
    }

    try {
      await masterDataService.deactivateDepartment(node.id);
      showToast(`Đã ngừng áp dụng phòng ban "${node.name}" thành công!`, "success");
      reload();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi ngừng áp dụng phòng ban.";
      showToast(msg, "error");
    }
  };

  // Reactivate Department (AC3)
  const handleActivate = async (node: DepartmentNode) => {
    try {
      await masterDataService.activateDepartment(node.id);
      showToast(`Đã kích hoạt lại phòng ban "${node.name}" thành công!`, "success");
      reload();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Lỗi khi kích hoạt lại phòng ban.";
      showToast(msg, "error");
    }
  };

  // Delete Department (AC3: Handles 409 Conflict with explanation)
  const handleDelete = async (node: DepartmentNode) => {
    if (!confirm(`CẢNH BÁO: Bạn đang yêu cầu XÓA VĨNH VIỄN phòng ban "${node.name}".\n\nHệ thống sẽ kiểm tra ràng buộc. Nếu có yêu cầu tuyển dụng hoặc tin tuyển dụng mở, việc xóa sẽ bị chặn theo quy tắc AC3.`)) {
      return;
    }

    try {
      await masterDataService.deleteDepartment(node.id);
      showToast(`Đã xóa hoàn toàn phòng ban "${node.name}".`, "success");
      reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Business Rule AC3 Conflict!
        setConflictModal({
          isOpen: true,
          deptName: node.name,
          deptId: node.id,
          message: err.message,
        });
      } else {
        const msg = err instanceof ApiError ? err.message : "Không thể xóa phòng ban.";
        showToast(msg, "error");
      }
    }
  };

  // Recursive Tree Node Renderer
  const renderDepartmentNode = (node: DepartmentNode) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const depth = node.depth;
    const isRoot = depth === 0;

    const matchesSearch =
      !deptSearch ||
      node.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      node.code.toLowerCase().includes(deptSearch.toLowerCase()) ||
      (node.head_name && node.head_name.toLowerCase().includes(deptSearch.toLowerCase())) ||
      (node.head_email && node.head_email.toLowerCase().includes(deptSearch.toLowerCase()));

    return (
      <div key={node.id} className="relative">
        {matchesSearch && (
          <div
            className={`group flex flex-col lg:flex-row lg:items-center justify-between p-4 rounded-2xl border transition-all duration-200 mb-3 shadow-2xs ${
              !node.is_active
                ? "bg-slate-100/70 border-slate-300/80 opacity-75"
                : isRoot
                ? "bg-gradient-to-r from-blue-50/90 to-indigo-50/50 border-blue-200 ring-1 ring-blue-500/20"
                : depth === 1
                ? "bg-slate-50/95 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
            }`}
            style={{ marginLeft: `${Math.min(depth * 32, 160)}px` }}
          >
            {/* Left: Expand toggle, Level icon, Details */}
            <div className="flex items-start md:items-center gap-3.5">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleNode(node.id)}
                  className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0 shadow-2xs cursor-pointer mt-0.5 md:mt-0"
                  aria-label={isExpanded ? "Thu gọn nhánh" : "Mở rộng nhánh"}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-7 h-7 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
              )}

              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border ${
                  !node.is_active
                    ? "bg-slate-200 border-slate-300 text-slate-500"
                    : isRoot
                    ? "bg-blue-600 border-blue-600 text-white"
                    : depth === 1
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                {isRoot ? (
                  <Building className="w-5 h-5" />
                ) : depth === 1 ? (
                  <Layers className="w-4 h-4" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {node.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {node.code}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isRoot
                        ? "bg-blue-100 text-blue-800"
                        : depth === 1
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    Cấp {depth + 1}
                  </span>
                  {hasChildren && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700">
                      {node.children?.length} nhánh con
                    </span>
                  )}
                  {!node.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                      Ngừng áp dụng
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 font-medium flex flex-wrap items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-0.5 rounded-md">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-slate-500">Người phụ trách:</span>
                    <strong className="text-slate-800 font-bold">
                      {node.head_name || "Chưa phân công"}
                    </strong>
                    {node.head_title && (
                      <span className="text-slate-400 text-[10px]">({node.head_title})</span>
                    )}
                  </span>
                  {node.open_positions ? (
                    <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                      <Briefcase className="w-3 h-3 text-emerald-600" />
                      {node.open_positions} vị trí tuyển
                    </span>
                  ) : null}
                  {node.description && (
                    <span className="text-slate-500 hidden sm:inline max-w-md truncate">
                      • {node.description}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Metrics & Actions */}
            <div className="flex items-center justify-between lg:justify-end gap-5 mt-3 lg:mt-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/60">
              {/* Headcount progress */}
              <div className="text-right">
                <div className="text-xs font-extrabold text-slate-900">
                  {node.member_count || 0} / {node.targetHeadcount || 10} nhân sự
                </div>
                <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                  <div
                    className={`h-1.5 rounded-full ${
                      (node.member_count || 0) >= (node.targetHeadcount || 10)
                        ? "bg-amber-500"
                        : "bg-blue-600"
                    }`}
                    style={{
                      width: `${Math.min(
                        Math.round(((node.member_count || 0) / (node.targetHeadcount || 10)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Add Sub-department */}
                <button
                  type="button"
                  onClick={() => openCreateModal(node.id)}
                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                  title="Thêm phòng ban con trực thuộc"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEditModal(node)}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Chỉnh sửa thông tin phòng ban"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Deactivate / Reactivate (AC3) */}
                {node.is_active ? (
                  <button
                    type="button"
                    onClick={() => handleDeactivate(node)}
                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                    title="Ngừng áp dụng phòng ban (Bảo toàn lịch sử REQ/Job)"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleActivate(node)}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="Kích hoạt lại phòng ban này"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                {/* Delete (AC3 Check) */}
                <button
                  type="button"
                  onClick={() => handleDelete(node)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa phòng ban (Chặn nếu có REQ/Job mở)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Child Nodes */}
        {hasChildren && (isExpanded || deptSearch) && (
          <div className="space-y-1">
            {node.children!.map((child) => renderDepartmentNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-50 border border-emerald-300 text-emerald-900"
              : "bg-rose-50 border border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs hover:opacity-75 cursor-pointer font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Cơ Cấu Phòng Ban & Sơ Đồ Tổ Chức
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-blue-200">
              SCRUM-43 / [S2-04]
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Khai báo cơ cấu cây phòng ban đa cấp, gắn Trưởng bộ phận phụ trách duyệt và quản lý định biên Headcount
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khối / Phòng Ban Cấp 1</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "all"
                ? "bg-white text-blue-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tất cả ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "active"
                ? "bg-white text-emerald-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đang áp dụng ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("inactive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusTab === "inactive"
                ? "bg-white text-slate-700 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Đã ngừng áp dụng ({counts.inactive})
          </button>
        </div>

        {/* Search & Tree View Actions */}
        <div className="flex items-center gap-2.5 flex-1 md:max-w-md ml-auto">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên phòng ban, mã, trưởng bộ phận..."
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            Mở rộng
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {/* Org Tree View */}
      <div className="border border-slate-200/90 rounded-3xl p-6 bg-white shadow-2xs">
        <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
          <span>Sơ Đồ Phân Cấp Cây Phòng Ban (Tree Hierarchy)</span>
          <span className="text-slate-600 font-bold">
            Hiển thị {orgTree.length} khối chính • {counts.total} đơn vị trực thuộc
          </span>
        </div>

        <div className="space-y-1">
          {orgTree.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium">
              Không tìm thấy phòng ban nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            orgTree.map((rootNode) => renderDepartmentNode(rootNode))
          )}
        </div>
      </div>

      {/* Modal: Thêm / Sửa Phòng Ban */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {deptModalMode === "create" ? "Thêm Phòng Ban Mới" : "Cập Nhật Thông Tin Phòng Ban"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Thiết lập cấp bậc phân cấp (AC1) và gán Trưởng bộ phận phụ trách (AC2)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên phòng ban <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Bộ Phận Phát Triển Phần Mềm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã phòng ban <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: IT-DEV"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Parent Department Selector with Anti-Cycle Protection (AC1) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Đơn vị cấp trên trực tiếp (Phòng ban cha)</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Tự động chống chu trình</span>
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  {availableParents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Head Selector (AC2: Mandatory from live DB) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Người phụ trách (Head) <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Bắt buộc theo AC2</span>
                  </label>
                  <select
                    required
                    value={formData.headUserId}
                    onChange={(e) => setFormData({ ...formData, headUserId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                  >
                    <option value="">— Chọn Người phụ trách phòng ban —</option>
                    {(data?.managers || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} — {m.job_title || m.role?.toUpperCase()} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Định biên nhân sự (Headcount)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ví dụ: 15"
                    value={formData.targetHeadcount}
                    onChange={(e) =>
                      setFormData({ ...formData, targetHeadcount: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chức năng & nhiệm vụ
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả chức năng, nhiệm vụ chính của phòng ban..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <span>Đang lưu...</span>
                  ) : deptModalMode === "create" ? (
                    <span>Xác nhận tạo phòng ban</span>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AC3 Conflict Modal: Prevent Delete & Prompt Deactivation */}
      {conflictModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Không Thể Xóa Phòng Ban (Quy tắc AC3)
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Ràng buộc toàn vẹn dữ liệu tuyển dụng
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs font-medium space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Chi tiết ràng buộc:</span>
              </div>
              <p className="text-[11px] leading-relaxed">{conflictModal.message}</p>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Theo quy chuẩn <strong>AC3</strong>, bạn không được phép xóa phòng ban đang có yêu cầu tuyển dụng hoặc tin tuyển dụng mở. Thay vào đó, hãy <strong>Ngừng áp dụng</strong> phòng ban này để bảo toàn dữ liệu lịch sử và ngăn ngừa việc khởi tạo yêu cầu tuyển dụng mới.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConflictModal({ isOpen: false, deptName: "", deptId: 0, message: "" })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = conflictModal.deptId;
                  const name = conflictModal.deptName;
                  setConflictModal({ isOpen: false, deptName: "", deptId: 0, message: "" });
                  try {
                    await masterDataService.deactivateDepartment(id);
                    showToast(`Đã chuyển phòng ban "${name}" sang trạng thái Ngừng áp dụng!`, "success");
                    reload();
                  } catch (err) {
                    showToast("Không thể ngừng áp dụng phòng ban.", "error");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Ngừng áp dụng ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
