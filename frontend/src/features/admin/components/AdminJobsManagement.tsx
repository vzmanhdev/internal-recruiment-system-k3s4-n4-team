"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Building2, Eye, Pause, Play, Plus, Search, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { Department, hrService } from "@/features/hr/services/hr.service";
import {
  createJobPosting,
  deleteJobPosting,
  fetchManageJobs,
  JobPostingItem,
  pauseJobPosting,
  publishJobPosting,
} from "@/features/jobs/services/job-posting.service";

const emptyForm = {title: "", department_id: "", quantity: "1", work_location: "", employment_type: "full_time", status: "draft"};

export function AdminJobsManagement() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchManageJobs({page_size: 100});
      setJobs(result.items || []);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải vị trí tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManageJobs({page_size: 100})
      .then((result) => setJobs(result.items || []))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không thể tải vị trí tuyển dụng."))
      .finally(() => setLoading(false));
    hrService.departments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const createJob = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await createJobPosting({
        title: form.title,
        department_id: Number(form.department_id),
        quantity: Number(form.quantity),
        work_location: form.work_location,
        employment_type: form.employment_type,
        status: form.status,
      });
      setForm(emptyForm);
      setShowCreate(false);
      setNotice("Đã tạo vị trí tuyển dụng.");
      await loadJobs();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tạo vị trí tuyển dụng.");
    }
  };

  const changeStatus = async (job: JobPostingItem) => {
    setBusyId(job.id);
    setError("");
    try {
      if (job.status === "published") await pauseJobPosting(job.id);
      else await publishJobPosting(job.id);
      setNotice(job.status === "published" ? "Đã tạm dừng tin tuyển dụng." : "Đã xuất bản tin tuyển dụng.");
      await loadJobs();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể đổi trạng thái vị trí.");
    } finally {
      setBusyId(null);
    }
  };

  const removeJob = async (job: JobPostingItem) => {
    if (!window.confirm(`Xóa vị trí ${job.code} - ${job.title}?`)) return;
    setBusyId(job.id);
    try {
      await deleteJobPosting(job.id);
      setNotice("Đã xóa vị trí tuyển dụng.");
      await loadJobs();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể xóa vị trí tuyển dụng.");
    } finally {
      setBusyId(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const keyword = searchQuery.toLowerCase();
    return `${job.title} ${job.department_name ?? ""} ${job.code}`.toLowerCase().includes(keyword) &&
      (statusFilter === "all" || job.status === statusFilter);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Quản lý Vị trí Tuyển dụng</h1><p className="mt-1 text-sm text-slate-500">Tạo, xuất bản, tạm dừng và xóa tin tuyển dụng.</p></div>
        <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Tạo vị trí mới</button>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600">Tin xuất bản cần tờ trình đã duyệt ngân sách và phân công tuyển dụng. <Link href="/hr/headcount" className="font-semibold text-blue-600">Mở luồng Headcount & đăng tin →</Link></div>

      {showCreate && (
        <form onSubmit={createJob} className="grid gap-4 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-3">
          <div className="flex items-center justify-between md:col-span-2 xl:col-span-3"><h2 className="font-bold text-slate-900">Tạo vị trí tuyển dụng</h2><button type="button" onClick={() => setShowCreate(false)} aria-label="Đóng"><X className="h-5 w-5" /></button></div>
          <Field label="Tên vị trí"><input required minLength={2} value={form.title} onChange={(event) => setForm({...form, title: event.target.value})} className="input-control" placeholder="Senior Backend Engineer" /></Field>
          <Field label="Phòng ban"><select required value={form.department_id} onChange={(event) => setForm({...form, department_id: event.target.value})} className="input-control"><option value="">Chọn phòng ban</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></Field>
          <Field label="Số lượng"><input required min={1} type="number" value={form.quantity} onChange={(event) => setForm({...form, quantity: event.target.value})} className="input-control" /></Field>
          <Field label="Địa điểm"><input required minLength={2} value={form.work_location} onChange={(event) => setForm({...form, work_location: event.target.value})} className="input-control" placeholder="Hà Nội" /></Field>
          <Field label="Loại công việc"><select value={form.employment_type} onChange={(event) => setForm({...form, employment_type: event.target.value})} className="input-control"><option value="full_time">Toàn thời gian</option><option value="part_time">Bán thời gian</option><option value="contract">Hợp đồng</option></select></Field>
          <Field label="Trạng thái"><select value={form.status} onChange={(event) => setForm({...form, status: event.target.value})} className="input-control"><option value="draft">Bản nháp</option><option value="published">Xuất bản ngay</option></select></Field>
          <div className="md:col-span-2 xl:col-span-3"><button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Lưu vị trí</button></div>
        </form>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm mã tin, vị trí, phòng ban..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm" /></div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"><option value="all">Tất cả trạng thái</option><option value="published">Đã xuất bản</option><option value="draft">Bản nháp</option><option value="paused">Tạm dừng</option><option value="expired">Hết hạn</option></select>
      </div>

      {loading ? <div className="py-16 text-center text-sm text-slate-500">Đang tải vị trí tuyển dụng...</div> : filteredJobs.length === 0 ? <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center"><BriefcaseBusiness className="h-8 w-8 text-blue-600" /><p className="mt-3 font-semibold">Chưa có vị trí tuyển dụng</p><p className="text-xs text-slate-500">Bấm “Tạo vị trí mới” để thêm dữ liệu đầu tiên.</p></div> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500"><tr><th className="px-5 py-4">Mã & Vị trí</th><th className="px-5 py-4">Phòng ban</th><th className="px-5 py-4">Địa điểm & Loại</th><th className="px-5 py-4 text-center">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-200">{filteredJobs.map((job) => <tr key={job.id}><td className="px-5 py-4"><span className="font-mono text-xs font-semibold text-blue-600">{job.code}</span><p className="font-bold text-slate-900">{job.title}</p></td><td className="px-5 py-4"><span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-slate-400" />{job.department_name ?? "Chưa xác định"}</span></td><td className="px-5 py-4 text-slate-600"><p>{job.work_location}</p><p className="text-xs text-slate-400">{job.employment_type}</p></td><td className="px-5 py-4 text-center"><Status value={job.status} /></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{job.status === "published" && <Link href={`/jobs/${job.id}`} className="rounded-lg border border-slate-200 p-2" title="Xem chi tiết"><Eye className="h-4 w-4" /></Link>}<button disabled={busyId === job.id} onClick={() => void changeStatus(job)} className="rounded-lg border border-slate-200 p-2" title={job.status === "published" ? "Tạm dừng" : "Xuất bản"}>{job.status === "published" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button><button disabled={busyId === job.id} onClick={() => void removeJob(job)} className="rounded-lg border border-rose-200 p-2 text-rose-600" title="Xóa"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) { return <label className="text-xs font-semibold text-slate-700">{label}<span className="mt-1 block [&_.input-control]:h-10 [&_.input-control]:w-full [&_.input-control]:rounded-xl [&_.input-control]:border [&_.input-control]:border-slate-200 [&_.input-control]:px-3">{children}</span></label>; }
function Status({value}: {value: JobPostingItem["status"]}) { const labels = {published: "Đã xuất bản", draft: "Bản nháp", paused: "Tạm dừng", expired: "Hết hạn"}; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value === "published" ? "bg-emerald-50 text-emerald-700" : value === "paused" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{labels[value]}</span>; }
