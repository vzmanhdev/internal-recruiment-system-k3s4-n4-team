"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  Plus,
  Search,
  Filter,
  DollarSign,
  Building2,
  CheckCircle2,
  Edit2,
  Trash2,
  ShieldCheck,
  Check,
  Briefcase,
  AlertCircle,
  X,
  Coins,
} from "lucide-react";
import { masterDataService, type JobTitle, type Department } from "@/services/master-data.service";
import { requisitionService } from "@/services/requisition.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";

const LEVELS = ["Intern", "Junior", "Middle", "Senior", "Lead", "Manager", "Director"] as const;
type LevelType = (typeof LEVELS)[number];

const codeOf = (description?: string | null) =>
  /^\[([^\]]+)\]/.exec(description || "")?.[1] || "";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export interface PositionItem {
  id: string;
  rawId: number;
  code: string;
  title: string;
  department: string;
  departmentId: number | null;
  level: LevelType;
  minSalary: number;
  maxSalary: number;
  midSalary: number;
  isOfferLocked: boolean;
  activeOpenings: number;
  status: "active" | "inactive";
}

export default function HRPositionsPage() {
  const { data, error, loading, reload } = useApiData(async () => {
    const [titles, depts, reqs] = await Promise.all([
      masterDataService.jobTitles(),
      masterDataService.departments(false),
      requisitionService.getRequisitions().catch(() => []),
    ]);
    return { titles, depts, reqs };
  }, []);

  const deptMap = useMemo(() => {
    return new Map((data?.depts || []).map((d) => [d.id, d.name]));
  }, [data?.depts]);

  const positions: PositionItem[] = useMemo(() => {
    return (data?.titles || []).map((t: JobTitle) => {
      const activeOpenings = (data?.reqs || [])
        .filter((r) => r.job_title_id === t.id && r.status === "approved")
        .reduce((sum, r) => sum + (r.quantity || 0), 0);

      const matchedLevel =
        LEVELS.find((l) => t.level.toLowerCase().includes(l.toLowerCase())) || "Middle";

      const min = t.min_salary || 0;
      const max = t.max_salary || 0;

      return {
        id: String(t.id),
        rawId: t.id,
        code: codeOf(t.description) || `JT-${t.id}`,
        title: t.name,
        department: t.department_id ? deptMap.get(t.department_id) || "Chưa phân ban" : "Tất cả phòng ban",
        departmentId: t.department_id,
        level: matchedLevel,
        minSalary: min,
        maxSalary: max,
        midSalary: Math.round((min + max) / 2),
        isOfferLocked: true, // S7-04: offers outside the band always require escalation approval
        activeOpenings,
        status: t.is_active ? "active" : "inactive",
      };
    });
  }, [data, deptMap]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return positions.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q);

      const matchesLevel = levelFilter === "all" || p.level === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [positions, searchQuery, levelFilter]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingPos, setEditingPos] = useState<PositionItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    code: "",
    level: "Middle" as LevelType,
    department: "",
    minSalary: 15000000,
    maxSalary: 25000000,
    isOfferLocked: true,
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPos(null);
    setModalMode("create");
    setFormData({
      title: "",
      code: "",
      level: "Middle",
      department: data?.depts?.[0]?.name || "",
      minSalary: 15000000,
      maxSalary: 25000000,
      isOfferLocked: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pos: PositionItem) => {
    setEditingPos(pos);
    setModalMode("edit");
    setFormData({
      title: pos.title,
      code: pos.code,
      level: pos.level,
      department: pos.department === "Tất cả phòng ban" ? "" : pos.department,
      minSalary: pos.minSalary,
      maxSalary: pos.maxSalary,
      isOfferLocked: pos.isOfferLocked,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Position Handler
  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const min = Number(formData.minSalary);
    const max = Number(formData.maxSalary);

    if (!formData.title.trim() || !formData.code.trim()) {
      setFormError("Vui lòng nhập đầy đủ tên và mã chức danh.");
      return;
    }

    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0) {
      setFormError("Mức lương Min và Max phải là số dương hợp lệ.");
      return;
    }

    if (min >= max) {
      setFormError("Mức lương tối thiểu (Min) BẮT BUỘC phải nhỏ hơn mức tối đa (Max)!");
      return;
    }

    setSaving(true);
    try {
      const deptId = data?.depts.find((d) => d.name === formData.department)?.id ?? null;
      await masterDataService.saveJobTitle(
        {
          name: formData.title.trim(),
          level: formData.level,
          department_id: deptId,
          min_salary: min,
          max_salary: max,
          description: `[${formData.code.trim().toUpperCase()}]`,
        },
        modalMode === "edit" && editingPos ? editingPos.rawId : undefined
      );

      showToast(
        modalMode === "create"
          ? `Đã thiết lập chức danh "${formData.title}" với dải lương được phê duyệt!`
          : `Cập nhật dải lương chức danh "${formData.title}" thành công!`,
        "success"
      );
      setIsModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Không lưu được chức danh.");
    } finally {
      setSaving(false);
    }
  };

  // Deactivate Position Handler
  const handleDeactivate = async (pos: PositionItem) => {
    if (confirm(`Bạn có chắc muốn ngừng áp dụng chức danh "${pos.title}" không?`)) {
      try {
        await masterDataService.deactivateJobTitle(pos.rawId);
        showToast(`Đã ngừng áp dụng chức danh "${pos.title}"!`, "success");
        reload();
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Không thể cập nhật chức danh.", "error");
      }
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
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
              Chức Danh & Dải Lương Phê Duyệt (Salary Bands)
            </h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              [S2-05] Standard Pay Bands
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Khóa chặn dải lương theo cấp bậc, quản trị định biên và kiểm soát chi phí tuyển dụng toàn hệ thống
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Chức Danh Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo chức danh, mã chức danh, phòng ban..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
          >
            <option value="all">Tất cả cấp bậc</option>
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium shrink-0">
          Tổng cộng: <strong className="text-slate-800 font-bold">{filtered.length}</strong> chức danh
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Chức Danh & Mã Cấp Bậc</th>
                <th className="p-4">Phòng Ban Hạn Định</th>
                <th className="p-4">Khung Cấp Bậc</th>
                <th className="p-4 text-center">Dải Lương Chuẩn (Min - Max)</th>
                <th className="p-4 text-center">Khóa Chặn Offer</th>
                <th className="p-4 text-center">Đang Tuyển</th>
                <th className="p-4 text-center">Trạng Thái</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không tìm thấy chức danh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{pos.title}</div>
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {pos.code}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">{pos.department}</td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                        {pos.level}
                      </span>
                    </td>

                    <td className="p-4 text-center font-mono">
                      <div className="font-bold text-slate-900">
                        {formatVND(pos.minSalary)} - {formatVND(pos.maxSalary)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Trung vị: {formatVND(pos.midSalary)}
                      </div>
                    </td>

                    {/* Lock Status (S7-04 / S2-05) */}
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Đã khóa chặn
                      </span>
                    </td>

                    {/* Active Openings */}
                    <td className="p-4 text-center">
                      <span
                        className={`font-mono text-xs font-bold ${
                          pos.activeOpenings > 0 ? "text-blue-600 font-black" : "text-slate-400"
                        }`}
                      >
                        {pos.activeOpenings} chỉ tiêu
                      </span>
                    </td>

                    {/* Active Status */}
                    <td className="p-4 text-center">
                      {pos.status === "active" ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                          Áp Dụng
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                          Đã Khóa
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pos)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Sửa dải lương chức danh"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(pos)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Ngừng áp dụng chức danh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Thêm / Sửa Chức Danh & Dải Lương */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {modalMode === "create" ? "Thiết Lập Chức Danh & Dải Lương" : "Cập Nhật Dải Lương Chức Danh"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Quy chuẩn mức lương tối thiểu & tối đa (VND) để tự động khóa chặn offer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePosition} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên chức danh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kỹ Sư Backend Senior"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã chức danh / Cấp bậc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: SWE-SR-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khung cấp bậc (Level) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as LevelType })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                  >
                    {LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phòng ban hạn định
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
                  >
                    <option value="">— Áp dụng tất cả phòng ban —</option>
                    {(data?.depts || []).map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary Band Inputs */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Dải Lương Chuẩn Được Phê Duyệt (VND)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mức tối thiểu (Min Salary) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="500000"
                      min="1000000"
                      value={formData.minSalary}
                      onChange={(e) => setFormData({ ...formData, minSalary: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatVND(formData.minSalary)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mức tối đa (Max Salary) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      step="500000"
                      min="1000000"
                      value={formData.maxSalary}
                      onChange={(e) => setFormData({ ...formData, maxSalary: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {formatVND(formData.maxSalary)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Đang lưu..." : modalMode === "create" ? "Tạo chức danh" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
