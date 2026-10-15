"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Filter, Search } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { AuditLogItem, systemService } from "../services/system.service";

export function AuditLogsManagement() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  useEffect(() => {
    systemService.auditLogs()
      .then(setLogs)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không thể tải nhật ký hệ thống."))
      .finally(() => setLoading(false));
  }, []);

  const modules = useMemo(() => Array.from(new Set(logs.map((log) => log.module))), [logs]);
  const filteredLogs = logs.filter((log) => {
    const keyword = searchQuery.toLowerCase();
    return (!keyword || `${log.actor} ${log.action} ${log.email}`.toLowerCase().includes(keyword)) &&
      (moduleFilter === "all" || log.module === moduleFilter);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nhật ký Hệ thống (Audit Logs)</h1>
        <p className="mt-1 text-sm text-slate-500">Dữ liệu thật được ghi từ các thao tác đăng nhập, cấu hình và quản lý tuyển dụng.</p>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm người thực hiện, hành động, email..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
            <option value="all">Tất cả phân hệ</option>
            {modules.map((module) => <option key={module} value={module}>{module}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4">Người thực hiện</th><th className="px-5 py-4">Hành động</th><th className="px-5 py-4">Phân hệ</th><th className="px-5 py-4">Địa chỉ IP</th><th className="px-5 py-4 text-center">Trạng thái</th></tr></thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{new Date(log.timestamp).toLocaleString("vi-VN")}</span></td>
                <td className="px-5 py-4"><p className="font-bold text-slate-900">{log.actor}</p><p className="text-xs text-slate-400">{log.email}</p></td>
                <td className="px-5 py-4 font-medium text-slate-800"><p>{log.action}</p><p className="text-xs font-normal text-slate-500">{log.details}</p></td>
                <td className="px-5 py-4"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium">{log.module}</span></td>
                <td className="px-5 py-4 font-mono text-xs text-slate-500">{log.ip_address}</td>
                <td className="px-5 py-4 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${log.status === "success" ? "bg-emerald-50 text-emerald-700" : log.status === "warning" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{log.status === "success" ? "Thành công" : log.status === "warning" ? "Cảnh báo" : "Lỗi"}</span></td>
              </tr>
            ))}
            {!loading && filteredLogs.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Chưa có nhật ký phù hợp.</td></tr>}
            {loading && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Đang tải nhật ký...</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
