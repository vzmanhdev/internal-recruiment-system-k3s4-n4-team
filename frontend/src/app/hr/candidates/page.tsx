'use client';

import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};
import { ArrowRight, Loader2, RefreshCw, Search, Users, XCircle } from 'lucide-react';
import { openProtectedFile } from "@/services/file.service";
import { applicationService, type ApplicationItem } from '@/services/application.service';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

const STAGES: Record<string, { label: string; next?: string; cls: string }> = {
  submitted: { label: 'Mới nộp', next: 'screening', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  screening: { label: 'Sàng lọc', next: 'interviewing', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  interviewing: { label: 'Phỏng vấn', next: 'offered', cls: 'bg-purple-50 text-purple-700 border-purple-100' },
  offered: { label: 'Đề xuất offer', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  hired: { label: 'Đã tuyển', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  onboarded: { label: 'Đã onboard', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: 'Đã loại', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  withdrawn: { label: 'Ứng viên rút', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function HRCandidatesPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // ?q= from the header search box seeds the filter until the user edits it.
  const urlQuery = useSyncExternalStore(noopSubscribe, () => new URLSearchParams(window.location.search).get('q') ?? '', () => '');
  const [typedSearch, setSearch] = useState<string | null>(null);
  const search = typedSearch ?? urlQuery;
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejecting, setRejecting] = useState<ApplicationItem | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      setItems(await applicationService.getApplications({ search: search.trim() || undefined, status_filter: statusFilter || undefined }));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được danh sách ứng viên.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // Reload on status change or a new ?q= from the header; typed searches apply via reload().
  useEffect(() => {
    let active = true;
    applicationService.getApplications({ search: search.trim() || undefined, status_filter: statusFilter || undefined })
      .then((rows) => { if (active) { setItems(rows); setLoadError(null); } })
      .catch((err) => { if (active) setLoadError(err instanceof ApiError ? err.message : 'Không tải được danh sách ứng viên.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [statusFilter, urlQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    void load();
  };

  const move = async (app: ApplicationItem, status: string, rejection_reason?: string) => {
    setBusyId(app.id);
    try {
      const updated = await applicationService.updateStatus(app.id, { status, rejection_reason });
      setItems((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
      showSuccess(`Đã chuyển ${app.full_name} sang "${STAGES[status]?.label || status}".`);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Không cập nhật được trạng thái.');
    } finally {
      setBusyId(null);
    }
  };

  const confirmReject = () => {
    if (!rejecting) return;
    if (!reason.trim()) {
      showError('Loại hồ sơ bắt buộc phải nhập lý do.');
      return;
    }
    const app = rejecting;
    setRejecting(null);
    move(app, 'rejected', reason.trim());
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" />Hồ Sơ Ứng Viên & Pipeline</h1>
          <p className="text-xs text-slate-500 mt-1">Chỉ hiển thị ứng viên thuộc vị trí bạn được phân công (bảo vệ dữ liệu cá nhân, kiểm ở tầng server).</p>
        </div>
        <div className="flex gap-2 items-center">
          <form onSubmit={(e) => { e.preventDefault(); reload(); }} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên, email, SĐT..."
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </form>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STAGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={reload} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer" title="Tải lại"><RefreshCw className="w-4 h-4 text-slate-600" /></button>
        </div>
      </div>

      {rejecting && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-4 space-y-3">
          <div className="text-xs font-bold text-slate-800">Lý do loại hồ sơ {rejecting.full_name} (bắt buộc)</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
            className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setRejecting(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Huỷ</button>
            <button onClick={confirmReject} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer">Xác nhận loại</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-xs text-rose-600">{loadError}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">Không có hồ sơ ứng viên nào phù hợp.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Ứng viên</th>
                <th className="p-4">Vị trí ứng tuyển</th>
                <th className="p-4 text-center">Kinh nghiệm</th>
                <th className="p-4 text-center">Giai đoạn</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {items.map((a) => {
                const st = STAGES[a.status] || { label: a.status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                const terminal = ['hired', 'onboarded', 'rejected', 'withdrawn'].includes(a.status);
                return (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{a.full_name}</div>
                      <div className="text-[11px] text-slate-400">{a.email} · {a.phone}</div>
                      {a.cv_url && <button type="button" onClick={() => openProtectedFile(a.cv_url!).catch((e) => showError(e.message))} className="text-[11px] text-blue-600 font-semibold cursor-pointer">Xem CV</button>}
                    </td>
                    <td className="p-4">{a.job_title}</td>
                    <td className="p-4 text-center">{a.years_of_experience} năm</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${st.cls}`}>{st.label}</span>
                      {a.rejection_reason && <div className="text-[10px] text-slate-400 mt-1 max-w-[180px] mx-auto">{a.rejection_reason}</div>}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {busyId === a.id ? <Loader2 className="w-4 h-4 animate-spin inline text-slate-400" /> : !terminal && (
                        <div className="inline-flex gap-1.5">
                          {st.next && (
                            <button onClick={() => move(a, st.next!)} className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer">
                              <ArrowRight className="w-3 h-3" />{STAGES[st.next].label}
                            </button>
                          )}
                          <button onClick={() => { setRejecting(a); setReason(''); }} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer">
                            <XCircle className="w-3 h-3" />Loại
                          </button>
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
