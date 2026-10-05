"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseSessionTimeoutOptions {
  timeoutMinutes?: number;
  enabled?: boolean;
  onTimeout?: () => void;
}

export function useSessionTimeout({
  timeoutMinutes = 15,
  enabled = true,
  onTimeout,
}: UseSessionTimeoutOptions = {}) {
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const handleTimeout = useCallback(() => {
    setIsExpired(true);
    if (onTimeout) {
      onTimeout();
    }
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (isExpired) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (enabled) {
      timerRef.current = setTimeout(handleTimeout, timeoutMs);
    }
  }, [enabled, handleTimeout, isExpired, timeoutMs]);

  // Kích hoạt mô phỏng hết hạn ngay lập tức (dùng cho test/review)
  const triggerMockTimeout = useCallback(() => {
    handleTimeout();
  }, [handleTimeout]);

  useEffect(() => {
    if (!enabled) return;

    // Các sự kiện người dùng tương tác để reset bộ đếm thời gian
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    const handleUserActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Khởi chạy timer lần đầu
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [enabled, resetTimer]);

  return {
    isExpired,
    setIsExpired,
    resetTimer,
    triggerMockTimeout,
  };
}
