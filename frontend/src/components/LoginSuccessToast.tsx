"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

export function LoginSuccessToast() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = () => {
    // Xóa các timer đang chạy nếu có
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    setIsVisible(true);

    // Kích hoạt hiệu ứng trượt vào (slide-in) ở frame tiếp theo
    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsAnimating(true);
      }, 50);
    });

    // Tự động kích hoạt trượt ra ngoài sau 3.5 giây
    hideTimerRef.current = setTimeout(() => {
      handleClose();
    }, 3500);
  };

  const handleClose = () => {
    // Trượt ra ngoài và mờ dần
    setIsAnimating(false);

    // Đợi 500ms để transition kết thúc rồi mới ẩn hoàn toàn (unmount)
    exitTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 500);
  };

  useEffect(() => {
    // Kiểm tra cờ justLoggedIn trong sessionStorage
    if (typeof window !== "undefined") {
      const justLoggedIn = sessionStorage.getItem("justLoggedIn");
      if (justLoggedIn === "true") {
        // Xóa ngay lập tức để người dùng F5 tải lại trang sẽ không bị lặp lại
        sessionStorage.removeItem("justLoggedIn");
        triggerToast();
      }
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-6 right-6 z-[9999] transition-all duration-500 ease-out transform pointer-events-auto ${
        isAnimating
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div className="flex items-center gap-3.5 bg-white text-slate-800 px-4 py-3.5 rounded-2xl shadow-2xl border border-gray-100 min-w-[300px] max-w-[380px]">
        {/* Icon dấu tích (Check Circle) màu xanh lá cây */}
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
        </div>

        {/* Nội dung thông báo: Dòng chữ "Đăng nhập thành công" */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-sm font-semibold text-slate-900 tracking-tight leading-snug">
            Đăng nhập thành công
          </p>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            Chào mừng bạn quay trở lại hệ thống!
          </p>
        </div>

        {/* Nút đóng nhanh */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng thông báo"
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default LoginSuccessToast;
