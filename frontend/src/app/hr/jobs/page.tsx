"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  RotateCcw,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  MapPin,
  X,
  Share2,
  ExternalLink,
  ShieldCheck,
  Layers,
} from "lucide-react";

export interface JobPostingReview {
  id: string;
  title: string;
  department: string;
  code: string;
  location: string;
  salaryDisplay: string;
  employmentType: string;
  experienceLevel: string;
  hiringManager: string;
  submittedAt: string;
  status: "pending_review" | "published" | "needs_revision";
  revisionReason?: string;
  description: string;
  requirements: string[];
  benefits: string[];
}

const INITIAL_JOBS_FOR_REVIEW: JobPostingReview[] = [
  {
    id: "job-1",
    title: "Senior Backend Developer (Python / Go)",
    department: "Khối Công Nghệ (Tech Hub)",
    code: "JOB-2026-001",
    location: "Hà Nội (Hybrid 3 ngày/tuần)",
    salaryDisplay: "35.000.000 - 55.000.000 VNĐ",
    employmentType: "Toàn thời gian",
    experienceLevel: "Senior (4+ năm)",
    hiringManager: "Vũ Hải Đăng (CTO)",
    submittedAt: "10/10/2026",
    status: "pending_review",
    description: "Chúng tôi tìm kiếm Senior Backend Engineer xuất sắc cùng xây dựng nền tảng Enterprise Microservices chịu tải hàng triệu giao dịch mỗi ngày. Bạn sẽ trực tiếp tham gia thiết kế kiến trúc phân tán, giải quyết bài toán concurrency và tối ưu hóa hạ tầng Cloud.",
    requirements: [
      "Tối thiểu 4 năm kinh nghiệm với Python (FastAPI/Django) hoặc Go.",
      "Thành thạo cơ sở dữ liệu quan hệ PostgreSQL và NoSQL Redis/MongoDB.",
      "Kinh nghiệm thực chiến với Message Broker (Apache Kafka, RabbitMQ).",
      "Hiểu sâu về Docker, Kubernetes và hệ thống CI/CD tự động hóa.",
      "Tư duy Clean Code, TDD và thiết kế RESTful/gRPC chuẩn hóa.",
    ],
    benefits: [
      "Thưởng hiệu quả dự án hàng quý và tháng lương 13++ hấp dẫn.",
      "Gói bảo hiểm sức khỏe cao cấp Bảo Việt / PVI cho nhân viên và người thân.",
      "Trang bị Macbook Pro M3 Max và màn hình kép 27 inch 4K tại văn phòng.",
      "Ngân sách đào tạo chứng chỉ quốc tế (AWS, GCP, CKA) 20 triệu/năm.",
      "Môi trường văn hóa cởi mở, không khoảng cách, tôn trọng sáng tạo.",
    ],
  },
  {
    id: "job-2",
    title: "Lead QA Automation Engineer",
    department: "Phòng Quản Lý Chất Lượng QA",
    code: "JOB-2026-002",
    location: "Hà Nội / TP.HCM",
    salaryDisplay: "35.000.000 - 50.000.000 VNĐ",
    employmentType: "Toàn thời gian",
    experienceLevel: "Lead (5+ năm)",
    hiringManager: "Trần Thị Mai (QA Manager)",
    submittedAt: "09/10/2026",
    status: "pending_review",
    description: "Dẫn dắt đội ngũ kiểm thử tự động hóa, xây dựng Framework Automation Test từ đầu cho hệ thống Core ATS và Mobile App.",
    requirements: [
      "5+ năm kinh nghiệm kiểm thử phần mềm, trong đó ít nhất 3 năm về Automation.",
      "Thành thạo Selenium, Playwright, Cypress hoặc Appium.",
      "Có kinh nghiệm tích hợp test script vào Jenkins/GitLab CI.",
    ],
    benefits: [
      "Lương cạnh tranh + thưởng KPI theo chất lượng release.",
      "Du lịch nghỉ dưỡng 5 sao hàng năm toàn công ty.",
    ],
  },
  {
    id: "job-3",
    title: "Product Manager (Enterprise Solutions)",
    department: "Khối Kinh Doanh & Tăng Trưởng",
    code: "JOB-2026-003",
    location: "Hà Nội",
    salaryDisplay: "45.000.000 - 65.000.000 VNĐ",
    employmentType: "Toàn thời gian",
    experienceLevel: "Manager (3+ năm PM)",
    hiringManager: "Bùi Quốc Đạt (CCO)",
    submittedAt: "05/10/2026",
    status: "published",
    description: "Định hình Roadmap sản phẩm, phối hợp cùng Tech và Sales để ra mắt các tính năng nhân sự đột phá.",
    requirements: [
      "3+ năm làm PM mảng B2B SaaS hoặc Enterprise Software.",
      "Kỹ năng phân tích số liệu Product Analytics và lắng nghe khách hàng xuất sắc.",
    ],
    benefits: [
      "Cơ chế ESOP cổ phần dành cho nhân sự chủ chốt.",
      "Phụ cấp ăn trưa, gửi xe và teambuilding định kỳ.",
    ],
  },
];

