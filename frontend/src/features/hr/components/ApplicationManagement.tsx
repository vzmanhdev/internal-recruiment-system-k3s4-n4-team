"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Mail,
  Phone,
  ArrowRight,
  Star,
  Calendar,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HrShell } from "./HrShell";
import {
  fetchManageApplications,
  updateApplicationStage,
  ApplicationItem,
} from "@/features/applications/services/application.service";
import {
  createEvaluation,
  fetchEvaluations,
  EvaluationItem,
} from "@/features/referrals/services/referral.service";
import { createInterview, fetchAvailableInterviewers, AvailableInterviewer } from "@/features/interviews/services/interview.service";
import { createOffer } from "@/features/offers/services/offer.service";
import { ApiError } from "@/lib/api-client";



const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  applied: { label: "Mới nộp", bg: "bg-blue-50", text: "text-blue-700" },
  screening: { label: "Sơ tuyển", bg: "bg-amber-50", text: "text-amber-700" },
  interviewing: { label: "Phỏng vấn", bg: "bg-purple-50", text: "text-purple-700" },
  offered: { label: "Mời làm việc (Offer)", bg: "bg-teal-50", text: "text-teal-700" },
  hired: { label: "Đã tuyển", bg: "bg-emerald-50", text: "text-emerald-700" },
  rejected: { label: "Từ chối", bg: "bg-rose-50", text: "text-rose-700" },
};

const RECOMMENDATION_MAP: Record<string, { label: string; color: string }> = {
  strong_hire: { label: "Tuyển gấp (Strong Hire)", color: "bg-emerald-100 text-emerald-800" },
  hire: { label: "Đạt yêu cầu (Hire)", color: "bg-blue-100 text-blue-800" },
  hold: { label: "Cân nhắc (Hold)", color: "bg-amber-100 text-amber-800" },
  reject: { label: "Không đạt (Reject)", color: "bg-rose-100 text-rose-800" },
};

