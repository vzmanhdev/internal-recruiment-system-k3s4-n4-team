"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Lock, ServerCrash, ShieldAlert } from "lucide-react";

interface Props {
  status: 403 | 503;
  code: string;
  message: string;
  requestId?: string | null;
  path?: string | null;
  homeHref?: string;
}

/** Shared Vietnamese access-denied / unavailable screen (rendered by /forbidden and by in-page 403s). */
export function AccessDenied({ status, code, message, requestId, path, homeHref = "/workspace" }: Props) {
  const router = useRouter();
  const unavailable = status === 503;
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-[#F7F9FC]">
      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-5 shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          {unavailable ? <ServerCrash className="w-8 h-8 text-[#2563EB]" /> : <ShieldAlert className="w-8 h-8 text-[#2563EB]" />}
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
          <Lock className="w-3.5 h-3.5" /> HTTP {status} · {code}
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[#0F172A]">
            {unavailable ? "Tạm thời không thể kiểm tra quyền truy cập" : "Bạn không có quyền truy cập"}
          </h1>
          <p className="text-sm text-[#64748B] leading-relaxed">{message}</p>
          {path && <p className="text-xs text-slate-400">Trang yêu cầu: <span className="font-mono">{path}</span></p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href={homeHref} className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold">
            <Home className="w-4 h-4" /> Quay về trang chủ
          </Link>
          <button type="button" onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 text-sm font-semibold cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>
        </div>
        {requestId && <p className="text-[11px] text-slate-400">Mã yêu cầu: <span className="font-mono">{requestId}</span></p>}
      </div>
    </div>
  );
}
