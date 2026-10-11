'use client';

import React, { useSyncExternalStore } from 'react';

/** Minimal public frame for candidate self-service pages (no account required). */
export function CandidateFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">Cổng ứng viên</div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

const noopSubscribe = () => () => {};

/** Reads ?token= from the URL on the client: undefined during SSR, then the token or null. */
export function useLinkToken(): string | null | undefined {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get('token'),
    () => undefined,
  );
}

export const candidateInput = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30';
export const candidateBtn = 'w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 cursor-pointer';
