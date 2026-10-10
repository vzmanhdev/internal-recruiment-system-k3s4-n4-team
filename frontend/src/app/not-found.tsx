"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileQuestion, Home, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8 sm:p-12 text-center relative overflow-hidden">
        {/* Top Decorative Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-50 rounded-full blur-2xl pointer-events-none" />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold mb-6">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>MÃ LỖI HTTP: 404 NOT FOUND</span>
        </div>

        {/* Icon */}
        <div className="relative mb-6 flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
            <FileQuestion className="w-12 h-12 text-slate-500" />
          </div>
        </div>

        {/* Main Headings */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Không Tìm Thấy Trang Yêu Cầu
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto mb-8 leading-relaxed">
          Đường dẫn <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200">{pathname}</code> không tồn tại trên hệ thống hoặc đã bị di chuyển sang khu vực làm việc khác.
        </p>

        {/* Single Action Button */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Quay về trang chủ</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
          Hệ thống Tuyển dụng Nội bộ — Báo lỗi hoặc hỗ trợ vui lòng liên hệ Ban Quản Trị Hệ Thống.
        </div>
      </div>
    </div>
  );
}
