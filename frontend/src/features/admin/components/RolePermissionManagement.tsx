"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Minus,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  Briefcase,
  Search,
  Settings,
  Lock,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ManagedUser, userService } from "../services/user.service";
import { ApiError } from "@/lib/api-client";

interface PermissionRow {
  module: string;
  action: string;
  admin: boolean;
  hr_manager: boolean;
  manager: boolean;
  employee: boolean;
}

const PERMISSION_MATRIX: PermissionRow[] = [
  { module: "Tài khoản & Phân quyền", action: "Tạo tài khoản & Phân vai trò", admin: true, hr_manager: false, manager: false, employee: false },
  { module: "Tài khoản & Phân quyền", action: "Khóa / Mở khóa tài khoản", admin: true, hr_manager: false, manager: false, employee: false },
  { module: "Tài khoản & Phân quyền", action: "Phê duyệt đăng ký tài khoản mới", admin: true, hr_manager: false, manager: false, employee: false },
  { module: "Phê duyệt tuyển dụng", action: "Phê duyệt / Từ chối bài đăng tuyển dụng", admin: true, hr_manager: false, manager: false, employee: false },
  { module: "Yêu cầu tuyển dụng (REQ)", action: "Tạo đề xuất yêu cầu tuyển dụng", admin: true, hr_manager: true, manager: true, employee: false },
  { module: "Yêu cầu tuyển dụng (REQ)", action: "Tham gia chuỗi cấp duyệt REQ", admin: true, hr_manager: true, manager: true, employee: false },
  { module: "Vị trí tuyển dụng", action: "Soạn tin tuyển dụng từ REQ đã duyệt", admin: true, hr_manager: true, manager: false, employee: false },
  { module: "Vị trí tuyển dụng", action: "Đăng tin tuyển dụng công khai lên hệ thống", admin: true, hr_manager: false, manager: false, employee: false },
  { module: "Quản lý Ứng viên (ATS)", action: "Xem hồ sơ & Chuyển giai đoạn ứng viên", admin: true, hr_manager: true, manager: true, employee: false },
  { module: "Lịch phỏng vấn", action: "Xếp lịch phỏng vấn & Đánh giá năng lực", admin: true, hr_manager: true, manager: true, employee: false },
  { module: "Giới thiệu nhân tài (Referral)", action: "Giới thiệu ứng viên nội bộ & nhận thưởng", admin: true, hr_manager: true, manager: true, employee: true },
  { module: "Ứng tuyển nội bộ", action: "Xem và ứng tuyển vị trí tuyển dụng nội bộ", admin: true, hr_manager: true, manager: true, employee: true },
  { module: "Kiểm toán & Cấu hình", action: "Xem nhật ký hệ thống & Điều chỉnh cấu hình", admin: true, hr_manager: false, manager: false, employee: false },
];

const ROLES_INFO = [
  {
    key: "admin",
    name: "Quản trị viên (Admin)",
    badgeColor: "bg-slate-900 text-white",
    desc: "Toàn quyền quản trị hệ thống, phê duyệt tài khoản, phê duyệt tin tuyển dụng, xem nhật ký kiểm toán và thiết lập cấu hình.",
  },
  {
    key: "hr_manager",
    name: "Nhân sự (HR)",
    badgeColor: "bg-blue-600 text-white",
    desc: "Soạn tin từ REQ đã duyệt (chờ Admin duyệt), quản lý phễu ứng viên (ATS), xếp lịch phỏng vấn và vận hành chương trình referral.",
  },
  {
    key: "manager",
    name: "Quản lý chuyên môn (Manager)",
    badgeColor: "bg-indigo-600 text-white",
    desc: "Khởi tạo yêu cầu tuyển dụng (REQ) cho phòng ban, thẩm định chuyên môn và tham gia đánh giá ứng viên phỏng vấn.",
  },
  {
    key: "employee",
    name: "Nhân viên (Employee)",
    badgeColor: "bg-slate-600 text-white",
    desc: "Xem tin tuyển dụng nội bộ, nộp hồ sơ ứng tuyển chuyển đổi vị trí và tham gia giới thiệu nhân tài nhận thưởng.",
  },
];

