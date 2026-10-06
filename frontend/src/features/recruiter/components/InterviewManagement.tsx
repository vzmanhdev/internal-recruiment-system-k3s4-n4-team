"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  CalendarCheck,
  CheckCircle,
  Clock,
  ExternalLink,
  MapPin,
  Plus,
  Users,
  Video,
  X,
} from "lucide-react";
import { recruiterService } from "../services/recruiter.service";
import type { InterviewItem } from "../types/recruiter.types";
import { Spinner } from "@/components/ui/Spinner";

export function InterviewManagement() {
  const searchParams = useSearchParams();
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    application_id: 1,
    candidate_name: "",
    job_title: "",
    interview_date: "08/10/2026",
    interview_time: "09:30 - 10:30",
    format: "Online",
    location_or_link: "https://teams.microsoft.com/l/meetup-join/interview-room",
    interviewer_names: "Nguyễn Thu Hà (HR), Trưởng bộ phận chuyên môn",
    round_name: "Vòng 1 - Chuyên môn",
  });

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const res = await recruiterService.getInterviews(statusFilter);
      setInterviews(res.items);
    } catch (err) {
      console.error("Failed to load interviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, [statusFilter]);

  // Pre-fill from query params if navigated from candidate page
  useEffect(() => {
    const candName = searchParams.get("candidate");
    const jobTitle = searchParams.get("job");
    const appId = searchParams.get("app_id");
    if (candName || jobTitle) {
      setFormData((prev) => ({
        ...prev,
        candidate_name: candName ?? "",
        job_title: jobTitle ?? "",
        application_id: appId ? parseInt(appId) : 1,
      }));
      setModalOpen(true);
    }
  }, [searchParams]);

  const handleOpenCreateModal = () => {
    setFormData({
      application_id: 1,
      candidate_name: "",
      job_title: "",
      interview_date: "08/10/2026",
      interview_time: "09:30 - 10:30",
      format: "Online",
      location_or_link: "https://teams.microsoft.com/l/meetup-join/interview-room",
      interviewer_names: "Nguyễn Thu Hà (HR), Trưởng bộ phận chuyên môn",
      round_name: "Vòng 1 - Chuyên môn",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidate_name || !formData.job_title) {
      alert("Vui lòng nhập tên ứng viên và vị trí phỏng vấn.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newInterview = await recruiterService.scheduleInterview(formData);
      setInterviews((prev) => [newInterview, ...prev]);
      setToastMessage(`Đã xếp lịch phỏng vấn cho ứng viên ${newInterview.candidate_name}!`);
      setModalOpen(false);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi tạo lịch phỏng vấn.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Lịch Phỏng Vấn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Điều phối hội đồng phỏng vấn, gửi link trao đổi chuyên môn trực tuyến hoặc phòng họp nội bộ.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Lên lịch phỏng vấn mới
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 w-fit">
        {[
          { id: "all", label: "Tất cả các ca" },
          { id: "scheduled", label: "Sắp diễn ra" },
          { id: "completed", label: "Đã hoàn thành" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interview List / Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">Không có lịch phỏng vấn nào</h3>
          <p className="mt-1 text-xs text-slate-500">Bấm nút "Lên lịch phỏng vấn mới" để xếp lịch trao đổi cho ứng viên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {interviews.map((iv) => (
            <div
              key={iv.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                        {iv.round_name}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs ${
                          iv.status === "completed"
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {iv.status === "completed" ? "Đã phỏng vấn" : "Chưa diễn ra"}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 pt-2">
                      {iv.candidate_name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600">{iv.job_title}</p>
                  </div>

                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-700 border border-slate-100">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-slate-800">
                      {iv.interview_date} • {iv.interview_time}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {iv.format === "Online" ? (
                      <Video className="h-3.5 w-3.5 text-blue-600" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    <span className="truncate max-w-[320px]">
                      Hình thức: <span className="font-semibold text-slate-800">{iv.format}</span> ({iv.location_or_link})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate max-w-[320px]">Hội đồng: {iv.interviewer_names}</span>
                  </div>
                </div>

                {iv.feedback && (
                  <div className="mt-3 rounded-xl bg-emerald-50/60 p-2.5 text-xs text-emerald-900 border border-emerald-100">
                    <span className="font-bold">Nhận xét:</span> {iv.feedback}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {iv.result === "passed" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Kết quả: Đạt
                    </span>
                  )}
                  {iv.result === "pending" && (
                    <span className="text-[11px] font-medium text-slate-400">
                      Đang chờ kết luận sau phỏng vấn
                    </span>
                  )}
                </div>

                <div>
                  {iv.format === "Online" && (
                    <a
                      href={iv.location_or_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Tham gia phỏng vấn
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                Lên lịch phỏng vấn mới
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ tên ứng viên *
                </label>
                <input
                  type="text"
                  required
                  value={formData.candidate_name}
                  onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                  placeholder="VD: Phạm Hoàng Long"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vị trí tuyển dụng *
                </label>
                <input
                  type="text"
                  required
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="VD: Senior Data Analyst"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày phỏng vấn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.interview_date}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                    placeholder="VD: 08/10/2026"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Khung giờ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.interview_time}
                    onChange={(e) => setFormData({ ...formData, interview_time: e.target.value })}
                    placeholder="VD: 09:30 - 10:30"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hình thức *
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
                  >
                    <option value="Online">Online (MS Teams / Meet)</option>
                    <option value="Trực tiếp">Trực tiếp tại văn phòng</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vòng đánh giá *
                  </label>
                  <select
                    value={formData.round_name}
                    onChange={(e) => setFormData({ ...formData, round_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
                  >
                    <option value="Vòng 1 - Chuyên môn">Vòng 1 - Chuyên môn</option>
                    <option value="Vòng 2 - Case Study">Vòng 2 - Case Study</option>
                    <option value="Vòng 3 - Ban Giám Đốc">Vòng 3 - Ban Giám Đốc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Link cuộc họp hoặc Phòng họp văn phòng *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location_or_link}
                  onChange={(e) => setFormData({ ...formData, location_or_link: e.target.value })}
                  placeholder="https://teams.microsoft.com/... hoặc Phòng họp Tokyo Tầng 8"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hội đồng phỏng vấn (Hiring Manager / HR) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.interviewer_names}
                  onChange={(e) => setFormData({ ...formData, interviewer_names: e.target.value })}
                  placeholder="Nguyễn Thu Hà (HR), Trần Quốc Bảo (Tech Manager)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting && <Spinner size="sm" />}
                  <span>Tạo lịch & Gửi thông báo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
