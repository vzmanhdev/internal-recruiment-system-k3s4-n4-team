"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import {
  Search,
  UserPlus,
  Upload,
  Shield,
  Lock,
  Unlock,
  Pencil,
  CheckCircle2,
  AlertTriangle,
  X,
  Users,
  Building,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { UserItem, getRoleMeta, ROLE_DEFINITIONS } from "./components/types";
import { RoleManagementModal } from "./components/RoleManagementModal";
import { LockUnlockModal } from "./components/LockUnlockModal";
import { ExcelImportModal } from "./components/ExcelImportModal";
import { UserFormModal } from "./components/UserFormModal";
import { userService } from "@/services/user.service";
import { Pagination } from "@/components/ui/Pagination";

export default function AdminUsersManagementPage() {
  // Server-side data state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  // Debounce search query to prevent high API request rate
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch users with full server-side pagination, filters, and sorting
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await userService.getUsers({
        page: currentPage,
        pageSize,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        department: departmentFilter,
        sortBy,
        sortOrder,
      });
      setUsers(res.items || []);
      setTotalRecords(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
      setFetchError(err.message || "Không thể tải danh sách tài khoản từ hệ thống.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, roleFilter, statusFilter, departmentFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sort toggle handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Render sorting icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  // Multi-role assignment handler (S1-08)
  const handleSaveRoles = async (userId: number, updatedRoles: string[]) => {
    try {
      await userService.updateRoles(userId, updatedRoles);
      showToast("Cập nhật phân quyền vai trò cho người dùng thành công!", "success");
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Không thể cập nhật phân quyền người dùng", "error");
    }
  };

  // Lock / Unlock handler (S1-08)
  const handleLockUnlockConfirm = async (userId: number, reason?: string) => {
    const isLocking = lockModalMode === "lock";
    try {
      if (isLocking) {
        await userService.lockUser(userId, reason || "Bị khóa bởi Quản trị viên");
        showToast("Đã khóa tài khoản người dùng thành công.", "error");
      } else {
        await userService.unlockUser(userId);
        showToast("Đã mở khóa tài khoản người dùng thành công!", "success");
      }
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Lỗi thao tác trạng thái tài khoản", "error");
    }
  };

  // Excel Import success callback
  const handleImportSuccess = (importedCount: number) => {
    showToast(`Đã nhập thành công ${importedCount} tài khoản nhân sự từ file Excel!`, "success");
    setCurrentPage(1);
    fetchUsers();
  };

  // Create / Edit user form handler
  const handleSaveUserForm = async (formData: Partial<UserItem>) => {
    try {
      if (userFormMode === "create") {
        await userService.createUser({
          full_name: formData.full_name || "Nhân sự mới",
          email: formData.email || "",
          password: "Password123!",
          phone: formData.phone,
          roles: formData.roles || [formData.role || "employee"],
          department: formData.department,
        });
        showToast(`Tạo mới tài khoản ${formData.full_name} thành công!`, "success");
      } else if (userFormTarget) {
        if (formData.roles) {
          await userService.updateRoles(userFormTarget.id, formData.roles);
        }
        showToast(`Cập nhật thông tin tài khoản ${formData.full_name} thành công!`, "success");
      }
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Lỗi khi lưu thông tin tài khoản", "error");
    }
  };

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

      {/* Main Content Card */}
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
            <button
              onClick={() => fetchUsers()}
              disabled={isLoading}
              title="Làm mới dữ liệu"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* 1. THANH CÔNG CỤ TRÊN CÙNG (TOP ACTION BAR) */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
          {/* Ô Search input lớn tìm kiếm theo Tên, Email hoặc Mã nhân viên */}
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm theo Tên, Email hoặc Mã nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-10 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Bộ lọc kết hợp & Nút hành động */}
          <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 w-full xl:w-auto shrink-0 justify-end">
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

            {/* Nút "Import Excel" chuyển hướng sang /admin/users/import */}
            <Link
              href="/admin/users/import"
              className="h-12 px-4.5 rounded-xl border border-emerald-600 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/70 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Import Excel</span>
            </Link>

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

        {/* Lỗi tải dữ liệu nếu có */}
        {fetchError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={() => fetchUsers()}
              className="font-bold underline hover:text-rose-900"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* 2. BẢNG DỮ LIỆU NGƯỜI DÙNG (DATA TABLE) */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
          {isLoading ? (
            <div className="p-20 text-center text-slate-500 space-y-3">
              <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-600">Đang tải danh sách tài khoản từ máy chủ...</p>
            </div>
          ) : users.length === 0 ? (
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
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] text-slate-500 font-bold uppercase tracking-wider select-none">
                    <th
                      className="py-4 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors group"
                      onClick={() => handleSort("full_name")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Họ Tên & Avatar</span>
                        {renderSortIcon("full_name")}
                      </div>
                    </th>
                    <th
                      className="py-4 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors group"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Email & Phòng ban</span>
                        {renderSortIcon("email")}
                      </div>
                    </th>
                    <th className="py-4 px-5">Vai trò (Multi-Role)</th>
                    <th className="py-4 px-5">Trạng thái</th>
                    <th
                      className="py-4 px-5 cursor-pointer hover:bg-slate-100/70 transition-colors group"
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Ngày tạo</span>
                        {renderSortIcon("created_at")}
                      </div>
                    </th>
                    <th className="py-4 px-5 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {users.map((user) => {
                    const isLocked = !user.is_active || user.account_status === "locked";
                    const userRoleList =
                      user.roles && user.roles.length > 0 ? user.roles : [user.role || "employee"];

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Họ Tên & Avatar */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs bg-blue-600 text-white"
                            >
                              {(user.full_name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                                {user.full_name}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                {user.employee_code || `ID-${user.id}`}
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

                        {/* Vai trò */}
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

                        {/* Trạng thái */}
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

                        {/* Ngày tạo */}
                        <td className="py-4 px-5 text-slate-500 text-[11px]">
                          {user.created_at ? user.created_at.slice(0, 10) : "---"}
                        </td>

                        {/* Cột Hành động (Actions) */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Quản lý vai trò (Icon Shield) */}
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

                            {/* Nút Khóa / Mở khóa tài khoản */}
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

          {/* PHÂN TRANG (PAGINATION) */}
          <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200/80">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalRecords}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              itemLabel="nhân sự"
            />
          </div>
        </div>
      </div>

      {/* MODAL: QUẢN LÝ VAI TRÒ */}
      <RoleManagementModal
        isOpen={isRoleModalOpen}
        user={roleModalUser}
        onClose={() => {
          setIsRoleModalOpen(false);
          setRoleModalUser(null);
        }}
        onSave={handleSaveRoles}
      />

      {/* MODAL: KHÓA / MỞ KHÓA TÀI KHOẢN */}
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

      {/* MODAL: IMPORT EXCEL */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* MODAL: TẠO / SỬA TÀI KHOẢN */}
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
