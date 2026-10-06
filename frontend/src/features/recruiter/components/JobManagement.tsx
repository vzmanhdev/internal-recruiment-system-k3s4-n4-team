"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  MapPin,
  MoreVertical,
  Plus,
  Power,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { recruiterService } from "../services/recruiter.service";
import type { JobApprovalStatus, JobStatus, RecruiterJob, JobRequisition } from "../types/recruiter.types";
import { Spinner } from "@/components/ui/Spinner";
import { getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";

export function JobManagement() {
  const searchParams = useSearchParams();
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  const isAdmin = roles.includes("admin");

  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<RecruiterJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Story S3-09 Requisitions State
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [selectedReq, setSelectedReq] = useState<JobRequisition | null>(null);
  const [scopeWarning, setScopeWarning] = useState<string | null>(null);
  const [reqStatusFilter, setReqStatusFilter] = useState<string>("all");
  const [draftSourceReq, setDraftSourceReq] = useState<JobRequisition | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    department: string;
    location: string;
    employment_type: string;
    openings: number;
    salary_range: string;
    experience_level: string;
    deadline: string;
    status: JobStatus;
    approval_status: JobApprovalStatus;
    description: string;
    requirements: string;
    benefits: string;
  }>({
    title: "",
    department: "Khối Công nghệ",
    location: "Hà Nội",
    employment_type: "Toàn thời gian",
    openings: 1,
    salary_range: "20 - 35 Triệu VNĐ",
    experience_level: "Chuyên viên / Mid-level",
    deadline: "30/11/2026",
    status: "open",
    approval_status: "approved",
    description: "",
    requirements: "",
    benefits: "",
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await recruiterService.getJobs({
        search,
        department,
        status: statusFilter,
      });
      setJobs(res.items);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [department, statusFilter]);

  // Handle open modal from query param (?action=create)
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setModalOpen(true);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const handleOpenReqModal = async () => {
    setSelectedReq(null);
    setScopeWarning(null);
    setReqModalOpen(true);
    try {
      setLoadingReqs(true);
      const res = await recruiterService.getRequisitions({ status: reqStatusFilter });
      setRequisitions(res.items);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
      alert("Không thể tải danh sách yêu cầu tuyển dụng. Vui lòng kiểm tra quyền đăng nhập.");
    } finally {
      setLoadingReqs(false);
    }
  };

  const handleFilterReqs = async (statusVal: string) => {
    setReqStatusFilter(statusVal);
    try {
      setLoadingReqs(true);
      const res = await recruiterService.getRequisitions({ status: statusVal });
      setRequisitions(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReqs(false);
    }
  };

  const handleSelectReq = (req: JobRequisition) => {
    setSelectedReq(req);
    if (req.status !== "approved") {
      setScopeWarning(
        `CẢNH BÁO THAO TÁC NGOÀI PHẠM VI (Story S3-09): Yêu cầu này đang ở trạng thái '${req.status === "pending_approval" ? "Chờ duyệt ⏳" : req.status === "draft" ? "Bản nháp 📝" : "Từ chối ❌"}'. Nhân viên tuyển dụng chỉ được phép soạn tin từ những yêu cầu đã hoàn tất chuỗi cấp duyệt ('Đã duyệt')!`
      );
    } else {
      setScopeWarning(null);
    }
  };

  const handleConfirmDraftFromReq = () => {
    if (!selectedReq) return;
    if (selectedReq.status !== "approved") {
      alert("Thao tác ngoài phạm vi cho phép: Chỉ yêu cầu ở trạng thái 'Đã duyệt' mới được phép soạn tin tuyển dụng.");
      return;
    }

    setEditingJob(null);
    setDraftSourceReq(selectedReq);
    setFormData({
      title: selectedReq.title,
      department: selectedReq.department,
      location: "Hà Nội",
      employment_type: "Toàn thời gian",
      openings: selectedReq.openings,
      salary_range: selectedReq.salary_range,
      experience_level: selectedReq.experience_level,
      deadline: "31/12/2026",
      status: isAdmin ? "open" : "closed",
      approval_status: isAdmin ? "approved" : "pending",
      description: selectedReq.description,
      requirements: selectedReq.requirements.join("\n"),
      benefits: selectedReq.benefits.join("\n"),
    });
    setReqModalOpen(false);
    setModalOpen(true);
    setNotification(`Đã kế thừa toàn bộ nội dung từ Yêu cầu #${selectedReq.id}. Bạn có thể tinh chỉnh văn phong cho phù hợp.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setDraftSourceReq(null);
    setFormData({
      title: "",
      department: "Khối Công nghệ",
      location: "Hà Nội",
      employment_type: "Toàn thời gian",
      openings: 1,
      salary_range: "20 - 35 Triệu VNĐ",
      experience_level: "Chuyên viên / Mid-level",
      deadline: "30/11/2026",
      status: "closed",
      approval_status: isAdmin ? "approved" : "pending",
      description: "",
      requirements: "",
      benefits: "",
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (job: RecruiterJob) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      openings: job.openings,
      salary_range: job.salary_range,
      experience_level: job.experience_level,
      deadline: job.deadline,
      status: job.status,
      approval_status: job.approval_status || (isAdmin ? "approved" : "pending"),
      description: job.description,
      requirements: job.requirements.join("\n"),
      benefits: job.benefits.join("\n"),
    });
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.requirements.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    // Nếu không phải admin, bắt buộc approval_status là pending và không được mở tuyển trực tiếp
    const effectiveApproval = isAdmin ? formData.approval_status : "pending";
    const finalStatus = effectiveApproval !== "approved" ? "closed" : formData.status;

    // Bổ sung yêu cầu: Bài đăng ở trạng thái duyệt thì mới đăng tin
    if ((finalStatus === "open" || finalStatus === "closingSoon") && effectiveApproval !== "approved") {
      alert("Yêu cầu bài đăng phải ở trạng thái ĐÃ DUYỆT thì mới được đăng tin tuyển dụng. Bài đăng của bạn đã được chuyển về trạng thái 'Chờ duyệt' để Quản trị viên (Admin) xét duyệt.");
      return;
    }

    const cleanRequirements = formData.requirements
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);
    const cleanBenefits = formData.benefits
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);
      if (editingJob) {
        await recruiterService.updateJob(editingJob.id, {
          ...formData,
          approval_status: effectiveApproval,
          status: finalStatus,
          requirements: cleanRequirements,
          benefits: cleanBenefits,
          requisition_id: draftSourceReq?.id || editingJob.requisition_id,
        });
        setNotification("Đã cập nhật tin tuyển dụng thành công!");
      } else {
        await recruiterService.createJob({
          ...formData,
          approval_status: effectiveApproval,
          status: finalStatus,
          requirements: cleanRequirements,
          benefits: cleanBenefits,
          requisition_id: draftSourceReq?.id,
        });
        setNotification(isAdmin ? "Đã tạo mới tin tuyển dụng thành công!" : "Đã tạo tin tuyển dụng và gửi Quản trị viên (Admin) phê duyệt!");
      }
      setModalOpen(false);
      loadJobs();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu tin tuyển dụng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveJob = async (job: RecruiterJob) => {
    if (!isAdmin) {
      alert("Chỉ Quản trị viên (Admin) mới có quyền phê duyệt bài đăng tuyển dụng.");
      return;
    }
    try {
      await recruiterService.approveJob(job.id);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, approval_status: "approved" } : j))
      );
      setNotification(`Đã duyệt vị trí "${job.title}". Bây giờ bạn có thể đăng tin.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Không thể phê duyệt tin tuyển dụng.");
    }
  };

  const handleRejectJob = async (job: RecruiterJob) => {
    if (!isAdmin) {
      alert("Chỉ Quản trị viên (Admin) mới có quyền từ chối bài đăng tuyển dụng.");
      return;
    }
    if (!confirm(`Bạn có chắc muốn từ chối bài đăng "${job.title}"? Tin sẽ tự động được đóng lại.`)) {
      return;
    }
    try {
      await recruiterService.rejectJob(job.id);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, approval_status: "rejected", status: "closed" } : j))
      );
      setNotification(`Đã chuyển vị trí "${job.title}" sang trạng thái Bị từ chối và tạm đóng tin.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Không thể từ chối tin tuyển dụng.");
    }
  };

  const handleSetJobPending = async (job: RecruiterJob) => {
    if (!isAdmin) {
      alert("Chỉ Quản trị viên (Admin) mới có quyền chuyển trạng thái bài đăng tuyển dụng.");
      return;
    }
    if (!confirm(`Bạn có chắc muốn đưa bài đăng "${job.title}" về trạng thái Chờ duyệt? Tin sẽ tự động được đóng lại.`)) {
      return;
    }
    try {
      await recruiterService.setJobPending(job.id);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, approval_status: "pending", status: "closed" } : j))
      );
      setNotification(`Đã chuyển vị trí "${job.title}" về trạng thái Chờ duyệt và tạm đóng tin.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Không thể chuyển trạng thái tin tuyển dụng.");
    }
  };

  const handleToggleStatus = async (job: RecruiterJob) => {
    const nextStatus = job.status === "closed" ? "open" : "closed";
    if (nextStatus === "open" && job.approval_status !== "approved") {
      alert(isAdmin
        ? "Bài đăng phải ở trạng thái duyệt thì mới được đăng tin! Vui lòng bấm 'Phê duyệt' trước khi đăng tin."
        : "Bài đăng chưa được Quản trị viên phê duyệt. Vui lòng liên hệ Quản trị viên (Admin) để xét duyệt trước khi đăng tin."
      );
      return;
    }
    try {
      if (nextStatus === "open") {
        await recruiterService.publishJob(job.id);
      } else {
        await recruiterService.updateJob(job.id, { status: nextStatus });
      }
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
      );
      setNotification(`Đã ${nextStatus === "closed" ? "đóng" : "đăng tin"} "${job.title}".`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Không thể thay đổi trạng thái tin tuyển dụng.");
    }
  };

  const handleDeleteJob = async (job: RecruiterJob) => {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn vị trí "${job.title}"?`)) return;
    try {
      await recruiterService.deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      setNotification(`Đã xóa vị trí "${job.title}".`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Không thể xóa vị trí tuyển dụng này.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/20">
          <CheckCircle className="h-4 w-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Vị Trí Tuyển Dụng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Đăng mới, điều chỉnh tiêu chuẩn và theo dõi tiến độ thu hút ứng viên cho từng vị trí.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenReqModal}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98]"
            title="Soạn tin tuyển dụng từ một yêu cầu đã được duyệt (Story S3-09)"
          >
            <Sparkles className="h-4 w-4" />
            Soạn tin từ yêu cầu đã duyệt (S3-09)
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Tạo tin tuyển dụng mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/80">
          {[
            { id: "all", label: "Tất cả vị trí" },
            { id: "approved", label: "Đã duyệt" },
            { id: "pending_approval", label: "Chờ phê duyệt" },
            { id: "rejected", label: "Bị từ chối" },
            { id: "open", label: "Đang mở" },
            { id: "closingSoon", label: "Sắp hết hạn" },
            { id: "closed", label: "Đã đóng" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Department filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tất cả khối / phòng ban</option>
            <option value="Khối Công nghệ">Khối Công nghệ</option>
            <option value="Khối Nhân sự">Khối Nhân sự</option>
            <option value="Khối Sản phẩm">Khối Sản phẩm</option>
            <option value="Khối Kinh doanh">Khối Kinh doanh</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Tìm theo chức danh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 sm:w-60 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </form>
        </div>
      </div>

      {/* Jobs Grid / List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">Không tìm thấy vị trí tuyển dụng phù hợp</h3>
          <p className="mt-1 text-xs text-slate-500">Thử thay đổi bộ lọc tìm kiếm hoặc tạo một tin tuyển dụng mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-100">
                        {job.department}
                      </span>
                      {job.approval_status === "approved" ? (
                        <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          Đã duyệt ✓
                        </span>
                      ) : job.approval_status === "rejected" ? (
                        <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          Bị từ chối ✕
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
                          Chờ duyệt ⏳
                        </span>
                      )}
                      {job.status === "open" ? (
                        <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          Đang tuyển
                        </span>
                      ) : job.status === "closingSoon" ? (
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Sắp hết hạn
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          Đã đóng
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 pt-1">{job.title}</h3>
                  </div>

                  <Link
                    href={`/recruiter/candidates?job_id=${job.id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>{job.applicant_count ?? 0} hồ sơ</span>
                  </Link>
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{job.location} ({job.employment_type})</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate font-semibold text-slate-700">
                    <span>Lương: {job.salary_range}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Chỉ tiêu: {job.openings} người</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-amber-700 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Hạn nộp: {job.deadline}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  {!isAdmin ? (
                    <div className="flex items-center gap-1.5">
                      {job.approval_status === "pending" && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Chờ Quản trị viên duyệt</span>
                        </span>
                      )}
                      {job.approval_status === "rejected" && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                          <span>Bị từ chối duyệt</span>
                        </span>
                      )}
                      {job.approval_status === "approved" && (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Đã duyệt</span>
                        </span>
                      )}
                    </div>
                  ) : job.approval_status !== "approved" ? (
                    <button
                      onClick={() => handleApproveJob(job)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                      title="Phê duyệt bài đăng để được phép đăng tin"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Phê duyệt</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSetJobPending(job)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
                        title="Đưa bài đăng về trạng thái Chờ duyệt (sẽ tạm đóng tin)"
                      >
                        <Clock className="h-3 w-3 text-amber-600" />
                        <span>Chờ duyệt</span>
                      </button>
                      <button
                        onClick={() => handleRejectJob(job)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                        title="Đưa bài đăng về trạng thái Bị từ chối (sẽ tạm đóng tin)"
                      >
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span>Từ chối</span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleToggleStatus(job)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      job.status === "closed"
                        ? job.approval_status === "approved"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-slate-100 text-slate-400 border border-dashed border-slate-300 hover:bg-slate-200 hover:text-slate-600"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    title={
                      job.status === "closed" && job.approval_status !== "approved"
                        ? "Yêu cầu bài đăng ở trạng thái duyệt thì mới đăng tin. Vui lòng bấm 'Phê duyệt' trước."
                        : job.status === "closed"
                        ? "Đăng tin tuyển dụng này"
                        : "Đóng tin tuyển dụng này"
                    }
                  >
                    <Power className="h-3 w-3" />
                    <span>{job.status === "closed" ? "Đăng tin" : "Đóng tin"}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(job)}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Sửa</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteJob(job)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Xóa tin tuyển dụng"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <Link
                    href={`/recruiter/candidates?job_id=${job.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <span>Xem ứng viên</span>
                    <Eye className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {editingJob ? "Chỉnh sửa tin tuyển dụng" : "Đăng tin tuyển dụng mới"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
              {draftSourceReq && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-emerald-900">
                      Đang kế thừa từ Yêu cầu tuyển dụng #{draftSourceReq.id}: {draftSourceReq.title}
                    </span>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Dữ liệu tiêu chuẩn, phòng ban và dải lương đã được kế thừa tự động. Bạn có thể sửa đổi lại văn phong mô tả công việc (Job Description) cho phù hợp với ngôn ngữ tuyển dụng công khai theo Story S3-09.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu đề vị trí tuyển dụng *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Senior Data Analyst, Chuyên viên Pháp chế..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khối / Phòng ban *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="Khối Công nghệ">Khối Công nghệ</option>
                    <option value="Khối Nhân sự">Khối Nhân sự</option>
                    <option value="Khối Sản phẩm">Khối Sản phẩm</option>
                    <option value="Khối Kinh doanh">Khối Kinh doanh</option>
                    <option value="Khối Vận hành">Khối Vận hành</option>
                    <option value="Khối Tài chính">Khối Tài chính</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa điểm làm việc
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mức lương đề xuất
                  </label>
                  <input
                    type="text"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    placeholder="VD: 25 - 40 Triệu VNĐ"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hạn nộp hồ sơ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    placeholder="VD: 30/11/2026"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số lượng cần tuyển
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.openings}
                    onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái phê duyệt *
                  </label>
                  {isAdmin ? (
                    <select
                      value={formData.approval_status}
                      onChange={(e) => {
                        const nextApproval = e.target.value as JobApprovalStatus;
                        setFormData({
                          ...formData,
                          approval_status: nextApproval,
                          // If not approved, cannot be open
                          status: nextApproval !== "approved" ? "closed" : formData.status,
                        });
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 font-medium"
                    >
                      <option value="approved">Đã duyệt (Cho phép đăng tin)</option>
                      <option value="pending">Chờ phê duyệt (Chưa cho phép đăng tin)</option>
                      <option value="rejected">Bị từ chối</option>
                    </select>
                  ) : (
                    <div>
                      <div className="flex h-9 items-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-800">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                        Chờ Quản trị viên duyệt (Tự động)
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        * Bài đăng tạo bởi Nhân sự cần Quản trị viên duyệt trước khi mở đăng tin.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái tin tuyển dụng *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as JobStatus;
                      if ((nextStatus === "open" || nextStatus === "closingSoon") && formData.approval_status !== "approved") {
                        alert("Yêu cầu bài đăng ở trạng thái duyệt thì mới được đăng tin! Vui lòng chuyển Trạng thái phê duyệt thành 'Đã duyệt' trước.");
                        return;
                      }
                      setFormData({ ...formData, status: nextStatus });
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500"
                  >
                    <option value="open" disabled={formData.approval_status !== "approved"}>
                      Đang mở tuyển (Open - Đã đăng tin) {formData.approval_status !== "approved" ? "— [Cần duyệt trước khi đăng]" : ""}
                    </option>
                    <option value="closingSoon" disabled={formData.approval_status !== "approved"}>
                      Sắp hết hạn (Closing Soon) {formData.approval_status !== "approved" ? "— [Cần duyệt trước khi đăng]" : ""}
                    </option>
                    <option value="closed">Đóng tạm thời (Closed - Bản nháp/Chưa đăng tin)</option>
                  </select>
                  {formData.approval_status === "approved" ? (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                      ✓ Bài đăng đã được duyệt, đủ điều kiện để mở đăng tin tuyển dụng.
                    </p>
                  ) : formData.approval_status === "rejected" ? (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">
                      ✕ Bài đăng bị từ chối phê duyệt, tin tuyển dụng tự động ở trạng thái Đóng.
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] font-semibold text-amber-700">
                      * Yêu cầu bài đăng ở trạng thái ĐÃ DUYỆT thì mới được đăng tin tuyển dụng.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả công việc (Job Description) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả tóm tắt mục tiêu và vai trò của vị trí tuyển dụng..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yêu cầu ứng viên (Mỗi tiêu chí 1 dòng) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="VD:&#10;Tốt nghiệp Đại học chuyên ngành liên quan&#10;Có 2 năm kinh nghiệm chuyên môn&#10;Khả năng giao tiếp tốt..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quyền lợi & Đãi ngộ (Mỗi quyền lợi 1 dòng)
                </label>
                <textarea
                  rows={2}
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="VD:&#10;Thưởng hiệu quả công việc&#10;Bảo hiểm sức khỏe cao cấp&#10;Môi trường làm việc mở..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting && <Spinner size="sm" />}
                  <span>{editingJob ? "Lưu thay đổi" : "Đăng tin tuyển dụng"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHỌN YÊU CẦU TUYỂN DỤNG ĐỂ SOẠN TIN (STORY S3-09)                  */}
      {/* ========================================================================= */}
      {reqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  <Sparkles className="h-3 w-3" />
                  <span>Story S3-09 Acceptance Testing</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Soạn Tin Tuyển Dụng Từ Yêu Cầu Đã Được Duyệt
                </h2>
                <p className="text-xs text-slate-500">
                  Chọn một yêu cầu tuyển dụng đã hoàn tất chuỗi cấp duyệt để tự động kế thừa mô tả công việc và dải lương.
                </p>
              </div>
              <button
                onClick={() => setReqModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scope Warning Banner */}
            {scopeWarning && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-950">
                    CẢNH BÁO PHẠM VI QUYỀN HẠN & NGHIỆP VỤ (KIỂM THỬ BƯỚC 4):
                  </span>
                  <p className="mt-1 text-red-800 leading-relaxed font-medium">
                    {scopeWarning}
                  </p>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/80">
              {[
                { id: "all", label: "Tất cả yêu cầu" },
                { id: "approved", label: "Đã duyệt (Hợp lệ để soạn tin) ✓" },
                { id: "pending_approval", label: "Chờ phê duyệt ⏳" },
                { id: "draft", label: "Bản nháp 📝" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleFilterReqs(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    reqStatusFilter === tab.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Requisitions List */}
            <div className="mt-4 max-h-[50vh] overflow-y-auto pr-1 space-y-3">
              {loadingReqs ? (
                <div className="flex h-48 items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : requisitions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  Không tìm thấy yêu cầu tuyển dụng nào phù hợp bộ lọc.
                </div>
              ) : (
                requisitions.map((req) => {
                  const isSelected = selectedReq?.id === req.id;
                  const isApproved = req.status === "approved";
                  return (
                    <div
                      key={req.id}
                      onClick={() => handleSelectReq(req)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? isApproved
                            ? "border-2 border-emerald-500 bg-emerald-50/20 shadow-md shadow-emerald-500/10"
                            : "border-2 border-red-500 bg-red-50/20 shadow-md shadow-red-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-100">
                              {req.department}
                            </span>
                            {req.status === "approved" ? (
                              <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                Đã duyệt ✓ (Sẵn sàng soạn tin)
                              </span>
                            ) : req.status === "pending_approval" ? (
                              <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                Chờ duyệt ⏳ (Không được tạo tin)
                              </span>
                            ) : req.status === "draft" ? (
                              <span className="rounded-md bg-slate-400 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                Bản nháp 📝 (Chưa duyệt)
                              </span>
                            ) : (
                              <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                Từ chối ❌
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-slate-500">
                              Chỉ tiêu: {req.openings} người • {req.experience_level}
                            </span>
                          </div>

                          <h3 className="text-sm font-extrabold text-slate-900 pt-1">
                            #{req.id} — {req.title}
                          </h3>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            {req.salary_range}
                          </span>
                        </div>
                      </div>

                      {req.reason && (
                        <p className="mt-2 text-xs text-slate-600 line-clamp-1">
                          <span className="font-semibold text-slate-700">Lý do tuyển:</span> {req.reason}
                        </p>
                      )}

                      {/* Visual Multi-level Approval Chain */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-700">
                          Chuỗi cấp duyệt mẫu ({req.approval_chain?.length || 0} cấp):
                        </span>
                        <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {req.approval_chain?.map((step) => {
                            const isStepApproved = step.status === "approved";
                            const isStepPending = step.status === "pending";
                            return (
                              <div
                                key={step.step}
                                className={`rounded-xl border p-2 text-[10px] transition-all ${
                                  isStepApproved
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                                    : isStepPending
                                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold">
                                  <span>Cấp {step.step}: {step.role}</span>
                                  <span>{isStepApproved ? "✓" : isStepPending ? "⏳" : "—"}</span>
                                </div>
                                <div className="text-slate-600 truncate mt-0.5">{step.approver}</div>
                                {step.comment && (
                                  <div className="text-[9px] text-slate-500 italic truncate mt-0.5">
                                    &ldquo;{step.comment}&rdquo;
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {selectedReq ? (
                  selectedReq.status === "approved" ? (
                    <span className="text-emerald-700 font-semibold">
                      Đã chọn Yêu cầu #{selectedReq.id}: Hợp lệ để soạn tin tuyển dụng.
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      Cảnh báo: Yêu cầu #{selectedReq.id} chưa được duyệt. Không thể soạn tin!
                    </span>
                  )
                ) : (
                  <span>Vui lòng click chọn 1 yêu cầu đã được duyệt trong danh sách trên.</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setReqModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDraftFromReq}
                  disabled={!selectedReq || selectedReq.status !== "approved"}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Tiến hành soạn tin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
