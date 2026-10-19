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
  const { data, error, loading, reload } = useApiData(() => apiRequest<MyApplication[]>("/applications?mine=true"));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Hồ sơ đã nộp của tôi</h1>
        <p className="text-sm text-[#64748B] mt-1">Trạng thái hiển thị ở mức tổng quát; nhận xét nội bộ không được chia sẻ.</p>
      </div>
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
        {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : !data?.length ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">Bạn chưa nộp hồ sơ ứng tuyển nào</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Các vị trí việc làm mới nhất đang chờ bạn khám phá. Hãy nộp hồ sơ ngay hôm nay!
            </p>
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Khám phá cơ hội việc làm
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-[#64748B]">
                <tr>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3">Phòng ban</th>
                  <th className="px-4 py-3">Mã tra cứu</th>
                  <th className="px-4 py-3">Ngày nộp</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {data.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold"><Link href={`/candidate/jobs/${a.job_posting_id}`} className="hover:text-[#2563EB]">{a.job_title || "—"}</Link></td>
                    <td className="px-4 py-3 text-[#64748B]">{a.department || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{a.tracking_code || `APP-${String(a.id).padStart(6, '0')}`}</td>
                    <td className="px-4 py-3 text-[#64748B]">{a.applied_date || "—"}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold">{a.public_status || a.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/candidate/track?code=${a.tracking_code || `APP-${String(a.id).padStart(6, '0')}`}`}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                      >
                        Tra cứu
                      </Link>
                    </td>
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
