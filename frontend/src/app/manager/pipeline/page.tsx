'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import {
  Filter,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Download,
  Share2,
  Copy,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import clsx from 'clsx';

interface FunnelStage {
  id: string;
  name: string;
  count: number;
  conversionRate: string;
  slaRole: string;
  badgeColor: string;
  description: string;
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: 'applied',
    name: '1. Tiếp Nhận CV',
    count: 240,
    conversionRate: '100%',
    slaRole: 'HR Sàng lọc ban đầu',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Từ Cổng nội bộ & Giới thiệu nhân viên',
  },
  {
    id: 'screened',
    name: '2. Đạt Sàng Lọc',
    count: 45,
    conversionRate: '18.8%',
    slaRole: 'HR kiểm tra kinh nghiệm',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'CV phù hợp bộ tiêu chuẩn chuyên môn',
  },
  {
    id: 'interviewed',
    name: '3. Phỏng Vấn Kỹ Thuật',
    count: 18,
    conversionRate: '40.0%',
    slaRole: 'Hiring Manager chấm điểm',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Trưởng bộ phận trực tiếp phỏng vấn',
  },
  {
    id: 'offered',
    name: '4. Đề Xuất Offer',
    count: 6,
    conversionRate: '33.3%',
    slaRole: 'Phê duyệt 4 cấp ngân sách',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Đã phát hành thư mời làm việc',
  },
  {
    id: 'hired',
    name: '5. Nhận Việc (Onboard)',
    count: 4,
    conversionRate: '66.7%',
    slaRole: 'Đã hoàn tất chỉ tiêu',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Ứng viên đã chính thức nhận việc',
  },
];

interface PositionPipelineItem {
  id: string;
  title: string;
  department: string;
  targetCount: number;
  hiredCount: number;
  appliedCount: number;
  interviewingCount: number;
  offeredCount: number;
  deadline: string;
  status: 'FULL' | 'IN_PROGRESS';
}

const POSITION_PIPELINES: PositionPipelineItem[] = [
  {
    id: 'REQ-2026-001',
    title: 'Senior Frontend Engineer (React/Next.js)',
    department: 'Khối Công Nghệ',
    targetCount: 2,
    hiredCount: 2,
    appliedCount: 85,
    interviewingCount: 6,
    offeredCount: 2,
    deadline: '28/02/2026',
    status: 'FULL',
  },
  {
    id: 'REQ-2026-003',
    title: 'Senior Backend Engineer (Golang/FastAPI)',
    department: 'Khối Công Nghệ',
    targetCount: 4,
    hiredCount: 3,
    appliedCount: 110,
    interviewingCount: 8,
    offeredCount: 1,
    deadline: '15/03/2026',
    status: 'IN_PROGRESS',
  },
  {
    id: 'REQ-2026-004',
    title: 'Chuyên viên Thiết Kế Trải Nghiệm (UI/UX Designer)',
    department: 'Khối Công Nghệ',
    targetCount: 1,
    hiredCount: 1,
    appliedCount: 28,
    interviewingCount: 2,
    offeredCount: 1,
    deadline: '05/03/2026',
    status: 'FULL',
  },
  {
    id: 'REQ-2026-005',
    title: 'QA Automation Engineer Lead',
    department: 'Khối Công Nghệ',
    targetCount: 1,
    hiredCount: 0,
    appliedCount: 17,
    interviewingCount: 2,
    offeredCount: 0,
    deadline: '25/03/2026',
    status: 'IN_PROGRESS',
  },
];

