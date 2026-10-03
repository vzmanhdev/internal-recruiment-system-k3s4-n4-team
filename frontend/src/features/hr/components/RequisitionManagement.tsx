"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { HrShell } from "./HrShell";
import { ApiError } from "@/lib/api-client";
import { fetchDepartments, fetchJobTitles, Department, JobTitle } from "../services/hr.service";
import {
  fetchRequisitions,
  createRequisition,
  submitRequisition,
  approveRequisition,
  rejectRequisition,
  deleteRequisition,
  RequisitionItem,
  CreateRequisitionPayload,
} from "../services/requisition.service";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: LucideIcon }> = {
  draft: { label: "Bản nháp", bg: "bg-slate-100", text: "text-slate-700", icon: Clock },
  pending_dept: { label: "Chờ Trưởng phòng duyệt", bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  pending_hr: { label: "Chờ HR Manager duyệt", bg: "bg-blue-50", text: "text-blue-700", icon: Clock },
  approved: { label: "Đã phê duyệt", bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Bị từ chối", bg: "bg-rose-50", text: "text-rose-700", icon: XCircle },
  closed: { label: "Đã đóng", bg: "bg-purple-50", text: "text-purple-700", icon: AlertCircle },
};

export function RequisitionManagement() {
  const [requisitions, setRequisitions] = useState<RequisitionItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Filters & Pagination
  const [statusTab, setStatusTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number | undefined>(undefined);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequisitionItem | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [actionError, setActionError] = useState("");

  // Form State
  const [formData, setFormData] = useState<CreateRequisitionPayload>({
    title: "",
    department_id: 0,
    job_title_id: undefined,
    quantity: 1,
    reason: "new_headcount",
    replacement_for: "",
    min_salary: undefined,
    max_salary: undefined,
    work_location: "Trụ sở chính",
    employment_type: "full_time",
    experience_years: "1-3 năm",
    deadline: "",
    job_description: "",
    requirements: "",
    benefits: "",
    submit_immediately: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reqData, depts, titles] = await Promise.all([
        fetchRequisitions({ status: statusTab !== "all" ? statusTab : undefined, search: searchTerm, department_id: selectedDeptId }),
        fetchDepartments(),
        fetchJobTitles(),
      ]);
      setRequisitions(reqData.items);
      setDepartments(depts);
      setJobTitles(titles);
      if (depts.length > 0) {
        setFormData((prev) => prev.department_id === 0 ? { ...prev, department_id: depts[0].id } : prev);
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải danh sách tờ trình tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedDeptId, statusTab]);

  useEffect(() => {
    queueMicrotask(() => void loadData());
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    try {
      await createRequisition(formData);
      setNotice(formData.submit_immediately ? "Đã gửi tờ trình tuyển dụng lên Trưởng phòng phê duyệt." : "Đã lưu bản nháp tờ trình.");
      setShowCreateModal(false);
      loadData();
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Không thể tạo tờ trình tuyển dụng.");
    }
  };

  const handleSubmitDraft = async (reqId: number) => {
    try {
      await submitRequisition(reqId);
      setNotice("Đã gửi tờ trình lên Trưởng phòng phê duyệt.");
      if (selectedReq) setSelectedReq(null);
      loadData();
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Lỗi khi gửi duyệt tờ trình.");
    }
  };

  const handleApprove = async (reqId: number) => {
    try {
      await approveRequisition(reqId, commentInput);
      setNotice("Đã phê duyệt tờ trình tuyển dụng.");
      setSelectedReq(null);
      setCommentInput("");
      loadData();
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Lỗi khi phê duyệt tờ trình.");
    }
  };

  const handleReject = async (reqId: number) => {
    if (!commentInput.trim()) {
      setActionError("Vui lòng nhập lý do từ chối.");
      return;
    }
    try {
      await rejectRequisition(reqId, commentInput);
      setNotice("Đã từ chối tờ trình tuyển dụng.");
      setSelectedReq(null);
      setCommentInput("");
      loadData();
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Lỗi khi từ chối tờ trình.");
    }
  };

  const handleDelete = async (reqId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bản nháp tờ trình này?")) return;
    try {
      await deleteRequisition(reqId);
      setNotice("Đã xóa bản nháp tờ trình.");
      setSelectedReq(null);
      loadData();
    } catch (err: unknown) {
      setActionError(err instanceof ApiError ? err.message : "Lỗi khi xóa tờ trình.");
    }
  };

  return (
    <HrShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản lý Yêu cầu Tuyển dụng & Tờ trình</h1>
            <p className="mt-1 text-sm text-slate-500">Tạo mới, theo dõi tiến độ và phê duyệt tờ trình bổ sung nhân sự cho các phòng ban.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tạo Tờ trình mới
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        {/* Status Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 gap-2 pb-px">
          {[
            { id: "all", label: "Tất cả" },
            { id: "draft", label: "Bản nháp" },
            { id: "pending_dept", label: "Chờ Trưởng phòng" },
            { id: "pending_hr", label: "Chờ HR Manager" },
            { id: "approved", label: "Đã phê duyệt" },
            { id: "rejected", label: "Bị từ chối" },
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

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã tờ trình hoặc vị trí tuyển dụng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={selectedDeptId || ""}
            onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary" className="px-4">
            <Filter className="h-4 w-4" /> Lọc
          </Button>
        </form>

        {/* Requisitions List Table */}
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Đang tải danh sách tờ trình...</div>
          ) : requisitions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Chưa có tờ trình tuyển dụng nào trong danh sách.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Mã & Vị trí tuyển dụng</th>
                    <th className="px-5 py-3">Phòng ban</th>
                    <th className="px-5 py-3">Số lượng</th>
                    <th className="px-5 py-3">Lý do</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Hạn tuyển</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requisitions.map((req) => {
                    const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.draft;
                    const StatusIcon = statusConf.icon;
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono font-bold text-blue-600 block">{req.code}</span>
                          <span className="font-bold text-slate-900">{req.title}</span>
                          {req.job_title_name && <span className="text-xs text-slate-500 block">Chức danh: {req.job_title_name}</span>}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-700">{req.department_name || "—"}</td>
                        <td className="px-5 py-4 font-bold text-slate-900">{req.quantity} người</td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {req.reason === "new_headcount" ? "Tuyển mới" : req.reason === "replacement" ? `Thay thế (${req.replacement_for})` : "Mở rộng"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusConf.bg} ${statusConf.text}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {req.deadline ? new Date(req.deadline).toLocaleDateString("vi-VN") : "Không giới hạn"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            Xem chi tiết & Duyệt
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

        {/* Modal Create Requisition */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Tạo Tờ trình Yêu cầu Tuyển dụng</h2>
              {actionError && <Alert variant="error" className="mb-4">{actionError}</Alert>}
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <Input
                  label="Tên vị trí tuyển dụng *"
                  required
                  placeholder="Ví dụ: Senior Backend Developer (Python/FastAPI)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-sm font-semibold text-slate-800">
                    Phòng ban yêu cầu *
                    <select
                      required
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-semibold text-slate-800">
                    Chức danh công việc
                    <select
                      value={formData.job_title_id || ""}
                      onChange={(e) => setFormData({ ...formData, job_title_id: e.target.value ? Number(e.target.value) : undefined })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Chọn chức danh --</option>
                      {jobTitles.map((jt) => (
                        <option key={jt.id} value={jt.id}>
                          {jt.name} ({jt.level})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Số lượng *"
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  />
                  <label className="block text-sm font-semibold text-slate-800">
                    Lý do tuyển dụng *
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="new_headcount">Tuyển mới (Headcount)</option>
                      <option value="replacement">Tuyển thay thế</option>
                      <option value="expansion">Mở rộng kinh doanh</option>
                    </select>
                  </label>
                  {formData.reason === "replacement" && (
                    <Input
                      label="Thay thế cho nhân sự nào"
                      placeholder="Tên nhân sự thôi việc"
                      value={formData.replacement_for || ""}
                      onChange={(e) => setFormData({ ...formData, replacement_for: e.target.value })}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Lương tối thiểu (VND)"
                    type="number"
                    placeholder="15000000"
                    value={formData.min_salary || ""}
                    onChange={(e) => setFormData({ ...formData, min_salary: e.target.value ? Number(e.target.value) : undefined })}
                  />
                  <Input
                    label="Lương tối đa (VND)"
                    type="number"
                    placeholder="30000000"
                    value={formData.max_salary || ""}
                    onChange={(e) => setFormData({ ...formData, max_salary: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Địa điểm làm việc"
                    value={formData.work_location || ""}
                    onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                  />
                  <label className="block text-sm font-semibold text-slate-800">
                    Hình thức làm việc
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="full_time">Toàn thời gian (Full-time)</option>
                      <option value="part_time">Bán thời gian (Part-time)</option>
                      <option value="contract">Hợp đồng (Contract)</option>
                    </select>
                  </label>
                  <Input
                    label="Hạn tuyển dụng"
                    type="date"
                    value={formData.deadline || ""}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                <label className="block text-sm font-semibold text-slate-800">
                  Mô tả công việc & Yêu cầu
                  <textarea
                    rows={3}
                    placeholder="Nội dung mô tả công việc, trách nhiệm và kỹ năng cần có..."
                    value={formData.job_description || ""}
                    onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="submit_immediately"
                    checked={formData.submit_immediately}
                    onChange={(e) => setFormData({ ...formData, submit_immediately: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="submit_immediately" className="text-sm font-medium text-slate-700">
                    Gửi duyệt ngay lên Trưởng phòng ban (Không lưu nháp)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                    Hủy bỏ
                  </Button>
                  <Button type="submit">Xác nhận tạo tờ trình</Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Modal View Detail & Approval Timeline */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 block">{selectedReq.code}</span>
                  <h2 className="text-xl font-black text-slate-900">{selectedReq.title}</h2>
                  <p className="text-sm text-slate-500">Phòng ban: {selectedReq.department_name} · Tạo bởi: {selectedReq.creator_name}</p>
                </div>
                <button onClick={() => setSelectedReq(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {actionError && <Alert variant="error">{actionError}</Alert>}

              {/* Requisition Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Số lượng cần tuyển</span>
                  <span className="font-bold text-slate-900">{selectedReq.quantity} nhân sự</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Lý do tuyển</span>
                  <span className="font-bold text-slate-900">{selectedReq.reason === "new_headcount" ? "Tuyển mới" : "Tuyển thay thế"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Dải lương</span>
                  <span className="font-bold text-slate-900">
                    {selectedReq.min_salary && selectedReq.max_salary
                      ? `${selectedReq.min_salary.toLocaleString("vi-VN")} - ${selectedReq.max_salary.toLocaleString("vi-VN")} VND`
                      : "Thỏa thuận"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Hạn tuyển dụng</span>
                  <span className="font-bold text-slate-900">{selectedReq.deadline ? new Date(selectedReq.deadline).toLocaleDateString("vi-VN") : "Không có"}</span>
                </div>
              </div>

              {selectedReq.job_description && (
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-1">Mô tả công việc & Yêu cầu</h4>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">{selectedReq.job_description}</p>
                </div>
              )}

              {/* Approval Timeline */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" /> Dòng thời gian Phê duyệt (Approval Logs)
                </h3>
                {selectedReq.approval_logs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có lịch sử phê duyệt.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedReq.approval_logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 text-xs border-l-2 border-blue-500 pl-3 py-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{log.approver_name}</span>
                            <span className="text-slate-400">• {new Date(log.created_at).toLocaleString("vi-VN")}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{log.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                {selectedReq.status in { pending_dept: 1, pending_hr: 1 } && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Ghi chú hoặc Lý do từ chối (Nêu có):</label>
                    <input
                      type="text"
                      placeholder="Nhập ghi chú phê duyệt hoặc lý do từ chối..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  {selectedReq.status === "draft" && (
                    <>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(selectedReq.id)}>
                        <Trash2 className="h-4 w-4" /> Xóa nháp
                      </Button>
                      <Button size="sm" onClick={() => handleSubmitDraft(selectedReq.id)}>
                        <Send className="h-4 w-4" /> Gửi Phê duyệt
                      </Button>
                    </>
                  )}

                  {(selectedReq.status === "pending_dept" || selectedReq.status === "pending_hr") && (
                    <>
                      <Button variant="danger" size="sm" onClick={() => handleReject(selectedReq.id)}>
                        <XCircle className="h-4 w-4" /> Từ chối
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(selectedReq.id)}>
                        <CheckCircle2 className="h-4 w-4" /> Phê duyệt tờ trình
                      </Button>
                    </>
                  )}

                  <Button variant="secondary" size="sm" onClick={() => setSelectedReq(null)}>
                    Đóng
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </HrShell>
  );
}
