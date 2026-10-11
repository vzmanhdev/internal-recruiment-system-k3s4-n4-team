'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, Download, Loader2, TrendingDown } from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';

type FunnelStage = { stage: string; label: string; count: number; conversion_from_previous: number | null };
type Funnel = { total: number; stages: FunnelStage[]; biggest_drop: { from: string; to: string; lost: number } | null };
type GroupRow = { hires: number; avg_time_to_hire_days: number | null; total_cost: number; cost_per_hire: number | null; department?: string; job_title?: string };
type Metrics = { total_hires: number; avg_time_to_hire_days: number | null; cost_per_hire: number | null; by_department: GroupRow[]; by_job_title: GroupRow[] };
type SourceRow = { source: string; applications: number; passed_screening: number; screening_pass_rate: number; hired: number; hire_rate: number; avg_evaluation_score: number | null; best_quality?: boolean };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function downloadExcel(path: string, filename: string) {
  // Authenticated download of the server-generated workbook (no client-side data fabrication).
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' });
  if (!res.ok) throw new ApiError(res.status, 'Không xuất được báo cáo.');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function HRReportsPage() {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [range, setRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (from = '', to = '') => {
    const qs = new URLSearchParams();
    if (from) qs.append('date_from', from);
    if (to) qs.append('date_to', to);
    const suffix = qs.toString() ? `?${qs}` : '';
    try {
      const [f, m, s] = await Promise.all([
        apiRequest<Funnel>(`/analytics/funnel${suffix}`),
        apiRequest<Metrics>(`/analytics/hiring-metrics${suffix}`),
        apiRequest<SourceRow[]>(`/analytics/sources${suffix}`),
      ]);
      setFunnel(f); setMetrics(m); setSources(s); setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được báo cáo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const money = (n: number | null) => (n == null ? '—' : n.toLocaleString('vi-VN') + ' VNĐ');
  const card = 'bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5';

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2"><BarChart3 className="w-6 h-6 text-blue-600" />Báo Cáo Tuyển Dụng</h1>
          <p className="text-xs text-slate-500 mt-1">Phễu tuyển dụng, time-to-hire, cost-per-hire và hiệu quả nguồn — tính trực tiếp từ dữ liệu hệ thống (S8-07, S8-08, S8-09).</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setLoading(true); void load(range.from, range.to); }} className="flex items-end gap-2 text-xs">
          <label className="font-semibold">Từ<input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="block border border-slate-200 rounded-lg px-2 py-1.5" /></label>
          <label className="font-semibold">Đến<input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="block border border-slate-200 rounded-lg px-2 py-1.5" /></label>
          <button className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold cursor-pointer">Lọc</button>
        </form>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</div>
      ) : error ? (
        <div className="p-10 text-center text-xs text-rose-600 bg-white rounded-2xl border border-slate-200">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={card}><div className="text-xs text-slate-500">Tổng hồ sơ trong kỳ</div><div className="text-3xl font-black text-slate-900">{funnel?.total ?? 0}</div></div>
            <div className={card}><div className="text-xs text-slate-500">Time-to-hire trung bình</div><div className="text-3xl font-black text-slate-900">{metrics?.avg_time_to_hire_days ?? '—'}<span className="text-sm font-semibold text-slate-400"> ngày</span></div></div>
            <div className={card}><div className="text-xs text-slate-500">Cost-per-hire</div><div className="text-2xl font-black text-slate-900">{money(metrics?.cost_per_hire ?? null)}</div><div className="text-[11px] text-slate-400">{metrics?.total_hires ?? 0} người nhận việc</div></div>
          </div>

          <div className={card}>
            <div className="text-sm font-bold text-slate-900 mb-3">Phễu tuyển dụng</div>
            <div className="space-y-2.5">
              {funnel?.stages.map((s) => {
                const pct = funnel.total ? Math.round((s.count / funnel.total) * 100) : 0;
                return (
                  <div key={s.stage} className="space-y-1">
                    <div className="flex justify-between text-xs"><span className="font-semibold">{s.label}</span><span>{s.count} hồ sơ{s.conversion_from_previous != null && s.stage !== 'submitted' ? ` · chuyển đổi ${s.conversion_from_previous}%` : ''}</span></div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
            {funnel?.biggest_drop && (
              <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 inline-flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" />Rơi rụng nhiều nhất: {funnel.biggest_drop.from} → {funnel.biggest_drop.to} ({funnel.biggest_drop.lost} hồ sơ)
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {(['by_department', 'by_job_title'] as const).map((key) => (
              <div key={key} className={card}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-slate-900">{key === 'by_department' ? 'Theo phòng ban' : 'Theo chức danh'}</div>
                  {key === 'by_department' && (
                    <button onClick={() => downloadExcel('/analytics/hiring-metrics?export=true', 'time-to-hire_cost-per-hire.xlsx').catch((e) => setError(e.message))}
                      className="text-xs font-bold text-blue-600 inline-flex items-center gap-1 cursor-pointer"><Download className="w-3.5 h-3.5" />Xuất Excel</button>
                  )}
                </div>
                {!metrics?.[key].length ? <div className="text-xs text-slate-500">Chưa có người nhận việc trong kỳ.</div> : (
                  <table className="w-full text-xs"><thead className="text-[10px] text-slate-400 uppercase"><tr><th className="text-left py-1">Nhóm</th><th>Tuyển</th><th>Ngày TB</th><th>Cost/hire</th></tr></thead>
                    <tbody>{metrics[key].map((r) => (
                      <tr key={(r.department || r.job_title) as string} className="border-t border-slate-100"><td className="py-1.5">{r.department || r.job_title}</td><td className="text-center">{r.hires}</td><td className="text-center">{r.avg_time_to_hire_days ?? '—'}</td><td className="text-right">{money(r.cost_per_hire)}</td></tr>
                    ))}</tbody></table>
                )}
              </div>
            ))}
          </div>

          <div className={card}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-slate-900">Hiệu quả nguồn ứng viên</div>
              <button onClick={() => downloadExcel('/analytics/sources?export=true', 'hieu-qua-nguon.xlsx').catch((e) => setError(e.message))}
                className="text-xs font-bold text-blue-600 inline-flex items-center gap-1 cursor-pointer"><Download className="w-3.5 h-3.5" />Xuất Excel</button>
            </div>
            {sources.length === 0 ? <div className="text-xs text-slate-500">Chưa có hồ sơ trong kỳ.</div> : (
              <table className="w-full text-xs"><thead className="text-[10px] text-slate-400 uppercase"><tr><th className="text-left py-1">Nguồn</th><th>Hồ sơ</th><th>Qua sàng lọc</th><th>Nhận việc</th><th>Tỷ lệ tuyển</th><th>Điểm đánh giá TB</th></tr></thead>
                <tbody>{sources.map((s) => (
                  <tr key={s.source} className={`border-t border-slate-100 ${s.best_quality ? 'bg-emerald-50/50' : ''}`}>
                    <td className="py-1.5 font-semibold">{s.source}{s.best_quality ? ' ★' : ''}</td><td className="text-center">{s.applications}</td>
                    <td className="text-center">{s.passed_screening} ({s.screening_pass_rate}%)</td><td className="text-center">{s.hired}</td>
                    <td className="text-center">{s.hire_rate}%</td><td className="text-center">{s.avg_evaluation_score ?? '—'}</td>
                  </tr>
                ))}</tbody></table>
            )}
            <p className="text-[11px] text-slate-400 mt-2">★ Nguồn chất lượng nhất: xếp theo tỷ lệ tuyển và điểm đánh giá, không chỉ theo số lượng hồ sơ.</p>
          </div>
        </>
      )}
    </div>
  );
}
