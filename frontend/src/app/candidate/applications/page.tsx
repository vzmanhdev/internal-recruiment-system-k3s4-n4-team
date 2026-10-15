"use client";

import Link from "next/link";
import { apiRequest } from "@/lib/api-client";
import { useApiData } from "@/hooks/useApiData";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataStates";

/** What the API returns to an applicant about their own applications (candidate view, no internal notes). */
interface MyApplication {
  id: number;
  job_posting_id: number;
  job_title?: string | null;
  department?: string | null;
  status: string;
  public_status?: string;
  tracking_code?: string | null;
  applied_date?: string | null;
}

export default function CandidateApplicationsPage() {
  const { data, error, loading, reload } = useApiData(() => apiRequest<MyApplication[]>("/applications"));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Hồ sơ đã nộp</h1>
        <p className="text-sm text-[#64748B] mt-1">Trạng thái hiển thị ở mức tổng quát; nhận xét nội bộ không được chia sẻ.</p>
      </div>
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? (
          <EmptyState hint="Bạn chưa nộp hồ sơ nào." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-[#64748B]">
                <tr><th className="px-4 py-3">Vị trí</th><th className="px-4 py-3">Phòng ban</th><th className="px-4 py-3">Mã tra cứu</th><th className="px-4 py-3">Ngày nộp</th><th className="px-4 py-3">Trạng thái</th></tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {data.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-semibold"><Link href={`/candidate/jobs/${a.job_posting_id}`} className="hover:text-[#2563EB]">{a.job_title || "—"}</Link></td>
                    <td className="px-4 py-3 text-[#64748B]">{a.department || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.tracking_code || "—"}</td>
                    <td className="px-4 py-3 text-[#64748B]">{a.applied_date || "—"}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold">{a.public_status || a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
