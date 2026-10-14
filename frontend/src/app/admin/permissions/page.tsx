"use client";

import React, { useState, useEffect } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import { Lock, ShieldCheck, Check, X, RefreshCw, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api-client";

interface ModulePermission {
  id: string;
  module: string;
  permissions: {
    [role: string]: string[];
  };
}

const DEFAULT_MATRIX: ModulePermission[] = [
  {
    id: "users",
    module: "Quản lý Người Dùng & Tài Khoản",
    permissions: {
      admin: ["user:view", "user:create", "user:edit", "user:lock", "user:reset_password"],
      hr_manager: ["user:view", "user:create", "user:edit"],
      recruiter: [],
      hiring_manager: [],
      interviewer: [],
      approver: [],
      candidate: [],
    },
  },
  {
    id: "rbac",
    module: "Phân Quyền RBAC & Ma Trận Role",
    permissions: {
      admin: ["master_data:manage"],
      hr_manager: [],
      recruiter: [],
      hiring_manager: [],
      interviewer: [],
      approver: [],
      candidate: [],
    },
  },
  {
    id: "requisition",
    module: "Yêu Cầu Tuyển Dụng (Requisition)",
    permissions: {
      admin: ["requisition:view", "requisition:create", "requisition:approve"],
      hr_manager: ["requisition:view", "requisition:create", "requisition:approve"],
      recruiter: ["requisition:view"],
      hiring_manager: ["requisition:view", "requisition:create"],
      interviewer: [],
      approver: ["requisition:view", "requisition:approve"],
      candidate: [],
    },
  },
  {
    id: "candidates",
    module: "Hồ Sơ Ứng Viên & Pipeline",
    permissions: {
      admin: ["candidate:view", "candidate:evaluate"],
      hr_manager: ["candidate:view", "candidate:evaluate"],
      recruiter: ["candidate:view", "candidate:evaluate"],
      hiring_manager: ["candidate:view", "candidate:evaluate"],
      interviewer: ["candidate:view", "candidate:evaluate"],
      approver: [],
      candidate: [],
    },
  },
  {
    id: "audit",
    module: "Nhật Ký Bảo Mật & Audit Logs",
    permissions: {
      admin: ["audit:view"],
      hr_manager: [],
      recruiter: [],
      hiring_manager: [],
      interviewer: [],
      approver: [],
      candidate: [],
    },
  },
];

export default function PermissionsMatrixPage() {
  const [matrix, setMatrix] = useState<ModulePermission[]>(DEFAULT_MATRIX);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const rolesList = [
    { code: "admin", label: "Admin", badge: "bg-purple-100 text-purple-700 border-purple-200" },
    { code: "hr_manager", label: "HR Manager", badge: "bg-blue-100 text-blue-700 border-blue-200" },
    { code: "recruiter", label: "Recruiter", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { code: "hiring_manager", label: "Hiring Manager", badge: "bg-amber-100 text-amber-700 border-amber-200" },
    { code: "interviewer", label: "Interviewer", badge: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    { code: "approver", label: "Approver", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    { code: "candidate", label: "Candidate", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  ];

  const actionsList = [
    { code: "user:view", label: "Xem người dùng (user:view)" },
    { code: "user:create", label: "Tạo người dùng (user:create)" },
    { code: "user:edit", label: "Sửa người dùng (user:edit)" },
    { code: "user:lock", label: "Khóa/Mở khóa (user:lock)" },
    { code: "user:reset_password", label: "Reset Mật khẩu (user:reset_password)" },
    { code: "requisition:view", label: "Xem Yêu cầu tuyển dụng (requisition:view)" },
    { code: "requisition:create", label: "Tạo Yêu cầu tuyển dụng (requisition:create)" },
    { code: "requisition:approve", label: "Phê duyệt Yêu cầu (requisition:approve)" },
    { code: "candidate:view", label: "Xem Hồ sơ Ứng viên (candidate:view)" },
    { code: "candidate:evaluate", label: "Đánh giá Ứng viên (candidate:evaluate)" },
    { code: "offer:create", label: "Tạo Thư mời (offer:create)" },
    { code: "offer:approve", label: "Duyệt Thư mời (offer:approve)" },
    { code: "master_data:manage", label: "Quản lý Danh mục (master_data:manage)" },
    { code: "audit:view", label: "Xem Nhật ký Audit Logs (audit:view)" },
  ];

  const fetchMatrix = async (showError = true): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<ModulePermission[]>("/admin/permissions/matrix");
      if (Array.isArray(data) && data.length > 0) {
        setMatrix(data);
      }
      return true;
    } catch {
      if (showError) {
        setToast("Không thể tải ma trận quyền từ hệ thống.");
        setTimeout(() => setToast(null), 3000);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    apiRequest<ModulePermission[]>("/admin/permissions/matrix")
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setMatrix(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setToast("Không thể tải ma trận quyền từ hệ thống.");
          setTimeout(() => setToast(null), 3000);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTogglePermission = async (moduleId: string, roleCode: string, actionCode: string) => {
    const roleLower = roleCode.toLowerCase();
    const currentRolePerms = (matrix.find(m => m.id === moduleId)?.permissions[roleLower]) || [];
    const isCurrentlyGranted = currentRolePerms.includes(actionCode);
    const nextGranted = !isCurrentlyGranted;

    // Optimistic UI update
    setMatrix((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const rolePerms = m.permissions[roleLower] || [];
        const updatedPerms = nextGranted
          ? [...rolePerms, actionCode]
          : rolePerms.filter((p) => p !== actionCode);

        return {
          ...m,
          permissions: {
            ...m.permissions,
            [roleLower]: updatedPerms,
          },
        };
      })
    );

    try {
      await apiRequest<{ message: string }>("/admin/permissions/matrix", {
        method: "PUT",
        body: JSON.stringify({
          role_code: roleLower,
          permission_code: actionCode,
          is_granted: nextGranted,
        }),
      });
      setToast(`Đã lưu thay đổi quyền [${actionCode}] cho vai trò ${roleCode} vào Database.`);
      setTimeout(() => setToast(null), 3000);
    } catch {
      setMatrix((prev) =>
        prev.map((module) => {
          if (module.id !== moduleId) return module;
          const permissions = module.permissions[roleLower] || [];
          return {
            ...module,
            permissions: {
              ...module.permissions,
              [roleLower]: isCurrentlyGranted
                ? [...permissions, actionCode]
                : permissions.filter((permission) => permission !== actionCode),
            },
          };
        })
      );
      setToast("Không thể lưu thay đổi. Giao diện đã khôi phục trạng thái trước đó.");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    try {
      const refreshed = await fetchMatrix(false);
      setToast(
        refreshed
          ? "Đã đồng bộ ma trận phân quyền mới nhất từ hệ thống."
          : "Không thể đồng bộ ma trận quyền từ hệ thống."
      );
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminAppShell activeTab="permissions">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Lock className="w-7 h-7 text-[#4285F4]" />
              Ma Trận Phân Quyền 7 Vai Trò (RBAC Matrix - S1-05)
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Nhấp trực tiếp vào thẻ để chuyển đổi giữa <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ Cho phép</span> và <span className="text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-gray-200">✕ Từ chối (DENY)</span>.
            </p>
          </div>

          <button
            onClick={handleSaveMatrix}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "Đang đồng bộ..." : "Đồng bộ ma trận"}</span>
          </button>
        </div>

        {/* Legend / Status Note */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Chú thích trạng thái:</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span>Cho phép (ALLOW)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-gray-200 text-slate-500 font-semibold text-xs">
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Từ chối (DENY)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Chính sách an toàn bảo mật: <strong className="text-rose-600">Default DENY</strong>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#4285F4]" />
              <p className="text-xs font-medium">Đang tải ma trận phân quyền...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="py-4 px-4 min-w-[240px] sticky left-0 bg-slate-50 border-r border-gray-200 z-10">
                      Phân Hệ Module
                    </th>
                    <th className="py-4 px-3 min-w-[170px] border-r border-gray-200">
                      Quyền Thao Tác
                    </th>
                    {rolesList.map((r) => (
                      <th
                        key={r.code}
                        onMouseEnter={() => setHoveredRole(r.code)}
                        onMouseLeave={() => setHoveredRole(null)}
                        className={`py-4 px-3 text-center min-w-[130px] transition-colors ${
                          hoveredRole === r.code ? "bg-blue-50/70" : ""
                        }`}
                      >
                        <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold block text-center shadow-xs ${r.badge}`}>
                          {r.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {matrix.map((m) =>
                    actionsList.map((act, actIdx) => (
                      <tr
                        key={`${m.id}-${act.code}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          actIdx === actionsList.length - 1 ? "border-b-2 border-gray-200" : ""
                        }`}
                      >
                        {actIdx === 0 && (
                          <td
                            rowSpan={actionsList.length}
                            className="py-4 px-4 font-extrabold text-slate-900 align-top border-r border-gray-200 bg-slate-50/60 sticky left-0 z-10"
                          >
                            <div className="flex items-center gap-2.5 pt-1">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#4285F4] flex items-center justify-center font-bold">
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <span className="text-xs text-slate-900 leading-snug">{m.module}</span>
                            </div>
                          </td>
                        )}

                        <td className="py-3 px-3 text-slate-700 font-semibold border-r border-gray-200 bg-slate-50/20 text-[11px]">
                          {act.label}
                        </td>

                        {rolesList.map((r) => {
                          const hasPerm = (m.permissions[r.code] || []).includes(act.code);
                          return (
                            <td
                              key={r.code}
                              onMouseEnter={() => setHoveredRole(r.code)}
                              onMouseLeave={() => setHoveredRole(null)}
                              className={`py-2.5 px-2 text-center transition-colors ${
                                hoveredRole === r.code ? "bg-blue-50/40" : ""
                              }`}
                            >
                              <button
                                onClick={() => handleTogglePermission(m.id, r.code, act.code)}
                                className={`w-full py-1.5 px-2.5 rounded-xl border font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                                  hasPerm
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-emerald-500/10"
                                    : "bg-slate-50 text-slate-400 border-gray-200 hover:bg-slate-100 hover:text-slate-600"
                                }`}
                              >
                                {hasPerm ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                    <span>Cho phép</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5 text-slate-300" />
                                    <span className="text-slate-400 font-medium">Từ chối</span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminAppShell>
  );
}
