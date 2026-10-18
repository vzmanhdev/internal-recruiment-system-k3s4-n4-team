'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Filter, Star, Eye, ChevronRight, CheckCircle2, 
  XCircle, Clock, FileText, ArrowRight, UserCheck, ShieldAlert, Sparkles,
  ExternalLink, Mail, Phone, Calendar, ArrowUpRight
} from 'lucide-react';
import { openProtectedFile } from '@/services/file.service';
import { apiRequest, ApiError } from '@/lib/api-client';
import { interviewService } from '@/services/interview.service';
import type { ApiApplication } from '@/features/candidates/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

// pipeline column -> application status (both interview columns are the 'interviewing' status)
const STAGE_TO_STATUS: Record<string, string> = {
  applied: 'submitted', screening: 'screening', tech_interview: 'interviewing', hr_interview: 'interviewing', offer: 'offered', hired: 'hired',
};

interface CandidateItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  position_applied: string;
  stage: 'applied' | 'screening' | 'tech_interview' | 'hr_interview' | 'offer' | 'hired';
  rating: number; // 1-5
  source: string;
  recruiter: string;
  applied_at: string;
  resume_url?: string;
}

const STAGES = [
  { key: 'applied', label: '1. Hồ sơ mới', color: 'bg-slate-100 text-slate-700' },
  { key: 'screening', label: '2. Thẩm định (Screening)', color: 'bg-blue-50 text-blue-700' },
  { key: 'tech_interview', label: '3. Phỏng vấn Chuyên môn', color: 'bg-indigo-50 text-indigo-700' },
  { key: 'hr_interview', label: '4. Phỏng vấn HR', color: 'bg-purple-50 text-purple-700' },
  { key: 'offer', label: '5. Thư mời (Offer)', color: 'bg-amber-50 text-amber-700' },
  { key: 'hired', label: '6. Đã tuyển dụng (Hired)', color: 'bg-emerald-50 text-emerald-700' }
];

export default function HRCandidatesPage() {
  const { data, error, loading, reload } = useApiData(async () => {
    const [apps, interviews] = await Promise.all([apiRequest<ApiApplication[]>('/applications'), interviewService.getInterviews().catch(() => [])]);
    // an interviewing application whose latest round is the HR round sits in the HR-interview column
    const hrRound = new Set(apps.filter((a) => {
      const rounds = interviews.filter((i) => i.application_id === a.id).sort((x, y) => y.scheduled_time.localeCompare(x.scheduled_time));
      return rounds[0] && /hr|nhân sự/i.test(rounds[0].round_name);
    }).map((a) => a.id));
    return apps
      .filter((a) => ['submitted', 'screening', 'interviewing', 'offered', 'hired', 'onboarded'].includes(a.status))
      .map((a): CandidateItem => ({
        id: String(a.id),
        name: a.full_name,
        email: a.email,
        phone: a.phone || '',
        position_applied: a.job_title || '',
        stage: a.status === 'submitted' ? 'applied' : a.status === 'screening' ? 'screening'
          : a.status === 'interviewing' ? (hrRound.has(a.id) ? 'hr_interview' : 'tech_interview')
            : a.status === 'offered' ? 'offer' : 'hired',
        rating: a.rating || 0,
        source: a.source || 'Không rõ',
        recruiter: '',
        applied_at: a.created_at ? new Date(a.created_at).toLocaleDateString('vi-VN') : '',
        resume_url: a.cv_url || undefined,
      }));
  }, []);
  const candidates = data || [];
  const [moveError, setMoveError] = useState('');

  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);

  const moveStage = async (candidateId: string, newStage: CandidateItem['stage']) => {
    const current = candidates.find((c) => c.id === candidateId);
    if (!current || STAGE_TO_STATUS[current.stage] === STAGE_TO_STATUS[newStage]) {
      setSelectedCandidate(null);
      return;
    }
    try {
      await apiRequest(`/applications/${candidateId}/status`, { method: 'PUT', body: JSON.stringify({ status: STAGE_TO_STATUS[newStage] }) });
      setMoveError('');
      setSelectedCandidate(null);
      reload();
    } catch (err) {
      setMoveError(err instanceof ApiError ? err.message : 'Không chuyển được giai đoạn.');
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Phễu Tuyển Dụng & Ứng Viên (Pipeline)</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              [S5-01] 6-Stage Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Theo dõi phễu chuyển đổi ứng viên qua 6 giai đoạn tuyển dụng chuẩn ATS</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button 
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Kanban Board
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Danh Sách
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {STAGES.map((st) => {
            const stageCandidates = candidates.filter(c => c.stage === st.key);
            return (
              <div key={st.key} className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 space-y-3 min-w-[220px]">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className={`px-2 py-0.5 rounded-md ${st.color}`}>{st.label}</span>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {stageCandidates.map((can) => (
                    <div 
                      key={can.id}
                      onClick={() => setSelectedCandidate(can)}
                      className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-slate-900">{can.name}</span>
                        <div className="flex items-center text-amber-400 text-[10px]">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="font-bold text-slate-700 ml-0.5">{can.rating}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1">{can.position_applied}</div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{can.source}</span>
                        <span>{can.applied_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                <th className="p-4">Họ & Tên Ứng Viên</th>
                <th className="p-4">Vị Trí Ứng Tuyển</th>
                <th className="p-4">Giai Đoạn Phễu</th>
                <th className="p-4 text-center">Đánh Giá</th>
                <th className="p-4">Recruiter Phụ Trách</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((can) => (
                <tr key={can.id} className="hover:bg-slate-50/70">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{can.name}</div>
                    <div className="text-[11px] text-slate-400">{can.email} | {can.phone}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{can.position_applied}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                      {STAGES.find(s => s.key === can.stage)?.label}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-amber-500">⭐ {can.rating}/5</td>
                  <td className="p-4 text-slate-700 font-semibold">{can.recruiter}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelectedCandidate(can)} className="text-blue-600 font-bold hover:underline">Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enterprise Candidate Detail & Stage Transition Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                  {selectedCandidate.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{selectedCandidate.name}</h3>
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      #{selectedCandidate.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{selectedCandidate.position_applied}</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCandidate(null)} 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedCandidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{selectedCandidate.phone || 'Chưa có SĐT'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Nộp ngày: {selectedCandidate.applied_at || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                  <span className="font-bold text-slate-800">Đánh giá: {selectedCandidate.rating}/5</span>
                </div>
                <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500">Nguồn ứng viên: <strong className="text-slate-800">{selectedCandidate.source}</strong></span>
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                    {STAGES.find(s => s.key === selectedCandidate.stage)?.label}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Link
                  href={`/hr/candidates/${selectedCandidate.id}`}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem Toàn Diện Hồ Sơ (Unified Profile)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                </Link>

                {selectedCandidate.resume_url && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedCandidate.resume_url) {
                        openProtectedFile(selectedCandidate.resume_url).catch((err) => {
                          alert(err instanceof Error ? err.message : 'Không mở được CV');
                        });
                      }
                    }}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Xem Tệp CV</span>
                  </button>
                )}
              </div>

              {/* Stage Transition Control */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Chuyển Giai Đoạn Tuyển Dụng (Pipeline Stage):
                </label>
                {moveError && (
                  <div className="mb-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg font-semibold">
                    {moveError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {STAGES.map((st) => {
                    const isCurrent = selectedCandidate.stage === st.key;
                    return (
                      <button 
                        key={st.key}
                        type="button"
                        onClick={() => moveStage(selectedCandidate.id, st.key as CandidateItem["stage"])}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                          isCurrent 
                            ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold shadow-2xs' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{st.label}</span>
                        {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
