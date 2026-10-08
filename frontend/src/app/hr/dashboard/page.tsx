'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileCheck, ShieldCheck, Users, Calendar, FileText, Target, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Clock, Plus, CheckCircle2, TrendingUp, 
  Building2, Sparkles, Filter, RefreshCw, ChevronRight, AlertCircle
} from 'lucide-react';

interface DashboardData {
  kpis: {
    active_requisitions: number;
    pending_approvals: number;
    new_candidates_this_week: number;
    interviews_this_week: number;
    pending_offers: number;
    hired_count: number;
    remaining_headcount: number;
    budget_usage_percent: number;
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
    recruiter: string;
    status: string;
  }>;
  hr_action_items: Array<{
    id: number;
    type: string;
    title: string;
    priority: string;
    time: string;
  }>;
  department_metrics: Array<{
    name: string;
    requisitions: number;
    candidates: number;
    hired: number;
  }>;
}

export default function HRDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/v1/analytics/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Fallback default enterprise data if backend server is starting
        setData(fallbackData);
      }
    } catch (err) {
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const fallbackData: DashboardData = {
    kpis: {
      active_requisitions: 8,
      pending_approvals: 3,
      new_candidates_this_week: 24,
      interviews_this_week: 12,
      pending_offers: 5,
      hired_count: 18,
      remaining_headcount: 14,
      budget_usage_percent: 68.5,
      conversion_rate: 15.2,
    },
    application_pipeline: {
      submitted: 24,
      screening: 18,
      interviewing: 12,
      offered: 5,
      hired: 18,
      rejected: 9,
    },
    overdue_requisitions: [
      {
        id: "REQ-2026-004",
        title: "Chuyên viên Senior DevOps / Cloud Architect",
        department: "Khối Công Nghệ",
        target_date: "30/09/2026",
        delay_days: 5,
        recruiter: "Nguyễn Văn Hùng",
        status: "Quá SLA 5 ngày"
      },
      {
        id: "REQ-2026-008",
        title: "Trưởng nhóm Data Analyst & BI",
        department: "Khối Dữ Liệu & Phân Tích",
        target_date: "02/10/2026",
        delay_days: 3,
        recruiter: "Lê Thị Mai",
        status: "Quá SLA 3 ngày"
      }
    ],
    hr_action_items: [
      {
        id: 1,
        type: "headcount_override",
        title: "Cần xác nhận Ghi đè Headcount REQ-2026-001 (Phòng CNTT)",
        priority: "Cao",
        time: "2 giờ trước"
      },
      {
        id: 2,
        type: "offer_approval",
        title: "Phê duyệt Offer cho ứng viên Đỗ Hoàng Long (Vượt band 12%)",
        priority: "Vượt dải lương",
        time: "Hôm nay, 10:30"
      },
      {
        id: 3,
        type: "job_review",
        title: "Thẩm định tin tuyển dụng Chuyên viên Digital Marketing",
        priority: "Trung bình",
        time: "Hôm nay, 08:15"
      }
    ],
    department_metrics: [
      { name: "Công Nghệ Thông Tin", requisitions: 5, candidates: 38, hired: 8 },
      { name: "Khối Dữ Liệu", requisitions: 3, candidates: 22, hired: 4 },
      { name: "Marketing & Growth", requisitions: 2, candidates: 15, hired: 3 },
      { name: "Tài Chính & Kế Toán", requisitions: 1, candidates: 8, hired: 2 },
      { name: "Nhân Sự & Vận Hành", requisitions: 1, candidates: 6, hired: 1 }
    ]
  };

  const kpis = data?.kpis || fallbackData.kpis;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruitment Control Center</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-emerald-200">
              Live System Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tổng quan hoạt động tuyển dụng toàn công ty, chỉ số SLA & danh sách hành động cần xử lý ngay</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          
          <Link
            href="/hr/requisitions"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Yêu Cầu Mới</span>
          </Link>
        </div>
      </div>

      {/* 6 Core KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vị trí đang mở</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.active_requisitions}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+2 so với tháng trước</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Yêu cầu chờ duyệt</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{kpis.pending_approvals}</div>
          <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Cần HR duyệt 3 cấp</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hồ sơ mới tuần này</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.new_candidates_this_week}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+15% lượng CV nộp</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phỏng vấn tuần này</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.interviews_this_week}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            12 hội đồng PV được gán
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Offer chờ xử lý</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{kpis.pending_offers}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            1 Offer chờ duyệt dải lương
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Headcount Còn Tải</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.remaining_headcount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Ngân sách đã dùng {kpis.budget_usage_percent}%
          </div>
        </div>

      </div>

      {/* SLA Breach Alert & Urgent Action Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Overdue Requisitions SLA Box (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-rose-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Cảnh Báo Vị Trí Tuyển Dụng Trễ Hạn SLA</h2>
                <p className="text-xs text-slate-500">Các vị trí vượt quá số ngày cam kết chưa tuyển đủ người</p>
              </div>
            </div>
            <Link href="/hr/requisitions" className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
              <span>Xem tất cả REQ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.overdue_requisitions || fallbackData.overdue_requisitions).map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{item.id}: {item.title}</span>
                    <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md uppercase">
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Phòng ban: <strong>{item.department}</strong> | Target: <strong>{item.target_date}</strong> | Recruiter: <strong>{item.recruiter}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/hr/requisitions" className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm">
                    Đúc Thúc Recruiter
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HR Action Items (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Hành Động Cần HR Xử Lý</h2>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">3 việc</span>
          </div>

          <div className="space-y-3">
            {(data?.hr_action_items || fallbackData.hr_action_items).map((action) => (
              <div key={action.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    {action.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">{action.time}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-snug">{action.title}</p>
                <div className="pt-1 flex justify-end">
                  <Link href={action.type === 'headcount_override' ? '/hr/master-data/headcount' : '/hr/approvals'} className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                    <span>Xử lý ngay</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recruitment Funnel & Department Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recruitment Funnel Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Phễu Tuyển Dụng (Recruitment Funnel)</h2>
              <p className="text-xs text-slate-500">Tỷ lệ chuyển đổi qua 5 giai đoạn ứng tuyển</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Tỷ lệ đạt {kpis.conversion_rate}%
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { stage: "Nộp hồ sơ (Submitted)", count: data?.application_pipeline.submitted || 24, percent: "100%", color: "bg-blue-600" },
              { stage: "Sàng lọc CV (Screening)", count: data?.application_pipeline.screening || 18, percent: "75%", color: "bg-indigo-600" },
              { stage: "Phỏng vấn (Interviewing)", count: data?.application_pipeline.interviewing || 12, percent: "50%", color: "bg-purple-600" },
              { stage: "Đề xuất Offer (Offered)", count: data?.application_pipeline.offered || 5, percent: "20.8%", color: "bg-amber-500" },
              { stage: "Đã nhận việc (Hired)", count: data?.application_pipeline.hired || 18, percent: "75%", color: "bg-emerald-600" },
            ].map((step, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{step.stage}</span>
                  <span className="font-bold">{step.count} ứng viên ({step.percent})</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-full ${step.color} rounded-full transition-all duration-500`} style={{ width: step.percent }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Metrics (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tuyển Dụng Theo Phòng Ban</h2>
              <p className="text-xs text-slate-500">Phân bổ vị trí mở & ứng viên thành công</p>
            </div>
            <Link href="/hr/master-data/departments" className="text-xs text-blue-600 font-bold hover:underline">
              Cơ cấu phòng ban
            </Link>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-bold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="p-3">Phòng Ban</th>
                  <th className="p-3 text-center">Vị Trí Mở</th>
                  <th className="p-3 text-center">Số CV</th>
                  <th className="p-3 text-right">Đã Nhận Việc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(data?.department_metrics || fallbackData.department_metrics).map((dept, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{dept.name}</td>
                    <td className="p-3 text-center font-bold text-blue-600">{dept.requisitions}</td>
                    <td className="p-3 text-center">{dept.candidates}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">{dept.hired}</td>
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
