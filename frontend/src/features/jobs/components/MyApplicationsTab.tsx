"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, Clock, CheckCircle2, AlertCircle, Calendar, 
  Building, MapPin, ChevronRight, User, Sparkles, RefreshCw, XCircle 
} from "lucide-react";
import { apiRequest } from "@/lib/api-client";

interface ApplicationItem {
  id: number;
  job_posting_id: number;
  full_name: string;
  email: string;
  phone: string;
  status: "submitted" | "screening" | "interviewing" | "offered" | "hired" | "rejected";
  created_at?: string;
  job_title?: string;
  job_department?: string;
  job_location?: string;
  score?: number;
  hr_notes?: string;
}

export function MyApplicationsTab() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<ApplicationItem[]>("/applications");
      if (Array.isArray(res)) {
        setApplications(res);
        if (res.length > 0) setSelectedApp(res[0]);
      }
    } catch (err) {
      console.error("Failed to fetch my applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return { label: "Đã nộp hồ sơ", style: "bg-blue-50 text-blue-700 border-blue-200" };
      case "screening":
        return { label: "Đang sàng lọc CV", style: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "interviewing":
        return { label: "Vòng phỏng vấn", style: "bg-purple-50 text-purple-700 border-purple-200" };
      case "offered":
        return { label: "Đã đề xuất Offer", style: "bg-amber-50 text-amber-700 border-amber-200" };
      case "hired":
        return { label: "Trúng tuyển nội bộ", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "rejected":
        return { label: "Chưa phù hợp", style: "bg-rose-50 text-rose-700 border-rose-200" };
      default:
        return { label: status, style: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const stages = [
    { key: "submitted", name: "1. Đã nộp" },
    { key: "screening", name: "2. Sàng lọc" },
    { key: "interviewing", name: "3. Phỏng vấn" },
    { key: "offered", name: "4. Offer" },
    { key: "hired", name: "5. Trúng tuyển" },
  ];

  const getStageIndex = (status: string) => {
    if (status === "rejected") return -1;
    const idx = stages.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="font-bold text-slate-800 text-base">Đang tải danh sách hồ sơ đã nộp...</h3>
        <p className="text-xs text-slate-500 mt-1">Hệ thống đang kiểm tra lịch sử ứng tuyển nội bộ của bạn.</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="font-extrabold text-slate-900 text-lg">Bạn chưa nộp hồ sơ ứng tuyển nội bộ nào</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Hãy khám phá các vị trí tuyển dụng nội bộ đang mở tại mục <strong>"Tất cả vị trí"</strong> và gửi ứng tuyển để mở rộng cơ hội phát triển sự nghiệp tại công ty.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left List of Applications (5 cols) */}
      <div className="lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between px-1 mb-1">
          <h3 className="font-bold text-slate-900 text-sm">Hồ sơ đã gửi ({applications.length})</h3>
          <button
            onClick={fetchMyApplications}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>

        {applications.map((app) => {
          const badge = getStatusBadge(app.status);
          const isSelected = selectedApp?.id === app.id;
          return (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-blue-50/70 border-blue-300 shadow-md ring-2 ring-blue-500/10"
                  : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${badge.style}`}>
                  {badge.label}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  ID: #{app.id}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                {app.job_title || `Vị trí tuyển dụng ID #${app.job_posting_id}`}
              </h4>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium mt-2">
                <div className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{app.job_department || "Khối Tuyển Dụng"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nộp ngày: {app.created_at ? new Date(app.created_at).toLocaleDateString("vi-VN") : "Gần đây"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Detail & Stage Timeline (7 cols) */}
      {selectedApp && (
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          {/* Header Detail */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(selectedApp.status).style}`}>
                {getStatusBadge(selectedApp.status).label}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Mã hồ sơ: #{selectedApp.id}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {selectedApp.job_title || `Vị trí tuyển dụng #${selectedApp.job_posting_id}`}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ứng viên: <strong>{selectedApp.full_name}</strong> ({selectedApp.email})
            </p>
          </div>

          {/* Timeline Visual Progress Bar */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
              Tiến độ xử lý hồ sơ (Workflow Pipeline)
            </h4>

            {selectedApp.status === "rejected" ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm mb-0.5">Hồ sơ chưa phù hợp đợt này</div>
                  <p>Hội đồng tuyển dụng đã xem xét và đánh giá hồ sơ của bạn chưa đáp ứng đủ tiêu chuẩn vị trí tại thời điểm này. Bạn hoàn toàn có thể tiếp tục ứng tuyển các vị trí khác!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-1.5">
                  {stages.map((stg, idx) => {
                    const currentIdx = getStageIndex(selectedApp.status);
                    const isPassed = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <div key={stg.key} className="text-center">
                        <div 
                          className={`h-2 rounded-full mb-2 transition-all ${
                            isPassed ? (isCurrent ? "bg-blue-600 ring-2 ring-blue-300" : "bg-emerald-500") : "bg-slate-200"
                          }`}
                        />
                        <span className={`text-[10px] font-bold block truncate ${
                          isCurrent ? "text-blue-700" : isPassed ? "text-emerald-700" : "text-slate-400"
                        }`}>
                          {stg.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Trạng thái hiện tại: {getStatusBadge(selectedApp.status).label}</span>
                  </div>
                  <p className="text-slate-600">
                    {selectedApp.status === "submitted" && "Hồ sơ của bạn đã được ghi nhận vào hệ thống và đang chờ Chuyên viên Tuyển dụng (Recruiter) tiếp nhận sàng lọc."}
                    {selectedApp.status === "screening" && "Hồ sơ của bạn đang được Phòng Nhân Sự đối chiếu năng lực & kinh nghiệm với tiêu chuẩn khung vị trí."}
                    {selectedApp.status === "interviewing" && "Hồ sơ của bạn đã vượt qua vòng hồ sơ! Hội đồng phỏng vấn đang xếp lịch hẹn phỏng vấn chuyên môn."}
                    {selectedApp.status === "offered" && "Chúc mừng! Bạn đã nhận được Đề xuất nhận việc (Offer) từ Hội đồng Tuyển dụng. Vui lòng kiểm tra email."}
                    {selectedApp.status === "hired" && "Chúc mừng bạn đã trúng tuyển chính thức vị trí điều chuyển nội bộ! Quy trình Onboarding đã sẵn sàng."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes / Evaluation Summary if any */}
          {selectedApp.hr_notes && (
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs space-y-1">
              <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider block">Ghi chú từ Phòng Nhân Sự:</span>
              <p className="text-slate-700 font-medium italic">"{selectedApp.hr_notes}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
