'use client';

import React from 'react';
import Link from 'next/link';
import { FileEdit, ArrowRight } from 'lucide-react';
import { interviewerApi } from '@/features/interviewer/api';
import { useApiData } from '@/hooks/useApiData';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';

export default function PendingEvaluationsPage() {
  const { data, error, loading, reload } = useApiData(() => interviewerApi.pendingScorecards());
  const pendingScorecards = (data || []).map((p) => ({ ...p, candidate: p.candidateName, dueTime: p.dueWarning }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Phiếu Đánh Giá Chờ Nộp</h1>
              <span className="bg-rose-100 text-rose-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {pendingScorecards.length} Phiếu
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Các buổi phỏng vấn đã hoàn tất cần bạn điền điểm số và nhận xét năng lực để HR hoàn thiện quy trình tuyển dụng
            </p>
          </div>
        </div>
      </div>

      {/* List of Pending Scorecards */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        {loading && <LoadingState />}
        {!loading && !!error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && pendingScorecards.length === 0 && <EmptyState hint="Bạn không còn phiếu đánh giá nào cần nộp." />}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingScorecards.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/20 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${item.urgencyClass}`}>
                    {item.urgency}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">ID: #{item.id}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {item.candidate}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{item.position}</p>
                </div>
                <div className="text-xs text-slate-400 space-y-0.5 pt-1">
                  <div>Ngày phỏng vấn: {item.interviewDate} ({item.timeSlot})</div>
                  <div className="font-semibold text-rose-600">{item.dueTime}</div>
                </div>
              </div>

              <Link
                href={`/interviewer/evaluations/${item.id}`}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>Chấm Điểm Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
