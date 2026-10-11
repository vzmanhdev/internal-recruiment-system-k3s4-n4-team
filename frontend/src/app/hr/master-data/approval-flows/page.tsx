'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { GitBranch, Plus } from 'lucide-react';
import { masterDataService, type ApprovalFlow, type Department } from '@/services/master-data.service';
import { MasterDataFrame, fieldClass, primaryBtn, ghostBtn } from '@/components/hr/MasterDataFrame';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

const STEP_LABEL: Record<string, string> = { manager: 'Trưởng khối', hr: 'Trưởng phòng Nhân sự', executive: 'Ban Giám đốc' };
const EMPTY = { name: '', department_id: null as number | null, steps: ['manager', 'hr'], min_salary_threshold: 0, max_salary_threshold: 1_000_000_000 };

export default function HRApprovalFlowsPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<ApprovalFlow[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [editing, setEditing] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [f, d] = await Promise.all([masterDataService.approvalFlows(), masterDataService.departments(false)]);
      setItems(f); setDepts(d); setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được luồng duyệt.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const toggleStep = (code: string) => {
    if (!form) return;
    const order = ['manager', 'hr', 'executive'];
    const next = form.steps.includes(code) ? form.steps.filter((s) => s !== code) : [...form.steps, code];
    setForm({ ...form, steps: order.filter((s) => next.includes(s)) });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.steps.length) { showError('Luồng duyệt phải có ít nhất một cấp duyệt.'); return; }
    try {
      await masterDataService.saveApprovalFlow(form, editing ?? undefined);
      showSuccess('Đã lưu luồng duyệt. Các yêu cầu đang chạy giữ nguyên chuỗi duyệt cũ.');
      setForm(null); setEditing(null);
      await load();
    } catch (err) { showError(err instanceof ApiError ? err.message : 'Lưu thất bại.'); }
  };

  return (
    <MasterDataFrame title="Luồng phê duyệt nhiều cấp" story="[S3-01]" loading={loading} error={error}
      description="Chuỗi cấp duyệt theo phòng ban và theo mức lương đề xuất. Lương vượt ngưỡng tự động áp dụng luồng có thêm cấp duyệt cao hơn."
      actions={<button onClick={() => { setForm(EMPTY); setEditing(null); }} className={`${primaryBtn} inline-flex items-center gap-1.5`}><Plus className="w-4 h-4" />Thêm luồng</button>}>
      {form && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 p-5 grid gap-3 md:grid-cols-4">
          <label className="text-xs font-semibold md:col-span-2">Tên luồng *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} /></label>
          <label className="text-xs font-semibold md:col-span-2">Phòng ban
            <select value={form.department_id ?? ''} onChange={(e) => setForm({ ...form, department_id: e.target.value ? Number(e.target.value) : null })} className={fieldClass}>
              <option value="">— Mọi phòng ban —</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
          <label className="text-xs font-semibold">Lương từ (VNĐ)<input type="number" min={0} value={form.min_salary_threshold} onChange={(e) => setForm({ ...form, min_salary_threshold: Number(e.target.value) })} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Đến dưới (VNĐ)<input type="number" min={0} value={form.max_salary_threshold} onChange={(e) => setForm({ ...form, max_salary_threshold: Number(e.target.value) })} className={fieldClass} /></label>
          <div className="text-xs font-semibold md:col-span-2">Các cấp duyệt (theo thứ tự)
            <div className="flex gap-1.5 mt-1">{Object.entries(STEP_LABEL).map(([k, label]) => (
              <button type="button" key={k} onClick={() => toggleStep(k)} className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${form.steps.includes(k) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>{label}</button>
            ))}</div>
          </div>
          <div className="md:col-span-4 flex justify-end gap-2"><button type="button" onClick={() => setForm(null)} className={ghostBtn}>Huỷ</button><button className={primaryBtn}>Lưu</button></div>
        </form>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {!items.length && <div className="text-xs text-slate-500">Chưa cấu hình luồng nào — mặc định: Trưởng khối → Trưởng phòng Nhân sự.</div>}
        {items.map((f) => (
          <div key={f.id} className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-2 ${f.status !== 'active' ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start gap-2">
              <div><div className="font-bold text-slate-900 inline-flex items-center gap-1.5"><GitBranch className="w-4 h-4 text-blue-600" />{f.name}</div>
                <div className="text-[11px] text-slate-400">{depts.find((d) => d.id === f.department_id)?.name || 'Mọi phòng ban'} · {f.min_salary_threshold.toLocaleString('vi-VN')} – {f.max_salary_threshold.toLocaleString('vi-VN')} VNĐ</div></div>
              <div className="flex gap-1.5">
                <button onClick={() => { setEditing(f.id); setForm({ name: f.name, department_id: f.department_id, steps: f.steps, min_salary_threshold: f.min_salary_threshold, max_salary_threshold: f.max_salary_threshold }); }} className={ghostBtn}>Sửa</button>
                {f.status === 'active' && <button onClick={async () => { try { await masterDataService.deactivateApprovalFlow(f.id); await load(); } catch (err) { showError(err instanceof ApiError ? err.message : 'Thất bại.'); } }} className={ghostBtn}>Ngừng</button>}
              </div>
            </div>
            <div className="text-xs text-slate-700">{f.steps.map((s) => STEP_LABEL[s] || s).join(' → ')}</div>
          </div>
        ))}
      </div>
    </MasterDataFrame>
  );
}
