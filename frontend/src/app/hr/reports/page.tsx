'use client';

import React, { useState } from 'react';
import { 
  BarChart3, Download, Calendar, Filter, FileSpreadsheet, TrendingUp, 
  Users, Clock, CheckCircle2, DollarSign, Building2, RefreshCw
} from 'lucide-react';
import { apiRequest, API_BASE_URL } from '@/lib/api-client';
import { requisitionService } from '@/services/requisition.service';
import { offerService } from '@/services/offer.service';
import { masterDataService } from '@/services/master-data.service';
import type { ApiApplication } from '@/features/candidates/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const vn = (d: Date) => d.toLocaleDateString('vi-VN');

/** Report periods computed from today (current quarter, previous quarter, current year). */
function periods() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const qStart = new Date(now.getFullYear(), q * 3, 1);
  const prevStart = new Date(now.getFullYear(), q * 3 - 3, 1);
  const prevEnd = new Date(qStart.getTime() - 86_400_000);
  const quarterLabel = (d: Date) => `Quý ${Math.floor(d.getMonth() / 3) + 1}/${d.getFullYear()}`;
  return [
    { id: 'this_quarter', label: `${quarterLabel(qStart)} (${vn(qStart)} - ${vn(now)})`, from: qStart, to: now },
    { id: 'last_quarter', label: `${quarterLabel(prevStart)} (${vn(prevStart)} - ${vn(prevEnd)})`, from: prevStart, to: prevEnd },
    { id: 'this_year', label: `Cả Năm ${now.getFullYear()}`, from: new Date(now.getFullYear(), 0, 1), to: now },
  ];
}

interface Metrics { total_hires: number; avg_time_to_hire_days: number | null; cost_per_hire: number | null; by_department: Array<{ department: string; avg_time_to_hire_days: number | null; hires: number }> }

async function loadReport(from: Date, to: Date) {
  const range = `date_from=${iso(from)}&date_to=${iso(to)}`;
  const [reqs, apps, offers, metrics, depts] = await Promise.all([
    requisitionService.getRequisitions(),
    apiRequest<ApiApplication[]>('/applications'),
    offerService.getOffers(),
    apiRequest<Metrics>(`/analytics/hiring-metrics?${range}`),
    masterDataService.departments(false),
  ]);
  const inRange = (t?: string | null) => !!t && new Date(t) >= from && new Date(t) <= new Date(to.getTime() + 86_400_000);
  return {
    reqs: reqs.filter((r) => inRange(r.created_at)),
    apps: apps.filter((a) => inRange(a.created_at)),
    offers: offers.filter((o) => inRange(o.created_at)),
    metrics, depts, range,
  };
}

