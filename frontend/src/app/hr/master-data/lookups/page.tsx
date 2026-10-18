"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { masterDataService, type Category } from "@/services/master-data.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";
import {
  Layers,
  Plus,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowUpDown,
  Building2,
  FileText,
  MapPin,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import {
  CreateLookupCategoryModal,
  type NewLookupCategoryData,
} from "@/features/hr/components/CreateLookupCategoryModal";

// -----------------------------------------------------------------------------
// STANDARD LOOKUP METADATA (S2-08)
// -----------------------------------------------------------------------------
interface GroupMeta {
  code: string;
  name: string;
  description: string;
  order: number;
}

const STANDARD_GROUPS: Record<string, GroupMeta> = {
  candidate_source: {
    code: "candidate_source",
    name: "1. Nguồn ứng viên",
    description: "LinkedIn, TopCV, Referral, Headhunter...",
    order: 1,
  },
  rejection_reason: {
    code: "rejection_reason",
    name: "2. Lý do loại hồ sơ",
    description: "Kỹ năng, mức lương, văn hóa doanh nghiệp...",
    order: 2,
  },
  work_location: {
    code: "work_location",
    name: "3. Địa điểm làm việc",
    description: "Hà Nội, TP.HCM, Đà Nẵng, Chi nhánh...",
    order: 3,
  },
  work_type: {
    code: "work_type",
    name: "4. Hình thức làm việc",
    description: "Full-time, Part-time, Remote, Hybrid...",
    order: 4,
  },
  contract_type: {
    code: "contract_type",
    name: "5. Loại hợp đồng",
    description: "Thử việc, xác định thời hạn, không xác định...",
    order: 5,
  },
  approval_type: {
    code: "approval_type",
    name: "6. Loại luồng phê duyệt",
    description: "Tuyển dụng tiêu chuẩn, Vượt ngân sách, Tuyển gấp...",
    order: 6,
  },
  tag: {
    code: "tag",
    name: "Nhãn ứng viên (Tags)",
    description: "Nhãn dùng để phân loại hồ sơ ứng viên",
    order: 7,
  },
};

const slug = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/[^A-Z0-9]+/g, "_")
    .slice(0, 24);

function HRLookupsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedType = searchParams.get("type");

  const { data: rawCategories, error, loading, reload } = useApiData(
    () => masterDataService.categories(),
    []
  );

  const categories = useMemo(() => rawCategories || [], [rawCategories]);

  // Distinct groups combining standard definitions with dynamically declared types
  const availableGroups = useMemo(() => {
    const typesInDb = new Set(categories.map((c) => c.category_type));
    const allCodes = Array.from(
      new Set([...Object.keys(STANDARD_GROUPS), ...Array.from(typesInDb)])
    );

    return allCodes
      .map((code) => {
        const std = STANDARD_GROUPS[code];
        const count = categories.filter((c) => c.category_type === code).length;
        return {
          code,
          name: std?.name || code.replace(/_/g, " ").toUpperCase(),
          description: std?.description || "Danh mục dùng chung hệ thống",
          count,
          order: std?.order ?? 99,
        };
      })
      .sort((a, b) => a.order - b.order || a.code.localeCompare(b.code));
  }, [categories]);

  // Active category group state
  const [activeType, setActiveType] = useState<string>("candidate_source");

  useEffect(() => {
    if (requestedType) {
      const match = availableGroups.find(
        (g) =>
          g.code.toLowerCase() === requestedType.toLowerCase() ||
          (requestedType === "work_locations" && g.code === "work_location")
      );
      if (match) {
        setActiveType(match.code);
      }
    }
  }, [requestedType, availableGroups]);

  // Items of the currently active group (sorted by sort_order)
  const activeItems = useMemo(() => {
    return categories
      .filter((c) => c.category_type === activeType)
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }, [categories, activeType]);

  // Search & Filter (SCRUM-227)
  const [searchTerm, setSearchTerm] = useState("");
  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return activeItems;
    return activeItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        slug(item.name).toLowerCase().includes(q)
    );
  }, [activeItems, searchTerm]);

  // Quick Add Form
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);

  // Inline Editing
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditName, setInlineEditName] = useState("");
  const [inlineEditSaving, setInlineEditSaving] = useState(false);

  // Modal Create Lookup Group
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Quick Add Item Handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickAddName.trim();
    if (!name) return;

    setQuickAddSaving(true);
    try {
      await masterDataService.createCategory({
        category_type: activeType,
        name,
        sort_order: activeItems.length + 1,
      });
      setQuickAddName("");
      showToast(`Đã thêm giá trị "${name}" thành công!`, "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thêm được giá trị mới.", "error");
    } finally {
      setQuickAddSaving(false);
    }
  };

  // Sắp xếp thứ tự hiển thị (S2-08 AC3)
  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeItems.length) return;

    const list = [...activeItems];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    try {
      await masterDataService.reorderCategories(list.map((c) => c.id));
      showToast("Đã cập nhật thứ tự hiển thị!", "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thể sắp xếp thứ tự.", "error");
    }
  };

  // Inline Edit Save Handler (S2-08 AC2 - block rename if in use)
  const handleSaveInlineEdit = async (item: Category) => {
    const newName = inlineEditName.trim();
    if (!newName || newName === item.name) {
      setInlineEditingId(null);
      return;
    }

    setInlineEditSaving(true);
    try {
      await masterDataService.updateCategory(item.id, {
        name: newName,
        is_active: item.is_active,
      });
      setInlineEditingId(null);
      showToast(`Đã cập nhật tên danh mục thành "${newName}"!`, "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không cập nhật được giá trị danh mục.", "error");
    } finally {
      setInlineEditSaving(false);
    }
  };

  // Delete Category Item Handler (S2-08 AC2 - block delete if in use)
  const handleDeleteItem = async (item: Category) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mục "${item.name}" khỏi danh mục không?`)) {
      return;
    }

    try {
      await masterDataService.deleteCategory(item.id);
      showToast(`Đã xóa mục "${item.name}" thành công!`, "success");
      reload();
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? err.message
          : "Giá trị đang được tham chiếu nên không xoá được (S2-08).",
        "error"
      );
    }
  };

  // Toggle active / deactivate
  const handleToggleActive = async (item: Category) => {
    try {
      await masterDataService.updateCategory(item.id, {
        name: item.name,
        is_active: !item.is_active,
      });
      showToast(`Đã ${item.is_active ? "ngừng áp dụng" : "kích hoạt lại"} "${item.name}"!`, "success");
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thể thay đổi trạng thái.", "error");
    }
  };

  // Create new group handler
  const handleCreateGroup = (form: NewLookupCategoryData) => {
    const code = form.code.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
    setIsModalOpen(false);
    setActiveType(code);
    showToast(`Đã tạo nhóm "${form.name}" (${code})! Hãy nhập giá trị đầu tiên ở ô bên dưới.`, "success");
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
              Danh Mục Tuyển Dụng Dùng Chung (System Lookups)
            </h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              [S2-08] Master Lookups
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tập trung nguồn ứng viên, lý do loại hồ sơ, địa điểm, hình thức làm việc và loại hợp đồng
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhóm Danh Mục Mới</span>
        </button>
      </div>

      {/* Category Type Selector Tabs (S2-08: Nguồn ứng viên, lý do loại, địa điểm, hình thức làm việc, loại hợp đồng...) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {availableGroups.map((group) => {
          const isActive = activeType === group.code;
          return (
            <button
              key={group.code}
              type="button"
              onClick={() => {
                setActiveType(group.code);
                setSearchTerm("");
                router.replace(`/hr/master-data/lookups?type=${encodeURIComponent(group.code)}`, {
                  scroll: false,
                });
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
                isActive
                  ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between gap-1">
                <span className="truncate">{group.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {group.count}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                {group.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search & Quick Add Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1 max-w-xl">
          <input
            type="text"
            placeholder={`Nhập tên giá trị mới cho "${
              STANDARD_GROUPS[activeType]?.name || activeType
            }"...`}
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
          <button
            type="submit"
            disabled={quickAddSaving || !quickAddName.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{quickAddSaving ? "Đang thêm..." : "Thêm nhanh"}</span>
          </button>
        </form>
      </div>

      {/* Items Table with Sắp xếp thứ tự (S2-08 AC3) & Inline Editing */}
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/90 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <th className="py-3 px-4 text-center w-28">Thứ tự</th>
              <th className="py-3 px-5">Tên Danh Mục (Hiển Thị)</th>
              <th className="py-3 px-5">Mã Hệ Thống (Code)</th>
              <th className="py-3 px-5 text-center">Trạng Thái</th>
              <th className="py-3 px-5 text-center">Lượt Sử Dụng</th>
              <th className="py-3 px-5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Chưa có giá trị nào trong nhóm danh mục này. Hãy nhập tên ở ô trên để thêm mới.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isEditing = inlineEditingId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Sort Order Column (S2-08 AC3: Sắp xếp được thứ tự hiển thị) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, "up")}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed font-bold"
                          title="Chuyển lên trên"
                        >
                          ↑
                        </button>
                        <span className="font-mono text-xs font-bold text-slate-700 w-5 text-center">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === filteredItems.length - 1}
                          onClick={() => handleMoveItem(idx, "down")}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-200 text-slate-700 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed font-bold"
                          title="Chuyển xuống dưới"
                        >
                          ↓
                        </button>
                      </div>
                    </td>

                    {/* Name Column */}
                    <td className="py-3.5 px-5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={inlineEditName}
                          onChange={(e) => setInlineEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold ${item.is_active ? "text-slate-900" : "text-slate-400 line-through"}`}>
                            {item.name}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Code Column */}
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                        {slug(item.name)}
                      </span>
                    </td>

                    {/* Active Status */}
                    <td className="py-3.5 px-5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors border ${
                          item.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Bấm để đổi trạng thái áp dụng"
                      >
                        {item.is_active ? "Đang áp dụng" : "Ngừng áp dụng"}
                      </button>
                    </td>

                    {/* Usage Count (S2-08 AC2) */}
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          (item.usage_count || 0) > 0
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                        title="Số lượt hồ sơ, tin tuyển dụng hoặc yêu cầu đang tham chiếu"
                      >
                        {item.usage_count || 0} lượt dùng
                      </span>
                    </td>

                    {/* Actions (Inline Edit / Save / Delete) */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(item)}
                              disabled={inlineEditSaving}
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
                                setInlineEditName(item.name);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Chỉnh sửa tên danh mục"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa giá trị danh mục"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Modal Thêm Nhóm Danh Mục Mới */}
      <CreateLookupCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}

export default function HRLookupsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HRLookupsContent />
    </Suspense>
  );
}
