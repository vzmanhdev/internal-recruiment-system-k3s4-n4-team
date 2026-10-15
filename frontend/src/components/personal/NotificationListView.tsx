"use client";

import Link from "next/link";
import React, { useState } from "react";
import { CheckCheck } from "lucide-react";
import { notificationService } from "@/services/notification.service";
import { useApiData } from "@/hooks/useApiData";
import { ApiError } from "@/lib/api-client";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataStates";

/** The user's in-app notifications (S8-03): real rows, unread first, opening the related screen. */
export function NotificationListView() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, error, loading, reload, setData } = useApiData(() => notificationService.list(unreadOnly), [unreadOnly]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const markRead = async (id: number) => {
    try {
      const updated = await notificationService.markRead(id);
      setData((prev) => prev && {
        unread_count: Math.max(0, prev.unread_count - 1),
        items: prev.items.map((n) => (n.id === id ? updated : n)),
      });
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Không cập nhật được thông báo.");
    }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await notificationService.markAllRead();
      reload();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Không cập nhật được thông báo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Thông báo</h1>
          <p className="text-sm text-[#64748B] mt-1">{data ? `${data.unread_count} thông báo chưa đọc` : " "}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-[13px] text-[#334155]">
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="accent-[#2563EB]" /> Chỉ chưa đọc
          </label>
          <button type="button" onClick={markAll} disabled={busy || !data?.unread_count}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E2E8F0] text-[13px] font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
            <CheckCheck className="w-4 h-4" aria-hidden="true" /> Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>
      {notice && <div className="text-sm rounded-xl px-4 py-3 border bg-red-50 border-red-200 text-red-700">{notice}</div>}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.items.length ? <EmptyState /> : (
          <ul className="divide-y divide-[#E2E8F0]">
            {data.items.map((n) => (
              <li key={n.id} className={`px-4 py-3 flex items-start gap-3 ${n.is_read ? "" : "bg-blue-50/40"}`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? "bg-transparent" : "bg-[#2563EB]"}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  {n.link ? (
                    <Link href={n.link} onClick={() => !n.is_read && void markRead(n.id)} className="text-sm font-semibold text-[#0F172A] hover:text-[#2563EB]">{n.title}</Link>
                  ) : (
                    <span className="text-sm font-semibold text-[#0F172A]">{n.title}</span>
                  )}
                  {n.message && <p className="text-[13px] text-[#64748B] mt-0.5">{n.message}</p>}
                  {n.created_at && <p className="text-[11px] text-[#94A3B8] mt-1">{new Date(n.created_at).toLocaleString("vi-VN")}</p>}
                </div>
                {!n.is_read && (
                  <button type="button" onClick={() => void markRead(n.id)} className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer shrink-0">Đã đọc</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