export default function HRReportsPage() {
  const PERIODS = periods();
  const [dateRange, setDateRange] = useState('this_quarter');
  const period = PERIODS.find((x) => x.id === dateRange) || PERIODS[0];
  const { data: rp, error, loading, reload } = useApiData(() => loadReport(period.from, period.to), [dateRange]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [exporting, setExporting] = useState(false);

  // Server-generated Excel for the selected period (time-to-hire & cost-per-hire by department / job title)
  const handleExportExcel = async () => {
    if (!rp) return;
    setExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE_URL}/analytics/hiring-metrics?${rp.range}&export=true`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include',
      });
      if (res.ok) {
        const name = /filename="?([^"]+)"?/.exec(res.headers.get('content-disposition') || '')?.[1] || 'bao-cao-tuyen-dung.xlsx';
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  if (loading && !rp) return <LoadingState />;
  if (error || !rp) return <ErrorState error={error} onRetry={reload} />;

  const deptName = (id?: number | null) => rp.depts.find((d) => d.id === id)?.name || '—';
  const reqs = selectedDept === 'all' ? rp.reqs : rp.reqs.filter((r) => String(r.department_id) === selectedDept);
  const scopeName = selectedDept === 'all' ? null : deptName(Number(selectedDept));
  const apps = scopeName ? rp.apps.filter((a) => a.department === scopeName) : rp.apps;
  const target = reqs.reduce((n, r) => n + (r.quantity || 0), 0);
  const filledQty = reqs.filter((r) => r.status === 'filled').reduce((n, r) => n + (r.quantity || 0), 0);
  const answered = rp.offers.filter((o) => ['accepted', 'declined', 'expired'].includes(o.status) && (!scopeName || o.department === scopeName));
  const acceptRate = answered.length ? (answered.filter((o) => o.status === 'accepted').length / answered.length) * 100 : null;
  const rows = Array.from(new Set(reqs.map((r) => r.department_id))).map((deptId) => {
    const name = deptName(deptId);
    const dReqs = reqs.filter((r) => r.department_id === deptId);
    const dApps = rp.apps.filter((a) => a.department === name);
    const quota = dReqs.reduce((n, r) => n + (r.quantity || 0), 0);
    const hired = dApps.filter((a) => a.status === 'hired' || a.status === 'onboarded').length;
    return {
      name, quota, hired, cvs: dApps.length,
      interviewed: dApps.filter((a) => ['interviewing', 'offered', 'hired', 'onboarded'].includes(a.status)).length,
      offers: rp.offers.filter((o) => o.department === name).length,
      days: rp.metrics.by_department.find((m) => m.department === name)?.avg_time_to_hire_days ?? null,
      rate: quota ? Math.round((hired / quota) * 1000) / 10 : null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trung Tâm Báo Cáo & Phân Tích Tuyển Dụng</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              [S9-01] [S9-04] Excel Export
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tổng hợp báo cáo phễu chuyển đổi, thời gian tuyển trung bình (Time-to-Hire) & Xuất báo cáo Excel theo quy định</p>
        </div>

        <button 
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
          <span>{exporting ? 'Đang Xuất Excel...' : 'Xuất Báo Cáo Excel (.xlsx)'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Kỳ báo cáo:</span>
          </div>

          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            {PERIODS.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </select>

          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">Tất cả phòng ban</option>
            {rp.depts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tổng Vị Trí Đã Đóng</div>
          <div className="text-2xl font-black text-slate-900">{filledQty}/{target}</div>
          <div className="text-xs text-emerald-600 font-bold">{target ? `Đạt ${((filledQty / target) * 100).toFixed(1)}% chỉ tiêu` : 'Chưa có chỉ tiêu trong kỳ'}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Thời Gian Tuyển TB (Time-to-Hire)</div>
          <div className="text-2xl font-black text-blue-600">{rp.metrics.avg_time_to_hire_days ?? '—'} ngày</div>
          <div className="text-xs text-slate-500">Tính trên {rp.metrics.total_hires} lượt tuyển trong kỳ</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tỷ Lệ Nhận Offer (Offer Acceptance)</div>
          <div className="text-2xl font-black text-purple-600">{acceptRate === null ? '—' : `${acceptRate.toFixed(1)}%`}</div>
          <div className="text-xs text-emerald-600 font-bold">Trên {answered.length} offer đã có phản hồi</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Chi Phí / 1 Nhân Sự (Cost-per-Hire)</div>
          <div className="text-2xl font-black text-slate-900">{rp.metrics.cost_per_hire ? `${(rp.metrics.cost_per_hire / 1_000_000).toFixed(1)} TR VNĐ` : '—'}</div>
          <div className="text-xs text-slate-500">Theo chi phí tuyển dụng đã ghi nhận</div>
        </div>
      </div>

      {/* Main Report Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Chi Tiết Hiệu Quả Tuyển Dụng Theo Phòng Ban [S9-01]</h2>
          <span className="text-xs text-slate-400">Xem trước bản xem dữ liệu trước khi xuất Excel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                <th className="p-3">Phòng Ban</th>
                <th className="p-3 text-center">Chỉ Tiêu Tuyển</th>
                <th className="p-3 text-center">Đã Tuyển Đủ</th>
                <th className="p-3 text-center">Tổng Hồ Sơ (CV)</th>
                <th className="p-3 text-center">Phỏng Vấn</th>
                <th className="p-3 text-center">Offer Phát Ra</th>
                <th className="p-3 text-center">Time-to-Hire</th>
                <th className="p-3 text-center">Tỷ Lệ Thành Công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-slate-400">Chưa có tờ trình tuyển dụng nào trong kỳ báo cáo.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.name} className="hover:bg-slate-50/70">
                  <td className="p-3 font-bold text-slate-900">{r.name}</td>
                  <td className="p-3 text-center">{r.quota}</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">{r.hired}</td>
                  <td className="p-3 text-center">{r.cvs}</td>
                  <td className="p-3 text-center">{r.interviewed}</td>
                  <td className="p-3 text-center">{r.offers}</td>
                  <td className="p-3 text-center">{r.days === null ? '—' : `${r.days} ngày`}</td>
                  <td className="p-3 text-center text-blue-600 font-bold">{r.rate === null ? '—' : `${r.rate}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