export default function HRJobsPage() {
  const [jobs, setJobs] = useState<JobPostingReview[]>(INITIAL_JOBS_FOR_REVIEW);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal: Xem trước giao diện tin đăng
  const [previewJob, setPreviewJob] = useState<JobPostingReview | null>(null);

  // Modal: Yêu cầu sửa lại (Bắt buộc nhập lý do)
  const [revisionJob, setRevisionJob] = useState<JobPostingReview | null>(null);
  const [revisionReason, setRevisionReason] = useState("");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Publish to portal
  const handlePublishJob = (job: JobPostingReview) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: "published" } : j))
    );
    showToast(`Đã xuất bản tin tuyển dụng "${job.title}" lên Career Portal thành công!`, "success");
    if (previewJob?.id === job.id) setPreviewJob(null);
  };

  // Submit Revision
  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionJob || !revisionReason.trim()) {
      showToast("Vui lòng nhập lý do yêu cầu sửa lại!", "error");
      return;
    }

    setJobs((prev) =>
      prev.map((j) =>
        j.id === revisionJob.id
          ? { ...j, status: "needs_revision", revisionReason: revisionReason.trim() }
          : j
      )
    );

    showToast(`Đã trả lại tin "${revisionJob.title}" kèm yêu cầu chỉnh sửa cho Quản lý!`, "success");
    setRevisionJob(null);
    setRevisionReason("");
    if (previewJob?.id === revisionJob.id) setPreviewJob(null);
  };

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.code.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || j.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [jobs, searchQuery, statusFilter]);

  return (
    <div className="w-full space-y-6">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-100">
                Portal Publishing Hub
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Kiểm duyệt tin trước khi công khai
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Duyệt & Xuất Bản Tin Tuyển Dụng
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rà soát nội dung mô tả công việc (JD), mức lương phê duyệt và xuất bản trực tiếp lên Cổng tuyển dụng Career Portal.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tin tuyển dụng, mã tin, phòng ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending_review">🟡 Chờ kiểm duyệt</option>
              <option value="published">🟢 Đã xuất bản lên Portal</option>
              <option value="needs_revision">🟠 Yêu cầu sửa lại</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-bold">
            Hiển thị <strong className="text-slate-900">{filteredJobs.length}</strong> tin tuyển dụng
          </div>
        </div>

        {/* Table tin tuyển dụng */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-4/12">Chức danh & Mã tin</th>
                  <th className="py-3.5 px-3">Phòng ban & Địa điểm</th>
                  <th className="py-3.5 px-3">Mức lương hiển thị</th>
                  <th className="py-3.5 px-3">Người đề xuất</th>
                  <th className="py-3.5 px-3 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => setPreviewJob(job)}
                        className="font-extrabold text-slate-900 text-xs hover:text-blue-600 cursor-pointer transition-colors"
                      >
                        {job.title}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold text-[10px]">
                          {job.code}
                        </span>
                        <span>• {job.employmentType}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-700">
                      <div>{job.department}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                      {job.salaryDisplay}
                    </td>

                    <td className="py-3.5 px-3 text-slate-600">
                      <div>{job.hiringManager}</div>
                      <div className="text-[10px] text-slate-400">Ngày gửi: {job.submittedAt}</div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {job.status === "pending_review" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                          Chờ duyệt
                        </span>
                      )}
                      {job.status === "published" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã lên Portal
                        </span>
                      )}
                      {job.status === "needs_revision" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                          Cần sửa lại
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewJob(job)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem trước</span>
                        </button>

                        {job.status === "pending_review" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePublishJob(job)}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Xuất bản</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setRevisionJob(job);
                                setRevisionReason("");
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Sửa lại</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: XEM TRƯỚC GIAO DIỆN TIN ĐĂNG (PORTAL PREVIEW) */}
      {previewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Live Portal Preview
                  </span>
                  <h3 className="text-base font-extrabold tracking-tight mt-0.5">
                    {previewJob.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewJob(null)}
                className="text-slate-400 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Mức lương:</span>
                  <strong className="text-emerald-700 font-mono">{previewJob.salaryDisplay}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Địa điểm:</span>
                  <strong>{previewJob.location}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Hình thức:</span>
                  <strong>{previewJob.employmentType}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Kinh nghiệm:</span>
                  <strong>{previewJob.experienceLevel}</strong>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-2">Mô Tả Công Việc</h4>
                <p className="text-slate-600 leading-relaxed">{previewJob.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-2">Yêu Cầu Ứng Viên</h4>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                  {previewJob.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-extrabold text-slate-900 mb-2">Quyền Lợi & Đãi Ngộ</h4>
                <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                  {previewJob.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewJob(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {previewJob.status === "pending_review" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRevisionJob(previewJob);
                        setRevisionReason("");
                      }}
                      className="px-4 py-2 text-xs font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 rounded-xl"
                    >
                      Yêu cầu sửa lại
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePublishJob(previewJob)}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20"
                    >
                      Xuất bản lên Portal ngay
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: YÊU CẦU SỬA LẠI (BẮT BUỘC NHẬP LÝ DO) */}
      {revisionJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-orange-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Yêu Cầu Sửa Lại Tin Tuyển Dụng
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRevisionJob(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                Tin tuyển dụng: <strong>{revisionJob.title}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do chi tiết & Điểm cần chỉnh sửa <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập yêu cầu sửa đổi (VD: Cần cập nhật dải lương theo band mới, bổ sung thêm yêu cầu tiếng Anh...)"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-orange-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevisionJob(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-500/20"
                >
                  Gửi yêu cầu sửa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
