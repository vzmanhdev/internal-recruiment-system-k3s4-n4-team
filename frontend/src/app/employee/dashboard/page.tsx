"use client";

import React, { useMemo, useState } from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import {
  Search,
  Briefcase,
  Users,
  Calendar,
  Clock,
  MapPin,
  Building2,
  ArrowRight,
  Star,
  ShieldCheck,
  Target,
  Handshake,
  CheckCircle2,
  Bell,
  ChevronRight,
  FileText,
  UserCheck,
  Video
} from "lucide-react";
import Link from "next/link";
import { jobService } from "@/services/job.service";
import { interviewService } from "@/services/interview.service";
import { referralService } from "@/services/referral.service";
import { notificationService } from "@/services/notification.service";
import { useApiData } from "@/hooks/useApiData";
import { useAuth } from "@/providers/auth-provider";

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
const ago = (iso: string | undefined, now: number) => {
  if (!iso) return "";
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  return m < 60 ? `${m} phút trước` : m < 1440 ? `${Math.round(m / 60)} giờ trước` : `${Math.round(m / 1440)} ngày trước`;
};

/** Everything on the employee home page, loaded once from the real API. */
async function loadHome() {
  const [jobs, mine, all, refs, notes] = await Promise.all([
    jobService.getJobs(),
    interviewService.getMine().catch(() => []),
    interviewService.getInterviews().catch(() => []),
    referralService.getReferrals().catch(() => []),
    notificationService.list().catch(() => ({ items: [], unread_count: 0 })),
  ]);
  const now = Date.now();
  const sessions = [...mine, ...all.filter((i) => i.is_own_application && !mine.some((m) => m.id === i.id))]
    .filter((i) => i.status === "scheduled" && new Date(i.scheduled_time).getTime() >= now - 2 * 3_600_000)
    .sort((x, y) => x.scheduled_time.localeCompare(y.scheduled_time));
  return {
    now,
    jobs: jobs.map((j, idx) => ({
      id: j.id,
      slug: j.slug,
      title: j.title,
      department: j.department_name || j.department || "",
      location: j.location,
      type: j.type,
      description: (j.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
      tags: ((j as { required_skills?: string[] }).required_skills || []).slice(0, 4),
      daysLeft: j.deadline ? Math.max(0, Math.ceil((new Date(j.deadline.slice(0, 10)).getTime() - now) / DAY_MS)) : null,
      publishedAt: j.published_at || j.created_at || "",
      isFeatured: idx < 2,
      isRecommended: false,
    })),
    interviews: sessions.slice(0, 3).map((i) => {
      const start = new Date(i.scheduled_time);
      const end = new Date(start.getTime() + i.duration_minutes * 60_000);
      return {
        id: i.id,
        day: pad(start.getDate()),
        month: `Th${start.getMonth() + 1}`,
        title: i.is_own_application ? `Phỏng vấn vị trí ${i.job_title || ""}` : `Phỏng vấn ứng viên ${i.candidate_name || ""}`,
        time: `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`,
        online: !!i.meeting_link,
        place: i.meeting_link ? "Online" : i.location,
      };
    }),
    upcomingCount: sessions.length,
    referrals: refs.slice(0, 3).map((r) => ({
      id: r.id,
      initials: r.candidate_name.split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase(),
      name: r.candidate_name,
      sub: `${r.job_title || ""} • ${r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : ""}`,
      status: r.status === "hired" || r.payout_status === "paid" || r.payout_status === "eligible" ? "Đã tuyển" : r.candidate_status || "Đang xét duyệt",
    })),
    referralCount: refs.length,
    notifications: notes.items.slice(0, 3),
  };
}

export default function EmployeeDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"featured" | "recommended" | "latest">("featured");
  const [bookmarkedJobs, setBookmarkedJobs] = useState<number[]>([]);
  const { user } = useAuth();
  const { data: home } = useApiData(loadHome, []);
  // "Phù hợp với bạn": postings whose title / skills share a keyword with the employee's own job title
  const jobs = useMemo(() => {
    const words = (user?.job_title || "").toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
    return (home?.jobs || []).map((j) => ({
      ...j,
      isRecommended: words.length > 0 && words.some((w) => j.title.toLowerCase().includes(w) || j.tags.some((t) => t.toLowerCase().includes(w))),
    }));
  }, [home, user?.job_title]);

  const toggleBookmark = (id: number) => {
    setBookmarkedJobs((prev) =>
      prev.includes(id) ? prev.filter((jId) => jId !== id) : [...prev, id]
    );
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredJobs = (activeTab === "latest" ? [...jobs].sort((x, y) => y.publishedAt.localeCompare(x.publishedAt)) : jobs)
    .filter((job) => {
      if (activeTab === "recommended" && !job.isRecommended) return false;
      return !q || job.title.toLowerCase().includes(q) || job.department.toLowerCase().includes(q) || job.tags.some((t) => t.toLowerCase().includes(q));
    });

  return (
    <EmployeeAppShell activeTab="home">
      <div className="space-y-6 w-full">
        {/* 1. HERO BANNER CARD (Soft Blue Light Background with Graphic & Search) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50/50 p-6 sm:p-8 border border-blue-100/80 shadow-xs">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left text greeting & search input */}
            <div className="space-y-5 max-w-2xl">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Xin chào, {user?.full_name || "bạn"}! <span className="inline-block animate-bounce">👋</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
                  Cùng khám phá các cơ hội nghề nghiệp nội bộ và đóng góp nhân tài cho công ty.
                </p>
              </div>

              {/* Banner Search Input with Button */}
              <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200/80 shadow-xs max-w-xl">
                <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Tìm kiếm vị trí, phòng ban, kỹ năng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none placeholder:text-slate-400"
                />
                <button className="px-5 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 shrink-0 cursor-pointer">
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm kiếm</span>
                </button>
              </div>
            </div>

            {/* Right badges & illustration simulation */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-blue-100 flex items-center gap-2.5 text-xs font-bold text-slate-800 shadow-xs">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#4285F4] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Phát triển sự nghiệp</span>
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-blue-100 flex items-center gap-2.5 text-xs font-bold text-slate-800 shadow-xs">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <span>Cơ hội nội bộ</span>
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/90 backdrop-blur-xs border border-blue-100 flex items-center gap-2.5 text-xs font-bold text-slate-800 shadow-xs">
                <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Handshake className="w-4 h-4" />
                </div>
                <span>Đồng hành cùng công ty</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 4 QUICK STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{jobs.length}</div>
              <div className="text-xs font-medium text-slate-500">Tin tuyển dụng đang mở</div>
              <Link href="/employee/jobs" className="text-[11px] font-bold text-[#4285F4] hover:underline flex items-center gap-1 pt-1">
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{jobs.filter((j) => j.isRecommended).length}</div>
              <div className="text-xs font-medium text-slate-500">Vị trí phù hợp với bạn</div>
              <Link href="/employee/jobs?filter=recommended" className="text-[11px] font-bold text-[#4285F4] hover:underline flex items-center gap-1 pt-1">
                <span>Xem gợi ý</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-2">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{home?.referralCount ?? 0}</div>
              <div className="text-xs font-medium text-slate-500">Ứng viên đã giới thiệu</div>
              <Link href="/employee/referrals" className="text-[11px] font-bold text-[#4285F4] hover:underline flex items-center gap-1 pt-1">
                <span>Xem chi tiết</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{home?.upcomingCount ?? 0}</div>
              <div className="text-xs font-medium text-slate-500">Lịch phỏng vấn sắp tới</div>
              <Link href="/employee/interviews" className="text-[11px] font-bold text-[#4285F4] hover:underline flex items-center gap-1 pt-1">
                <span>Xem lịch</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. MAIN CONTENT (2 COLUMNS GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: MAIN JOBS FEED (2 Cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Segmented Control Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-3 text-xs font-bold">
              <button
                onClick={() => setActiveTab("featured")}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === "featured"
                    ? "bg-[#4285F4] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tin tuyển dụng nổi bật
              </button>
              <button
                onClick={() => setActiveTab("recommended")}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === "recommended"
                    ? "bg-[#4285F4] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Vị trí phù hợp
              </button>
              <button
                onClick={() => setActiveTab("latest")}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === "latest"
                    ? "bg-[#4285F4] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tin mới nhất
              </button>
            </div>

            {/* 2-Column Job Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    {/* Top Tag & Bookmark star */}
                    <div className="flex items-center justify-between">
                      {job.isFeatured ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-extrabold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-rose-500" />
                          NỔI BẬT
                        </span>
                      ) : (
                        <span></span>
                      )}

                      <button
                        onClick={() => toggleBookmark(job.id)}
                        className="p-1 text-slate-300 hover:text-amber-500 cursor-pointer transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            bookmarkedJobs.includes(job.id) ? "fill-amber-400 text-amber-400" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Job Title */}
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#4285F4] transition-colors leading-tight">
                      {job.title}
                    </h3>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {job.type}
                      </span>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {job.description}
                    </p>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-gray-200 text-[10px] font-bold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {job.daysLeft == null ? "Không giới hạn hạn nộp" : `Còn ${job.daysLeft} ngày`}
                    </span>

                    <Link
                      href={`/candidate/jobs/${job.slug || job.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-bold text-xs transition-all shadow-xs"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: 3 INTERACTIVE WIDGETS (1 Col) */}
          <div className="space-y-6">
            {/* Widget 1: Upcoming Interviews */}
            <div id="upcoming-interviews" className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Lịch phỏng vấn sắp tới
                </h3>
                <Link href="/employee/interviews" className="text-[11px] font-bold text-[#4285F4] hover:underline">
                  Xem tất cả &rarr;
                </Link>
              </div>

              <div className="space-y-3 text-xs font-medium">
                {(home?.interviews || []).length === 0 && (
                  <p className="text-[11px] text-slate-400">Chưa có lịch phỏng vấn sắp tới.</p>
                )}
                {(home?.interviews || []).map((iv, idx) => (
                  <div key={iv.id} className="p-3.5 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${idx === 0 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-[#4285F4]"} font-extrabold text-[11px] text-center leading-none`}>
                          <div>{iv.day}</div>
                          <div className="text-[9px] uppercase mt-0.5">{iv.month}</div>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">{iv.title}</h4>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" /> {iv.time}
                          </div>
                        </div>
                      </div>
                      <Link href="/employee/interviews" className="text-[11px] font-bold text-[#4285F4] hover:underline shrink-0">
                        Chi tiết
                      </Link>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 bg-white p-2 rounded-xl border border-gray-100">
                      {iv.online ? <Video className="w-3 h-3 text-blue-500" /> : <Building2 className="w-3 h-3 text-slate-400" />} {iv.place}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Referred Candidates */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#4285F4]" />
                  Ứng viên bạn đã giới thiệu
                </h3>
                <Link href="/employee/referrals" className="text-[11px] font-bold text-[#4285F4] hover:underline">
                  Xem tất cả &rarr;
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                {(home?.referrals || []).length === 0 && (
                  <p className="text-[11px] text-slate-400">Bạn chưa giới thiệu ứng viên nào.</p>
                )}
                {(home?.referrals || []).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#4285F4] font-extrabold text-xs flex items-center justify-center">
                        {r.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{r.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium">{r.sub}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${r.status === "Đã tuyển" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Recent Notifications */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-500" />
                  Thông báo mới
                </h3>
                <Link href="/employee/notifications" className="text-[11px] font-bold text-[#4285F4] hover:underline">
                  Xem tất cả &rarr;
                </Link>
              </div>

              <div className="space-y-3 text-xs font-medium">
                {(home?.notifications || []).length === 0 && (
                  <p className="text-[11px] text-slate-400">Chưa có thông báo mới.</p>
                )}
                {(home?.notifications || []).map((n) => (
                  <div key={n.id} className="flex gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      {n.type.startsWith("interview") ? <Calendar className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{n.title}</h4>
                      {n.message && <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>}
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">{ago(n.created_at, home?.now || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeAppShell>
  );
}
