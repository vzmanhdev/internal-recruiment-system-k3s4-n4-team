'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/** Common page frame for HR master-data screens: header, loading / error / empty states. */
export function MasterDataFrame({ title, story, description, actions, loading, error, empty, children }: {
  title: string; story: string; description: string; actions?: React.ReactNode;
  loading: boolean; error: string | null; empty?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">{story}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
        {actions}
      </div>
      {loading ? (
        <div className="p-10 flex justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</div>
      ) : error ? (
        <div className="p-10 text-center text-xs text-rose-600 bg-white rounded-2xl border border-slate-200">{error}</div>
      ) : empty ? (
        <div className="p-10 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">Chưa có dữ liệu.</div>
      ) : children}
    </div>
  );
}

export const fieldClass = 'w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30';
export const primaryBtn = 'px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50';
export const ghostBtn = 'px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer';
