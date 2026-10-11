'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { masterDataService, type Department, type JobTitle } from '@/services/master-data.service';
import { MasterDataFrame, fieldClass, primaryBtn, ghostBtn } from '@/components/hr/MasterDataFrame';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

const EMPTY = { name: '', department_id: null as number | null, level: 'Middle', min_salary: 0, max_salary: 0, description: '' };

export default function HRPositionsPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<JobTitle[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, d] = await Promise.all([masterDataService.jobTitles(), masterDataService.departments(false)]);
      setItems(t); setDepts(d); setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được chức danh.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterDataService.saveJobTitle({ ...form, description: form.description || undefined }, editing ?? undefined);
      showSuccess('Đã lưu chức danh.');
      setOpen(false); setEditing(null); setForm(EMPTY);
      await load();
    } catch (err) { showError(err instanceof ApiError ? err.message : 'Lưu thất bại.'); }
  };

  const money = (n?: number) => (n == null ? '—' : n.toLocaleString('vi-VN'));

  return (
    <MasterDataFrame title="Chức danh & Dải lương" story="[S2-05]" loading={loading} error={error} empty={!items.length && !open}
      description="Mỗi chức danh có cấp bậc và dải lương tối thiểu–tối đa; dải lương là hạn mức duyệt offer và chỉ Trưởng phòng Nhân sự xem được."
      actions={<button onClick={() => { setOpen(true); setEditing(null); setForm(EMPTY); }} className={`${primaryBtn} inline-flex items-center gap-1.5`}><Plus className="w-4 h-4" />Thêm chức danh</button>}>
      {open && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 p-5 grid gap-3 md:grid-cols-3 mb-4">
          <label className="text-xs font-semibold">Tên chức danh *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Phòng ban
            <select value={form.department_id ?? ''} onChange={(e) => setForm({ ...form, department_id: e.target.value ? Number(e.target.value) : null })} className={fieldClass}>
              <option value="">— Dùng chung —</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
          <label className="text-xs font-semibold">Cấp bậc *<input required value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Lương tối thiểu (VNĐ) *<input required type="number" min={0} value={form.min_salary} onChange={(e) => setForm({ ...form, min_salary: Number(e.target.value) })} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Lương tối đa (VNĐ) *<input required type="number" min={0} value={form.max_salary} onChange={(e) => setForm({ ...form, max_salary: Number(e.target.value) })} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Mô tả<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={fieldClass} /></label>
          <div className="md:col-span-3 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className={ghostBtn}>Huỷ</button><button className={primaryBtn}>Lưu</button></div>
        </form>
      )}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider"><tr><th className="p-4">Chức danh</th><th className="p-4">Phòng ban</th><th className="p-4">Cấp bậc</th><th className="p-4 text-right">Dải lương (VNĐ)</th><th className="p-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((t) => (
              <tr key={t.id} className={t.is_active ? '' : 'opacity-60'}>
                <td className="p-4 font-bold text-slate-900">{t.name}</td>
                <td className="p-4">{depts.find((d) => d.id === t.department_id)?.name || 'Dùng chung'}</td>
                <td className="p-4">{t.level}</td>
                <td className="p-4 text-right font-mono">{money(t.min_salary)} – {money(t.max_salary)}</td>
                <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                  <button onClick={() => { setEditing(t.id); setForm({ name: t.name, department_id: t.department_id, level: t.level, min_salary: t.min_salary || 0, max_salary: t.max_salary || 0, description: t.description || '' }); setOpen(true); }} className={ghostBtn}>Sửa</button>
                  {t.is_active && <button onClick={async () => { try { await masterDataService.deactivateJobTitle(t.id); showSuccess('Đã ngừng áp dụng.'); await load(); } catch (err) { showError(err instanceof ApiError ? err.message : 'Thất bại.'); } }} className={ghostBtn}>Ngừng áp dụng</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MasterDataFrame>
  );
}
