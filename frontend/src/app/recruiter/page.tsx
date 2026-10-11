'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calendar, Loader2, Send, Users, XCircle, FileText, Mail } from 'lucide-react';
import { openProtectedFile } from "@/services/file.service";
import { RoleWorkspaceShell } from '@/components/layout/RoleWorkspaceShell';
import { applicationService, type ApplicationItem } from '@/services/application.service';
import { interviewService } from '@/services/interview.service';
import { offerService, type OfferItem } from '@/services/offer.service';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';

const STAGES: Array<{ key: string; label: string; next?: string }> = [
  { key: 'submitted', label: 'Hồ sơ mới', next: 'screening' },
  { key: 'screening', label: 'Sàng lọc', next: 'interviewing' },
  { key: 'interviewing', label: 'Phỏng vấn' },
  { key: 'offered', label: 'Đề xuất offer' },
  { key: 'hired', label: 'Nhận việc' },
  { key: 'rejected', label: 'Loại' },
];
type Person = { id: number; full_name: string; email: string };

export default function RecruiterWorkspacePage() {
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState<'pipeline' | 'interviews' | 'offers'>('pipeline');
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [interviewers, setInterviewers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jobFilter, setJobFilter] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<ApplicationItem | null>(null);
  const [reason, setReason] = useState('');
  const [sched, setSched] = useState({ application_id: 0, scheduled_time: '', duration_minutes: 60, location: 'Phòng họp 302', meeting_link: '', round_name: 'Vòng 1: Phỏng vấn chuyên môn', interviewer_ids: [] as number[], override_conflict_reason: '' });
  const [conflict, setConflict] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState({ application_id: 0, offered_salary: 0, allowance: 0, start_date: '', response_deadline: '', salary_justification: '' });

  const load = useCallback(async () => {
    try {
      const [a, o, people] = await Promise.all([
        applicationService.getApplications(),
        offerService.getOffers(),
        apiRequest<Person[]>('/hr/people?role=interviewer').catch(() => [] as Person[]),
      ]);
      setApps(a); setOffers(o); setInterviewers(people);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const jobs = useMemo(() => Array.from(new Map(apps.map((a) => [a.job_posting_id, a.job_title || `#${a.job_posting_id}`])).entries()), [apps]);
  const visible = apps.filter((a) => !jobFilter || String(a.job_posting_id) === jobFilter);

  const move = async (a: ApplicationItem, status: string, rejection_reason?: string) => {
    setBusy(a.id);
    try {
      await applicationService.updateStatus(a.id, { status, rejection_reason });
      await load();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Không chuyển được giai đoạn.');
    } finally {
      setBusy(null);
    }
  };

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflict(null);
    try {
      await interviewService.scheduleInterview({
        ...sched, meeting_link: sched.meeting_link || undefined,
        override_conflict_reason: sched.override_conflict_reason || undefined,
      } as never);
      showSuccess('Đã đặt lịch và gửi thư mời cho ứng viên.');
      setSched((s) => ({ ...s, application_id: 0, override_conflict_reason: '' }));
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setConflict(err.message);
      else showError(err instanceof ApiError ? err.message : 'Đặt lịch thất bại.');
    }
  };

  const createOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await offerService.createOffer({ ...offerForm, response_deadline: offerForm.response_deadline || undefined,
        salary_justification: offerForm.salary_justification || undefined } as never);
      showSuccess('Đã tạo offer và gửi duyệt.');
      setOfferForm({ application_id: 0, offered_salary: 0, allowance: 0, start_date: '', response_deadline: '', salary_justification: '' });
      await load();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Tạo offer thất bại.');
    }
  };

  const input = 'w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs';
  const tabs = [['pipeline', 'Pipeline ứng viên'], ['interviews', 'Đặt lịch phỏng vấn'], ['offers', 'Offer']] as const;

  return (
    <RoleWorkspaceShell title="Recruiter Workspace" badge="Nhân viên tuyển dụng" subtitle="Vận hành pipeline các vị trí được phân công, đặt lịch phỏng vấn và soạn offer"
      icon={<Users className="w-6 h-6" />} accent="from-blue-600 to-indigo-500">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${tab === k ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{label}</button>
        ))}
        <Link href="/hr/automation/email-logs" className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-600 inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" />Nhật ký email</Link>
        <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="ml-auto px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
          <option value="">Tất cả vị trí phụ trách</option>
          {jobs.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</div>
      ) : loadError ? (
        <div className="py-10 text-center text-xs text-rose-600">{loadError}</div>
      ) : tab === 'pipeline' ? (
        <>
          {rejecting && (
            <div className="mb-4 bg-white rounded-2xl border border-rose-200 p-4 space-y-2">
              <div className="text-xs font-bold">Lý do loại {rejecting.full_name} (bắt buộc)</div>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRejecting(null)} className="px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer">Huỷ</button>
                <button onClick={() => { if (!reason.trim()) { showError('Bắt buộc nhập lý do.'); return; } const a = rejecting; setRejecting(null); void move(a, 'rejected', reason.trim()); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white cursor-pointer">Xác nhận loại</button>
              </div>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {STAGES.map((st) => {
              const col = visible.filter((a) => a.status === st.key || (st.key === 'hired' && a.status === 'onboarded'));
              return (
                <div key={st.key} className="bg-white rounded-2xl border border-slate-200/80 p-3 space-y-2 min-h-[160px]">
                  <div className="flex justify-between text-xs font-extrabold text-slate-700"><span>{st.label}</span><span className="text-slate-400">{col.length}</span></div>
                  {col.map((a) => (
                    <div key={a.id} className={`rounded-xl border p-2.5 text-xs space-y-1 ${a.is_overdue ? 'border-rose-300 bg-rose-50/40' : 'border-slate-100'}`}>
                      <div className="font-bold text-slate-900">{a.full_name}</div>
                      <div className="text-[11px] text-slate-500">{a.job_title}{a.match_score != null ? ` · phù hợp ${a.match_score}%` : ''}{a.is_overdue ? ' · quá SLA' : ''}</div>
                      {a.cv_url && <button type="button" onClick={() => openProtectedFile(a.cv_url!).catch((e) => showError(e.message))} className="text-[11px] text-blue-600 inline-flex items-center gap-1 cursor-pointer"><FileText className="w-3 h-3" />CV</button>}
                      {busy === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" /> : !['hired', 'onboarded', 'rejected', 'withdrawn'].includes(a.status) && (
                        <div className="flex gap-1 pt-1">
                          {st.next && <button onClick={() => move(a, st.next!)} className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer"><ArrowRight className="w-3 h-3" />{STAGES.find((x) => x.key === st.next)?.label}</button>}
                          <button onClick={() => { setRejecting(a); setReason(''); }} className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold inline-flex items-center gap-0.5 cursor-pointer"><XCircle className="w-3 h-3" />Loại</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      ) : tab === 'interviews' ? (
        <form onSubmit={schedule} className="bg-white rounded-2xl border border-slate-200 p-5 grid gap-3 md:grid-cols-2 max-w-3xl">
          <label className="text-xs font-semibold md:col-span-2">Ứng viên *
            <select required value={sched.application_id || ''} onChange={(e) => setSched({ ...sched, application_id: Number(e.target.value) })} className={input}>
              <option value="">— Chọn ứng viên —</option>
              {visible.filter((a) => ['submitted', 'screening', 'interviewing'].includes(a.status)).map((a) => <option key={a.id} value={a.id}>{a.full_name} · {a.job_title}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold">Vòng<input value={sched.round_name} onChange={(e) => setSched({ ...sched, round_name: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold">Thời gian *<input required type="datetime-local" value={sched.scheduled_time} onChange={(e) => setSched({ ...sched, scheduled_time: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold">Thời lượng (phút)<input type="number" min={5} value={sched.duration_minutes} onChange={(e) => setSched({ ...sched, duration_minutes: Number(e.target.value) })} className={input} /></label>
          <label className="text-xs font-semibold">Phòng / Địa điểm<input value={sched.location} onChange={(e) => setSched({ ...sched, location: e.target.value })} className={input} /></label>
          <label className="text-xs font-semibold md:col-span-2">Link họp trực tuyến (nếu có)<input value={sched.meeting_link} onChange={(e) => setSched({ ...sched, meeting_link: e.target.value })} className={input} /></label>
          <div className="text-xs font-semibold md:col-span-2">Người phỏng vấn *
            <div className="flex flex-wrap gap-1.5 mt-1">
              {interviewers.map((p) => {
                const on = sched.interviewer_ids.includes(p.id);
                return <button type="button" key={p.id} onClick={() => setSched({ ...sched, interviewer_ids: on ? sched.interviewer_ids.filter((x) => x !== p.id) : [...sched.interviewer_ids, p.id] })}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${on ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>{p.full_name}</button>;
              })}
            </div>
          </div>
          {conflict && (
            <div className="md:col-span-2 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <div className="font-bold">{conflict}</div>
              <input placeholder="Lý do ghi đè trùng lịch (bắt buộc nếu vẫn đặt)" value={sched.override_conflict_reason} onChange={(e) => setSched({ ...sched, override_conflict_reason: e.target.value })} className={input} />
            </div>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"><Calendar className="w-4 h-4" />Đặt lịch & gửi thư mời</button>
          </div>
        </form>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createOffer} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="text-sm font-bold text-slate-900">Soạn offer (S7-04)</div>
            <select required value={offerForm.application_id || ''} onChange={(e) => setOfferForm({ ...offerForm, application_id: Number(e.target.value) })} className={input}>
              <option value="">— Ứng viên đã quyết định đề xuất offer —</option>
              {visible.filter((a) => ['interviewing', 'offered'].includes(a.status) && !offers.some((o) => o.application_id === a.id)).map((a) => <option key={a.id} value={a.id}>{a.full_name} · {a.job_title}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold">Lương (VNĐ) *<input required type="number" min={1} value={offerForm.offered_salary || ''} onChange={(e) => setOfferForm({ ...offerForm, offered_salary: Number(e.target.value) })} className={input} /></label>
              <label className="text-xs font-semibold">Phụ cấp (VNĐ)<input type="number" min={0} value={offerForm.allowance || ''} onChange={(e) => setOfferForm({ ...offerForm, allowance: Number(e.target.value) })} className={input} /></label>
              <label className="text-xs font-semibold">Ngày nhận việc *<input required type="date" value={offerForm.start_date} onChange={(e) => setOfferForm({ ...offerForm, start_date: e.target.value })} className={input} /></label>
              <label className="text-xs font-semibold">Hạn phản hồi<input type="date" value={offerForm.response_deadline} onChange={(e) => setOfferForm({ ...offerForm, response_deadline: e.target.value })} className={input} /></label>
            </div>
            <textarea placeholder="Giải trình (bắt buộc nếu lương ngoài dải chuẩn của chức danh)" value={offerForm.salary_justification} onChange={(e) => setOfferForm({ ...offerForm, salary_justification: e.target.value })} rows={2} className={input} />
            <button type="submit" className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer">Tạo offer & gửi duyệt</button>
          </form>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <div className="text-sm font-bold text-slate-900">Offer của các vị trí phụ trách</div>
            {offers.length === 0 ? <div className="text-xs text-slate-500">Chưa có offer.</div> : offers.map((o) => (
              <div key={o.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-2.5 text-xs">
                <div><div className="font-bold">{o.candidate_name}</div><div className="text-slate-500">{o.offered_salary.toLocaleString('vi-VN')} {o.currency} · {o.status}</div></div>
                {o.status === 'approved' && (
                  <button onClick={async () => { try { await offerService.sendOffer(o.id); showSuccess('Đã gửi thư offer cho ứng viên.'); await load(); } catch (err) { showError(err instanceof ApiError ? err.message : 'Gửi thất bại.'); } }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold inline-flex items-center gap-1 cursor-pointer"><Send className="w-3 h-3" />Gửi</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </RoleWorkspaceShell>
  );
}
