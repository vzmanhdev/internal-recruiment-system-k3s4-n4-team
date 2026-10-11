'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Loader2, MapPin, RefreshCw, Users, Video } from 'lucide-react';
import { interviewService, type InterviewItem } from '@/services/interview.service';
import { ApiError } from '@/lib/api-client';

const STATUS: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Đã lên lịch', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  completed: { label: 'Đã hoàn thành', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  cancelled: { label: 'Đã huỷ', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function HRInterviewsPage() {
  const [items, setItems] = useState<InterviewItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await interviewService.getInterviews(statusFilter ? { status_filter: statusFilter } : undefined));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2"><Calendar className="w-6 h-6 text-blue-600" />Lịch Phỏng Vấn</h1>
          <p className="text-xs text-slate-500 mt-1">Hệ thống chặn đặt lịch trong quá khứ và chặn trùng lịch theo từng người phỏng vấn (S6-02, S6-04).</p>
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
            <option value="">Tất cả</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={reload} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer" title="Tải lại"><RefreshCw className="w-4 h-4 text-slate-600" /></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-xs text-rose-600">{loadError}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">Chưa có lịch phỏng vấn nào trong phạm vi của bạn.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Ứng viên & vị trí</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4">Địa điểm / Link</th>
                <th className="p-4">Người phỏng vấn</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {items.map((i) => {
                const st = STATUS[i.status] || { label: i.status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                const when = i.scheduled_time ? new Date(i.scheduled_time) : null;
                return (
                  <tr key={i.id} className="hover:bg-slate-50/70 align-top">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{i.candidate_name}</div>
                      <div className="text-[11px] text-slate-400">{i.job_title} · {i.round_name}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">{when ? when.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'} · {i.duration_minutes} phút</td>
                    <td className="p-4">
                      {i.meeting_link ? (
                        <a href={i.meeting_link} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold inline-flex items-center gap-1"><Video className="w-3 h-3" />Tham gia</a>
                      ) : (
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{i.location}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" />
                        {((i.interviewers || []) as Array<{ interviewer_name?: string; interviewer_email?: string }>).map((v) => v.interviewer_name || v.interviewer_email).join(', ') || '—'}
                      </span>
                    </td>
                    <td className="p-4 text-center"><span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${st.cls}`}>{st.label}</span></td>
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
