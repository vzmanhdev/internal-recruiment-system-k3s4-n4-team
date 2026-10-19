"use client";

import React, { useState, useMemo } from "react";
import { apiRequest, API_BASE_URL } from "@/lib/api-client";
import { useApiData } from "@/hooks/useApiData";
import { triggerFileDownload } from "@/utils/fileDownload";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import Link from "next/link";

import {
  Briefcase as BriefcaseIcon,
  Users as UsersIcon,
  Clock as ClockIcon,
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  RefreshCw as RefreshCwIcon,
  Download as DownloadIcon,
  Calendar as CalendarIcon,
  Sparkles as SparklesIcon,
  CheckCircle2 as CheckCircle2Icon,
  AlertTriangle as AlertTriangleIcon,
  ChevronRight as ChevronRightIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  Award as AwardIcon,
  Layers as LayersIcon,
  Building2 as Building2Icon,
  Percent,
  ArrowRightLeft as ArrowRightLeftIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// =============================================================================
// REAL ANALYTICS (S8-05 … S8-09) -> CHART MODELS
// =============================================================================

const FUNNEL_COLORS = ["#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#14B8A6"];
const SOURCE_COLORS = ["#0A66C2", "#10B981", "#1877F2", "#8B5CF6", "#F59E0B", "#EF4444", "#64748B"];
const TARGET_SLA_DAYS = 25; // committed time-to-hire target shown as the reference line

interface FunnelResp { total: number; stages: Array<{ stage: string; label: string; count: number; conversion_from_previous: number | null }>; biggest_drop: { from: string; to: string; lost: number } | null }
interface SourceRow { source: string; applications: number; passed_screening: number; hired: number; hire_rate: number }
interface Metrics { total_hires: number; avg_time_to_hire_days: number | null; cost_per_hire: number | null }
interface Overview {
  kpis: {
    active_requisitions: number;
    pending_approvals: number;
    total_applications: number;
    new_candidates_this_week: number;
    interviews_this_week?: number;
    pending_offers?: number;
    hired_count?: number;
    remaining_headcount?: number;
    budget_usage_percent?: number | null;
  };
  overdue_requisitions?: Array<{
    id: string;
    requisition_id: number;
    title: string;
    department: string;
    target_date: string;
    delay_days: number;
    recruiter: string | null;
    status: string;
  }>;
  hr_alerts?: {
    total_alerts: number;
    overdue_count: number;
    handover_count: number;
    headcount_warning_count: number;
    over_band_count: number;
    stuck_approval_count: number;
    items: {
      overdue: Array<{
        id: string;
        requisition_id: number;
        title: string;
        department: string;
        target_date: string;
        delay_days: number;
        recruiter: string | null;
        status: string;
      }>;
      handover: Array<{
        requisition_id: number;
        code: string;
        title: string;
        department: string;
        reason: string;
        priority: string;
        status: string;
      }>;
      headcount: Array<{
        department_id: number;
        department: string;
        budget: number;
        used: number;
        remaining: number;
        message: string;
      }>;
      over_band: Array<{
        offer_id: number;
        candidate_name: string;
        offered_salary: number;
        department: string;
        position: string;
        justification: string;
      }>;
      stuck_approvals: Array<{
        requisition_id: number;
        code: string;
        title: string;
        department: string;
        step: string;
        pending_days: number;
        message: string;
      }>;
    };
  };
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

async function loadDashboard(range: string, customStartDate?: string, customEndDate?: string) {
  const now = new Date();
  let from = new Date(now);
  let to = new Date(now);

  if (range === "custom" && customStartDate && customEndDate) {
    from = new Date(customStartDate);
    to = new Date(customEndDate);
  } else if (range === "30d") {
    from.setDate(now.getDate() - 30);
  } else if (range === "quarter") {
    from.setMonth(now.getMonth() - 3);
  } else {
    from.setFullYear(now.getFullYear() - 1);
  }
  const q = `date_from=${iso(from)}&date_to=${iso(to)}`;
  // last 10 months for the time-to-hire / cost-per-hire trend
  const months = Array.from({ length: 10 }, (_, k) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (9 - k), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { start, end, label: `T${start.getMonth() + 1}${k === 9 ? " (Nay)" : ""}` };
  });
  const [overview, funnel, sources, metrics, trend] = await Promise.all([
    apiRequest<Overview>("/analytics/overview"),
    apiRequest<FunnelResp>(`/analytics/funnel?${q}`),
    apiRequest<SourceRow[]>(`/analytics/sources?${q}`),
    apiRequest<Metrics>(`/analytics/hiring-metrics?${q}`),
    Promise.all(months.map((m) => apiRequest<Metrics>(`/analytics/hiring-metrics?date_from=${iso(m.start)}&date_to=${iso(m.end)}`)
      .then((r) => ({ month: m.label, timeToHire: r.avg_time_to_hire_days ?? 0, costPerHire: r.cost_per_hire ? Math.round(r.cost_per_hire / 100_000) / 10 : 0, targetSLA: TARGET_SLA_DAYS, hires: r.total_hires })))),
  ]);
  const totalApps = sources.reduce((n, r) => n + r.applications, 0) || 1;
  const FUNNEL_DATA = funnel.stages.map((st, i) => ({
    stage: st.label, count: st.count, conversionFromPrev: st.conversion_from_previous ?? 0,
    color: FUNNEL_COLORS[i % FUNNEL_COLORS.length], dropOff: i === 0 || st.conversion_from_previous == null ? 0 : Math.round((100 - st.conversion_from_previous) * 10) / 10,
  }));
  const SOURCE_PIE_DATA = sources.map((r, i) => ({
    name: r.source, value: r.applications, percentage: Math.round((r.applications / totalApps) * 100), color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));
  const SOURCE_EFFICIENCY_TABLE = sources.map((r) => {
    const cost = r.hired && metrics.cost_per_hire ? `${(metrics.cost_per_hire / 1_000_000).toFixed(1)} tr` : "—";
    return {
      source: r.source, applied: r.applications, interviewed: r.passed_screening, hired: r.hired, hireRate: `${r.hire_rate}%`,
      costPerHire: cost,
      roi: r.hire_rate >= 4 ? "Hiệu quả cao" : r.hire_rate >= 2 ? "Ổn định" : r.applications ? "Cần cải thiện chất lượng" : "Chưa có dữ liệu",
      badgeColor: r.hire_rate >= 4 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : r.hire_rate >= 2 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200",
    };
  });
  const hired = funnel.stages.find((x) => x.stage === "hired")?.count ?? 0;
  const overall = funnel.total ? Math.round((hired / funnel.total) * 10000) / 100 : 0;
  const withData = trend.filter((t) => t.hires > 0);
  const worst = withData.reduce<typeof withData[number] | null>((w, t) => (!w || t.timeToHire > w.timeToHire ? t : w), null);
  return { overview, funnel, FUNNEL_DATA, SOURCE_PIE_DATA, SOURCE_EFFICIENCY_TABLE, MONTHLY_TREND_DATA: trend, metrics, overall, worst, latest: withData[withData.length - 1] || null, from: iso(from), to: iso(to) };
}

export default function HRDashboardPage() {
  const nowStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const thirtyDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, []);

  const [timeRange, setTimeRange] = useState<"30d" | "quarter" | "year" | "custom">("30d");
  const [customFrom, setCustomFrom] = useState(thirtyDaysAgoStr);
  const [customTo, setCustomTo] = useState(nowStr);
  const [appliedCustomDates, setAppliedCustomDates] = useState<{ from: string; to: string } | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: dash, error, loading, reload } = useApiData(
    () =>
      loadDashboard(
        timeRange,
        timeRange === "custom" ? (appliedCustomDates?.from || customFrom) : undefined,
        timeRange === "custom" ? (appliedCustomDates?.to || customTo) : undefined
      ),
    [timeRange, appliedCustomDates]
  );
  const FUNNEL_DATA = dash?.FUNNEL_DATA || [];
  const SOURCE_PIE_DATA = dash?.SOURCE_PIE_DATA || [];
  const SOURCE_EFFICIENCY_TABLE = dash?.SOURCE_EFFICIENCY_TABLE || [];
  const MONTHLY_TREND_DATA = dash?.MONTHLY_TREND_DATA || [];
  const mounted = !!dash; // charts render on the client once the data is loaded


  const handleRefresh = () => {
    setIsRefreshing(true);
    reload();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Server-generated Excel (time-to-hire & cost-per-hire by department / job title) for the selected period
  const handleExportExcel = async () => {
    if (!dash || isExporting) return;
    setIsExporting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const filename = `Bao_Cao_Tuyen_Dung_${dash.from}_den_${dash.to}.xlsx`;
      const exportUrl = `${API_BASE_URL}/analytics/hiring-metrics?date_from=${dash.from}&date_to=${dash.to}&export=true`;

      const res = await fetch(exportUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Không thể tải báo cáo từ máy chủ.");
      }

      const disposition = res.headers.get("content-disposition") || "";
      let resolvedFilename = filename;
      const match = /filename\*?=['"]?(?:UTF-8'')?([^"';]+)['"]?/i.exec(disposition);
      if (match?.[1]) {
        resolvedFilename = decodeURIComponent(match[1]);
      }

      const buffer = await res.arrayBuffer();
      triggerFileDownload(buffer, resolvedFilename);
    } catch (err) {
      console.error("Export error:", err);
      alert("Đã xảy ra lỗi khi xuất báo cáo Excel. Vui lòng thử lại.");
    } finally {
      setTimeout(() => setIsExporting(false), 600);
    }
  };

  if (loading && !dash) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="w-full space-y-6">
      {/* ========================================================================= */}
      {/* HEADER SECTION: TIÊU ĐỀ & THANH CÔNG CỤ ĐIỀU HÀNH                        */}
      {/* ========================================================================= */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-100 shrink-0">
                Executive Control Center
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Cập nhật tự động theo thời gian thực (Live Analytics)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Báo Cáo & Điều Hành Tuyển Dụng Toàn Công Ty
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Tổng quan hiệu suất tuyển dụng, phân tích chuyển đổi phễu ứng viên, đo lường nguồn thu hút và phát hiện điểm nghẽn SLA.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-auto flex-nowrap">
            {/* Bộ lọc khoảng thời gian */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setTimeRange("30d")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  timeRange === "30d"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30 Ngày qua
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("quarter")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  timeRange === "quarter"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Quý {Math.floor(new Date().getMonth() / 3) + 1}/{new Date().getFullYear()}
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("year")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  timeRange === "year"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Năm {new Date().getFullYear()}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeRange("custom");
                  setAppliedCustomDates({ from: customFrom, to: customTo });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  timeRange === "custom"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Tùy chỉnh</span>
              </button>
            </div>

            {/* Nút Làm mới */}
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
              title="Làm mới dữ liệu"
            >
              <RefreshCwIcon
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>

            {/* Nút Xuất Excel */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
            >
              <FileSpreadsheetIcon className={`w-4 h-4 ${isExporting ? "animate-spin" : ""}`} />
              <span>{isExporting ? "Đang Xuất Excel..." : "Xuất Báo Cáo Excel"}</span>
            </button>
          </div>
        </div>

        {/* Thanh chọn ngày tùy chỉnh khi kích hoạt Tùy chỉnh */}
        {timeRange === "custom" && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-2.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Khoảng ngày tùy chỉnh:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500">Từ:</span>
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo || nowStr}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
                  />
                </div>
                <span className="text-slate-400 font-bold">→</span>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500">Đến:</span>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom}
                    max={nowStr}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (customFrom && customTo && customFrom <= customTo) {
                      setAppliedCustomDates({ from: customFrom, to: customTo });
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  Áp dụng
                </button>
              </div>
            </div>
            <div className="text-[11px] text-blue-700 font-medium">
              * Dữ liệu dashboard & file Excel xuất ra sẽ được lọc theo khoảng thời gian này
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* YÊU CẦU 1: OVERVIEW DASHBOARD (2 PHÚT MỖI SÁNG - 4 THẺ KPI NỔI BẬT)     */}
        {/* ===================================================================== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Khởi đầu ngày mới (2 phút nắm bắt toàn cục)
            </span>
            <span className="text-[11px] text-slate-400">
              Kỳ so sánh: Tháng trước
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Tổng YC đang mở */}
            <div className="bg-gradient-to-br from-white to-blue-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tổng YC Đang Mở</span>
                <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BriefcaseIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {dash?.overview.kpis.active_requisitions ?? 0} <span className="text-sm font-bold text-slate-400">vị trí</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  <span>{dash?.overview.kpis.pending_approvals ?? 0} yêu cầu đang chờ phê duyệt</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Tổng ứng viên mới */}
            <div className="bg-gradient-to-br from-white to-indigo-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tổng Ứng Viên Mới</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UsersIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {(dash?.funnel.total ?? 0).toLocaleString("vi-VN")} <span className="text-sm font-bold text-slate-400">hồ sơ</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  <span>+{dash?.overview.kpis.new_candidates_this_week ?? 0} hồ sơ trong 7 ngày qua</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Thời gian tuyển trung bình (Time-to-hire) */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Thời Gian Tuyển TB (Time-to-Hire)</span>
                <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-purple-700 tracking-tight">
                  {dash?.metrics.avg_time_to_hire_days ?? "—"} <span className="text-sm font-bold text-slate-400">ngày</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
                  <ArrowDownRightIcon className="w-3.5 h-3.5" />
                  <span>{dash?.metrics.total_hires ?? 0} lượt tuyển trong kỳ (SLA cam kết: {TARGET_SLA_DAYS} ngày)</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Chi phí trên mỗi lượt tuyển (Cost-per-hire) */}
            <div className="bg-gradient-to-br from-white to-emerald-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Chi Phí / Tuyển Dụng (Cost-per-Hire)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSignIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">
                  {dash?.metrics.cost_per_hire ? (dash.metrics.cost_per_hire / 1_000_000).toFixed(2) : "—"} <span className="text-sm font-bold text-slate-400">triệu VNĐ</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
                  <ArrowDownRightIcon className="w-3.5 h-3.5" />
                  <span>Theo chi phí tuyển dụng đã ghi nhận trong kỳ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TRUNG TÂM CẢNH BÁO HR & ĐIỂM NGHẼN TUYỂN DỤNG (HR ALERTS CENTER)      */}
        {/* ===================================================================== */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                <AlertTriangleIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
                    Trung Tâm Cảnh Báo & Rủi Ro Tuyển Dụng
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {dash?.overview.hr_alerts?.total_alerts || 0} Cảnh Báo Cần Xử Lý
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tự động phát hiện các vị trí trễ hạn SLA, vị trí cần bàn giao do Recruiter nghỉ/khoá tài khoản, vượt trần định biên và tắc nghẽn phê duyệt.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/hr/requisitions"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Điều phối Yêu cầu</span>
                <ArrowUpRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 5 Risk Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Card 1: Vị trí trễ hạn SLA */}
            <Link
              href="/hr/requisitions"
              className="p-3.5 rounded-2xl border bg-white border-rose-200 hover:border-rose-300 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between text-rose-600">
                <span className="text-[11px] font-bold">Trễ Hạn Tuyển Dụng</span>
                <ClockIcon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-1.5">
                {dash?.overview.hr_alerts?.overdue_count || 0}{" "}
                <span className="text-xs font-bold text-slate-400">vị trí</span>
              </div>
              <p className="text-[10px] text-rose-700 font-semibold mt-1">
                Quá ngày cần nhân sự
              </p>
            </Link>

            {/* Card 2: Cần bàn giao Recruiter */}
            <Link
              href="/hr/requisitions"
              className="p-3.5 rounded-2xl border bg-white border-amber-200 hover:border-amber-300 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-[11px] font-bold">Cần Bàn Giao (S1-10)</span>
                <UsersIcon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-1.5">
                {dash?.overview.hr_alerts?.handover_count || 0}{" "}
                <span className="text-xs font-bold text-slate-400">vị trí</span>
              </div>
              <p className="text-[10px] text-amber-800 font-semibold mt-1">
                Recruiter khoá / Chưa gán
              </p>
            </Link>

            {/* Card 3: Cảnh báo vượt định biên */}
            <Link
              href="/hr/requisitions"
              className="p-3.5 rounded-2xl border bg-white border-purple-200 hover:border-purple-300 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between text-purple-700">
                <span className="text-[11px] font-bold">Vượt Định Biên (S3-04)</span>
                <Building2Icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-1.5">
                {dash?.overview.hr_alerts?.headcount_warning_count || 0}{" "}
                <span className="text-xs font-bold text-slate-400">phòng ban</span>
              </div>
              <p className="text-[10px] text-purple-800 font-semibold mt-1">
                Cần HR xác nhận ghi đè
              </p>
            </Link>

            {/* Card 4: Offer vượt khung lương */}
            <Link
              href="/hr/offers"
              className="p-3.5 rounded-2xl border bg-white border-indigo-200 hover:border-indigo-300 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between text-indigo-700">
                <span className="text-[11px] font-bold">Offer Vượt Khung</span>
                <DollarSignIcon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-1.5">
                {dash?.overview.hr_alerts?.over_band_count || 0}{" "}
                <span className="text-xs font-bold text-slate-400">hồ sơ</span>
              </div>
              <p className="text-[10px] text-indigo-800 font-semibold mt-1">
                Leo thang cấp duyệt (S7-03)
              </p>
            </Link>

            {/* Card 5: Tắc nghẽn phê duyệt */}
            <Link
              href="/hr/approvals"
              className="p-3.5 rounded-2xl border bg-white border-blue-200 hover:border-blue-300 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-[11px] font-bold">Tắc Nghẽn Duyệt</span>
                <AlertTriangleIcon className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-1.5">
                {dash?.overview.hr_alerts?.stuck_approval_count || 0}{" "}
                <span className="text-xs font-bold text-slate-400">tờ trình</span>
              </div>
              <p className="text-[10px] text-blue-800 font-semibold mt-1">
                Kẹt &gt; 3 ngày SLA
              </p>
            </Link>
          </div>

          {/* Bảng Xếp Hạng Vị Trí Tuyển Dụng Trễ Hạn Tuyển (S8-05 AC3, S3-08) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">
                  Bảng Xếp Hạng Vị Trí Tuyển Dụng Trễ Hạn (S8-05 AC3)
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  (Sắp xếp theo số ngày chậm tiến độ giảm dần)
                </span>
              </div>
              <span className="text-xs font-bold text-rose-700">
                {(dash?.overview.overdue_requisitions || []).length} vị trí quá hạn
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4 w-40">Mã REQ & Chức danh</th>
                    <th className="py-3 px-3">Phòng ban</th>
                    <th className="py-3 px-3">Hạn cần nhân sự</th>
                    <th className="py-3 px-3">Mức độ trễ hạn SLA</th>
                    <th className="py-3 px-3">Recruiter phụ trách</th>
                    <th className="py-3 px-4 text-right w-36">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium">
                  {(!dash?.overview.overdue_requisitions || dash.overview.overdue_requisitions.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        🎉 Tuyệt vời! Hiện không có vị trí tuyển dụng nào bị quá hạn SLA.
                      </td>
                    </tr>
                  ) : (
                    dash.overview.overdue_requisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold text-[10px] mr-1.5">
                            {req.id}
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {req.title}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {req.department || "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-bold">
                          {req.target_date}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
                            <ClockIcon className="w-3 h-3 text-rose-600" />
                            <span>Trễ {req.delay_days} ngày</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-bold">
                          {req.recruiter ? `👤 ${req.recruiter}` : <span className="text-amber-700 font-bold">⚠️ Chưa có</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/hr/requisitions"
                            className="px-3 py-1 bg-white hover:bg-slate-50 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 inline-flex items-center gap-1 shadow-2xs"
                          >
                            <span>Xử lý & Bàn giao</span>
                            <ArrowRightLeftIcon className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* YÊU CẦU 2 & 3: PHỄU TUYỂN DỤNG & HIỆU QUẢ NGUỒN ỨNG VIÊN                 */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (6/12): BÁO CÁO PHỄU TUYỂN DỤNG (RECRUITMENT FUNNEL) */}
          <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Conversion Analytics
                </span>
                <h2 className="text-sm md:text-base font-black text-slate-900 mt-1">
                  Báo Cáo Phễu Tuyển Dụng (Recruitment Funnel)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tỷ lệ rơi rụng (Drop-off) & tỷ lệ chuyển đổi giữa 5 giai đoạn chính
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">Tỷ lệ trúng tuyển toàn phễu</span>
                <span className="text-base font-black text-emerald-600">{dash?.overall ?? 0}%</span>
              </div>
            </div>

            {/* Horizontal Bar Visual Funnel */}
            <div className="space-y-3.5">
              {FUNNEL_DATA.map((step, idx) => {
                const widthPercent = FUNNEL_DATA[0].count ? (step.count / FUNNEL_DATA[0].count) * 100 : 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        <span>{step.stage}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-extrabold">{step.count.toLocaleString()}</span>
                        {idx > 0 && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-bold">
                            {step.conversionFromPrev}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Funnel Progress Bar with Dropoff Indicator */}
                    <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5 flex">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: step.color,
                        }}
                      />
                    </div>

                    {idx > 0 && (
                      <div className="text-[10px] text-slate-400 text-right pr-1">
                        Rơi rụng so với bước trước: <strong className="text-slate-600">{step.dropOff}%</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Funnel Metrics Summary Box */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between font-bold">
                <span>Điểm thắt cổ chai lớn nhất:</span>
                <span className="text-purple-700">
                  {dash?.funnel.biggest_drop ? `${dash.funnel.biggest_drop.from} → ${dash.funnel.biggest_drop.to} (mất ${dash.funnel.biggest_drop.lost} hồ sơ)` : "Chưa đủ dữ liệu"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Số liệu tính trên các hồ sơ nộp từ {dash?.from} đến {dash?.to}.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI (6/12): BÁO CÁO HIỆU QUẢ NGUỒN (SOURCE OF HIRE) */}
          <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Channel Attribution
                </span>
                <h2 className="text-sm md:text-base font-black text-slate-900 mt-1">
                  Báo Cáo Hiệu Quả Nguồn Ứng Viên (Source of Hire)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tỷ trọng ứng viên theo kênh tiếp cận & hiệu quả chuyển đổi thành nhân sự nhận việc
                </p>
              </div>
            </div>

            {/* Donut Pie Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              {!mounted ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  Đang tải biểu đồ nguồn tuyển dụng...
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={SOURCE_PIE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {SOURCE_PIE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name, item) => [
                          `${val} CV (${(item.payload as { percentage?: number } | undefined)?.percentage ?? 0}%)`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(val: string) => (
                          <span className="text-[11px] font-bold text-slate-700 mr-2">
                            {val}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bảng nhỏ phân tích nguồn mang lại ứng viên nhận việc nhiều nhất */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="p-2.5 bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                Bảng phân tích chi phí & tỷ lệ tuyển thành công theo kênh:
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3">Kênh tuyển dụng</th>
                      <th className="py-2.5 px-2 text-center">CV</th>
                      <th className="py-2.5 px-2 text-center">Đã tuyển</th>
                      <th className="py-2.5 px-2 text-right">Chi phí / Hire</th>
                      <th className="py-2.5 px-3 text-right">Đánh giá ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {SOURCE_EFFICIENCY_TABLE.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-800">
                          {row.source}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600 font-mono">
                          {row.applied}
                        </td>
                        <td className="py-2 px-2 text-center font-extrabold text-emerald-600 font-mono">
                          {row.hired}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                          {row.costPerHire}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${row.badgeColor}`}>
                            {row.roi}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* YÊU CẦU 4: BÁO CÁO CHI PHÍ & THỜI GIAN TUYỂN DỤNG (LINE / AREA CHART)    */}
        {/* ===================================================================== */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                Time-to-Hire & Cost Trends
              </span>
              <h2 className="text-sm md:text-base font-black text-slate-900 mt-1">
                Báo Cáo Xu Hướng Thời Gian Tuyển & Chi Phí (T1 - T10/2026)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Theo dõi biến động số ngày lấp đầy vị trí và chi phí trung bình để phát hiện các tháng có điểm nghẽn quy trình
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-700">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span>Thời gian tuyển (ngày)</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Chi phí / Hire (Triệu ₫)</span>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            {!mounted ? (
              <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                Đang tải biểu đồ xu hướng...
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={MONTHLY_TREND_DATA}
                    margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: "bold" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    {/* Trục trái: Thời gian tuyển (ngày) */}
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "#3b82f6", fontSize: 11, fontWeight: "bold" }}
                      domain={[15, 35]}
                      unit=" ngày"
                      axisLine={false}
                      tickLine={false}
                    />
                    {/* Trục phải: Chi phí (Triệu VNĐ) */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "#10b981", fontSize: 11, fontWeight: "bold" }}
                      domain={[4, 12]}
                      unit=" tr"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                      formatter={(val, name) => {
                        if (name === "timeToHire") return [`${val} ngày`, "Thời gian tuyển TB"];
                        if (name === "costPerHire") return [`${val} triệu VNĐ`, "Chi phí / Hire"];
                        return [val, name];
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: 10 }}
                      formatter={(val: string) => {
                        if (val === "timeToHire") return "Thời gian tuyển (Trục trái)";
                        if (val === "costPerHire") return "Chi phí / Hire (Trục phải)";
                        return val;
                      }}
                    />

                    {/* Đường Thời gian tuyển */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="timeToHire"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#ffffff", stroke: "#3b82f6", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
                    />

                    {/* Đường Chi phí tuyển */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="costPerHire"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Phân tích điểm nghẽn SLA từ AI / Giám sát hệ thống */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1.5 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Phân tích điểm nghẽn tự động:</span>
            </div>
            <p className="leading-relaxed">
              {dash?.worst ? (
                <>
                  Thời gian tuyển cao nhất trong 10 tháng gần đây: <strong className="text-amber-900">{dash.worst.timeToHire} ngày</strong> ({dash.worst.month}
                  {dash.worst.timeToHire > TARGET_SLA_DAYS ? `, vượt mục tiêu ${TARGET_SLA_DAYS} ngày` : ", trong mục tiêu"}). Tháng gần nhất có tuyển dụng ({dash.latest?.month}):{" "}
                  <strong className="text-emerald-700 font-bold">{dash.latest?.timeToHire} ngày</strong>.
                </>
              ) : (
                <>Chưa có lượt tuyển nào hoàn tất trong 10 tháng gần đây để phân tích thời gian tuyển.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
