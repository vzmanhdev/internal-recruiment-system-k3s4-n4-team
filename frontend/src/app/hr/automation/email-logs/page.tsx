"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Mail,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  FileText
} from "lucide-react";
import { apiRequest, ApiError } from "@/lib/api-client";

interface EmailLog {
  id: number;
  template_code?: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  body_html: string;
  status: string; // sent, failed, pending
  error_message?: string;
  sent_at: string;
  retried_at?: string;
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter.toLowerCase());
      if (search) params.append("search", search);
      setLogs(await apiRequest<EmailLog[]>(`/email-automation/logs${params.toString() ? `?${params.toString()}` : ""}`));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không tải được nhật ký email.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchLogs());
  }, [statusFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = async (log: EmailLog) => {
    try {
      const updated = await apiRequest<EmailLog>(`/email-automation/logs/${log.id}/retry`, { method: "POST" });
      setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      if (selectedLog?.id === updated.id) {
        setSelectedLog(updated);
      }
      // the server returns the real outcome of the new attempt
      showToast(
        updated.status === "sent" ? `Đã gửi lại thành công email tới ${log.recipient_email}!` : `Gửi lại chưa thành công (trạng thái: ${updated.status}).`,
        updated.status === "sent" ? "success" : "error",
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Gửi lại email thất bại!", "error");
    }
  };

  const sentCount = logs.filter((l) => l.status === "sent").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;
  const pendingCount = logs.filter((l) => l.status === "pending" || l.status === "queued").length;
  const successRate = logs.length > 0 ? Math.round((sentCount / logs.length) * 100) : 100;

  return (
    <div className="w-full space-y-5 antialiased">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Chi Tiết Email Đã Gửi</h3>
                  <p className="text-[11px] text-slate-400">ID Nhật Ký: #{selectedLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-slate-400 font-medium block">Người nhận:</span>
                  <span className="font-extrabold text-slate-900">
                    {selectedLog.recipient_name} ({selectedLog.recipient_email})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Thời điểm gửi:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLog.sent_at ? new Date(selectedLog.sent_at).toLocaleString("vi-VN") : "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Trạng thái:</span>
                {selectedLog.status === "sent" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold inline-flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                  </span>
                )}
                {selectedLog.status === "failed" && (
                  <div className="space-y-1 mt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold inline-flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Thất bại
                    </span>
                    {selectedLog.error_message && (
                      <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-800 text-[11px] font-medium font-mono">
                        Lỗi: {selectedLog.error_message}
                      </div>
                    )}
                  </div>
                )}
                {selectedLog.status === "pending" && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold inline-flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5" /> Đang chờ
                  </span>
                )}
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400 font-medium block mb-1">Tiêu đề:</span>
                <span className="font-extrabold text-slate-900">{selectedLog.subject}</span>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400 font-medium block mb-1">Nội dung Email:</span>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs max-h-48 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: selectedLog.body_html }} />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {selectedLog.status === "failed" ? (
                <button
                  type="button"
                  onClick={() => handleRetry(selectedLog)}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white font-extrabold text-xs hover:bg-blue-700 flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Thực hiện gửi lại email này
                </button>
              ) : (
                <div></div>
              )}
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-md cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <Send className="w-5 h-5" />
            </div>
            <span>Nhật Ký Gửi Email (Email Delivery Logs)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Theo dõi lịch sử gửi email tự động bất đồng bộ, kiểm tra trạng thái và xử lý gửi lại khi xảy ra lỗi (S8-02).
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Làm mới nhật ký</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Total Sent */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{logs.length}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Tổng email đã phát</div>
          </div>
        </div>

        {/* Success */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">{sentCount}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {successRate}%
              </span>
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Thành công ({successRate}%)</div>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{failedCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Lỗi kết nối / Thất bại</div>
          </div>
        </div>

        {/* Pending Queue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{pendingCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Đang chờ trong hàng đợi</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo người nhận, email, tiêu đề..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-600">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SENT">Gửi Thành Công</option>
            <option value="FAILED">Gửi Thất Bại</option>
            <option value="PENDING">Đang Chờ</option>
          </select>
        </div>
      </div>

      {/* Email Logs Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs font-medium flex flex-col items-center justify-center gap-2.5">
            <RefreshCw className="w-6 h-6 animate-spin text-[#2563EB]" />
            <span>Đang truy xuất nhật ký email...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50/80 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <Send className="w-7 h-7" />
            </div>
            <p className="font-extrabold text-sm text-slate-800">Không có bản ghi nhật ký phù hợp</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Hệ thống sẽ tự động ghi lại lịch sử các đợt phát email kích hoạt tài khoản, lời mời phỏng vấn và thông báo offer.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={fetchLogs}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới dữ liệu</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Người Nhận</th>
                  <th className="py-3.5 px-4">Mẫu / Tiêu Đề</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">
                        {log.sent_at ? new Date(log.sent_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                      </span>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {log.sent_at ? new Date(log.sent_at).toLocaleDateString("vi-VN") : ""}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{log.recipient_name}</div>
                      <div className="text-[11px] text-slate-500">{log.recipient_email}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate">
                      {log.template_code && (
                        <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md inline-block mb-1">
                          {log.template_code}
                        </span>
                      )}
                      <div className="text-slate-800 font-medium truncate">{log.subject}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {log.status === "sent" && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Thành công</span>
                        </span>
                      )}
                      {log.status === "failed" && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Thất bại</span>
                        </span>
                      )}
                      {log.status === "pending" && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Đang chờ</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {log.status === "failed" && (
                          <button
                            type="button"
                            onClick={() => handleRetry(log)}
                            title="Thực hiện gửi lại"
                            className="px-2.5 py-1 rounded-xl bg-blue-50 text-[#2563EB] hover:bg-blue-600 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Gửi lại</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailModalOpen(true);
                          }}
                          title="Xem chi tiết nội dung"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
