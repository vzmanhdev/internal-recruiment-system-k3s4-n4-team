'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileCheck, ShieldCheck, Users, Calendar, FileText, Target, AlertTriangle, 
  ArrowUpRight, Clock, Plus, RefreshCw, ChevronRight, Sparkles, Building2,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import RecruitmentComboChart from '@/components/RecruitmentComboChart';
import { apiRequest, ApiError } from '@/lib/api-client';


interface DashboardData {
  kpis: {
    active_requisitions: number;
    pending_approvals: number;
    new_candidates_this_week: number;
    interviews_this_week: number;
    pending_offers: number;
    hired_count: number;
    remaining_headcount: number;
    budget_usage_percent: number | null;
    conversion_rate: number;
  };
  application_pipeline: {
    submitted: number;
    screening: number;
    interviewing: number;
    offered: number;
    hired: number;
    rejected: number;
  };
  overdue_requisitions: Array<{
    id: string;
    title: string;
    department: string;
    target_date: string;
    delay_days: number;
    recruiter: string | null;
    status: string;
  }>;
  hr_action_items: Array<{
    id: number | string;
    type: string;
    title: string;
    priority: string;
    time: string;
  }>;
  weekly_applications?: Array<{ week_start: string; applications: number; closed_positions: number }>;
  department_metrics: Array<{
    name: string;
    requisitions: number;
    candidates: number;
    hired: number;
  }>;
}

