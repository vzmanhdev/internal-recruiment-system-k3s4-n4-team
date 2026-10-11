'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { masterDataService, type Department, type Headcount } from '@/services/master-data.service';
import { MasterDataFrame, fieldClass, primaryBtn } from '@/components/hr/MasterDataFrame';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

export default function HRHeadcountPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<Headcount[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ department_id: 0, year: new Date().getFullYear(), budget_quantity: 0 });

  const load = useCallback(async () => {
    try {
      const [h, d] = await Promise.all([masterDataService.headcounts(), masterDataService.departments(false)]);
      setItems(h); setDepts(d); setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được ngân sách headcount.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterDataService.saveHeadcount(form);
      showSuccess('Đã lưu chỉ tiêu headcount.');
      await load();
    } catch (err) { showError(err instanceof ApiError ? err.message : 'Lưu thất bại.'); }
  };

  return (
    <MasterDataFrame title="Ngân sách Headcount" story="[S3-04]" loading={loading} error={error}
      description="Chỉ tiêu theo phòng ban và năm. Yêu cầu tuyển dụng vượt chỉ tiêu bị chặn, cần Trưởng phòng Nhân sự xác nhận ghi đè kèm lý do.">
      <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 p-5 grid gap-3 md:grid-cols-4 items-end">
        <label className="text-xs font-semibold">Phòng ban *
          <select required value={form.department_id || ''} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) })} className={fieldClass}>
            <option value="">— Chọn —</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select></label>
        <label className="text-xs font-semibold">Năm *<input required type="number" min={2000} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className={fieldClass} /></label>
        <label className="text-xs font-semibold">Chỉ tiêu (người) *<input required type="number" min={0} value={form.budget_quantity} onChange={(e) => setForm({ ...form, budget_quantity: Number(e.target.value) })} className={fieldClass} /></label>
        <button className={primaryBtn}>Lưu chỉ tiêu</button>
      </form>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {!items.length ? <div className="p-8 text-center text-xs text-slate-500">Chưa khai báo chỉ tiêu nào.</div> : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider"><tr><th className="p-4">Phòng ban</th><th className="p-4">Năm</th><th className="p-4 text-center">Chỉ tiêu</th><th className="p-4 text-center">Đã cam kết</th><th className="p-4 text-center">Còn lại</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((h) => (
                <tr key={h.id}>
                  <td className="p-4 font-bold">{depts.find((d) => d.id === h.department_id)?.name || `#${h.department_id}`}</td>
                  <td className="p-4">{h.year}</td>
                  <td className="p-4 text-center">{h.budget_quantity}</td>
                  <td className="p-4 text-center">{h.committed_quantity}</td>
                  <td className={`p-4 text-center font-bold ${(h.remaining_quantity ?? 0) <= 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{h.remaining_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MasterDataFrame>
  );
}
