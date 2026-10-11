'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { masterDataService, type Framework, type Criterion, type Question } from '@/services/master-data.service';
import { MasterDataFrame, fieldClass, primaryBtn, ghostBtn } from '@/components/hr/MasterDataFrame';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

type FwForm = { code: string; name: string; department: string; applied_job_titles: string; criteria: Criterion[] };
const EMPTY: FwForm = { code: '', name: '', department: '', applied_job_titles: '', criteria: [{ code: 'TC-01', name: '', weight: 100 }] };

export default function HRCompetenciesPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<Framework[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FwForm | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [qForm, setQForm] = useState({ code: '', content: '', criteria_id: '', job_title: '', difficulty: 'medium', suggested_answer: '' });

  const load = useCallback(async () => {
    try {
      const [f, q] = await Promise.all([masterDataService.frameworks(), masterDataService.questions()]);
      setItems(f); setQuestions(q); setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được khung năng lực.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const total = form ? form.criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0) : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (total !== 100) { showError(`Tổng trọng số phải bằng 100% (hiện tại ${total}%).`); return; }
    try {
      await masterDataService.saveFramework({
        code: form.code, name: form.name, department: form.department || undefined,
        applied_job_titles: form.applied_job_titles.split(',').map((x) => x.trim()).filter(Boolean),
        criteria: form.criteria.map((c) => ({ ...c, weight: Number(c.weight) })),
      }, editing ?? undefined);
      showSuccess('Đã lưu khung năng lực.');
      setForm(null); setEditing(null);
      await load();
    } catch (err) { showError(err instanceof ApiError ? err.message : 'Lưu thất bại.'); }
  };

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterDataService.saveQuestion({ ...qForm, job_title: qForm.job_title || undefined, suggested_answer: qForm.suggested_answer || undefined });
      showSuccess('Đã thêm câu hỏi.');
      setQForm({ code: '', content: '', criteria_id: '', job_title: '', difficulty: 'medium', suggested_answer: '' });
      await load();
    } catch (err) { showError(err instanceof ApiError ? err.message : 'Lưu câu hỏi thất bại.'); }
  };

  const setCrit = (idx: number, patch: Partial<Criterion>) => form && setForm({ ...form, criteria: form.criteria.map((c, i) => (i === idx ? { ...c, ...patch } : c)) });
  const allCriteria = items.flatMap((f) => f.criteria.map((c) => ({ ...c, fw: f.name })));

  return (
    <MasterDataFrame title="Khung Năng Lực & Ngân hàng câu hỏi" story="[S2-06 / S2-07]" loading={loading} error={error}
      description="Mỗi khung gồm các tiêu chí có trọng số, tổng bằng 100%; khung áp dụng cho nhiều chức danh và sinh phiếu đánh giá phỏng vấn."
      actions={<button onClick={() => { setForm(EMPTY); setEditing(null); }} className={`${primaryBtn} inline-flex items-center gap-1.5`}><Plus className="w-4 h-4" />Thêm khung</button>}>
      {form && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 mb-4">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-xs font-semibold">Mã *<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={fieldClass} /></label>
            <label className="text-xs font-semibold md:col-span-2">Tên khung *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} /></label>
            <label className="text-xs font-semibold">Phòng ban<input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={fieldClass} /></label>
            <label className="text-xs font-semibold md:col-span-4">Áp dụng cho chức danh (phân tách bằng dấu phẩy)<input value={form.applied_job_titles} onChange={(e) => setForm({ ...form, applied_job_titles: e.target.value })} className={fieldClass} /></label>
          </div>
          <div className="space-y-2">
            {form.criteria.map((c, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-[100px_1fr_1fr_90px_32px] items-center">
                <input required value={c.code} onChange={(e) => setCrit(idx, { code: e.target.value })} className={fieldClass} placeholder="Mã" />
                <input required value={c.name} onChange={(e) => setCrit(idx, { name: e.target.value })} className={fieldClass} placeholder="Tên tiêu chí" />
                <input value={c.description || ''} onChange={(e) => setCrit(idx, { description: e.target.value })} className={fieldClass} placeholder="Mô tả" />
                <input required type="number" min={1} max={100} value={c.weight} onChange={(e) => setCrit(idx, { weight: Number(e.target.value) })} className={fieldClass} />
                <button type="button" onClick={() => setForm({ ...form, criteria: form.criteria.filter((_, i) => i !== idx) })} className="text-rose-600 cursor-pointer" title="Xoá tiêu chí"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setForm({ ...form, criteria: [...form.criteria, { code: `TC-${String(form.criteria.length + 1).padStart(2, '0')}`, name: '', weight: 0 }] })} className={ghostBtn}>+ Tiêu chí</button>
              <span className={`text-xs font-bold ${total === 100 ? 'text-emerald-700' : 'text-rose-600'}`}>Tổng trọng số: {total}%</span>
            </div>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setForm(null)} className={ghostBtn}>Huỷ</button><button className={primaryBtn}>Lưu khung</button></div>
        </form>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((f) => (
          <div key={f.id} className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-2 ${f.status !== 'active' ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start gap-2">
              <div><div className="font-bold text-slate-900">{f.name}</div><div className="text-[11px] text-slate-400">{f.code} · {f.applied_job_titles.join(', ') || 'Chưa gắn chức danh'}</div></div>
              <button onClick={() => { setEditing(f.id); setForm({ code: f.code, name: f.name, department: f.department || '', applied_job_titles: f.applied_job_titles.join(', '), criteria: f.criteria }); }} className={ghostBtn}>Sửa</button>
            </div>
            {f.criteria.map((c) => (
              <div key={c.id} className="flex justify-between text-xs border-t border-slate-100 pt-1.5"><span>{c.code} · {c.name}</span><span className="font-bold">{c.weight}%</span></div>
            ))}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
        <div className="text-sm font-bold text-slate-900">Ngân hàng câu hỏi phỏng vấn ({questions.length})</div>
        <form onSubmit={saveQuestion} className="grid gap-2 md:grid-cols-6">
          <input required placeholder="Mã" value={qForm.code} onChange={(e) => setQForm({ ...qForm, code: e.target.value })} className={fieldClass} />
          <input required placeholder="Nội dung câu hỏi" value={qForm.content} onChange={(e) => setQForm({ ...qForm, content: e.target.value })} className={`${fieldClass} md:col-span-2`} />
          <select required value={qForm.criteria_id} onChange={(e) => setQForm({ ...qForm, criteria_id: e.target.value })} className={fieldClass}>
            <option value="">— Tiêu chí —</option>{allCriteria.map((c) => <option key={c.id} value={c.id}>{c.fw}: {c.name}</option>)}
          </select>
          <select value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })} className={fieldClass}>
            <option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option>
          </select>
          <button className={primaryBtn}>Thêm</button>
          <input placeholder="Chức danh áp dụng" value={qForm.job_title} onChange={(e) => setQForm({ ...qForm, job_title: e.target.value })} className={`${fieldClass} md:col-span-2`} />
          <input placeholder="Gợi ý câu trả lời tốt" value={qForm.suggested_answer} onChange={(e) => setQForm({ ...qForm, suggested_answer: e.target.value })} className={`${fieldClass} md:col-span-4`} />
        </form>
        <ul className="divide-y divide-slate-100 text-xs">
          {questions.map((q) => (
            <li key={q.id} className="py-2"><span className="font-mono text-slate-400 mr-2">{q.code}</span>{q.content}<div className="text-[11px] text-slate-400">{q.criteria_name} · {q.job_title || 'Mọi chức danh'} · {q.difficulty}</div></li>
          ))}
        </ul>
      </div>
    </MasterDataFrame>
  );
}
