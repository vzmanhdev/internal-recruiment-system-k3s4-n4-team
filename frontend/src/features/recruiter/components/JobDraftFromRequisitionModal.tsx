"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Globe,
  MapPin,
  Maximize2,
  Minimize2,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { JobRequisition, RecruiterJob } from "../types/recruiter.types";
import { recruiterService } from "../services/recruiter.service";
import { getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";
import { Spinner } from "@/components/ui/Spinner";

interface JobDraftFromRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: JobRequisition | null;
  onSuccess: (job: RecruiterJob) => void;
}

export function JobDraftFromRequisitionModal({
  isOpen,
  onClose,
  requisition,
  onSuccess,
}: JobDraftFromRequisitionModalProps) {
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  const isAdminOrHrManager = roles.includes("admin") || roles.includes("hr_manager");

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Hà Nội");
  const [employmentType, setEmploymentType] = useState("Toàn thời gian");
  const [showSalary, setShowSalary] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [benefits, setBenefits] = useState("");

  useEffect(() => {
    if (!requisition) return;

    // Kế thừa dữ liệu từ yêu cầu tuyển dụng (AC1)
    setTitle(requisition.title || "");
    setLocation(requisition.work_location || "Hà Nội");
    setEmploymentType(requisition.employment_type || "Toàn thời gian");
    setShowSalary(true);

    // Mặc định hạn nhận hồ sơ 30 ngày kể từ hôm nay nếu chưa có
    if (requisition.deadline) {
      setDeadline(requisition.deadline.slice(0, 10));
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      setDeadline(defaultDate.toISOString().slice(0, 10));
    }

    setDescription(
      requisition.job_description ||
      requisition.description ||
      "Chúng tôi đang tìm kiếm nhân tài nhiệt huyết đồng hành cùng sứ mệnh phát triển hệ thống nội bộ vững mạnh."
    );

    setRequirements(
      Array.isArray(requisition.requirements)
        ? requisition.requirements.join("\n")
        : requisition.requirements || ""
    );

    setBenefits(
      Array.isArray(requisition.benefits)
        ? requisition.benefits.join("\n")
        : requisition.benefits || ""
    );

    setErrorMessage(null);
    setActiveTab("edit");
  }, [requisition, isOpen]);

  if (!isOpen || !requisition) return null;

  const isApproved = requisition.status === "approved";

  const handleSave = async (publishImmediately: boolean) => {
    if (!isApproved) {
      setErrorMessage(
        "Ràng buộc phạm vi (Story S3-09 AC3): Chỉ yêu cầu ở trạng thái 'Đã duyệt' mới được phép tạo tin tuyển dụng. Yêu cầu hiện tại đang ở trạng thái: " +
          requisition.status
      );
      return;
    }

    if (!title.trim() || !description.trim() || !requirements.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ các mục bắt buộc (*): Tiêu đề, Mô tả công việc và Yêu cầu ứng viên.");
      return;
    }

    if (!deadline) {
      setErrorMessage("Vui lòng chọn hạn nhận hồ sơ ứng tuyển.");
      return;
    }

    // Kiểm tra hạn nhận hồ sơ không ở quá khứ
    const todayStr = new Date().toISOString().slice(0, 10);
    if (deadline < todayStr) {
      setErrorMessage("Hạn nhận hồ sơ không được ở quá khứ. Vui lòng chọn một ngày hợp lệ trong tương lai.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // Nếu người dùng chọn xuất bản ngay và có quyền Admin/HR -> status = "open", ngược lại đưa về "closed" chờ duyệt
      const targetStatus = publishImmediately && isAdminOrHrManager ? "open" : "closed";

      const payload = {
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.trim(),
        benefits: benefits.trim(),
        location,
        employment_type: employmentType,
        deadline,
        show_salary: showSalary,
        status: targetStatus,
      };

      const result = await recruiterService.createJobFromRequisition(requisition.id, payload);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi soạn tin tuyển dụng:", err);
      setErrorMessage(
        err?.message || "Không thể tạo tin tuyển dụng. Vui lòng kiểm tra kết nối hoặc quyền truy cập."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reqListItems = requirements
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);

  const benListItems = benefits
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  const displaySalary = showSalary
    ? requisition.salary_range || "Thỏa thuận"
    : "Mức lương: Thỏa thuận";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-200">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Soạn tin tuyển dụng từ Yêu cầu đã duyệt
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  Story S3-09
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Kế thừa từ Tờ trình #{requisition.code || requisition.id} · {requisition.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center rounded-xl bg-slate-200/80 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  activeTab === "edit"
                    ? "bg-white text-blue-700 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileEdit className="h-3.5 w-3.5" />
                <span>Biên tập nội dung (AC1, AC2)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-white text-blue-700 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Xem trước công khai (S3-10)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* AC3 Warning if requisition is not approved */}
        {!isApproved && (
          <div className="flex items-start gap-3 bg-amber-50 border-b border-amber-200 px-6 py-3.5 text-xs text-amber-900">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                Cảnh báo thao tác ngoài phạm vi (Story S3-09 AC3):
              </p>
              <p className="text-amber-800">
                Yêu cầu này đang ở trạng thái{" "}
                <span className="font-extrabold uppercase">
                  {requisition.status === "pending_approval"
                    ? "Chờ duyệt"
                    : requisition.status === "draft"
                    ? "Bản nháp"
                    : "Từ chối"}
                </span>
                . Theo tiêu chí chấp nhận AC3, chỉ có những yêu cầu đã hoàn tất phê duyệt (Đã duyệt /
                approved) mới được phép soạn tin tuyển dụng và xuất bản.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "edit" ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-6">
              {/* Inherited Banner */}
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-600 text-white grid place-items-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      Đã tự động kế thừa dữ liệu từ Yêu cầu #{requisition.code || requisition.id}
                    </span>
                    <p className="text-slate-500">
                      Phòng ban: <strong className="text-slate-700">{requisition.department}</strong> · Chỉ
                      tiêu: <strong className="text-slate-700">{requisition.openings || requisition.quantity || 1} nhân sự</strong>
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-blue-200 font-semibold text-blue-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Dải lương đề xuất: {requisition.salary_range}
                </div>
              </div>

              {/* Grid Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tiêu đề tin tuyển dụng <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Kỹ Sư Backend Senior (Python / FastAPI)"
                    disabled={!isApproved}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Kế thừa từ chức danh yêu cầu, có thể tối ưu cho hấp dẫn trên cổng tin tuyển dụng.
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa điểm làm việc <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!isApproved}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
                  >
                    <option value="Hà Nội">Hà Nội (Trụ sở chính)</option>
                    <option value="Hồ Chí Minh">TP. Hồ Chí Minh (Văn phòng miền Nam)</option>
                    <option value="Đà Nẵng">Đà Nẵng (Chi nhánh miền Trung)</option>
                    <option value="Hybrid">Hybrid (Linh hoạt kết hợp Online/Offline)</option>
                    <option value="Remote">Remote (Làm việc từ xa 100%)</option>
                  </select>
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hình thức làm việc <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    disabled={!isApproved}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
                  >
                    <option value="Toàn thời gian">Toàn thời gian (Full-time)</option>
                    <option value="Bán thời gian">Bán thời gian (Part-time)</option>
                    <option value="Hợp đồng dự án">Hợp đồng dự án (Contract)</option>
                    <option value="Thực tập">Thực tập sinh (Internship)</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hạn nhận hồ sơ ứng tuyển <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    disabled={!isApproved}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Tin sẽ tự động ẩn khi vượt quá hạn nộp theo tác vụ định kỳ (S4-08).
                  </p>
                </div>

                {/* Show Salary Toggle (Story S3-09 AC2) */}
                <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Hiển thị mức lương công khai
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {showSalary
                          ? `Đang hiển thị: ${requisition.salary_range}`
                          : "Đang ẩn (Hiện chữ: 'Thỏa thuận')"}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSalary}
                        onChange={(e) => setShowSalary(e.target.checked)}
                        disabled={!isApproved}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description (AC1) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Mô tả công việc (Job Description) <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-blue-600 font-medium">
                    Có thể tinh chỉnh văn phong theo truyền thông tuyển dụng
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả các nhiệm vụ và trách nhiệm chính của vị trí..."
                  disabled={!isApproved}
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-normal focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed disabled:bg-slate-100"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Yêu cầu ứng viên (Mỗi yêu cầu trên 1 dòng) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Từ 3 năm kinh nghiệm lập trình backend&#10;Thành thạo cơ sở dữ liệu PostgreSQL&#10;Kỹ năng làm việc nhóm tốt"
                  disabled={!isApproved}
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-normal focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed disabled:bg-slate-100"
                />
              </div>

              {/* Benefits */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Quyền lợi & Đãi ngộ (Mỗi quyền lợi trên 1 dòng)
                </label>
                <textarea
                  rows={3}
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="Lương tháng 13 và thưởng hiệu quả kinh doanh&#10;Bảo hiểm sức khỏe cao cấp&#10;Phụ cấp ăn trưa và gửi xe"
                  disabled={!isApproved}
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm font-normal focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed disabled:bg-slate-100"
                />
              </div>
            </form>
          ) : (
            /* Tab 2: Live Public Preview (Story S3-10) */
            <div className="space-y-4">
              {/* Preview Device Controls */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Mô phỏng hiển thị:</span>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        previewDevice === "desktop"
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Desktop / Laptop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        previewDevice === "mobile"
                          ? "bg-white text-blue-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Điện thoại (360px)</span>
                    </button>
                  </div>
                </div>

                <span className="text-xs text-slate-400">
                  Giao diện mô phỏng 100% trang Career Portal công khai (/jobs/[id])
                </span>
              </div>

              {/* Preview Canvas Container */}
              <div className="flex justify-center bg-slate-100/80 p-4 sm:p-8 rounded-2xl overflow-x-auto min-h-[480px]">
                <div
                  className={`bg-white rounded-3xl shadow-lg border border-slate-200 transition-all duration-300 p-6 sm:p-8 ${
                    previewDevice === "mobile" ? "w-[360px] text-xs" : "w-full max-w-3xl text-sm"
                  }`}
                >
                  {/* Job Header */}
                  <div className="space-y-3 border-b border-slate-100 pb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        {requisition.department}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {employmentType}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        {displaySalary}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {title || "Tiêu đề vị trí tuyển dụng"}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span>{location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>Số lượng: {requisition.openings || requisition.quantity || 1}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>Hạn nộp: {deadline || "Chưa chọn"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Apply Mock Button */}
                  <div className="my-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">Gia nhập đội ngũ nhân sự tài năng</p>
                      <p className="text-xs text-blue-100">Nộp hồ sơ trực tuyến trong 2 phút</p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="rounded-xl bg-white px-4 py-2 text-xs font-black !text-blue-700 shadow-sm opacity-95 cursor-not-allowed"
                    >
                      Ứng tuyển ngay (Mô phỏng)
                    </button>
                  </div>

                  {/* Job Content */}
                  <div className="space-y-6 text-slate-700">
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">
                        Mô tả công việc
                      </h3>
                      <p className="whitespace-pre-line leading-relaxed text-slate-600">
                        {description || "Chưa có nội dung mô tả."}
                      </p>
                    </div>

                    {reqListItems.length > 0 && (
                      <div>
                        <h3 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">
                          Yêu cầu ứng viên
                        </h3>
                        <ul className="space-y-2">
                          {reqListItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                              <span className="leading-relaxed text-slate-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {benListItems.length > 0 && (
                      <div>
                        <h3 className="font-bold text-slate-900 mb-2 text-sm sm:text-base">
                          Quyền lợi & Đãi ngộ
                        </h3>
                        <ul className="space-y-2">
                          {benListItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                              <span className="leading-relaxed text-slate-600">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng lại
          </button>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Draft Action */}
            <button
              type="button"
              disabled={isSubmitting || !isApproved}
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              {isSubmitting ? <Spinner size="sm" /> : <FileEdit className="h-3.5 w-3.5" />}
              <span>Lưu bản nháp tin</span>
            </button>

            {/* Submit for Approval Action (S3-10) */}
            <button
              type="button"
              disabled={isSubmitting || !isApproved}
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? <Spinner size="sm" /> : <Send className="h-3.5 w-3.5" />}
              <span>Gửi Trưởng phòng Nhân sự duyệt (S3-10)</span>
            </button>

            {/* Direct publish if Admin/HR Manager */}
            {isAdminOrHrManager && (
              <button
                type="button"
                disabled={isSubmitting || !isApproved}
                onClick={() => handleSave(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? <Spinner size="sm" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>Duyệt & Xuất bản ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
