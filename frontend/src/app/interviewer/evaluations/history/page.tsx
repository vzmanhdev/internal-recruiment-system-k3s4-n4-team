'use client';

import React from 'react';
import Link from 'next/link';
import { History, Search, Star, Eye } from 'lucide-react';
import { interviewerApi } from '@/features/interviewer/api';
import { useApiData } from '@/hooks/useApiData';
import { useAuth } from '@/providers/auth-provider';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';

export default function EvaluationHistoryPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApiData(
    () => (user ? interviewerApi.history(user.id) : Promise.resolve([])),
    [user?.id],
  );
  const historyList = data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lịch Sử Đánh Giá Phỏng Vấn</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách các phiếu đánh giá năng lực ứng viên bạn đã hoàn thành trong các kỳ tuyển dụng trước
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo ứng viên, vị trí..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">{historyList.length} phiếu đã nộp</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Ứng Viên</th>
                <th className="py-3 px-4">Vị Trí & Phòng Ban</th>
                <th className="py-3 px-4 text-center">Điểm Trung Bình</th>
                <th className="py-3 px-4">Kết Luận Khuyến Nghị</th>
                <th className="py-3 px-4">Ngày Hoàn Tất</th>
                <th className="py-3 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(loading || !!error || historyList.length === 0) && (
                <tr><td colSpan={6}>
                  {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : <EmptyState hint="Bạn chưa nộp phiếu đánh giá nào." />}
                </td></tr>
              )}
              {historyList.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-slate-900">{item.candidate}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{item.position}</div>
                    <div className="text-[11px] text-slate-400">{item.department}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                      <Star className="w-3 h-3 fill-blue-600" />
                      <span>{item.score}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">{item.recommendation}</td>
                  <td className="py-3.5 px-4 text-slate-500">{item.date}</td>
                  <td className="py-3.5 px-5 text-right">
                    {item.interviewId ? (
                      <Link
                        href={`/interviewer/evaluations/${item.interviewId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem lại</span>
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
