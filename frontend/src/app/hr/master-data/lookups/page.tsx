'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { masterDataService, type Category } from '@/services/master-data.service';
import { MasterDataFrame, fieldClass, primaryBtn, ghostBtn } from '@/components/hr/MasterDataFrame';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

const TYPES: Record<string, string> = {
  source: 'Nguồn ứng viên', rejection_reason: 'Lý do loại hồ sơ', work_location: 'Địa điểm làm việc', work_type: 'Hình thức làm việc', tag: 'Nhãn ứng viên',
};

export default function HRLookupsPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('source');
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    try { setItems(await masterDataService.categories()); setError(null); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Không tải được danh mục.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const list = useMemo(() => items.filter((c) => c.category_type === type).sort((a, b) => a.sort_order - b.sort_order), [items, type]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); showSuccess(ok); await load(); } catch (err) { showError(err instanceof ApiError ? err.message : 'Thao tác thất bại.'); }
  };

  const move = (idx: number, dir: -1 | 1) => {
    const ids = list.map((c) => c.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    void run(() => masterDataService.reorderCategories(ids), 'Đã cập nhật thứ tự.');
  };

  return (
    <MasterDataFrame title="Danh mục dùng chung" story="[S2-08]" loading={loading} error={error}
      description="Nguồn ứng viên, lý do loại hồ sơ, địa điểm, hình thức làm việc, nhãn. Giá trị đang được tham chiếu thì không xoá được, chỉ ngừng áp dụng.">
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPES).map(([k, label]) => (
          <button key={k} onClick={() => setType(k)} className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${type === k ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{label}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; void run(() => masterDataService.createCategory({ category_type: type, name: name.trim(), sort_order: list.length }), 'Đã thêm giá trị.'); setName(''); }}
        className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Thêm giá trị cho "${TYPES[type]}"`} className={fieldClass} />
        <button className={primaryBtn}>Thêm</button>
      </form>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">
        {!list.length ? <div className="p-6 text-center text-xs text-slate-500">Chưa có giá trị.</div> : list.map((c, idx) => (
          <div key={c.id} className={`flex items-center justify-between p-3 text-xs ${c.is_active ? '' : 'opacity-60'}`}>
            <span className="font-semibold text-slate-800">{c.name}{!c.is_active && ' (ngừng áp dụng)'}</span>
            <div className="flex gap-1.5">
              <button onClick={() => move(idx, -1)} className={ghostBtn} title="Lên"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(idx, 1)} className={ghostBtn} title="Xuống"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => run(() => masterDataService.updateCategory(c.id, { name: c.name, is_active: !c.is_active }), 'Đã cập nhật.')} className={ghostBtn}>{c.is_active ? 'Ngừng áp dụng' : 'Kích hoạt'}</button>
              <button onClick={() => window.confirm(`Xoá "${c.name}"?`) && run(() => masterDataService.deleteCategory(c.id), 'Đã xoá.')} className={`${ghostBtn} text-rose-600`}>Xoá</button>
            </div>
          </div>
        ))}
      </div>
    </MasterDataFrame>
  );
}
