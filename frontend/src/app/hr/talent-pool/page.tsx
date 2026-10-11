'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, Sparkles, Trash2, Users } from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { requisitionService, type RequisitionItem } from '@/services/requisition.service';
import { useToast } from '@/components/ui/Toast';

interface PoolEntry {
  id: number; full_name: string; email: string; phone?: string; interested_title?: string; skills?: string;
  reason: string; created_at?: string; match?: number;
}

export default function HRTalentPoolPage() {
  const { showSuccess, showError } = useToast();
  const [entries, setEntries] = useState<PoolEntry[]>([]);
  const [reqs, setReqs] = useState<RequisitionItem[]>([]);
  const [q, setQ] = useState('');
  const [reqId, setReqId] = useState('');
  const [suggestions, setSuggestions] = useState<PoolEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (query = '') => {
    try {
      const [pool, open] = await Promise.all([
        apiRequest<PoolEntry[]>(`/talent-pool${query ? `?q=${encodeURIComponent(query)}` : ''}`),
        requisitionService.getRequisitions('approved').catch(() => [] as RequisitionItem[]),
      ]);
      setEntries(pool); setReqs(open); setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được kho ứng viên.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const suggest = async (id: string) => {
    setReqId(id);
    if (!id) { setSuggestions(null); return; }
    try {
      setSuggestions(await apiRequest<PoolEntry[]>(`/talent-pool/suggestions?requisition_id=${id}`));
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Không lấy được gợi ý.');
    }
  };

  const remove = async (e: PoolEntry) => {
    if (!window.confirm(`Đưa ${e.full_name} ra khỏi kho tiềm năng?`)) return;
    try {
      await apiRequest(`/talent-pool/${e.id}`, { method: 'DELETE' });
      setEntries((prev) => prev.filter((x) => x.id !== e.id));
      showSuccess('Đã cập nhật kho ứng viên.');
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Thao tác thất bại.');
    }
  };

  const rows = suggestions ?? entries;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2"><Users className="w-6 h-6 text-blue-600" />Kho Ứng Viên Tiềm Năng</h1>
          <p className="text-xs text-slate-500 mt-1">Ứng viên bị loại ở vòng cuối hoặc từ chối offer được lưu kèm lý do; hệ thống gợi ý khi mở vị trí mới (S5-06).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form onSubmit={(e) => { e.preventDefault(); setSuggestions(null); setReqId(''); setLoading(true); void load(q.trim()); }} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chức danh, kỹ năng, tên..." className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-56" />
          </form>
          <select value={reqId} onChange={(e) => suggest(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
            <option value="">Gợi ý cho vị trí đang mở...</option>
            {reqs.map((r) => <option key={r.id} value={r.id}>{r.code} · {r.title}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {suggestions && <div className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Ứng viên phù hợp với vị trí đã chọn ({suggestions.length})</div>}
        {loading ? (
          <div className="p-10 flex justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-xs text-rose-600">{loadError}</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">Không có ứng viên phù hợp.</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr><th className="p-4">Ứng viên</th><th className="p-4">Quan tâm / Kỹ năng</th><th className="p-4">Lý do lưu</th><th className="p-4 text-right">Thao tác</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((e) => (
                <tr key={e.id}>
                  <td className="p-4"><div className="font-bold text-slate-900">{e.full_name}</div><div className="text-[11px] text-slate-400">{e.email}{e.phone ? ` · ${e.phone}` : ''}</div></td>
                  <td className="p-4"><div className="font-semibold">{e.interested_title || '—'}</div><div className="text-[11px] text-slate-500">{e.skills}</div>{e.match ? <div className="text-[10px] text-blue-600 font-bold">Mức khớp: {e.match}</div> : null}</td>
                  <td className="p-4 text-slate-600">{e.reason}</td>
                  <td className="p-4 text-right"><button onClick={() => remove(e)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer" title="Đưa ra khỏi kho"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
