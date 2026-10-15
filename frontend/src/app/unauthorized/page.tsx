'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, HelpCircle, Lock } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 antialiased font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-100 text-center space-y-6 relative overflow-hidden">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

        {/* 403 Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-black tracking-wider uppercase">
          <Lock className="w-3.5 h-3.5" />
          <span>HTTP 403 &bull; FORBIDDEN</span>
        </div>

        {/* Centered Large ShieldAlert Icon */}
        <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-50 to-amber-50 border-2 border-rose-100 flex items-center justify-center shadow-inner group">
          <ShieldAlert className="w-12 h-12 text-rose-600 transition-transform duration-300 group-hover:scale-110" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Truy Cập Bị Từ Chối
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Bạn không có quyền truy cập vào dữ liệu này. Vui lòng kiểm tra lại tài khoản hoặc liên hệ Quản trị viên (Admin) để được cấp quyền bổ sung.
          </p>
        </div>

        {/* Context Info Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-500 space-y-1">
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Bạn cần hỗ trợ phân quyền?</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            Nếu đây là một nhầm lẫn, vui lòng liên hệ Bộ phận IT/HR qua email: <span className="font-mono text-slate-600 font-semibold">admin@company.com</span>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer order-2 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang trước</span>
          </button>

          <Link
            href="/employee"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 order-1 sm:order-2"
          >
            <Home className="w-4 h-4" />
            <span>Quay lại Bảng điều khiển</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