export default function PipelinePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalTarget = POSITION_PIPELINES.reduce((acc, p) => acc + p.targetCount, 0);
  const totalHired = POSITION_PIPELINES.reduce((acc, p) => acc + p.hiredCount, 0);
  const overallPercentage = Math.round((totalHired / totalTarget) * 100);

  // Pagination State (20 items per page)
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(POSITION_PIPELINES.length / ITEMS_PER_PAGE));

  const paginatedPositions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return POSITION_PIPELINES.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage]);

  const handleCopyReport = () => {
    const reportText = `[BÁO CÁO TIẾN ĐỘ TUYỂN DỤNG KHỐI CÔNG NGHỆ]\n• Tổng chỉ tiêu: ${totalTarget} nhân sự\n• Đã tuyển đạt: ${totalHired}/${totalTarget} (${overallPercentage}%)\n• Phễu ứng viên: 240 CV Nộp -> 45 Sàng lọc -> 18 Phỏng vấn -> 6 Offer -> 4 Onboard.\n• Chi tiết xem tại hệ thống Enterprise ATS.`;
    navigator.clipboard.writeText(reportText);
    setToastMessage('Đã sao chép tóm tắt báo cáo tuyển dụng vào bộ nhớ tạm để gửi sếp!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
              Recruitment Funnel Analytics
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Tiến Độ Phễu Tuyển Dụng (Pipeline Funnel)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tỷ lệ chuyển đổi từng giai đoạn và tiến độ hoàn thành chỉ tiêu định biên nhân sự.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Copy className="w-4 h-4" />
            <span>Sao Chép Tóm Tắt Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Overall Progress Bar Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tổng Quan Tỷ Lệ Hoàn Thành Chỉ Tiêu Headcount
            </h2>
            <p className="text-xs text-slate-500">
              Kế hoạch định biên tuyển dụng quý 1/2026 của Khối Công Nghệ & Phần Mềm
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-blue-600">{overallPercentage}%</span>
            <span className="text-xs text-slate-400 font-medium block">
              Đã tuyển {totalHired}/{totalTarget} nhân sự
            </span>
          </div>
        </div>

        {/* Multi-step visual bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-700 shadow-xs"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Chỉ tiêu mở</span>
            <strong className="text-slate-900 text-sm">{totalTarget} Vị trí</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Đã chốt tuyển</span>
            <strong className="text-emerald-600 text-sm">{totalHired} Nhân sự</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Thời gian tuyển TB</span>
            <strong className="text-blue-600 text-sm">18.5 ngày</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Độ trễ SLA</span>
            <strong className="text-emerald-600 text-sm">Vượt 2.5 ngày</strong>
          </div>
        </div>
      </div>

      {/* CONNECTED RECRUITMENT PIPELINE FUNNEL (Horizontal Connected Cards) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Phễu Tuyển Dụng Tổng Thể (Recruitment Pipeline Funnel)</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Toàn bộ 4 vị trí đang tuyển</span>
        </div>

        {/* 5 Connected Funnel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {FUNNEL_STAGES.map((stage, idx) => (
            <div
              key={stage.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/40 hover:border-blue-300 transition-all space-y-2 relative group"
            >
              {/* Arrow Connector Indicator for desktop */}
              {idx < FUNNEL_STAGES.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {stage.name}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{stage.count}</span>
                <span className="text-xs font-bold text-blue-600">({stage.conversionRate})</span>
              </div>

              <p className="text-[11px] text-slate-500 line-clamp-1">{stage.description}</p>

              <div className="pt-2 border-t border-slate-200/60">
                <span
                  className={clsx(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full border block truncate text-center',
                    stage.badgeColor
                  )}
                >
                  {stage.slaRole}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED POSITIONS BREAKDOWN TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Tiến Độ Phễu Theo Từng Vị Trí Cụ Thể</span>
          </h2>
          <Link
            href="/manager/requisitions"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Quản lý tờ trình</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Vị trí & Mã tờ trình</th>
                <th className="py-3 px-4 text-center">Tiếp nhận CV</th>
                <th className="py-3 px-4 text-center">Đang phỏng vấn</th>
                <th className="py-3 px-4 text-center">Đã Offer</th>
                <th className="py-3 px-4 text-center">Chỉ tiêu đạt</th>
                <th className="py-3 px-4 text-center">Tiến độ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPositions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Không tìm thấy vị trí tuyển dụng nào.
                  </td>
                </tr>
              ) : (
                paginatedPositions.map((pos) => {
                  const percent = Math.round((pos.hiredCount / pos.targetCount) * 100);

                  return (
                    <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pos.title}</div>
                        <div className="font-mono text-[10px] text-blue-600 font-semibold">{pos.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {pos.appliedCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600">
                        {pos.interviewingCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-purple-600">
                        {pos.offeredCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {pos.hiredCount} / {pos.targetCount}
                      </td>
                      <td className="py-3.5 px-4 text-center min-w-[120px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={clsx(
                                'h-full rounded-full',
                                percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                              )}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-slate-700">{percent}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={clsx(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold',
                            pos.status === 'FULL'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          )}
                        >
                          {pos.status === 'FULL' ? 'Đủ người' : 'Đang tuyển'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân Trang (Pagination) */}
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={POSITION_PIPELINES.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
            itemLabel="vị trí tuyển dụng"
          />
        </div>
      </div>
    </div>
  );
}
