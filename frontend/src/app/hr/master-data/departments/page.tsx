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
  X,
  Users,
} from "lucide-react";
import { masterDataService, type Department } from "@/services/master-data.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";

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

type DeptRow = Department & { head_name?: string | null; member_count?: number };

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

export default function HRDepartmentsPage() {
  const { data, error, loading, reload } = useApiData(async () => {
    const year = new Date().getFullYear();
    const [depts, budgets, hm, hr] = await Promise.all([
      masterDataService.departments(false) as Promise<DeptRow[]>,
      masterDataService.headcounts().catch(() => []),
      masterDataService.people("hiring_manager").catch(() => []),
      masterDataService.people("hr_manager").catch(() => []),
    ]);
    return {
      depts,
      year,
      budgets: new Map(budgets.filter((b) => b.year === year).map((b) => [b.department_id, b.budget_quantity])),
      managers: [...hm, ...hr.filter((u) => !hm.some((x) => x.id === u.id))],
    };
  }, []);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [deptSearch, setDeptSearch] = useState("");
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptModalMode, setDeptModalMode] = useState<"create" | "edit">("create");
  const [editingDept, setEditingDept] = useState<DepartmentNode | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [deptFormData, setDeptFormData] = useState({
    name: "",
    code: "",
    parentId: "",
    managerName: "",
    managerEmail: "",
    targetHeadcount: 10,
    description: "",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const orgData = useMemo(() => {
    if (!data) return [];
    return buildTree(data.depts, data.budgets);
  }, [data]);

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

  // Handle Save Department
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormData.name || !deptFormData.code || !deptFormData.managerName) {
      showToast("Vui lòng điền đầy đủ các thông tin bắt buộc (*)", "error");
      return;
    }
    const wanted = deptFormData.managerName.trim().toLowerCase();
    const head =
      deptFormData.managerName === "Chưa gán"
        ? null
        : (data?.managers || []).find(
            (u) => u.full_name.toLowerCase() === wanted || u.email.toLowerCase() === wanted
          );

    if (deptFormData.managerName !== "Chưa gán" && !head) {
      showToast("Không tìm thấy Trưởng phòng / Manager có tên này trong hệ thống.", "error");
      return;
    }

    setSaving(true);
    try {
      const saved = await masterDataService.saveDepartment(
        {
          name: deptFormData.name.trim(),
          code: deptFormData.code.trim().toUpperCase(),
          parent_id: deptFormData.parentId ? Number(deptFormData.parentId) : null,
          head_user_id: head ? head.id : null,
          sort_order: 0,
          is_active: true,
        },
        deptModalMode === "edit" && editingDept ? Number(editingDept.id) : undefined
      );

      if (data && deptFormData.targetHeadcount > 0 && deptFormData.targetHeadcount !== data.budgets.get(saved.id)) {
        await masterDataService.saveHeadcount({
          department_id: saved.id,
          year: data.year,
          budget_quantity: deptFormData.targetHeadcount,
        });
      }

      if (deptFormData.parentId) {
        setExpandedNodes((prev) => ({ ...prev, [deptFormData.parentId]: true }));
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
      showToast(err instanceof ApiError ? err.message : "Không lưu được phòng ban.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle Deactivate / Delete Department
  const handleDeleteDepartment = async (node: DepartmentNode) => {
    if (confirm(`Bạn có chắc chắn muốn ngừng áp dụng phòng ban "${node.name}" không?`)) {
      try {
        await masterDataService.deactivateDepartment(Number(node.id));
        showToast(`Đã ngừng áp dụng phòng ban "${node.name}"!`, "success");
        reload();
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Không thể ngừng áp dụng phòng ban.", "error");
      }
    }
  };

  // Recursive Tree Node Renderer
  const renderDepartmentNode = (node: DepartmentNode, depth: number = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = depth === 0;

    const matchesSearch =
      !deptSearch ||
      node.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
      node.code.toLowerCase().includes(deptSearch.toLowerCase()) ||
      node.managerName.toLowerCase().includes(deptSearch.toLowerCase());

    return (
      <div key={node.id} className="relative">
        {matchesSearch && (
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
            {/* Left: Expand toggle, Name, Code, Manager */}
            <div className="flex items-start md:items-center gap-3">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleNode(node.id)}
                  className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors shrink-0 shadow-2xs cursor-pointer mt-0.5 md:mt-0"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
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
                  {node.description && (
                    <>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <span className="text-slate-400">{node.description}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Headcount Progress & Action Buttons */}
            <div className="flex items-center justify-between md:justify-end gap-4 mt-3 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
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

                <button
                  type="button"
                  onClick={() => handleDeleteDepartment(node)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Ngừng áp dụng phòng ban"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Render child nodes recursively */}
        {hasChildren && (isExpanded || deptSearch) && (
          <div className="space-y-1">
            {node.children!.map((child) => renderDepartmentNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
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
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Cơ Cấu Phòng Ban & Sơ Đồ Tổ Chức (Org Tree)
            </h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              [S2-04] Tree Hierarchy
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý sơ đồ cây phân cấp phòng ban đa tầng, gán Trưởng bộ phận & định biên Headcount
          </p>
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
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phòng Ban Cấp 1</span>
        </button>
      </div>

      {/* Top Search & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên phòng ban, mã, trưởng bộ phận..."
            value={deptSearch}
            onChange={(e) => setDeptSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            Mở rộng tất cả
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs"
          >
            Thu gọn
          </button>
        </div>
      </div>

      {/* Org Tree View */}
      <div className="border border-slate-200/90 rounded-2xl p-5 bg-white shadow-2xs">
        <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Sơ Đồ Phân Cấp Doanh Nghiệp</span>
          <span>{data?.depts.length || 0} đơn vị trực thuộc</span>
        </div>

        <div className="space-y-1">
          {orgData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              Chưa có dữ liệu phòng ban nào được thiết lập.
            </div>
          ) : (
            orgData.map((node) => renderDepartmentNode(node, 0))
          )}
        </div>
      </div>

      {/* Modal: Thêm / Sửa Phòng Ban */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
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
                    Thiết lập cơ cấu phân cấp và định biên nhân sự (Headcount)
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

            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên phòng ban <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Khối Công Nghệ Thông Tin"
                    value={deptFormData.name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã phòng ban <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: DEPT-IT-01"
                    value={deptFormData.code}
                    onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đơn vị cấp trên trực tiếp (Phòng ban cha)
                </label>
                <select
                  value={deptFormData.parentId}
                  onChange={(e) => setDeptFormData({ ...deptFormData, parentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                >
                  {allDepartmentsFlat.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trưởng bộ phận / Lead <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn Trưởng HR"
                    value={deptFormData.managerName}
                    onChange={(e) => setDeptFormData({ ...deptFormData, managerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Định biên Headcount mục tiêu
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ví dụ: 15"
                    value={deptFormData.targetHeadcount}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, targetHeadcount: Number(e.target.value) })
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
                  placeholder="Mô tả tóm tắt trách nhiệm của đơn vị..."
                  value={deptFormData.description}
                  onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Đang lưu..." : deptModalMode === "create" ? "Xác nhận tạo phòng ban" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
