'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { masterDataService, type Department, type Person } from '@/services/master-data.service';
import { MasterDataFrame, fieldClass, primaryBtn, ghostBtn } from '@/components/hr/MasterDataFrame';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

const EMPTY = { name: '', code: '', parent_id: null as number | null, head_user_id: null as number | null, sort_order: 0 };

export default function HRDepartmentsPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<Department[]>([]);
  const [heads, setHeads] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, hm] = await Promise.all([masterDataService.departments(), masterDataService.people('hiring_manager').catch(() => [] as Person[])]);
      setItems(d); setHeads(hm); setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được phòng ban.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterDataService.saveDepartment(form, editing ?? undefined);
      showSuccess(editing ? 'Đã cập nhật phòng ban.' : 'Đã tạo phòng ban.');
      setOpen(false); setEditing(null); setForm(EMPTY);
      await load();
    } catch (err) { showError(err instanceof ApiError ? err.message : 'Lưu thất bại.'); }
  };

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); showSuccess(ok); await load(); } catch (err) { showError(err instanceof ApiError ? err.message : 'Thao tác thất bại.'); }
  };

  const nameOf = (id: number | null) => items.find((d) => d.id === id)?.name || '—';
  const depth = (d: Department): number => { let n = 0, cur = d; while (cur.parent_id && n < 10) { const p = items.find((x) => x.id === cur.parent_id); if (!p) break; cur = p; n++; } return n; };
  const ordered = [...items].sort((a, b) => nameOf(a.parent_id).localeCompare(nameOf(b.parent_id)) || a.sort_order - b.sort_order);

  return (
    <MasterDataFrame title="Cơ cấu Phòng ban" story="[S2-04]" loading={loading} error={error} empty={!items.length && !open}
      description="Phòng ban dạng cây nhiều cấp, mỗi phòng ban có một người phụ trách; phòng ban đang được tham chiếu chỉ có thể ngừng áp dụng."
      actions={<button onClick={() => { setOpen(true); setEditing(null); setForm(EMPTY); }} className={`${primaryBtn} inline-flex items-center gap-1.5`}><Plus className="w-4 h-4" />Thêm phòng ban</button>}>
      {open && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 p-5 grid gap-3 md:grid-cols-4 mb-4">
          <label className="text-xs font-semibold">Mã *<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Tên *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} /></label>
          <label className="text-xs font-semibold">Phòng ban cha
            <select value={form.parent_id ?? ''} onChange={(e) => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })} className={fieldClass}>
              <option value="">— Không —</option>{items.filter((d) => d.id !== editing).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
          <label className="text-xs font-semibold">Người phụ trách
            <select value={form.head_user_id ?? ''} onChange={(e) => setForm({ ...form, head_user_id: e.target.value ? Number(e.target.value) : null })} className={fieldClass}>
              <option value="">— Chưa chọn —</option>{heads.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select></label>
          <div className="md:col-span-4 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className={ghostBtn}>Huỷ</button><button className={primaryBtn}>Lưu</button></div>
        </form>
      )}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider"><tr><th className="p-4">Phòng ban</th><th className="p-4">Trực thuộc</th><th className="p-4">Người phụ trách</th><th className="p-4">Trạng thái</th><th className="p-4 text-right">Thao tác</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {ordered.map((d) => (
              <tr key={d.id} className={d.is_active ? '' : 'opacity-60'}>
                <td className="p-4" style={{ paddingLeft: 16 + depth(d) * 18 }}><div className="font-bold text-slate-900 inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-600" />{d.name}</div><div className="text-[11px] text-slate-400 font-mono">{d.code}</div></td>
                <td className="p-4">{nameOf(d.parent_id)}</td>
                <td className="p-4">{heads.find((p) => p.id === d.head_user_id)?.full_name || '—'}</td>
                <td className="p-4">{d.is_active ? <span className="text-emerald-700 font-bold">Đang áp dụng</span> : <span className="text-slate-500 font-bold">Ngừng áp dụng</span>}</td>
                <td className="p-4 text-right whitespace-nowrap space-x-1.5">
                  <button onClick={() => { setEditing(d.id); setForm({ name: d.name, code: d.code, parent_id: d.parent_id, head_user_id: d.head_user_id, sort_order: d.sort_order }); setOpen(true); }} className={ghostBtn}>Sửa</button>
                  <button onClick={() => act(() => masterDataService.setDepartmentActive(d.id, !d.is_active), d.is_active ? 'Đã ngừng áp dụng.' : 'Đã kích hoạt lại.')} className={ghostBtn}>{d.is_active ? 'Ngừng áp dụng' : 'Kích hoạt'}</button>
                  <button onClick={() => window.confirm(`Xoá phòng ban ${d.name}?`) && act(() => masterDataService.deleteDepartment(d.id), 'Đã xoá phòng ban.')} className={`${ghostBtn} text-rose-600`}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MasterDataFrame>
  );
}
