"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Building2, Clock3, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { fetchPublicJobs, type JobPostingItem } from "@/features/jobs/services/job-posting.service";

const employmentLabels: Record<string, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  contract: "Hợp đồng",
  internship: "Thực tập",
};

export function PublicJobsPortal() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublicJobs({ page_size: 100 })
      .then((result) => setJobs(result.items))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Không tải được danh sách việc làm."))
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(() => Array.from(new Set(jobs.map((job) => job.work_location).filter(Boolean))), [jobs]);
  const filtered = useMemo(() => jobs.filter((job) => {
    const content = `${job.title} ${job.department_name || ""} ${job.job_description || ""} ${job.requirements || ""}`.toLowerCase();
    return content.includes(search.trim().toLowerCase())
      && (!location || job.work_location === location)
      && (!employmentType || job.employment_type === employmentType);
  }), [jobs, search, location, employmentType]);

  return (
    <div className="public-site min-h-screen text-slate-800">
      <Header />
      <section className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="container relative py-14 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-bold text-blue-700 shadow-sm">
              <BriefcaseBusiness className="h-4 w-4" /> Cổng ứng tuyển
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Cơ hội phù hợp đang chờ bạn</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Tìm vị trí theo kỹ năng, địa điểm và hình thức làm việc. Bạn có thể xem tin và nộp hồ sơ mà không cần đăng nhập.</p>
          </div>
          <div className="mt-8 grid gap-3 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-blue-900/5 backdrop-blur md:grid-cols-[1fr_220px_220px]">
            <label className="relative">
              <span className="sr-only">Tìm kiếm công việc</span>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên vị trí, kỹ năng hoặc phòng ban" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white" />
            </label>
            <select value={location} onChange={(event) => setLocation(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500">
              <option value="">Tất cả địa điểm</option>
              {locations.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-500">
              <option value="">Mọi hình thức</option>
              {Object.entries(employmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
      </section>

      <main className="container py-10 sm:py-14">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600"><SlidersHorizontal className="h-4 w-4" /> Kết quả phù hợp</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{filtered.length} vị trí đang tuyển</h2>
          </div>
          <Link href="/application-status" className="text-sm font-bold text-blue-600 hover:text-blue-800">Đã ứng tuyển? Tra cứu hồ sơ →</Link>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{error}</div>}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map((item) => <div key={item} className="h-64 animate-pulse rounded-3xl bg-slate-200" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-4 text-lg font-bold">Chưa có vị trí phù hợp</h3><p className="mt-1 text-sm text-slate-500">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p></div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => (
              <article key={job.id} className="group flex min-h-72 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><BriefcaseBusiness /></div>
                  {job.is_featured && <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">Nổi bật</span>}
                </div>
                <h3 className="mt-5 text-xl font-black leading-snug text-slate-950 group-hover:text-blue-700">{job.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{job.job_description || "Khám phá cơ hội phát triển cùng đội ngũ của chúng tôi."}</p>
                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-500" />{job.department_name || "Phòng ban tuyển dụng"}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-500" />{job.work_location}</div>
                  <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-blue-500" />{employmentLabels[job.employment_type] || job.employment_type}</div>
                </div>
                <Link href={`/jobs/${job.id}`} className="mt-auto pt-6 font-bold text-blue-600">Xem chi tiết và ứng tuyển →</Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
