"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCw, Home, ArrowLeft, ShieldAlert } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console or error tracker
    console.error("Ghi nhận sự cố giao diện / HTTP Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-50 rounded-full blur-2xl pointer-events-none" />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold mb-6">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          <span>MÃ LỖI HTTP 500 / SYSTEM ERROR</span>
        </div>

        {/* Icon */}
        <div className="relative mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
            <AlertOctagon className="w-10 h-10" />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Không Thể Tải Nội Dung Hoặc Xảy Ra Sự Cố Xử Lý
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto mb-6 leading-relaxed">
          Hệ thống gặp gián đoạn tạm thời khi phản hồi yêu cầu. Đội ngũ kỹ thuật đã ghi nhận chi tiết lỗi này để xử lý.
        </p>

        {error?.message && (
          <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] text-slate-600 break-all max-h-32 overflow-y-auto">
            <span className="font-bold text-slate-800 block mb-1">Chi tiết kỹ thuật:</span>
            {error.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử tải lại nội dung</span>
          </button>

          <Link
            href="/hr/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>Về Trang Chủ Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
