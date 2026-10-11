"use client";

import React, { useState, useMemo } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import {
  Search,
  UserPlus,
  Upload,
  Shield,
  Lock,
  Unlock,
  Pencil,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  Building,
} from "lucide-react";
import { UserItem, getRoleMeta, ROLE_DEFINITIONS } from "./components/types";
import { MOCK_USERS_150 } from "./components/mockData";
import { RoleManagementModal } from "./components/RoleManagementModal";
import { LockUnlockModal } from "./components/LockUnlockModal";
import { ExcelImportModal } from "./components/ExcelImportModal";
import { UserFormModal } from "./components/UserFormModal";

const PAGE_SIZE = 20;

export default function AdminUsersManagementPage() {
  // Main data state
  const [users, setUsers] = useState<UserItem[]>(MOCK_USERS_150);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [roleModalUser, setRoleModalUser] = useState<UserItem | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const [lockModalUser, setLockModalUser] = useState<UserItem | null>(null);
  const [lockModalMode, setLockModalMode] = useState<"lock" | "unlock">("lock");
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userFormMode, setUserFormMode] = useState<"create" | "edit">("create");
  const [userFormTarget, setUserFormTarget] = useState<UserItem | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      // Search matching: name, email, employee_code
      const matchSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.employee_code.toLowerCase().includes(q);

      // Role filter matching
      const matchRole =
        roleFilter === "all" ||
        u.roles.includes(roleFilter) ||
        u.role === roleFilter;

      // Status filter matching
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active && u.account_status === "active") ||
        (statusFilter === "locked" && (!u.is_active || u.account_status === "locked"));

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination calculation
  const totalRecords = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  // Ensure current page does not exceed bounds
  const validatedPage = Math.min(currentPage, totalPages);
  const startIndex = (validatedPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalRecords);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Handlers for User Stories
  // 1. Role assignment handler (Multi-role)
  const handleSaveRoles = (userId: number, updatedRoles: string[]) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              roles: updatedRoles,
              role: updatedRoles[0] || "employee",
            }
          : u
      )
    );
    const target = users.find((u) => u.id === userId);
    showToast(`Đã cập nhật phân quyền vai trò cho ${target?.full_name || "người dùng"}!`, "success");
  };

  // 2. Lock / Unlock handler
  const handleLockUnlockConfirm = (userId: number, reason?: string) => {
    const isLocking = lockModalMode === "lock";
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              is_active: !isLocking,
              account_status: isLocking ? "locked" : "active",
              lock_reason: isLocking ? reason || "Bị khóa bởi Quản trị viên" : undefined,
            }
          : u
      )
    );
    const target = users.find((u) => u.id === userId);
    if (isLocking) {
      showToast(`Đã khóa tài khoản ${target?.full_name || ""}. Phiên đăng nhập đã bị hủy.`, "error");
    } else {
      showToast(`Đã mở khóa tài khoản ${target?.full_name || ""} thành công!`, "success");
    }
  };

  // 3. Excel Import success handler
  const handleImportSuccess = (importedCount: number, newUsers: UserItem[]) => {
    setUsers((prev) => [...newUsers, ...prev]);
    showToast(`Đã nhập thành công ${importedCount} tài khoản nhân sự từ file Excel!`, "success");
    setCurrentPage(1);
  };

  // 4. Create / Edit user form handler
  const handleSaveUserForm = (formData: Partial<UserItem>) => {
    if (userFormMode === "create") {
      const newId = Math.max(...users.map((u) => u.id), 0) + 1;
      const newUser: UserItem = {
        id: newId,
        employee_code: formData.employee_code || `NV-${newId}`,
        full_name: formData.full_name || "Nhân sự mới",
        email: formData.email || "",
        phone: formData.phone || "",
        department: formData.department || "Khối Công nghệ & Kỹ thuật",
        role: formData.role || "employee",
        roles: formData.roles || ["employee"],
        is_active: true,
        account_status: "active",
        created_at: new Date().toISOString().slice(0, 10),
        avatar_color: "bg-blue-600 text-white",
      };
      setUsers([newUser, ...users]);
      showToast(`Tạo mới tài khoản ${newUser.full_name} thành công!`, "success");
    } else if (userFormTarget) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userFormTarget.id
            ? {
                ...u,
                ...formData,
              }
            : u
        )
      );
      showToast(`Cập nhật thông tin tài khoản ${formData.full_name} thành công!`, "success");
    }
  };

  // Generate pagination buttons array
  const paginationRange = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (validatedPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (validatedPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", validatedPage - 1, validatedPage, validatedPage + 1, "...", totalPages);
      }
    }
    return pages;
  }, [totalPages, validatedPage]);

  return (
    <AdminAppShell activeTab="users">
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-blue-50 text-blue-800 border-blue-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Card (bg-white rounded-2xl shadow-sm border border-slate-100) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
        {/* Page Title & Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản Lý Người Dùng & Phân Quyền
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Quản trị danh mục tài khoản nhân sự nội bộ, phân quyền Multi-role và trạng thái truy cập hệ thống.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
              Tổng số: <strong className="text-slate-900">{totalRecords}</strong> nhân sự
            </span>
          </div>
        </div>

        {/* 1. THANH CÔNG CỤ TRÊN CÙNG (TOP ACTION BAR) */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Ô Search input lớn tìm kiếm theo Tên, Email hoặc Mã nhân viên */}
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên, Email hoặc Mã nhân viên (VD: Nguyễn Văn A, NV-001, an.nguyen@...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-12 pl-12 pr-10 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3.5 top-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bộ lọc kết hợp & Nút hành động */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
            {/* Lọc Vai trò */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-12 px-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="all">Tất cả vai trò</option>
              {ROLE_DEFINITIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Lọc Trạng thái */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-12 px-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>

            {/* Nút Outline "Import Excel" kèm icon Upload */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="h-12 px-4.5 rounded-xl border border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/70 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </button>

            {/* Nút Primary "Thêm tài khoản" */}
            <button
              onClick={() => {
                setUserFormTarget(null);
                setUserFormMode("create");
                setIsUserFormOpen(true);
              }}
              className="h-12 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm tài khoản</span>
            </button>
          </div>
        </div>

        {/* 2. BẢNG DỮ LIỆU NGƯỜI DÙNG (DATA TABLE) */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
          {paginatedUsers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">
                Không tìm thấy nhân sự phù hợp
              </p>
              <p className="text-xs text-slate-400">
                Hãy thử kiểm tra lại từ khóa tìm kiếm hoặc tùy chỉnh lại bộ lọc vai trò/trạng thái.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-5">Họ Tên & Avatar</th>
                    <th className="py-4 px-5">Email & Phòng ban</th>
                    <th className="py-4 px-5">Vai trò (Multi-Role)</th>
                    <th className="py-4 px-5">Trạng thái</th>
                    <th className="py-4 px-5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedUsers.map((user) => {
                    const isLocked = !user.is_active || user.account_status === "locked";
                    const userRoleList = user.roles && user.roles.length > 0 ? user.roles : [user.role || "employee"];

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Họ Tên & Avatar */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs ${
                                user.avatar_color || "bg-blue-600 text-white"
                              }`}
                            >
                              {user.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                                {user.full_name}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                {user.employee_code}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phòng ban */}
                        <td className="py-4 px-5">
                          <div className="font-medium text-slate-700">
                            {user.email}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{user.department || "Khối Công nghệ & Kỹ thuật"}</span>
                          </div>
                        </td>

                        {/* Vai trò (Hiển thị dạng nhiều Badges bo tròn cho từng vai trò) */}
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {userRoleList.map((roleCode, idx) => {
                              const meta = getRoleMeta(roleCode);
                              return (
                                <span
                                  key={idx}
                                  className={`rounded-full px-3 py-1 text-[11px] font-bold border shadow-2xs whitespace-nowrap ${meta.badgeClass}`}
                                >
                                  {meta.name}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Trạng thái (Đang hoạt động - Xanh lá, Đã khóa - Đỏ/Xám) */}
                        <td className="py-4 px-5">
                          {!isLocked ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Đang hoạt động
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs"
                              title={user.lock_reason || "Tài khoản bị tạm khóa"}
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              Đã khóa
                            </span>
                          )}
                        </td>

                        {/* Cột Hành động (Actions) */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 3. Nút Quản lý vai trò (Icon Shield) */}
                            <button
                              onClick={() => {
                                setRoleModalUser(user);
                                setIsRoleModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/80 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Quản lý vai trò (Multi-Role)"
                            >
                              <Shield className="w-4 h-4" />
                              <span className="text-[11px] font-bold hidden xl:inline">
                                Vai trò
                              </span>
                            </button>

                            {/* 4. Nút Khóa / Mở khóa tài khoản */}
                            {!isLocked ? (
                              <button
                                onClick={() => {
                                  setLockModalUser(user);
                                  setLockModalMode("lock");
                                  setIsLockModalOpen(true);
                                }}
                                className="p-2 rounded-xl text-rose-600 bg-rose-50/60 hover:bg-rose-100 hover:text-rose-800 border border-rose-200/80 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                title="Khóa tài khoản"
                              >
                                <Lock className="w-4 h-4" />
                                <span className="text-[11px] font-bold hidden xl:inline">
                                  Khóa
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setLockModalUser(user);
                                  setLockModalMode("unlock");
                                  setIsLockModalOpen(true);
                                }}
                                className="p-2 rounded-xl text-emerald-600 bg-emerald-50/60 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                                title="Mở khóa tài khoản"
                              >
                                <Unlock className="w-4 h-4" />
                                <span className="text-[11px] font-bold hidden xl:inline">
                                  Mở khóa
                                </span>
                              </button>
                            )}

                            {/* Sửa thông tin tài khoản */}
                            <button
                              onClick={() => {
                                setUserFormTarget(user);
                                setUserFormMode("edit");
                                setIsUserFormOpen(true);
                              }}
                              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
                              title="Chỉnh sửa thông tin"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PHÂN TRANG (PAGINATION - CHUẨN PREVIOUS, 1, 2, 3, NEXT) */}
          <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Hiển thị 1-20 trên tổng số 150 nhân sự */}
            <div className="text-xs text-slate-500 font-medium">
              Hiển thị{" "}
              <span className="font-bold text-slate-900">
                {totalRecords === 0 ? 0 : startIndex + 1}-{endIndex}
              </span>{" "}
              trên tổng số{" "}
              <span className="font-bold text-slate-900">{totalRecords}</span> nhân sự
            </div>

            {/* Các nút phân trang */}
            <div className="flex items-center gap-1.5">
              {/* Nút Previous */}
              <button
                disabled={validatedPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>

              {/* Các số trang: 1, 2, 3... */}
              <div className="flex items-center gap-1">
                {paginationRange.map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-slate-400 text-xs font-bold"
                      >
                        ...
                      </span>
                    );
                  }

                  const pageNum = Number(p);
                  const isActive = pageNum === validatedPage;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Nút Next */}
              <button
                disabled={validatedPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
              >
                <span>Sau</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODAL: QUẢN LÝ VAI TRÒ (MULTI-ROLE) */}
      <RoleManagementModal
        isOpen={isRoleModalOpen}
        user={roleModalUser}
        onClose={() => {
          setIsRoleModalOpen(false);
          setRoleModalUser(null);
        }}
        onSave={handleSaveRoles}
      />

      {/* 4. MODAL: KHÓA / MỞ KHÓA TÀI KHOẢN */}
      <LockUnlockModal
        isOpen={isLockModalOpen}
        user={lockModalUser}
        mode={lockModalMode}
        onClose={() => {
          setIsLockModalOpen(false);
          setLockModalUser(null);
        }}
        onConfirm={handleLockUnlockConfirm}
      />

      {/* 5. MODAL: IMPORT EXCEL */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* 1. MODAL: TẠO / SỬA TÀI KHOẢN */}
      <UserFormModal
        isOpen={isUserFormOpen}
        mode={userFormMode}
        user={userFormTarget}
        onClose={() => {
          setIsUserFormOpen(false);
          setUserFormTarget(null);
        }}
        onSave={handleSaveUserForm}
      />
    </AdminAppShell>
  );
}
