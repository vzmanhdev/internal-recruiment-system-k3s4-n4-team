'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Eye, Loader2, Plus, RefreshCw, Send, XCircle } from 'lucide-react';
import { jobService, type JobPostingItem } from '@/services/job.service';
import { requisitionService, type RequisitionItem } from '@/services/requisition.service';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Nháp', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  pending_review: { label: 'Chờ HR duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  published: { label: 'Đang đăng công khai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  closed: { label: 'Đã đóng', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function HRJobPostingsPage() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const rawRoles = (currentUser?.roles ?? []) as Array<string | { code: string }>;
  const roleCodes = new Set<string>(rawRoles.map((r) => (typeof r === 'string' ? r : r.code)));
  const canPublish = roleCodes.has('admin') || roleCodes.has('hr_manager');

  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [approvedReqs, setApprovedReqs] = useState<RequisitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ requisition_id: 0, title: '', location: 'Hà Nội', type: 'Full-time', level: 'Mid-Level', salary_range: 'Thỏa thuận', deadline: '', description: '', requirements: '' });

  const load = useCallback(async () => {
    try {
      const [jobList, reqs] = await Promise.all([jobService.getAdminJobs(), requisitionService.getRequisitions('approved')]);
      setJobs(jobList);
      setApprovedReqs(reqs);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được danh sách tin tuyển dụng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    void load();
  };

  const pickRequisition = (id: number) => {
    const req = approvedReqs.find((r) => r.id === id);
    setForm((f) => ({
      ...f,
      requisition_id: id,
      title: req?.title || '',
      location: req?.work_location || f.location,
      type: req?.employment_type || f.type,
      description: req?.job_description || '',
      requirements: req?.requirements || '',
    }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const req = approvedReqs.find((r) => r.id === form.requisition_id);
    if (!req) {
      showError('Chỉ tạo được tin từ yêu cầu tuyển dụng đã được duyệt.');
      return;
    }
    setSaving(true);
    try {
      const created = await jobService.createJob({
        ...form,
        deadline: form.deadline || undefined,
        department_id: req.department_id,
        department_name: req.department_name || '',
        status: 'pending_review',
      });
      setJobs((prev) => [created, ...prev]);
      setShowForm(false);
      showSuccess(created.status === 'published' ? 'Đã đăng tin.' : 'Đã tạo tin, đang chờ Trưởng phòng Nhân sự duyệt.');
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Tạo tin thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const act = async (job: JobPostingItem, fn: () => Promise<JobPostingItem>, ok: string) => {
    setBusyId(job.id);
    try {
      const updated = await fn();
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      showSuccess(ok);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Thao tác thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  const input = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30';

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Tin Tuyển Dụng</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">[S3-09 / S3-10]</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tin chỉ được tạo từ yêu cầu đã duyệt và phải được Trưởng phòng Nhân sự duyệt trước khi hiển thị công khai.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Tải lại
          </button>
          <button onClick={() => setShowForm((v) => !v)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer">
            <Plus className="w-4 h-4" /> Soạn tin mới
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-slate-700 md:col-span-2">Yêu cầu tuyển dụng đã duyệt *
            <select required value={form.requisition_id || ''} onChange={(e) => pickRequisition(Number(e.target.value))} className={input}>
              <option value="">— Chọn yêu cầu —</option>
              {approvedReqs.map((r) => <option key={r.id} value={r.id}>{r.code} · {r.title}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-700">Tiêu đề tin *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold text-slate-700">Hạn nhận hồ sơ<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold text-slate-700">Địa điểm<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold text-slate-700">Mức lương hiển thị<input value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold text-slate-700 md:col-span-2">Mô tả công việc *<textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold text-slate-700 md:col-span-2">Yêu cầu ứng viên<textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className={input} /></label>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Huỷ</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Gửi duyệt
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-xs text-rose-600">{loadError}</div>
        ) : jobs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">Chưa có tin tuyển dụng nào.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Tin tuyển dụng</th>
                <th className="p-4">Phòng ban</th>
                <th className="p-4 text-center">Lượt xem / Hồ sơ</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {jobs.map((job) => {
                const st = STATUS[job.status] || { label: job.status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                return (
                  <tr key={job.id} className="hover:bg-slate-50/70">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-blue-600" />{job.title}</div>
                      <div className="text-[11px] text-slate-400">{job.location} · {job.type}{job.deadline ? ` · hạn ${job.deadline}` : ''}</div>
                      {job.published_at && <div className="text-[10px] text-slate-400">Xuất bản: {new Date(job.published_at + 'Z').toLocaleString('vi-VN')}</div>}
                    </td>
                    <td className="p-4">{job.department_name || job.department}</td>
                    <td className="p-4 text-center font-mono">{job.views_count ?? 0} / {job.applications_count ?? 0}</td>
                    <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${st.cls}`}>{st.label}</span></td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {busyId === job.id ? <Loader2 className="w-4 h-4 animate-spin inline text-slate-400" /> : (
                        <div className="inline-flex gap-1.5">
                          {job.status === 'published' && (
                            <a href={`/jobs/${job.slug}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 inline-flex items-center gap-1"><Eye className="w-3 h-3" />Xem</a>
                          )}
                          {canPublish && (job.status === 'pending_review' || job.status === 'draft') && (
                            <button onClick={() => act(job, () => jobService.publishJob(job.id), 'Đã xuất bản tin.')} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"><Send className="w-3 h-3" />Duyệt & đăng</button>
                          )}
                          {job.status !== 'closed' && (
                            <button onClick={() => act(job, () => jobService.closeJob(job.id), 'Đã đóng tin.')} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"><XCircle className="w-3 h-3" />Đóng</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
