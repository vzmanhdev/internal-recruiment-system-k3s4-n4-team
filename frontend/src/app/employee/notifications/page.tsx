"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { notificationService, type NotificationItem } from "@/services/notification.service";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api-client";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso + (iso.endsWith("Z") ? "" : "Z")).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function EmployeeNotificationsPage() {
  const { showError } = useToast();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await notificationService.list();
      setItems(res.items);
      setUnread(res.unread_count);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Không tải được thông báo.");
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

  const markRead = async (item: NotificationItem) => {
    if (item.is_read) return;
    try {
      const updated = await notificationService.markRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "Không cập nhật được trạng thái đã đọc.");
    }
  };

  const markAll = async () => {
    try {
      await notificationService.markAllRead();
      reload();
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "Không cập nhật được trạng thái đã đọc.");
    }
  };

  return (
    <EmployeeAppShell activeTab="notifications">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bell className="w-7 h-7 text-[#4285F4]" /> Thông Báo Của Tôi
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">{unread} thông báo chưa đọc</p>
          </div>
          <button onClick={markAll} disabled={unread === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
            <CheckCircle2 className="w-4 h-4" /> Đánh dấu tất cả đã đọc
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
          ) : loadError ? (
            <div className="p-8 text-center text-xs text-rose-600">{loadError}</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">Bạn chưa có thông báo nào.</div>
          ) : (
            items.map((n) => {
              const content = (
                <div className={`p-4 flex gap-3 ${n.is_read ? "" : "bg-blue-50/40"}`}>
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.is_read ? "bg-transparent" : "bg-blue-600"}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">{n.title}</div>
                    {n.message && <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>}
                    <div className="text-[11px] text-slate-400 mt-1">{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => markRead(n)} className="block hover:bg-slate-50">{content}</Link>
              ) : (
                <button key={n.id} onClick={() => markRead(n)} className="block w-full text-left hover:bg-slate-50 cursor-pointer">{content}</button>
              );
            })
          )}
        </div>
      </div>
    </EmployeeAppShell>
  );
}
