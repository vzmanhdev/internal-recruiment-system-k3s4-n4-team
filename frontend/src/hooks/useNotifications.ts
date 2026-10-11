"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationService, NotificationItem } from "@/services/notification.service";

/** Unread count + latest notifications for header bells; polls every 60s while mounted. */
export function useNotifications(limit = 5) {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const refresh = useCallback(() => {
    return notificationService.list()
      .then((res) => {
        setItems(res.items.slice(0, limit));
        setUnread(res.unread_count);
      })
      .catch(() => {
        // Header bells must never break the page; keep the last known state.
      });
  }, [limit]);

  useEffect(() => {
    let active = true;
    const load = () => notificationService.list()
      .then((res) => {
        if (!active) return;
        setItems(res.items.slice(0, limit));
        setUnread(res.unread_count);
      })
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [limit]);

  const markRead = useCallback(async (id: number) => {
    try {
      await notificationService.markRead(id);
    } finally {
      refresh();
    }
  }, [refresh]);

  return { unread, items, refresh, markRead };
}

export const unreadLabel = (n: number) => (n > 99 ? "99+" : String(n));
