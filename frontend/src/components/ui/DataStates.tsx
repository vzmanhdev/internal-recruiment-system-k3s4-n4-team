"use client";

import { AlertTriangle, Inbox, Loader2, RotateCcw } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { AccessDenied } from "@/components/auth/AccessDenied";

/** Shared loading / empty / error states: real data or an honest state — never demo records. */
export function LoadingState({ label = "Đang tải dữ liệu..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#64748B]" aria-busy="true">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {label}
    </div>
  );
}

export function EmptyState({ title = "Chưa có dữ liệu.", hint }: { title?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Inbox className="w-8 h-8 text-[#94A3B8]" aria-hidden="true" />
      <p className="text-sm font-semibold text-[#334155]">{title}</p>
      {hint && <p className="text-xs text-[#64748B] max-w-sm">{hint}</p>}
    </div>
  );
}

/** API failure: shows the server's message (403 → access-denied screen) with a retry. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  if (error instanceof ApiError && error.status === 403) {
    return <AccessDenied status={403} code={error.code || "FORBIDDEN"} message={error.message} requestId={error.requestId} />;
  }
  const message = error instanceof ApiError ? error.message : "Không tải được dữ liệu. Vui lòng thử lại.";
  const requestId = error instanceof ApiError ? error.requestId : null;
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center" role="alert">
      <AlertTriangle className="w-8 h-8 text-amber-500" aria-hidden="true" />
      <p className="text-sm text-[#334155] max-w-md">{message}</p>
      {requestId && <p className="text-[11px] text-[#94A3B8]">Mã yêu cầu: <span className="font-mono">{requestId}</span></p>}
      {onRetry && (
        <button type="button" onClick={onRetry}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E2E8F0] text-[13px] font-semibold text-[#0F172A] hover:bg-slate-50 cursor-pointer">
          <RotateCcw className="w-4 h-4" aria-hidden="true" /> Thử lại
        </button>
      )}
    </div>
  );
}
