"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  UserCheck,
  Key,
  Database,
  Clock,
} from "lucide-react";
import { AdminShell } from "./AdminShell";

interface AuditLog {
  id: string;
  actor: string;
  email: string;
  action: string;
  module: string;
  ipAddress: string;
  status: "success" | "warning" | "error";
  timestamp: string;
  details: string;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "LOG-9001",
    actor: "Admin Quản trị",
    email: "admin@company.com",
    action: "Đăng nhập hệ thống",
    module: "Xác thực (Auth)",
    ipAddress: "192.168.1.10",
    status: "success",
    timestamp: "02/10/2026 16:45:12",
    details: "Đăng nhập thành công với JWT token",
  },
  {
    id: "LOG-9002",
    actor: "HR Manager",
    email: "hr@company.com",
    action: "Phê duyệt tin tuyển dụng",
    module: "Tin tuyển dụng",
    ipAddress: "192.168.1.25",
    status: "success",
    timestamp: "02/10/2026 15:30:00",
    details: "Phê duyệt công việc Senior Backend Engineer (JOB-101)",
  },
  {
    id: "LOG-9003",
    actor: "Hệ thống",
    email: "system@company.com",
    action: "Khởi tạo dữ liệu mặc định (Seed)",
    module: "Cơ sở dữ liệu",
    ipAddress: "127.0.0.1",
    status: "success",
    timestamp: "02/10/2026 14:00:00",
    details: "Đã tạo tài khoản mặc định admin@company.com, hr@company.com",
  },
  {
    id: "LOG-9004",
    actor: "Unknown",
    email: "test_hacker@gmail.com",
    action: "Sai mật khẩu quá 5 lần",
    module: "Bảo mật",
    ipAddress: "113.190.45.12",
    status: "warning",
    timestamp: "02/10/2026 12:15:33",
    details: "Tự động kích hoạt khóa tạm thời IP trong 15 phút",
  },
];

export function AuditLogsManagement() {
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nhật ký Hệ thống (Audit Logs)</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ghi vết tất cả các thao tác quan trọng, lịch sử truy cập và biến động dữ liệu.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm người thực hiện, hành động, email..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả phân hệ</option>
              <option value="Xác thực (Auth)">Xác thực (Auth)</option>
              <option value="Tin tuyển dụng">Tin tuyển dụng</option>
              <option value="Cơ sở dữ liệu">Cơ sở dữ liệu</option>
              <option value="Bảo mật">Bảo mật</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Thời gian</th>
                <th className="px-5 py-4">Người thực hiện</th>
                <th className="px-5 py-4">Hành động</th>
                <th className="px-5 py-4">Phân hệ</th>
                <th className="px-5 py-4">Địa chỉ IP</th>
                <th className="px-5 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-5 py-4 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{log.timestamp}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{log.actor}</p>
                      <p className="text-xs text-slate-400">{log.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-800">
                    <p>{log.action}</p>
                    <p className="text-xs font-normal text-slate-500">{log.details}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{log.ipAddress}</td>
                  <td className="px-5 py-4 text-center">
                    {log.status === "success" && (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Thành công
                      </span>
                    )}
                    {log.status === "warning" && (
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Cảnh báo
                      </span>
                    )}
                    {log.status === "error" && (
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        Lỗi
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
