"use client";

import React, { useState, useEffect } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import { ScrollText, Search, RefreshCw, Eye, X, ShieldAlert, CheckCircle2, AlertTriangle, Filter } from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";
import { API_BASE_URL } from "@/lib/api-client";

interface AuditLog {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  module: string;
  target: string;
  ip: string;
  status: string;
  details: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminAppShell activeTab="audit-logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ScrollText className="w-7 h-7 text-[#4285F4]" />
              Nhật Ký Giám Sát Hệ Thống (Immutable Audit Logs)
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Nhật ký bất biến ghi nhận mọi thao tác truy cập, thay đổi quyền, khóa tài khoản và hoạt động bảo mật.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Làm mới nhật ký</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo Actor, Action hoặc Target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#4285F4]" />
              <p className="text-xs font-medium">Đang truy vấn nhật ký hệ thống...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 font-extrabold uppercase tracking-wider text-[11px] text-slate-500">
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4">Tài khoản thực hiện (Actor)</th>
                    <th className="py-3.5 px-4">Hành động (Action)</th>
                    <th className="py-3.5 px-4">Module</th>
                    <th className="py-3.5 px-4">Đối tượng tác động (Target)</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-bold whitespace-nowrap">
                        {log.timestamp.replace("T", " ")}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{log.actor}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#4285F4] border border-blue-100 font-extrabold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{log.module}</td>
                      <td className="py-3.5 px-4 text-slate-800">{log.target}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{log.ip}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Audit Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200 border-l border-gray-100 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <ScrollText className="w-5 h-5 text-[#4285F4]" />
                <h3 className="font-extrabold text-sm text-slate-900">Chi Tiết Sự Kiện Audit #{selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 space-y-3 font-medium text-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Thời gian sự kiện</span>
                <span className="font-bold text-slate-900">{selectedLog.timestamp}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tài khoản thao tác</span>
                <span className="font-bold text-slate-900">{selectedLog.actor}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Hành động thực hiện</span>
                <span className="font-bold text-blue-600">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Địa chỉ IP truy cập</span>
                <span className="font-mono text-slate-900">{selectedLog.ip}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nội dung ghi nhận</span>
                <p className="mt-1 leading-relaxed bg-white p-3 rounded-xl border border-gray-200 text-slate-800">
                  {selectedLog.details}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
