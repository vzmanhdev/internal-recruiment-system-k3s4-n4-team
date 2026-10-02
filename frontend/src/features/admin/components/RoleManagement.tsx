"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Lock,
  Edit3,
  Plus,
  Search,
  Key,
} from "lucide-react";
import { AdminShell } from "./AdminShell";

interface RolePermission {
  id: string;
  name: string;
  code: string;
  description: string;
  usersCount: number;
  isSystem: boolean;
  permissions: {
    module: string;
    read: boolean;
    write: boolean;
    approve: boolean;
    delete: boolean;
  }[];
}

const initialRoles: RolePermission[] = [
  {
    id: "role-admin",
    name: "Quản trị viên (Admin)",
    code: "admin",
    description: "Toàn quyền quản trị hệ thống, quản lý tài khoản, cấu hình và phân quyền.",
    usersCount: 2,
    isSystem: true,
    permissions: [
      { module: "Quản lý tài khoản", read: true, write: true, approve: true, delete: true },
      { module: "Phê duyệt tờ trình", read: true, write: true, approve: true, delete: true },
      { module: "Quản lý tin tuyển dụng", read: true, write: true, approve: true, delete: true },
      { module: "Hồ sơ & Ứng tuyển", read: true, write: true, approve: true, delete: true },
      { module: "Cấu hình hệ thống", read: true, write: true, approve: true, delete: true },
    ],
  },
  {
    id: "role-hr",
    name: "Quản lý Nhân sự (HR Manager)",
    code: "hr_manager",
    description: "Đăng tin tuyển dụng, tiếp nhận hồ sơ, đặt lịch phỏng vấn và quản lý ứng viên.",
    usersCount: 5,
    isSystem: true,
    permissions: [
      { module: "Quản lý tài khoản", read: true, write: false, approve: false, delete: false },
      { module: "Phê duyệt tờ trình", read: true, write: true, approve: true, delete: false },
      { module: "Quản lý tin tuyển dụng", read: true, write: true, approve: true, delete: true },
      { module: "Hồ sơ & Ứng tuyển", read: true, write: true, approve: true, delete: true },
      { module: "Cấu hình hệ thống", read: true, write: false, approve: false, delete: false },
    ],
  },
  {
    id: "role-depthead",
    name: "Trưởng phòng / Quản lý (Dept Head)",
    code: "manager",
    description: "Tạo tờ trình tuyển dụng bổ sung, duyệt hồ sơ phòng ban và đánh giá phỏng vấn.",
    usersCount: 12,
    isSystem: true,
    permissions: [
      { module: "Quản lý tài khoản", read: false, write: false, approve: false, delete: false },
      { module: "Phê duyệt tờ trình", read: true, write: true, approve: true, delete: false },
      { module: "Quản lý tin tuyển dụng", read: true, write: false, approve: false, delete: false },
      { module: "Hồ sơ & Ứng tuyển", read: true, write: true, approve: true, delete: false },
      { module: "Cấu hình hệ thống", read: false, write: false, approve: false, delete: false },
    ],
  },
  {
    id: "role-employee",
    name: "Nhân viên nội bộ (Employee)",
    code: "employee",
    description: "Xem các vị trí tuyển dụng nội bộ, tự ứng tuyển hoặc giới thiệu ứng viên.",
    usersCount: 140,
    isSystem: true,
    permissions: [
      { module: "Quản lý tài khoản", read: false, write: false, approve: false, delete: false },
      { module: "Phê duyệt tờ trình", read: false, write: false, approve: false, delete: false },
      { module: "Quản lý tin tuyển dụng", read: true, write: false, approve: false, delete: false },
      { module: "Hồ sơ & Ứng tuyển", read: true, write: true, approve: false, delete: false },
      { module: "Cấu hình hệ thống", read: false, write: false, approve: false, delete: false },
    ],
  },
];

export function RoleManagement() {
  const [roles] = useState<RolePermission[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<RolePermission>(roles[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vai trò & Phân quyền</h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý các vai trò người dùng và phân quyền chi tiết trong hệ thống tuyển dụng nội bộ.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-hover hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo vai trò mới
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Roles list */}
          <div className="space-y-4 lg:col-span-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm vai trò..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              {filteredRoles.map((role) => {
                const isSelected = selectedRole.id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid h-9 w-9 place-items-center rounded-xl ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{role.name}</p>
                          <code className="text-[11px] font-mono text-slate-500">{role.code}</code>
                        </div>
                      </div>
                      {role.isSystem && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          <Lock className="h-3 w-3" /> System
                        </span>
                      )}
                    </div>
                    <p className="mt-2.5 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                      {role.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>{role.usersCount} tài khoản được gán</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role details & permissions table */}
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900">{selectedRole.name}</h2>
                    <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-mono font-semibold text-blue-700">
                      {selectedRole.code}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{selectedRole.description}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-4 w-4" /> Chỉnh sửa
                </button>
              </div>

              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
                  <Key className="h-4 w-4 text-blue-600" /> Chi tiết phân quyền theo chức năng
                </h3>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Phân hệ Chức năng</th>
                        <th className="px-4 py-3 text-center">Xem (Read)</th>
                        <th className="px-4 py-3 text-center">Tạo/Sửa (Write)</th>
                        <th className="px-4 py-3 text-center">Phê duyệt (Approve)</th>
                        <th className="px-4 py-3 text-center">Xóa (Delete)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {selectedRole.permissions.map((perm, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3.5 font-medium text-slate-900">{perm.module}</td>
                          <td className="px-4 py-3.5 text-center">
                            {perm.read ? (
                              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {perm.write ? (
                              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {perm.approve ? (
                              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {perm.delete ? (
                              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
