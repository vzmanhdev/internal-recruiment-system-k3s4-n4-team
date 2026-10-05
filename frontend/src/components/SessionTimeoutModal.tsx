"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogIn } from "lucide-react";
import { clearAuthSession } from "@/features/auth/lib/auth-session";
import { authService } from "@/features/auth/services/auth.service";

export interface SessionTimeoutModalProps {
  isOpen: boolean;
  onLoginAgain?: () => void;
  title?: string;
  message?: string;
}

export function SessionTimeoutModal({
  isOpen,
  onLoginAgain,
  title = "Phiên đăng nhập đã hết hạn",
  message = "Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống",
}: SessionTimeoutModalProps) {
  const router = useRouter();

  // Ngăn chặn phím Escape để modal không thể bị đóng
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReLogin = () => {
    // 1. Xóa phiên và token hiện tại
    try {
      authService.logout();
      clearAuthSession();
    } catch {
      // ignore
    }

    if (onLoginAgain) {
      onLoginAgain();
    }

    // 2. Chuyển hướng người dùng về trang /login
    router.push("/login");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md select-none animate-in fade-in duration-300"
    >
      <div className="bg-white rounded-3xl p-7 sm:p-9 max-w-[440px] w-full shadow-[0_25px_60px_rgba(15,23,42,0.35)] border border-gray-100 text-center animate-in zoom-in-95 duration-200">
        {/* Icon Cảnh báo (Màu vàng/cam) */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-5">
          <AlertTriangle className="w-9 h-9 text-amber-500 animate-pulse" />
        </div>

        {/* Tiêu đề Modal */}
        <h3
          id="session-timeout-title"
          className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2"
        >
          {title}
        </h3>

        {/* Thông báo */}
        <p
          id="session-timeout-desc"
          className="text-sm text-slate-600 mb-7 leading-relaxed max-w-[340px] mx-auto"
        >
          {message}
        </p>

        {/* Duy nhất một nút "Đăng nhập lại" (màu xanh chủ đạo) */}
        <div>
          <button
            type="button"
            onClick={handleReLogin}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#4285F4] hover:bg-[#3367D6] active:bg-[#2057C2] text-white font-semibold text-base shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <LogIn className="w-5 h-5" />
            <span>Đăng nhập lại</span>
          </button>
        </div>
      </div>
    </div>
  );
}