export function ApplicationManagement() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [statusTab, setStatusTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [stageNote, setStageNote] = useState("");
  const [actionError, setActionError] = useState("");

  // Evaluation Form State
  const [evalForm, setEvalForm] = useState({
    overall_score: 4,
    competency_score: 4,
    culture_fit_score: 4,
    recommendation: "hire",
    feedback: "",
  });
  const [submittingEval, setSubmittingEval] = useState(false);

  // Interview Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [schedulePanel, setSchedulePanel] = useState<number[]>([]);
  const [availablePanel, setAvailablePanel] = useState<AvailableInterviewer[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: "Phỏng vấn Chuyên môn Vòng 1",
    interview_type: "online",
    location_or_link: "https://meet.google.com/abc-xyz-def",
    start_time: "",
    end_time: "",
    notes: "Vui lòng chuẩn bị thiết bị micro và camera sẵn sàng 5 phút trước giờ hẹn.",
  });

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSubmittingSchedule(true);
    setActionError("");
    try {
      await createInterview({
        application_id: selectedApp.id,
        title: scheduleForm.title,
        interview_type: scheduleForm.interview_type,
        location_or_link: scheduleForm.location_or_link,
        start_time: new Date(scheduleForm.start_time).toISOString(),
        end_time: new Date(scheduleForm.end_time).toISOString(),
        notes: scheduleForm.notes,
        interviewer_ids: schedulePanel,
      });
      setNotice("Đã tạo lịch phỏng vấn. Mở trang Lịch phỏng vấn để gửi lời mời.");
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Không thể lên lịch phỏng vấn.");
    } finally {
      setSubmittingSchedule(false);
    }
  };

  // Offer Creation Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    position_title: "",
    offered_salary: 35000000,
    start_date: "",
    probation_period_months: 2,
    work_location: "Hà Nội / Hồ Chí Minh",
    expiration_date: "",
    notes: "Hưởng 85% lương trong 2 tháng thử việc. Bảo hiểm XH đầy đủ theo quy định.",
  });

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSubmittingOffer(true);
    setActionError("");
    try {
      await createOffer({
        application_id: selectedApp.id,
        position_title: offerForm.position_title || selectedApp.job_title || "Nhân viên mới",
        offered_salary: Number(offerForm.offered_salary),
        start_date: new Date(offerForm.start_date).toISOString(),
        probation_period_months: Number(offerForm.probation_period_months),
        work_location: offerForm.work_location,
        expiration_date: new Date(offerForm.expiration_date).toISOString(),
        notes: offerForm.notes,
      });
      setNotice("Đã lưu bản nháp thư mời. Vào Thư mời & phê duyệt offer để trình duyệt và gửi ứng viên.");
      setShowOfferModal(false);
      loadData();
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Không thể tạo Thư mời nhận việc.");
    } finally {
      setSubmittingOffer(false);
    }
  };



  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchManageApplications({
        status: statusTab !== "all" ? statusTab : undefined,
        search: searchTerm,
      });
      setApplications(res.items);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải danh sách hồ sơ ứng tuyển.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusTab]);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  useEffect(() => {
    if (selectedApp) {
      void fetchEvaluations(selectedApp.id)
        .then(setEvaluations)
        .catch((err) => console.error("Failed to load evaluations:", err));
    } else {
      queueMicrotask(() => setEvaluations([]));
    }
  }, [selectedApp]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleStageChange = async (appId: number, targetStatus: string) => {
    setActionError("");
    try {
      const updated = await updateApplicationStage(appId, targetStatus, stageNote);
      setNotice(`Đã chuyển giai đoạn hồ sơ sang: ${STAGE_CONFIG[targetStatus]?.label || targetStatus}`);
      setSelectedApp(updated);
      setStageNote("");
      loadData();
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Không thể chuyển giai đoạn hồ sơ.");
    }
  };

  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    if (!evalForm.feedback.trim()) {
      setActionError("Vui lòng nhập nhận xét đánh giá ứng viên.");
      return;
    }
    setSubmittingEval(true);
    setActionError("");
    try {
      await createEvaluation(selectedApp.id, evalForm);
      setNotice("Đã thêm điểm đánh giá & nhận xét ứng viên thành công!");
      const updatedEvals = await fetchEvaluations(selectedApp.id);
      setEvaluations(updatedEvals);
      setEvalForm({
        overall_score: 4,
        competency_score: 4,
        culture_fit_score: 4,
        recommendation: "hire",
        feedback: "",
      });
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Không thể gửi đánh giá ứng viên.");
    } finally {
      setSubmittingEval(false);
    }
  };

  const openScheduleModal = () => {
    setSchedulePanel([]);
    void fetchAvailableInterviewers().then(setAvailablePanel).catch(() => setActionError('Không thể tải hội đồng phỏng vấn.'));
    const start = new Date(Date.now() + 86400000);
    const end = new Date(start.getTime() + 3600000);
    setScheduleForm((current) => ({
      ...current,
      start_time: start.toISOString().slice(0, 16),
      end_time: end.toISOString().slice(0, 16),
    }));
    setShowScheduleModal(true);
  };

  const openOfferModal = () => {
    const now = Date.now();
    setOfferForm((current) => ({
      ...current,
      position_title: selectedApp?.job_title ?? "",
      start_date: new Date(now + 14 * 86400000).toISOString().slice(0, 10),
      expiration_date: new Date(now + 7 * 86400000).toISOString().slice(0, 10),
    }));
    setShowOfferModal(true);
  };

  return (
    <HrShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản lý Phễu Hồ sơ Ứng viên & Đánh giá (Candidate Assessment)</h1>
          <p className="text-sm text-slate-500">Theo dõi phễu ứng viên, điều phối phỏng vấn và chấm điểm năng lực ứng viên toàn diện.</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        {/* Stage Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 gap-2 pb-px">
          {[
            { id: "all", label: "Tất cả phễu" },
            { id: "applied", label: "Mới nộp" },
            { id: "screening", label: "Sơ tuyển" },
            { id: "interviewing", label: "Phỏng vấn" },
            { id: "offered", label: "Offer" },
            { id: "hired", label: "Đã tuyển" },
            { id: "rejected", label: "Từ chối" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
                statusTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tên ứng viên, email, số điện thoại hoặc mã hồ sơ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <Button type="submit" variant="secondary" className="px-4">
            <Filter className="h-4 w-4" /> Lọc hồ sơ
          </Button>
        </form>

        {/* Applications List Table */}
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Đang tải danh sách hồ sơ...</div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Chưa có hồ sơ ứng tuyển nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Ứng viên & Mã HS</th>
                    <th className="px-5 py-3">Vị trí ứng tuyển</th>
                    <th className="px-5 py-3">Thông tin liên hệ</th>
                    <th className="px-5 py-3">Loại ứng viên</th>
                    <th className="px-5 py-3">Giai đoạn Phễu</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => {
                    const stage = STAGE_CONFIG[app.status] || STAGE_CONFIG.applied;
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono font-bold text-blue-600 block">{app.code}</span>
                          <span className="font-bold text-slate-900">{app.full_name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800 block">{app.job_title || "Vị trí tuyển dụng"}</span>
                          <span className="text-xs text-slate-500">{app.department_name}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          <span className="block font-medium">{app.email}</span>
                          <span className="text-slate-400">{app.phone}</span>
                        </td>
                        <td className="px-5 py-4 text-xs">
                          {app.current_department ? (
                            <span className="rounded-full bg-purple-50 px-2.5 py-1 font-bold text-purple-700">
                              Nội bộ ({app.current_department})
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">Bên ngoài</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${stage.bg} ${stage.text}`}>
                            {stage.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/hr/applications/${app.id}`} className="mr-2 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50">
                            Hồ sơ hợp nhất
                          </Link>
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            Xem & Chấm điểm
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal Candidate Profile & Assessment Panel */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-white space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 block">{selectedApp.code}</span>
                  <h2 className="text-xl font-black text-slate-900">{selectedApp.full_name}</h2>
                  <p className="text-sm text-slate-500">
                    Ứng tuyển vị trí: <strong className="text-slate-800">{selectedApp.job_title}</strong>
                  </p>
                </div>
                <button onClick={() => setSelectedApp(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {actionError && <Alert variant="error">{actionError}</Alert>}

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Email liên hệ</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Mail className="h-3.5 w-3.5 text-slate-500" /> {selectedApp.email}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Số điện thoại</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500" /> {selectedApp.phone}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">File CV Đính kèm</span>
                  {selectedApp.cv_url ? (
                    <a
                      href={selectedApp.cv_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> Mở xem CV <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">Chưa đính kèm</span>
                  )}
                </div>
              </div>

              {/* Stage Transition Control Panel */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600" /> Chuyển giai đoạn Phễu (Pipeline Stage)
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleStageChange(selectedApp.id, "screening")}>
                    Sơ tuyển (Screening)
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleStageChange(selectedApp.id, "interviewing")}>
                    Phỏng vấn (Interviewing)
                  </Button>
                  <Button size="sm" variant="secondary" onClick={openOfferModal}>
                    <FileText className="h-3.5 w-3.5 text-teal-600" /> Phát Hành Offer
                  </Button>
                  <Button size="sm" variant="secondary" onClick={openScheduleModal}>
                    <Calendar className="h-3.5 w-3.5 text-blue-600" /> Lên Lịch Phỏng Vấn
                  </Button>
                  <Button size="sm" onClick={() => handleStageChange(selectedApp.id, "hired")}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Đã tuyển dụng (Hired)
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleStageChange(selectedApp.id, "rejected")}>
                    <XCircle className="h-3.5 w-3.5" /> Từ chối (Rejected)
                  </Button>
                </div>
              </div>

              {/* Sub-modal Create Offer */}
              {showOfferModal && (
                <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-600" /> Phát Hành Thư Mời Nhận Việc (Offer Letter)
                  </h4>
                  <form onSubmit={handleOfferSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Chức danh công việc đề xuất *</label>
                      <input
                        type="text"
                        required
                        placeholder={selectedApp.job_title}
                        value={offerForm.position_title}
                        onChange={(e) => setOfferForm({ ...offerForm, position_title: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Mức lương đề xuất (VNĐ) *</label>
                        <input
                          type="number"
                          required
                          value={offerForm.offered_salary}
                          onChange={(e) => setOfferForm({ ...offerForm, offered_salary: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Số tháng thử việc *</label>
                        <input
                          type="number"
                          required
                          min={0}
                          max={12}
                          value={offerForm.probation_period_months}
                          onChange={(e) => setOfferForm({ ...offerForm, probation_period_months: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu làm việc *</label>
                        <input
                          type="date"
                          required
                          value={offerForm.start_date}
                          onChange={(e) => setOfferForm({ ...offerForm, start_date: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Hạn ứng viên phản hồi *</label>
                        <input
                          type="date"
                          required
                          value={offerForm.expiration_date}
                          onChange={(e) => setOfferForm({ ...offerForm, expiration_date: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Địa điểm làm việc *</label>
                      <input
                        type="text"
                        required
                        value={offerForm.work_location}
                        onChange={(e) => setOfferForm({ ...offerForm, work_location: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ghi chú điều khoản bổ sung</label>
                      <textarea
                        rows={2}
                        value={offerForm.notes}
                        onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setShowOfferModal(false)}>
                        Hủy
                      </Button>
                      <Button type="submit" size="sm" disabled={submittingOffer}>
                        {submittingOffer ? "Đang phát hành..." : "Xác nhận Phát hành Offer"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}


              {/* Sub-modal Schedule Interview */}
              {showScheduleModal && (
                <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" /> Tạo Lịch Phỏng Vấn Mới
                  </h4>
                  <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tiêu đề phỏng vấn *</label>
                      <input
                        type="text"
                        required
                        value={scheduleForm.title}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Hình thức *</label>
                        <select
                          value={scheduleForm.interview_type}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, interview_type: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        >
                          <option value="online">Online (Google Meet/Teams)</option>
                          <option value="offline">Offline (Phòng họp Công ty)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Link Meeting / Phòng họp *</label>
                        <input
                          type="text"
                          required
                          value={scheduleForm.location_or_link}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, location_or_link: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Thời gian bắt đầu *</label>
                        <input
                          type="datetime-local"
                          required
                          value={scheduleForm.start_time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Thời gian kết thúc *</label>
                        <input
                          type="datetime-local"
                          required
                          value={scheduleForm.end_time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 font-semibold text-slate-700">Hội đồng phỏng vấn</p>
                      <div className="mb-3 flex flex-wrap gap-3">{availablePanel.map((person) => <label key={person.id} className="flex items-center gap-2"><input type="checkbox" checked={schedulePanel.includes(person.id)} onChange={() => setSchedulePanel((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])}/>{person.full_name}</label>)}</div>
                      <label className="block font-semibold text-slate-700 mb-1">Ghi chú dặn dò</label>
                      <textarea
                        rows={2}
                        value={scheduleForm.notes}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setShowScheduleModal(false)}>
                        Hủy
                      </Button>
                      <Button type="submit" size="sm" disabled={submittingSchedule}>
                        {submittingSchedule ? "Đang lên lịch..." : "Xác nhận Lên lịch"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}


              {/* Candidate Evaluation & Scoring Form */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Chấm điểm & Nhận xét Đánh giá Ứng viên
                </h3>

                <form onSubmit={handleEvaluationSubmit} className="bg-slate-50/80 p-4 rounded-xl space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm tổng quan (1-5⭐)</label>
                      <select
                        value={evalForm.overall_score}
                        onChange={(e) => setEvalForm({ ...evalForm, overall_score: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
                      >
                        {[5, 4, 3, 2, 1].map((s) => (
                          <option key={s} value={s}>{s} Sao ({s === 5 ? "Xuất sắc" : s === 4 ? "Tốt" : s === 3 ? "Đạt" : "Kém"})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm chuyên môn (1-5⭐)</label>
                      <select
                        value={evalForm.competency_score}
                        onChange={(e) => setEvalForm({ ...evalForm, competency_score: Number(e.target.value) })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
                      >
                        {[5, 4, 3, 2, 1].map((s) => (
                          <option key={s} value={s}>{s} Sao</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Đề xuất kết quả</label>
                      <select
                        value={evalForm.recommendation}
                        onChange={(e) => setEvalForm({ ...evalForm, recommendation: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
                      >
                        <option value="strong_hire">Strong Hire (Tuyển gấp)</option>
                        <option value="hire">Hire (Đạt yêu cầu)</option>
                        <option value="hold">Hold (Cân nhắc)</option>
                        <option value="reject">Reject (Không đạt)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nhận xét chi tiết của người đánh giá *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Ghi nhận xét chi tiết về năng lực, kỹ năng mềm và sự phù hợp của ứng viên..."
                      value={evalForm.feedback}
                      onChange={(e) => setEvalForm({ ...evalForm, feedback: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={submittingEval}>
                      {submittingEval ? "Đang lưu..." : "Lưu điểm & Nhận xét"}
                    </Button>
                  </div>
                </form>

                {/* Existing Evaluation Results */}
                {evaluations.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch sử Chấm điểm Hội đồng tuyển dụng</h4>
                    {evaluations.map((ev) => {
                      const rec = RECOMMENDATION_MAP[ev.recommendation] || RECOMMENDATION_MAP.hire;
                      return (
                        <div key={ev.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{ev.evaluator_name || "Hội đồng tuyển dụng"}</span>
                            <span className={`px-2 py-0.5 rounded font-bold ${rec.color}`}>{rec.label}</span>
                          </div>
                          <div className="flex items-center gap-4 text-slate-600 font-medium">
                            <span>Điểm tổng quan: <strong className="text-amber-600">{ev.overall_score}⭐</strong></span>
                            <span>Chuyên môn: <strong className="text-blue-600">{ev.competency_score}⭐</strong></span>
                            <span>Văn hóa: <strong className="text-purple-600">{ev.culture_fit_score}⭐</strong></span>
                          </div>
                          <p className="text-slate-700 whitespace-pre-line bg-slate-50 p-2 rounded">{ev.feedback}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </HrShell>
  );
}
