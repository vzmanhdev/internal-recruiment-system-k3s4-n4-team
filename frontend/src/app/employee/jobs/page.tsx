"use client";

import React, { useMemo, useState } from "react";
import { jobService } from "@/services/job.service";
import { useApiData } from "@/hooks/useApiData";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataStates";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { Search, Briefcase, MapPin, Building2, Clock, Star, Gift } from "lucide-react";
import Link from "next/link";

export default function EmployeeJobsPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Published, non-expired postings (the same list the public career page shows)
  const { data, error, loading, reload } = useApiData(async () => {
    const rows = await jobService.getJobs();
    const now = Date.now();
    return rows.map((j) => ({
      id: j.id,
      slug: j.slug,
      title: j.title,
      department: j.department_name || j.department || "",
      location: j.location,
      type: j.type,
      description: (j.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220),
      tags: ((j as { required_skills?: string[] }).required_skills || []).slice(0, 5),
      daysLeft: j.deadline ? Math.max(0, Math.ceil((new Date(j.deadline.slice(0, 10)).getTime() - now) / 86_400_000)) : null,
    }));
  }, []);
  const jobs = useMemo(() => data || [], [data]);
  const departments = useMemo(() => Array.from(new Set(jobs.map((j) => j.department).filter(Boolean))).sort(), [jobs]);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || j.department.includes(deptFilter);
    return matchesSearch && matchesDept;
  });

  return (
    <EmployeeAppShell activeTab="jobs">
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Briefcase className="w-7 h-7 text-[#4285F4]" />
              Vị Trí Tuyển Dụng Nội Bộ
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Khám phá các cơ hội chuyển đổi vị trí nội bộ hoặc giới thiệu ứng viên phù hợp cho công ty.
            </p>
          </div>

          <Link
            href="/employee/referrals/new"
            className="px-4 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            <span>Giới thiệu ứng viên ngay</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm vị trí, từ khóa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Job Cards Grid */}
        {loading && <LoadingState />}
        {error ? <ErrorState error={error} onRetry={reload} /> : null}
        {!loading && !error && filteredJobs.length === 0 && <EmptyState title="Chưa có vị trí tuyển dụng nào đang mở." />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">{job.title}</h3>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {job.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">{job.description}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-gray-200 text-[10px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {job.daysLeft == null ? "Không giới hạn hạn nộp" : `Còn ${job.daysLeft} ngày`}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/employee/referrals/new?jobId=${job.id}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#4285F4] hover:bg-blue-100 font-bold text-xs transition-all"
                  >
                    Giới thiệu
                  </Link>
                  <Link
                    href={`/candidate/jobs/${job.slug || job.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-bold text-xs transition-all"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployeeAppShell>
  );
}
