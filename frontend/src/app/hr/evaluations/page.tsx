'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest, ApiError } from '@/lib/api-client';
import { interviewService, type InterviewItem } from '@/services/interview.service';
import { referralService, type EvaluationItem } from '@/services/referral.service';
import type { ApiApplication } from '@/features/candidates/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { 
  ClipboardCheck, Star, Users, CheckCircle2, XCircle, Clock, 
  Search, Filter, Eye, Award, Sparkles, RotateCcw, ChevronRight,
  TrendingUp, BarChart2, Check, AlertCircle, FileText, ArrowLeft, RefreshCw
} from 'lucide-react';

interface FullEvaluationItem extends EvaluationItem {
  candidate_name?: string;
  candidate_email?: string;
  position_title?: string;
  round_name?: string;
  criteria_json?: string;
  parsed_criteria?: Array<{ name: string; score: number; comment?: string }>;
  reopened_at?: string | null;
}

interface CandidateCompareItem {
  application_id: number;
  candidate: string;
  status: string;
  criteria: Record<string, number>;
  total_score: number | null;
  evaluations: number;
}

export default function HREvaluationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'compare' | 'summary'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [recommendFilter, setRecommendFilter] = useState<'all' | 'hire' | 'hold' | 'reject'>('all');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedAppIdForSummary, setSelectedAppIdForSummary] = useState<number | null>(null);
  const [selectedEvalForModal, setSelectedEvalForModal] = useState<FullEvaluationItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reopeningId, setReopeningId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Load All Applications, Interviews, Jobs, and Evaluations
  const { data, error, loading, reload } = useApiData(async () => {
    const [apps, interviews, jobs] = await Promise.all([
      apiRequest<ApiApplication[]>('/applications').catch(() => []),
      interviewService.getInterviews().catch(() => []),
      apiRequest<any[]>('/jobs').catch(() => []),
    ]);

    // Fetch evaluations across all applications that have evaluations
    const appMap = new Map(apps.map((a) => [a.id, a]));
    const interviewMap = new Map(interviews.map((i) => [i.id, i]));

    const allEvalsPromises = apps.map(async (app) => {
      try {
        const evals = await referralService.listEvaluations(app.id);
        return evals.map((e) => {
          const inv = e.interview_id ? interviewMap.get(e.interview_id) : undefined;
          let parsed: Array<{ name: string; score: number; comment?: string }> = [];
          try {
            if ((e as any).criteria_json) {
              parsed = JSON.parse((e as any).criteria_json);
            }
          } catch {
            // ignore parse error
          }
          return {
            ...e,
            candidate_name: app.full_name,
            candidate_email: app.email,
            position_title: app.job_title || (inv?.job_title) || 'Vị trí tuyển dụng',
            round_name: inv?.round_name || 'Đánh giá chuyên môn',
            criteria_json: (e as any).criteria_json,
            parsed_criteria: parsed,
            reopened_at: (e as any).reopened_at,
          } as FullEvaluationItem;
        });
      } catch {
        return [];
      }
    });

    const nested = await Promise.all(allEvalsPromises);
    const allEvaluations: FullEvaluationItem[] = nested.flat();

    return {
      apps,
      interviews,
      jobs,
      evaluations: allEvaluations,
    };
  }, []);

  const evaluations = data?.evaluations || [];
  const apps = data?.apps || [];
  const jobs = data?.jobs || [];

  // Summary state for Tab 3
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Compare state for Tab 2
  const [compareRows, setCompareRows] = useState<CandidateCompareItem[]>([]);
  const [loadingCompare, setLoadingCompare] = useState(false);

  // Filtered Evaluations for Tab 1
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((e) => {
      if (recommendFilter !== 'all' && e.recommendation !== recommendFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCandidate = (e.candidate_name || '').toLowerCase().includes(q);
        const matchPosition = (e.position_title || '').toLowerCase().includes(q);
        const matchEvaluator = (e.evaluator_name || '').toLowerCase().includes(q);
        if (!matchCandidate && !matchPosition && !matchEvaluator) return false;
      }
      return true;
    });
  }, [evaluations, recommendFilter, searchTerm]);

  // Load Compare data when Job selected in Tab 2
  const handleSelectJobForCompare = async (jobId: number) => {
    setSelectedJobId(jobId);
    try {
      setLoadingCompare(true);
      const rows = await interviewService.compareCandidates(jobId);
      setCompareRows(rows || []);
    } catch {
      setCompareRows([]);
    } finally {
      setLoadingCompare(false);
    }
  };

  // Load Summary data when Application selected in Tab 3
  const handleSelectAppForSummary = async (appId: number) => {
    setSelectedAppIdForSummary(appId);
    try {
      setLoadingSummary(true);
      const sum = await interviewService.getEvaluationSummary(appId);
      setSummaryData(sum);
    } catch {
      setSummaryData(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Handle Reopening Evaluation (S6-08 AC3)
  const handleReopen = async (evalId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn MỞ LẠI phiếu đánh giá này trong 24h để người phỏng vấn cập nhật?")) return;
    try {
      setReopeningId(evalId);
      await interviewService.reopenEvaluation(evalId);
      reload();
      showToast("Đã mở lại phiếu đánh giá thành công! Người phỏng vấn có thể chỉnh sửa trong 24h.");
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : "Không thể mở lại phiếu (đã quá 24h hoặc không có quyền).");
    } finally {
      setReopeningId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10001] px-4 py-3 rounded-2xl shadow-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Điều Hành */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-200">
                [S6-07 • S6-08 • S7-03] Evaluation Center
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Phiếu Đánh Giá Theo Khung Năng Lực & So Sánh Ứng Viên
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Tổng Hợp & Đánh Giá Ứng Viên Toàn Công Ty
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi toàn bộ phiếu đánh giá của Hội đồng, so sánh ứng viên theo tiêu chí khung năng lực và tổng hợp quyết định tuyển.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/hr/interviews"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Quay lại Lịch Phỏng Vấn</span>
            </Link>
            <button
              type="button"
              onClick={() => reload()}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Tất Cả Phiếu Đánh Giá ({evaluations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('compare');
              if (jobs.length > 0 && !selectedJobId) {
                handleSelectJobForCompare(jobs[0].id);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>So Sánh Ứng Viên Theo Vị Trí (S6-09)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('summary');
              if (apps.length > 0 && !selectedAppIdForSummary) {
                handleSelectAppForSummary(apps[0].id);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Tổng Hợp Nhiều Vòng Tuyển (S7-03)</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: DANH SÁCH TẤT CẢ PHIẾU ĐÁNH GIÁ (ALL EVALUATIONS)               */}
      {/* ===================================================================== */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo tên ứng viên, vị trí, người đánh giá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setRecommendFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${recommendFilter === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Mọi Kết Luận
              </button>
              <button
                type="button"
                onClick={() => setRecommendFilter('hire')}
                className={`px-3 py-1 rounded-lg transition-all ${recommendFilter === 'hire' ? 'bg-white text-emerald-600 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Nên Tuyển (Hire)
              </button>
              <button
                type="button"
                onClick={() => setRecommendFilter('hold')}
                className={`px-3 py-1 rounded-lg transition-all ${recommendFilter === 'hold' ? 'bg-white text-amber-600 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Cân Nhắc (Hold)
              </button>
              <button
                type="button"
                onClick={() => setRecommendFilter('reject')}
                className={`px-3 py-1 rounded-lg transition-all ${recommendFilter === 'reject' ? 'bg-white text-rose-600 shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Không Tuyển (Reject)
              </button>
            </div>
          </div>

          {/* Evaluations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvaluations.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">Chưa có phiếu đánh giá nào phù hợp</h3>
                <p className="text-xs text-slate-500 mt-1">Các phiếu đánh giá sẽ tự động hiển thị tại đây khi Hội đồng phỏng vấn nộp phiếu sau buổi phỏng vấn.</p>
              </div>
            ) : (
              filteredEvaluations.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900">{ev.candidate_name}</h2>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                          {ev.round_name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{ev.position_title}</div>
                    </div>

                    {/* Recommendation Badge */}
                    <div>
                      {ev.recommendation === 'hire' ? (
                        <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Nên Tuyển (Hire)</span>
                        </span>
                      ) : ev.recommendation === 'hold' ? (
                        <span className="bg-amber-50 text-amber-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Cân Nhắc (Hold)</span>
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Không Tuyển (Reject)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Evaluator info & Score */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Người Đánh Giá</span>
                      <div className="font-bold text-slate-800 mt-0.5">{ev.evaluator_name || 'Hội đồng'}</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Điểm Đánh Giá</span>
                      <div className="font-extrabold text-blue-700 mt-0.5 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{ev.weighted_score ? `${ev.weighted_score}/100 điểm` : `${ev.overall_score || 0}/10 điểm`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  {ev.strengths && (
                    <div className="text-xs">
                      <span className="font-bold text-emerald-800">Điểm mạnh:</span>
                      <p className="text-slate-600 mt-0.5 line-clamp-2">{ev.strengths}</p>
                    </div>
                  )}

                  {ev.comments && (
                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700">Nhận xét chung:</span>
                      <p className="text-slate-600 mt-0.5 italic line-clamp-2">"{ev.comments}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      {ev.created_at ? new Date(ev.created_at).toLocaleDateString('vi-VN') : 'Đã nộp'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEvalForModal(ev)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi Tiết Điểm</span>
                      </button>
                      <button
                        type="button"
                        disabled={reopeningId === ev.id}
                        onClick={() => handleReopen(ev.id)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                        title="Mở lại phiếu trong 24h để hội đồng sửa (S6-08 AC3)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Mở Lại (24h)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SO SÁNH ỨNG VIÊN THEO VỊ TRÍ (S6-09 CANDIDATE COMPARISON)       */}
      {/* ===================================================================== */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bảng So Sánh Ứng Viên Vòng Cuối (S6-09)</h2>
                <p className="text-xs text-slate-500">So sánh điểm số theo từng tiêu chí khung năng lực, sắp xếp theo tổng điểm.</p>
              </div>

              {/* Job posting picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Chọn vị trí:</span>
                <select
                  value={selectedJobId || ''}
                  onChange={(e) => handleSelectJobForCompare(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingCompare ? (
              <div className="p-8 text-center text-xs text-slate-500">Đang tổng hợp dữ liệu so sánh...</div>
            ) : compareRows.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Chưa có ứng viên nào có phiếu đánh giá đã nộp cho vị trí này.
              </div>
            ) : (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3">Hạng</th>
                      <th className="py-2.5 px-3">Ứng Viên</th>
                      <th className="py-2.5 px-3">Trạng Thái</th>
                      {Object.keys(compareRows[0]?.criteria || {}).map((crit) => (
                        <th key={crit} className="py-2.5 px-3 text-center">{crit}</th>
                      ))}
                      <th className="py-2.5 px-3 text-right">Tổng Điểm</th>
                      <th className="py-2.5 px-3 text-center">Số Phiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {compareRows.map((row, idx) => (
                      <tr key={row.application_id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3 px-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                            idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            idx === 1 ? 'bg-slate-200 text-slate-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{row.candidate}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            {row.status}
                          </span>
                        </td>
                        {Object.keys(compareRows[0]?.criteria || {}).map((crit) => (
                          <td key={crit} className="py-3 px-3 text-center font-bold text-slate-800">
                            {row.criteria[crit] ? `${row.criteria[crit]}/5` : '—'}
                          </td>
                        ))}
                        <td className="py-3 px-3 text-right font-black text-blue-700 text-sm">
                          {row.total_score ? `${row.total_score} đ` : '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-600">
                          {row.evaluations} phiếu
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: TỔNG HỢP NHIỀU VÒNG ĐÁNH GIÁ (S7-03 SUMMARY MULTI-ROUND)       */}
      {/* ===================================================================== */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Tổng Hợp Kết Quả Nhiều Vòng Tuyển Dụng (S7-03)</h2>
                <p className="text-xs text-slate-500">Gộp toàn bộ phiếu đánh giá của mọi vòng, hiển thị điểm trung bình và các kết luận.</p>
              </div>

              {/* Application picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Ứng viên:</span>
                <select
                  value={selectedAppIdForSummary || ''}
                  onChange={(e) => handleSelectAppForSummary(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name} — {a.job_title}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingSummary ? (
              <div className="p-8 text-center text-xs text-slate-500">Đang tổng hợp phiếu các vòng...</div>
            ) : !summaryData ? (
              <div className="p-10 text-center text-xs text-slate-400">Chưa có dữ liệu đánh giá cho ứng viên này.</div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* 3 Metric cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Tổng Số Phiếu Thu Thập</span>
                    <div className="text-2xl font-black text-blue-900 mt-1">{summaryData.evaluation_count} phiếu</div>
                  </div>
                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Điểm Trung Bình Trọng Số</span>
                    <div className="text-2xl font-black text-emerald-900 mt-1">{summaryData.average_weighted_score || '—'} / 100</div>
                  </div>
                  <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Tỷ Lệ Đề Xuất Tuyển</span>
                    <div className="text-2xl font-black text-amber-900 mt-1">
                      {summaryData.recommendations?.hire || 0} Hire / {summaryData.evaluation_count || 1}
                    </div>
                  </div>
                </div>

                {/* Điểm TB theo tiêu chí */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="font-bold text-slate-800">Điểm trung bình theo tiêu chí khung năng lực (Thang 1–5):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {Object.entries(summaryData.criteria_averages || {}).map(([name, avg]) => (
                      <div key={name} className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[11px] text-slate-500 truncate block">{name}</span>
                        <span className="font-black text-blue-700 text-sm mt-0.5 block">{String(avg)} / 5</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Danh sách phiếu chi tiết */}
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-slate-800">Chi tiết từng phiếu đánh giá của Hội đồng:</span>
                  <div className="space-y-2">
                    {(summaryData.evaluations || []).map((ev: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{ev.evaluator_name || 'Hội đồng phỏng vấn'}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Điểm: <strong>{ev.overall_score}/10</strong> • Kết luận: <strong className="text-blue-700 uppercase">{ev.recommendation}</strong>
                          </div>
                          {ev.comments && <p className="text-[11px] text-slate-600 italic mt-1">"{ev.comments}"</p>}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {ev.created_at ? new Date(ev.created_at).toLocaleDateString('vi-VN') : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL XEM CHI TIẾT ĐIỂM TIÊU CHÍ (SCORECARD MODAL)                     */}
      {/* ===================================================================== */}
      {selectedEvalForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Phiếu Đánh Giá Chi Tiết
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedEvalForModal.candidate_name}</h2>
                <span className="text-xs text-slate-500">{selectedEvalForModal.position_title}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvalForModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Người Đánh Giá</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedEvalForModal.evaluator_name}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Kết Luận Tuyển</span>
                  <div className="font-black text-blue-700 uppercase mt-0.5">{selectedEvalForModal.recommendation}</div>
                </div>
              </div>

              {/* Bảng điểm từng tiêu chí */}
              <div>
                <span className="font-bold text-slate-800 mb-2 block">Điểm số từng tiêu chí năng lực (Thang 1–5):</span>
                {(!selectedEvalForModal.parsed_criteria || selectedEvalForModal.parsed_criteria.length === 0) ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400 text-center">
                    Phiếu đánh giá tổng quan (Overall: {selectedEvalForModal.overall_score}/10)
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedEvalForModal.parsed_criteria.map((crit, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{crit.name}</div>
                          {crit.comment && <div className="text-[11px] text-slate-500 italic mt-0.5">{crit.comment}</div>}
                        </div>
                        <div className="text-sm font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {crit.score} / 5
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedEvalForModal.strengths && (
                <div>
                  <span className="font-bold text-emerald-800">Điểm mạnh nổi bật:</span>
                  <p className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-slate-700 mt-1">
                    {selectedEvalForModal.strengths}
                  </p>
                </div>
              )}

              {selectedEvalForModal.weaknesses && (
                <div>
                  <span className="font-bold text-rose-800">Điểm cần cải thiện / Rủi ro:</span>
                  <p className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-xl text-slate-700 mt-1">
                    {selectedEvalForModal.weaknesses}
                  </p>
                </div>
              )}

              {selectedEvalForModal.comments && (
                <div>
                  <span className="font-bold text-slate-800">Nhận xét tổng thể:</span>
                  <p className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 mt-1 italic">
                    "{selectedEvalForModal.comments}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedEvalForModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all"
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