export default function HRDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setData(await apiRequest<DashboardData>('/analytics/overview'));
    } catch (err) {
      // Never substitute fabricated numbers: show the failure and keep the last real data (if any).
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const emptyData: DashboardData = {
    kpis: {
      active_requisitions: 0, pending_approvals: 0, new_candidates_this_week: 0, interviews_this_week: 0,
      pending_offers: 0, hired_count: 0, remaining_headcount: 0, budget_usage_percent: null, conversion_rate: 0,
    },
    application_pipeline: { submitted: 0, screening: 0, interviewing: 0, offered: 0, hired: 0, rejected: 0 },
    overdue_requisitions: [],
    hr_action_items: [],
    department_metrics: [],
  };

  const kpis = data?.kpis ?? emptyData.kpis;

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "Cao":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "Vượt dải lương":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200/80";
    }
  };

  return (
    <div className="space-y-8">
      {loadError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4" /> {loadError}
        </div>
      )}
      {/* ========================================================================= */}
      {/* 1. TOP HEADER WITH PRIMARY GLOW & GHOST ACTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-slate-200/80 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Recruitment Control Center
            </h1>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase border border-emerald-200/80 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {loadError ? 'Dữ liệu chưa tải được' : 'Dữ liệu thời gian thực'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Tổng quan hoạt động tuyển dụng toàn công ty, chỉ số SLA & danh sách hành động cần xử lý ngay
          </p>
        </div>

        {/* Action Buttons: Ghost Button (Refresh) + Primary Glow (+ Tạo Yêu Cầu Mới) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Ghost Refresh Button with 180deg hover rotation */}
          <button 
            type="button"
            onClick={fetchDashboardData}
            className="group flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-semibold shadow-xs hover:border-slate-300 active:scale-95 transition-all cursor-pointer"
            title="Làm mới dữ liệu Dashboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900 transition-transform duration-500 group-hover:rotate-180 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Làm mới</span>
          </button>
          
          {/* Primary Glow Button */}
          <Link
            href="/hr/requisitions"
            className="relative group overflow-hidden flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
            <span>+ Tạo Yêu Cầu Mới</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 6 CORE KPI STAT CARDS (RESPONSIVE GRID & UIVERSE HOVER TOUCH) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        
        {/* KPI 1: Vị trí đang mở */}
        <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-300/80 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vị trí đang mở</span>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{kpis.active_requisitions}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+2 so với tháng trước</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Yêu cầu chờ duyệt */}
        <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-amber-900/5 hover:border-amber-300/80 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Yêu cầu chờ duyệt</span>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-600 tracking-tight">{kpis.pending_approvals}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-semibold mt-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Cần HR duyệt 3 cấp</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Hồ sơ mới tuần này */}
        <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-900/5 hover:border-indigo-300/80 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hồ sơ mới tuần</span>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{kpis.new_candidates_this_week}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+15% lượng CV nộp</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Phỏng vấn tuần này */}
        <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-900/5 hover:border-purple-300/80 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phỏng vấn tuần</span>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{kpis.interviews_this_week}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1.5">
              12 hội đồng PV được gán
            </div>
          </div>
        </div>

        {/* KPI 5: Offer chờ xử lý */}
        <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-300/80 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Offer chờ xử lý</span>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{kpis.pending_offers}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1.5">
              1 Offer chờ duyệt dải lương
            </div>
          </div>
        </div>

        {/* KPI 6: Headcount Còn Tải */}
        <div className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:-translate-y-1.5 hover:shadow-xl hover:shadow-rose-900/5 hover:border-rose-300/80 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Headcount Còn Tải</span>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{kpis.remaining_headcount}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1.5">
              {kpis.budget_usage_percent === null ? 'Chưa khai báo ngân sách headcount' : `Đã dùng ${kpis.budget_usage_percent}% ngân sách`}
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. RECRUITMENT VELOCITY COMBO CHART (COMPOSED CHART: BAR + LINE)          */}
      {/* ========================================================================= */}
      <RecruitmentComboChart weekly={data?.weekly_applications ?? []} />

      {/* ========================================================================= */}
      {/* 4. SLA BREACH ALERT (SOFT DANGER UI) & HR ACTION ITEMS (STACKED CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Overdue Requisitions SLA Box (8 cols) - Soft Danger Neumorphism */}
        <div className="lg:col-span-8 bg-white/95 rounded-3xl border border-rose-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-rose-900/5 transition-all duration-300 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Cảnh Báo Vị Trí Tuyển Dụng Trễ Hạn SLA
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase tracking-wider">
                    Cảnh Báo
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Các vị trí vượt quá số ngày cam kết chuẩn (SLA) mà chưa hoàn tất tuyển dụng
                </p>
              </div>
            </div>

            <Link 
              href="/hr/requisitions" 
              className="text-xs text-blue-600 font-bold hover:text-blue-700 hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Xem tất cả REQ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* List of Overdue Requisitions */}
          <div className="space-y-3.5">
            {(data?.overdue_requisitions ?? emptyData.overdue_requisitions).map((item) => (
              <div 
                key={item.id} 
                className="p-4 sm:p-5 rounded-2xl bg-rose-50/40 backdrop-blur-xs border border-rose-200/60 shadow-xs hover:border-rose-300 hover:shadow-md hover:shadow-rose-500/5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                      {item.id}: {item.title}
                    </span>
                    <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Phòng ban: <strong className="text-slate-800">{item.department}</strong></span>
                    <span>•</span>
                    <span>Hạn chót: <strong className="text-slate-800">{item.target_date}</strong></span>
                    <span>•</span>
                    <span>Recruiter phụ trách: <strong className="text-blue-700">{item.recruiter}</strong></span>
                  </div>
                </div>

                {/* Uiverse Glowing Button: "Đốc Thúc Recruiter" */}
                <div className="flex items-center shrink-0">
                  <Link 
                    href="/hr/requisitions" 
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/30 hover:shadow-[0_0_15px_rgba(225,29,72,0.4)] active:scale-95 transition-all duration-200 text-center cursor-pointer"
                  >
                    Đốc Thúc Recruiter
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HR Action Items (4 cols) - Stacked Cards with Hover Slide Effect */}
        <div className="lg:col-span-4 bg-white/95 rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Hành Động Cần HR Xử Lý
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Nhiệm vụ cần phê duyệt & thẩm định</p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-blue-200/60 shadow-xs">
                3 việc
              </span>
            </div>

            {/* Stacked Cards List */}
            <div className="space-y-3">
              {(data?.hr_action_items ?? emptyData.hr_action_items).map((action) => (
                <div 
                  key={action.id} 
                  className="group p-4 rounded-2xl border border-slate-200/70 bg-white hover:bg-slate-50/80 hover:border-blue-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    {/* Pill Badge with Opacity / Elegant Styling */}
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-xs ${getPriorityBadgeClass(action.priority)}`}>
                      {action.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{action.time}</span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-blue-900 transition-colors">
                    {action.title}
                  </p>

                  <div className="pt-1.5 flex justify-end">
                    <Link 
                      href={action.type === 'headcount_override' ? '/hr/master-data/headcount' : '/hr/approvals'} 
                      className="text-[11px] font-extrabold text-blue-600 group-hover:text-blue-700 flex items-center gap-0.5 group-hover:underline"
                    >
                      <span>Xử lý ngay</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link 
              href="/hr/approvals" 
              className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
            >
              <span>Xem toàn bộ hàng đợi phê duyệt</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. RECRUITMENT FUNNEL & DEPARTMENT METRICS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recruitment Funnel Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white/95 rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Phễu Tuyển Dụng (Recruitment Funnel)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Tỷ lệ chuyển đổi qua 5 giai đoạn ứng tuyển
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 shadow-xs">
              Tỷ lệ đạt {kpis.conversion_rate}%
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {(() => {
              // Funnel built only from real pipeline counts; percentages are relative to all applications.
              const p = data?.application_pipeline ?? emptyData.application_pipeline;
              const total = Object.values(p).reduce((a, b) => a + b, 0);
              const pct = (n: number) => (total ? `${Math.round((n / total) * 1000) / 10}%` : '0%');
              return [
                { stage: "Nộp hồ sơ (Submitted)", count: p.submitted, percent: pct(p.submitted), color: "bg-blue-600" },
                { stage: "Sàng lọc CV (Screening)", count: p.screening, percent: pct(p.screening), color: "bg-indigo-600" },
                { stage: "Phỏng vấn (Interviewing)", count: p.interviewing, percent: pct(p.interviewing), color: "bg-purple-600" },
                { stage: "Đề xuất Offer (Offered)", count: p.offered, percent: pct(p.offered), color: "bg-amber-500" },
                { stage: "Đã nhận việc (Hired)", count: p.hired, percent: pct(p.hired), color: "bg-emerald-600" },
              ];
            })()
            .map((step, idx) => (
              <div key={idx} className="space-y-1.5 group">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="group-hover:text-blue-600 transition-colors">{step.stage}</span>
                  <span className="font-extrabold text-slate-900">{step.count} ứng viên ({step.percent})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                  <div 
                    className={`h-full ${step.color} rounded-full transition-all duration-500 shadow-xs`} 
                    style={{ width: step.percent }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Metrics (6 cols) */}
        <div className="lg:col-span-6 bg-white/95 rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Tuyển Dụng Theo Phòng Ban
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Phân bổ vị trí mở & ứng viên thành công
              </p>
            </div>
            <Link 
              href="/hr/master-data/departments" 
              className="text-xs text-blue-600 font-bold hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              <span>Cơ cấu phòng ban</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border border-slate-200/70 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/90 font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="p-3.5">Phòng Ban</th>
                  <th className="p-3.5 text-center">Vị Trí Mở</th>
                  <th className="p-3.5 text-center">Số CV</th>
                  <th className="p-3.5 text-right">Đã Nhận Việc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(data?.department_metrics ?? emptyData.department_metrics).map((dept, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dept.name}</span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-blue-600">{dept.requisitions}</td>
                    <td className="p-3.5 text-center font-semibold text-slate-700">{dept.candidates}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-600">{dept.hired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
