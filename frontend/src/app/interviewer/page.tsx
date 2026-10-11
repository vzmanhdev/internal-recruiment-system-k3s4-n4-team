'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, FileText, Loader2, MessageSquare, UserCheck, Video, MapPin } from 'lucide-react';
import { openProtectedFile } from "@/services/file.service";
import { RoleWorkspaceShell } from '@/components/layout/RoleWorkspaceShell';
import { interviewService, type InterviewItem } from '@/services/interview.service';
import { referralService } from '@/services/referral.service';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

type Criterion = { id: string; code: string; name: string; description?: string; weight: number };
type Question = { id: string; code: string; content: string; criteria_name?: string; difficulty?: string; suggested_answer?: string; already_asked: boolean };

export default function InterviewerWorkspacePage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active, setActive] = useState<InterviewItem | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [ratings, setRatings] = useState<Record<string, { score: number; comment: string }>>({});
  const [overall, setOverall] = useState(7);
  const [recommendation, setRecommendation] = useState<'' | 'hire' | 'hold' | 'reject'>('');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await interviewService.getMine());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được lịch phỏng vấn.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const open = async (i: InterviewItem) => {
    setActive(i);
    setRatings({}); setRecommendation(''); setComments(''); setOverall(7);
    try {
      const [tpl, qs] = await Promise.all([interviewService.scorecardTemplate(i.id), interviewService.questionSuggestions(i.id)]);
      setCriteria(tpl.criteria);
      setQuestions(qs);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Không mở được phiếu đánh giá.');
    }
  };

  const markAsked = async (q: Question) => {
    if (!active) return;
    try {
      await interviewService.markAsked(active.id, q.id);
      setQuestions((prev) => prev.map((x) => (x.id === q.id ? { ...x, already_asked: true } : x)));
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Không lưu được.');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    if (!recommendation) {
      showError('Bắt buộc chọn kết luận: Nên tuyển, Cân nhắc hoặc Không nên tuyển.');
      return;
    }
    if (criteria.length && criteria.some((c) => !ratings[c.id]?.score)) {
      showError('Vui lòng chấm đủ mọi tiêu chí (thang 1–5).');
      return;
    }
    setSaving(true);
    try {
      await referralService.submitEvaluation({
        application_id: active.application_id,
        interview_id: active.id,
        recommendation,
        comments: comments || undefined,
        ...(criteria.length
          ? { ratings: criteria.map((c) => ({ criterion_id: c.id, score: ratings[c.id].score, comment: ratings[c.id].comment || undefined })) }
          : { overall_score: overall }),
      });
      showSuccess('Đã nộp phiếu đánh giá. Phiếu đã nộp không sửa được (trừ khi Recruiter mở lại trong 24 giờ).');
      setActive(null);
      await load();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Nộp phiếu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const upcoming = items.filter((i) => i.status === 'scheduled');
  const pendingEval = items.filter((i) => i.status !== 'cancelled' && !i.my_evaluation_submitted);

  return (
    <RoleWorkspaceShell title="Interviewer Workspace" badge="Người phỏng vấn" subtitle="Lịch phỏng vấn của riêng bạn và phiếu đánh giá theo khung năng lực"
      icon={<UserCheck className="w-6 h-6" />} accent="from-blue-600 to-indigo-500">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Lịch phỏng vấn của tôi</h2>
            <p className="text-xs text-slate-500">{upcoming.length} buổi sắp tới · {pendingEval.length} buổi chưa nộp phiếu</p>
          </div>
          {loading ? (
            <div className="py-10 flex justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</div>
          ) : loadError ? (
            <div className="py-10 text-center text-xs text-rose-600">{loadError}</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">Bạn chưa được mời vào buổi phỏng vấn nào.</div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.id} className="border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900">{i.candidate_name} · <span className="font-semibold text-slate-600">{i.job_title}</span></div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(i.scheduled_time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{i.duration_minutes} phút</span>
                      {i.meeting_link ? <a href={i.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600"><Video className="w-3 h-3" />Link họp</a>
                        : <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{i.location}</span>}
                      {i.cv_url && <button type="button" onClick={() => openProtectedFile(i.cv_url!).catch((e) => showError(e.message))} className="inline-flex items-center gap-1 text-blue-600 cursor-pointer"><FileText className="w-3 h-3" />Mở CV</button>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {i.my_evaluation_submitted ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Đã nộp phiếu</span>
                    ) : i.status === 'cancelled' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold">Đã huỷ</span>
                    ) : (
                      <button onClick={() => open(i)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer">Nộp phiếu đánh giá</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
          {!active ? (
            <div className="text-xs text-slate-500">Chọn một buổi phỏng vấn để mở phiếu đánh giá và bộ câu hỏi gợi ý.</div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <div className="text-sm font-bold text-slate-900">{active.candidate_name}</div>
                <div className="text-xs text-slate-500">{active.round_name}</div>
              </div>
              {criteria.length > 0 ? criteria.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800">{c.name} <span className="text-slate-400">({c.weight}%)</span></div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} onClick={() => setRatings((r) => ({ ...r, [c.id]: { score: n, comment: r[c.id]?.comment || '' } }))}
                        className={`w-8 h-8 rounded-lg text-xs font-bold border cursor-pointer ${ratings[c.id]?.score === n ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>{n}</button>
                    ))}
                  </div>
                  <input placeholder="Nhận xét cho tiêu chí" value={ratings[c.id]?.comment || ''}
                    onChange={(e) => setRatings((r) => ({ ...r, [c.id]: { score: r[c.id]?.score || 0, comment: e.target.value } }))}
                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                </div>
              )) : (
                <label className="block text-xs font-semibold text-slate-800">Điểm tổng (1–10)
                  <input type="number" min={1} max={10} value={overall} onChange={(e) => setOverall(Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                  <span className="text-[10px] text-slate-400">Chức danh này chưa gắn khung năng lực.</span>
                </label>
              )}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-800">Kết luận *</div>
                <div className="flex gap-1.5">
                  {([['hire', 'Nên tuyển'], ['hold', 'Cân nhắc'], ['reject', 'Không nên tuyển']] as const).map(([v, label]) => (
                    <button type="button" key={v} onClick={() => setRecommendation(v)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${recommendation === v ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <textarea placeholder="Nhận xét chung" value={comments} onChange={(e) => setComments(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-lg p-2 text-xs" />
              <button type="submit" disabled={saving} className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}Nộp phiếu
              </button>
              {questions.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />Câu hỏi gợi ý</div>
                  {questions.map((q) => (
                    <div key={q.id} className="text-xs border border-slate-100 rounded-lg p-2 space-y-1">
                      <div className="text-slate-800">{q.content}</div>
                      {q.suggested_answer && <div className="text-[11px] text-slate-500">Gợi ý: {q.suggested_answer}</div>}
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{q.criteria_name} · {q.difficulty}</span>
                        {q.already_asked ? <span className="text-emerald-600 font-bold">Đã hỏi</span>
                          : <button type="button" onClick={() => markAsked(q)} className="text-blue-600 font-bold cursor-pointer">Đánh dấu đã hỏi</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </RoleWorkspaceShell>
  );
}