export function RolePermissionManagement() {
  const [activeTab, setActiveTab] = useState<"matrix" | "users">("matrix");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleUser, setRoleUser] = useState<ManagedUser | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [savingRole, setSavingRole] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await userService.list({
        role: selectedRole,
        search,
        pageSize: 50,
      });
      setUsers(res.items);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải danh sách tài khoản theo vai trò.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
  }, [activeTab, selectedRole]);

  const handleOpenRoleModal = (user: ManagedUser) => {
    setRoleUser(user);
    setEditingRoles(user.roles);
  };

  const handleSaveRoles = async () => {
    if (!roleUser) return;
    if (editingRoles.length === 0) {
      alert("Cần giữ lại ít nhất một vai trò cho người dùng.");
      return;
    }
    setSavingRole(true);
    try {
      await userService.updateRoles(roleUser.id, editingRoles);
      setRoleUser(null);
      loadUsers();
    } catch (caught: unknown) {
      alert(caught instanceof ApiError ? caught.message : "Không thể cập nhật vai trò.");
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
            <ShieldCheck className="h-4 w-4" />
            Phân quyền hệ thống
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Vai trò và Phân quyền (RBAC)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Tổng quan ma trận quyền hạn cho 4 vai trò chuẩn và phân quyền cho người dùng trong tổ chức.
          </p>
        </div>
      </header>

      {error && <Alert variant="error" title="Không thể tải dữ liệu">{error}</Alert>}

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES_INFO.map((role) => (
          <Card key={role.key} className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${role.badgeColor}`}>
                {role.name.split(" ")[0]}
              </span>
              <Shield className="h-4 w-4 text-slate-400" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">{role.name}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
          </Card>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "matrix"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Ma trận phân quyền (Role Matrix)</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "users"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Danh sách gán vai trò người dùng</span>
        </button>
      </div>

      {/* Tab 1: Permission Matrix */}
      {activeTab === "matrix" && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900">
              Chi tiết thẩm quyền của từng vai trò trên hệ thống
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                  <th className="px-5 py-3.5">Phân hệ nghiệp vụ</th>
                  <th className="px-4 py-3.5">Thao tác quyền hạn</th>
                  <th className="px-4 py-3.5 text-center">Quản trị viên (Admin)</th>
                  <th className="px-4 py-3.5 text-center">Nhân sự (HR)</th>
                  <th className="px-4 py-3.5 text-center">Quản lý (Manager)</th>
                  <th className="px-4 py-3.5 text-center">Nhân viên (Employee)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_MATRIX.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-800">{row.module}</td>
                    <td className="px-4 py-3 text-slate-600">{row.action}</td>
                    <td className="px-4 py-3 text-center">
                      {row.admin ? (
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-400">
                          <Minus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.hr_manager ? (
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-400">
                          <Minus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.manager ? (
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-400">
                          <Minus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.employee ? (
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-slate-400">
                          <Minus className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Users by Role */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: "all", label: "Tất cả vai trò" },
                  { value: "admin", label: "Quản trị viên" },
                  { value: "hr_manager", label: "Nhân sự" },
                  { value: "manager", label: "Quản lý" },
                  { value: "employee", label: "Nhân viên" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setSelectedRole(item.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      selectedRole === item.value
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="search"
                  placeholder="Tìm theo tên/email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
                <Button size="sm" onClick={() => loadUsers()} leftIcon={<Search className="h-3.5 w-3.5" />}>
                  Lọc
                </Button>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                Đang tải dữ liệu...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Không tìm thấy người dùng phù hợp với vai trò này.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {users.map((u) => (
                  <article key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{u.full_name}</h4>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              r === "admin"
                                ? "bg-slate-900 text-white"
                                : r === "hr_manager"
                                ? "bg-blue-100 text-blue-700"
                                : r === "manager"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {r === "admin" ? "Quản trị viên" : r === "hr_manager" ? "Nhân sự" : r === "manager" ? "Quản lý" : "Nhân viên"}
                          </span>
                        ))}
                      </div>

                      <Button size="sm" variant="outline" onClick={() => handleOpenRoleModal(u)}>
                        Đổi vai trò
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Role Adjustment Modal */}
      {roleUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-950">
              Phân vai trò cho {roleUser.full_name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Chọn các vai trò áp dụng cho tài khoản này ({roleUser.email}).
            </p>

            <div className="mt-4 grid gap-2">
              {[
                { value: "admin", label: "Quản trị viên (Admin)" },
                { value: "hr_manager", label: "Nhân sự (HR)" },
                { value: "manager", label: "Quản lý chuyên môn (Manager)" },
                { value: "employee", label: "Nhân viên (Employee)" },
              ].map((item) => (
                <label
                  key={item.value}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={editingRoles.includes(item.value)}
                    onChange={(e) =>
                      setEditingRoles(
                        e.target.checked
                          ? [...editingRoles, item.value]
                          : editingRoles.filter((r) => r !== item.value)
                      )
                    }
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRoleUser(null)}>
                Hủy bỏ
              </Button>
              <Button onClick={handleSaveRoles} isLoading={savingRole}>
                Lưu quyền hạn
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
