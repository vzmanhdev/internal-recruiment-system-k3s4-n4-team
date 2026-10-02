"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  Eye,
  Plus,
  Search,
} from "lucide-react";
import { AdminShell } from "./AdminShell";
import { fetchPublicJobs, type JobPostingItem } from "@/features/jobs/services/job-posting.service";

export function AdminJobsManagement() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchPublicJobs()
      .then((res) => setJobs(res.items || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.department_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.code ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Vị trí Tuyển dụng</h1>
            <p className="mt-1 text-sm text-slate-500">
              Giám sát tất cả các tin tuyển dụng và vị trí công việc trong toàn hệ thống.
            </p>
          </div>
          <Link
            href="/hr/requisitions"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-hover hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Tạo vị trí mới
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mã tin, vị trí, phòng ban..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản (Published)</option>
              <option value="draft">Bản nháp (Draft)</option>
              <option value="closed">Đã đóng (Closed)</option>
            </select>
          </div>
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <p className="mt-3 font-semibold text-slate-900">Không tìm thấy vị trí tuyển dụng nào</p>
            <p className="mt-1 text-xs text-slate-500">Dữ liệu hiện đang trống hoặc không khớp với bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Mã & Vị trí tuyển dụng</th>
                  <th className="px-5 py-4">Phòng ban</th>
                  <th className="px-5 py-4">Địa điểm & Loại</th>
                  <th className="px-5 py-4 text-center">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-mono text-xs font-semibold text-blue-600">{job.code}</span>
                        <p className="font-bold text-slate-900">{job.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span>{job.department_name ?? "Toàn công ty"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{job.work_location ?? "Hà Nội / Hồ Chí Minh"}</div>
                      <div className="text-xs text-slate-400">{job.employment_type ?? "Full-time"}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {job.status === "published" ? "Đã đăng tin" : job.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
