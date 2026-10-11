'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, RefreshCw, UserCheck } from 'lucide-react';
import { offerService, type OfferItem } from '@/services/offer.service';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

export default function HROnboardingPage() {
  const { showError } = useToast();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setOffers(await offerService.getOffers('accepted'));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu onboarding.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    void load();
  };

  const toggle = async (offer: OfferItem, itemId: number, completed: boolean) => {
    setBusyItem(itemId);
    try {
      const updated = await offerService.updateOnboardingItem(offer.id, itemId, { is_completed: completed });
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Không cập nhật được mục onboarding.');
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Checklist Onboarding Nhân Sự Mới</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">[S7-08]</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Checklist được sinh tự động khi ứng viên chấp nhận offer; ứng viên chuyển sang “Đã onboard” khi hoàn tất 100%.</p>
        </div>
        <button onClick={reload} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      {loading ? (
        <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
      ) : loadError ? (
        <div className="p-10 text-center text-xs text-rose-600 bg-white rounded-2xl border border-slate-200">{loadError}</div>
      ) : offers.length === 0 ? (
        <div className="p-10 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">Chưa có ứng viên nào chấp nhận offer.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {offers.map((offer) => {
            const progress = offer.onboarding_progress ?? 0;
            return (
              <div key={offer.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-blue-600" />{offer.candidate_name}</div>
                    <div className="text-[11px] text-slate-500">{offer.job_title} · Ngày đi làm {offer.start_date}</div>
                  </div>
                  <span className={`text-[11px] font-extrabold ${progress === 100 ? 'text-emerald-600' : 'text-slate-700'}`}>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <ul className="space-y-2">
                  {(offer.onboarding || []).map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-xs">
                      <button disabled={busyItem === item.id} onClick={() => toggle(offer, item.id, !item.is_completed)}
                        className="flex items-center gap-2 text-left cursor-pointer disabled:opacity-50">
                        {busyItem === item.id ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          : item.is_completed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-300" />}
                        <span className={item.is_completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>{item.task_name}</span>
                      </button>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {item.assigned_role}{item.responsible_user_name ? ` · ${item.responsible_user_name}` : ''}{item.due_date ? ` · hạn ${item.due_date}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
