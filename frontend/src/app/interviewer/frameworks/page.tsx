'use client';

import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { masterDataService } from '@/services/master-data.service';
import { useApiData } from '@/hooks/useApiData';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';

/** Read-only view of the active competency frameworks used to generate scorecards (S2-06, S6-07). */
export default function CompetencyFrameworksPage() {
  const { data, error, loading, reload } = useApiData(() => masterDataService.frameworks());
  const frameworks = (data || []).filter((f) => f.status === 'active');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Khung Năng Lực Chuẩn (Competency Framework)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bộ tiêu chí và trọng số dùng để sinh phiếu đánh giá phỏng vấn theo từng chức danh
            </p>
          </div>
        </div>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : frameworks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><EmptyState hint="Chưa có khung năng lực nào được kích hoạt." /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {frameworks.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900">{f.name}</h2>
                <p className="text-[11px] text-slate-400 font-mono">{f.code}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(f.applied_job_titles || []).map((t) => (
                    <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{t}</span>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Tiêu chí chấm điểm (thang 1–5):</span>
                <ul className="space-y-2 text-xs text-slate-600">
                  {f.criteria.map((c) => (
                    <li key={c.id || c.code} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="flex-1">{c.name}{c.description ? <span className="block text-[11px] text-slate-400">{c.description}</span> : null}</span>
                      <span className="text-[11px] font-bold text-slate-500">{c.weight}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
