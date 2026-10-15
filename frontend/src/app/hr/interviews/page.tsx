"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Video,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HrShell } from "@/features/hr/components/HrShell";
import {
  fetchManageInterviews,
  fetchMyInterviews,
  updateInterview,
  InterviewItem,
} from "@/features/interviews/services/interview.service";
import { ApiError } from "@/lib/api-client";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  scheduled: { label: "Đã lên lịch", bg: "bg-blue-50", text: "text-blue-700" },
  completed: { label: "Đã phỏng vấn", bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled: { label: "Đã hủy", bg: "bg-rose-50", text: "text-rose-700" },
  rescheduled: { label: "Đổi lịch", bg: "bg-amber-50", text: "text-amber-700" },
};

export default function HrInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "my") {
        const res = await fetchMyInterviews();
        setInterviews(res.items);
      } else {
        const res = await fetchManageInterviews({
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm,
        });
        setInterviews(res.items);
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải danh sách lịch phỏng vấn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void loadData());
    // Search is applied explicitly when the filter form is submitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateInterview(id, { status });
      setNotice(`Đã cập nhật trạng thái lịch phỏng vấn thành: ${STATUS_CONFIG[status]?.label || status}`);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể cập nhật trạng thái lịch.");
    }
  };

  return (
    <HrShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản lý Lịch Phỏng vấn & Hội đồng Tuyển dụng</h1>
            <p className="text-sm text-slate-500">Lên lịch phỏng vấn, phân công Hội đồng phỏng vấn (Panel) và điều phối các ca phỏng vấn.</p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        {/* View Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 gap-2 pb-px">
          <button
            onClick={() => setActiveTab("all")}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "all" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Tất cả Lịch phỏng vấn Toàn hệ thống
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "my" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Lịch phỏng vấn Tôi được phân công
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mã lịch INT, tiêu đề hoặc ứng viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <Button type="submit" variant="secondary" className="px-4">
              Lọc
            </Button>
          </form>

          {activeTab === "all" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="completed">Đã hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          )}
        </div>

        {/* Interviews Cards / List Grid */}
        <div className="space-y-4">
          {loading ? (
            <Card className="p-8 text-center text-sm text-slate-500">Đang tải danh sách lịch phỏng vấn...</Card>
          ) : interviews.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">Chưa có lịch phỏng vấn nào phù hợp với bộ lọc.</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((item) => {
                const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.scheduled;
                return (
                  <Card key={item.id} className="p-5 space-y-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-blue-600 block">{item.code}</span>
                        <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ứng viên: <strong className="text-slate-800">{item.candidate_name || "N/A"}</strong> — {item.job_title}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="block font-bold text-slate-800">
                            {new Date(item.start_time).toLocaleDateString("vi-VN")}
                          </span>
                          <span className="text-slate-500">
                            {new Date(item.start_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {new Date(item.end_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.interview_type === "online" ? (
                          <Video className="h-4 w-4 text-purple-600 shrink-0" />
                        ) : (
                          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="block font-bold text-slate-800 capitalize">{item.interview_type}</span>
                          {item.interview_type === "online" && item.location_or_link.startsWith("http") ? (
                            <a
                              href={item.location_or_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 font-bold hover:underline truncate block"
                            >
                              Tham gia Meeting <ExternalLink className="inline h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500 truncate block">{item.location_or_link}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Interviewers Panel */}
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" /> Hội đồng Phỏng vấn (Panel):
                      </div>
                      {item.interviewers.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Chưa phân công người phỏng vấn</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.interviewers.map((iv) => (
                            <span key={iv.id} className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800">
                              {iv.full_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {item.status === "scheduled" && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(item.id, "completed")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Hoàn thành
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleUpdateStatus(item.id, "cancelled")}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Hủy lịch
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </HrShell>
  );
}
