"use client";

import React, { useState, useEffect } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  Lock,
  Unlock,
  Edit3,
  X,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  Building,
  User as UserIcon,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { authService } from "@/features/auth/services/auth.service";

interface UserItem {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  employee_code?: string;
  role: string;
  roles: string[];
  is_active: boolean;
  account_status: string;
  lock_reason?: string;
  created_at?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawers State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditRolesOpen, setIsEditRolesOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Create User Form State
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    roles: ["employee"] as string[],
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Roles Form State
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmittingRoles, setIsSubmittingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // Lock Form State
  const [lockReason, setLockReason] = useState("");
  const [isSubmittingLock, setIsSubmittingLock] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  // Feedback Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const availableRoles = [
    { code: "admin", name: "Quản trị viên (Admin)" },
    { code: "hr_manager", name: "Trưởng phòng HR (HR Manager)" },
    { code: "recruiter", name: "Chuyên viên Tuyển dụng (Recruiter)" },
    { code: "hiring_manager", name: "Trưởng bộ phận (Hiring Manager)" },
    { code: "interviewer", name: "Người phỏng vấn (Interviewer)" },
    { code: "approver", name: "Người duyệt (Approver)" },
    { code: "candidate", name: "Ứng viên (Candidate)" },
    { code: "employee", name: "Nhân viên (Employee)" },
  ];

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      const queryParams = new URLSearchParams({
        search,
        status: statusFilter,
        role: roleFilter,
        page: page.toString(),
        page_size: "15",
      });

      const res = await fetch(`http://localhost:8000/api/v1/admin/users?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Không thể tải danh sách tài khoản người dùng");
      }

      const data = await res.json();
      setUsers(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi truy vấn hệ thống");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter, page]);

  // Handle Create User Submit (S1-08)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.full_name.trim() || !createForm.email.trim() || !createForm.password) {
      setCreateError("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
      return;
    }

    if (createForm.roles.length === 0) {
      setCreateError("Vui lòng chọn ít nhất một vai trò cho tài khoản");
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const token = authService.getToken();
      const res = await fetch("http://localhost:8000/api/v1/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Không thể tạo tài khoản người dùng mới");
      }

      showToast("Tạo tài khoản người dùng mới thành công!");
      setIsCreateModalOpen(false);
      setCreateForm({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        roles: ["employee"],
      });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Update Roles Submit (S1-09)
  const handleUpdateRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setRolesError(null);

    if (selectedRoles.length === 0) {
      setRolesError("Vui lòng chọn ít nhất 1 vai trò cho tài khoản");
      return;
    }

    setIsSubmittingRoles(true);
    try {
      const token = authService.getToken();
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${selectedUser.id}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: selectedRoles }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Không thể cập nhật danh sách vai trò");
      }

      showToast("Cập nhật phân quyền vai trò tài khoản thành công!");
      setIsEditRolesOpen(false);
      fetchUsers();
    } catch (err: any) {
      setRolesError(err.message);
    } finally {
      setIsSubmittingRoles(false);
    }
  };

  // Handle Lock Account Submit (S1-10)
  const handleLockAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLockError(null);

    if (!lockReason.trim()) {
      setLockError("Vui lòng nhập lý do khóa tài khoản");
      return;
    }

    setIsSubmittingLock(true);
    try {
      const token = authService.getToken();
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${selectedUser.id}/lock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: lockReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Không thể khóa tài khoản này");
      }

      showToast("Khóa tài khoản và làm mới session thành công!", "success");
      setIsLockModalOpen(false);
      setLockReason("");
      fetchUsers();
    } catch (err: any) {
      setLockError(err.message);
    } finally {
      setIsSubmittingLock(false);
    }
  };

  // Handle Unlock Account Submit (S1-10)
  const handleUnlockAccount = async () => {
    if (!selectedUser) return;
    try {
      const token = authService.getToken();
      const res = await fetch(`http://localhost:8000/api/v1/admin/users/${selectedUser.id}/unlock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Không thể mở khóa tài khoản");
      }

      showToast("Mở khóa tài khoản thành công!");
      setIsUnlockModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const getRoleBadgeColor = (roleStr: string) => {
    const r = roleStr.toLowerCase();
    if (r.includes("admin")) return "bg-purple-100 text-purple-700 border-purple-200";
    if (r.includes("hr_manager") || r.includes("hr")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (r.includes("recruiter")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (r.includes("hiring_manager") || r.includes("manager")) return "bg-amber-100 text-amber-700 border-amber-200";
    if (r.includes("interviewer")) return "bg-cyan-100 text-cyan-700 border-cyan-200";
    if (r.includes("approver")) return "bg-indigo-100 text-indigo-700 border-indigo-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <AdminAppShell activeTab="users">
      {/* Toast alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#4285F4]" />
            Quản Lý Người Dùng & Tài Khoản
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý danh mục tài khoản nhân sự nội bộ, phân vai trò đa vai trò (Multi-Role) và khóa/mở khóa tài khoản an toàn (S1-08, S1-09, S1-10).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/users/import"
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Excel</span>
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tạo tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc mã nhân viên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#4285F4]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-[#4285F4]"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="hr_manager">Trưởng phòng HR</option>
            <option value="recruiter">Chuyên viên tuyển dụng</option>
            <option value="hiring_manager">Trưởng bộ phận</option>
            <option value="interviewer">Người phỏng vấn</option>
            <option value="approver">Người duyệt</option>
            <option value="candidate">Ứng viên</option>
            <option value="employee">Nhân viên</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-[#4285F4]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động (Active)</option>
            <option value="locked">Đã bị khóa (Locked)</option>
          </select>

          {/* Reset filter button */}
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
              setStatusFilter("all");
              setPage(1);
            }}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors border border-gray-200 cursor-pointer"
            title="Đặt lại bộ lọc"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Accounts Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#4285F4]" />
            <p className="text-xs font-medium">Đang tải danh sách tài khoản người dùng...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600 space-y-3">
            <AlertTriangle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-4 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">Không tìm thấy tài khoản người dùng nào</p>
            <p className="text-[11px] text-slate-400">Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Họ tên & Email</th>
                  <th className="py-3.5 px-4">Số điện thoại</th>
                  <th className="py-3.5 px-4">Vai trò (Multi-Role)</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {users.map((u) => {
                  const userRoles = u.roles || (u.role ? u.role.split(",") : []);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-[#4285F4] font-bold flex items-center justify-center text-xs border border-blue-200 shrink-0">
                            {u.full_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.full_name}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {u.phone || "---"}
                      </td>

                      {/* Roles Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {userRoles.map((r, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getRoleBadgeColor(
                                r
                              )}`}
                            >
                              {r.trim()}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.is_active && u.account_status !== "locked" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold" title={u.lock_reason || "Tài khoản bị khóa"}>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Bị khóa
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail View */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Xem chi tiết tài khoản"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Roles (S1-09) */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedRoles(userRoles);
                              setRolesError(null);
                              setIsEditRolesOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Phân vai trò (Roles)"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Lock / Unlock (S1-10) */}
                          {u.is_active && u.account_status !== "locked" ? (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setLockReason("");
                                setLockError(null);
                                setIsLockModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Khóa tài khoản"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setIsUnlockModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Trang <span className="font-bold text-slate-900">{page}</span> / <span className="font-bold text-slate-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. MODAL: TẠO TÀI KHOẢN MỚI (S1-08) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Tạo Tài Khoản Người Dùng Mới</h3>
                  <p className="text-[11px] text-slate-400">Nhập thông tin nhân sự và gán vai trò ban đầu (S1-08)</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#4285F4]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email nội bộ *</label>
                <input
                  type="email"
                  required
                  placeholder="employee@company.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#4285F4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#4285F4]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu ban đầu *</label>
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu tạo mới"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#4285F4]"
                  />
                </div>
              </div>

              {/* Roles Multi-select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Gán vai trò hệ thống *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-gray-100 max-h-40 overflow-y-auto">
                  {availableRoles.map((r) => {
                    const isChecked = createForm.roles.includes(r.code);
                    return (
                      <label
                        key={r.code}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-blue-50 border-blue-200 text-[#4285F4]"
                            : "bg-white border-gray-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({ ...createForm, roles: [...createForm.roles, r.code] });
                            } else {
                              setCreateForm({
                                ...createForm,
                                roles: createForm.roles.filter((rc) => rc !== r.code),
                              });
                            }
                          }}
                          className="rounded text-[#4285F4] focus:ring-0"
                        />
                        <span>{r.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-bold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCreate ? "Đang tạo tài khoản..." : "Xác nhận tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL: CHỈNH SỬA VAI TRÒ (MULTI-ROLE S1-09) */}
      {isEditRolesOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Phân Vai Trò Tài Khoản (Multi-Role)</h3>
                  <p className="text-[11px] text-slate-400">{selectedUser.full_name} ({selectedUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditRolesOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {rolesError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{rolesError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateRoles} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Chọn danh sách vai trò cho phép:</label>
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-gray-100 max-h-60 overflow-y-auto">
                  {availableRoles.map((r) => {
                    const isChecked = selectedRoles.includes(r.code);
                    return (
                      <label
                        key={r.code}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-purple-50 border-purple-200 text-purple-800"
                            : "bg-white border-gray-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoles([...selectedRoles, r.code]);
                              } else {
                                setSelectedRoles(selectedRoles.filter((rc) => rc !== r.code));
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-0"
                          />
                          <span>{r.name}</span>
                        </div>
                        {isChecked && (
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditRolesOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRoles}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold shadow-md shadow-purple-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRoles ? "Đang lưu..." : "Cập nhật vai trò"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: KHÓA TÀI KHOẢN VỚI LÝ DO & CẢNH BÁO TRÁCH NHIỆM (S1-10) */}
      {isLockModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Khóa Tài Khoản Người Dùng</h3>
                  <p className="text-[11px] text-slate-400">{selectedUser.full_name} ({selectedUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setIsLockModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning regarding active business tasks */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Cảnh báo trách nhiệm nghiệp vụ</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Khi khóa tài khoản, người dùng sẽ bị đăng xuất ngay lập tức khỏi hệ thống.
                Nếu người dùng đang phụ trách Yêu cầu tuyển dụng hoặc Lịch phỏng vấn, vui lòng phân công lại nhân sự trước khi thực hiện.
              </p>
            </div>

            {lockError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{lockError}</span>
              </div>
            )}

            <form onSubmit={handleLockAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhập lý do khóa tài khoản *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Tạm khóa do chuyển công tác / Vi phạm chính sách an toàn bảo mật..."
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLock}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmittingLock ? "Đang khóa..." : "Xác nhận khóa tài khoản"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: MỞ KHÓA TÀI KHOẢN */}
      {isUnlockModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Mở Khóa Tài Khoản</h3>
                  <p className="text-[11px] text-slate-400">{selectedUser.full_name} ({selectedUser.email})</p>
                </div>
              </div>
              <button
                onClick={() => setIsUnlockModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn mở khóa tài khoản <span className="font-bold text-slate-900">{selectedUser.full_name}</span> không? Người dùng sẽ có thể đăng nhập lại bình thường.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsUnlockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleUnlockAccount}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Xác nhận mở khóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DRAWER: XEM CHI TIẾT TÀI KHOẢN & LỊCH SỬ HOẠT ĐỘNG */}
      {isDetailDrawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200 border-l border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#4285F4] font-bold flex items-center justify-center text-sm border border-blue-200">
                  {selectedUser.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{selectedUser.full_name}</h3>
                  <p className="text-[11px] text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile summary */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Thông tin tài khoản</div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-400">ID Tài khoản:</span>
                  <span className="font-bold text-slate-900">#{selectedUser.id}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-400">Số điện thoại:</span>
                  <span className="font-bold text-slate-900">{selectedUser.phone || "---"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="font-medium text-slate-400">Trạng thái:</span>
                  {selectedUser.is_active ? (
                    <span className="text-emerald-600 font-bold">Đang hoạt động</span>
                  ) : (
                    <span className="text-rose-600 font-bold">Đã bị khóa</span>
                  )}
                </div>
                {selectedUser.lock_reason && (
                  <div className="pt-2 border-t border-gray-200 text-rose-700">
                    <span className="font-bold">Lý do khóa:</span> {selectedUser.lock_reason}
                  </div>
                )}
              </div>

              {/* Roles Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Vai trò được cấp (RBAC)</div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedUser.roles || [selectedUser.role]).map((r, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 font-bold text-slate-700">
                      {r.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
