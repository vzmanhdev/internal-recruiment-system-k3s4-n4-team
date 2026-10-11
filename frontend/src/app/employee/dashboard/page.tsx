"use client";

import React, { useState, useEffect } from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { jobService, type JobPostingItem } from "@/services/job.service";
import { ApiError } from "@/lib/api-client";
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
import { authService } from "@/features/auth/services/auth.service";
import { interviewService, type InterviewItem } from "@/services/interview.service";
import { referralService, type ReferralItem } from "@/services/referral.service";
import { useNotifications } from "@/hooks/useNotifications";


// Map a published posting from the API into the card shape used by this page.
function toCard(j: JobPostingItem & { required_skills?: string[] }, myDepartment?: string, index = 0) {
  const daysLeft = j.deadline ? Math.max(0, Math.ceil((new Date(j.deadline).getTime() - Date.now()) / 86400000)) : null;
  return {
    id: j.id,
    slug: j.slug,
    title: j.title,
    department: j.department_name || j.department,
    location: j.location,
    type: j.type,
    description: j.description,
    tags: (j.required_skills && j.required_skills.length ? j.required_skills : [j.level]).filter(Boolean),
    daysLeft,
    isFeatured: index < 3,
    isRecommended: !!myDepartment && (j.department_name || j.department) === myDepartment,
  };
}

export default function EmployeeDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"featured" | "recommended" | "latest">("featured");
  const [bookmarkedJobs, setBookmarkedJobs] = useState<number[]>([]);
  const [jobs, setJobs] = useState<ReturnType<typeof toCard>[]>([]);

  const [jobsError, setJobsError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<InterviewItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const notifications = useNotifications(3);

  useEffect(() => {
    const me = authService.getUserInfo();
    jobService.getJobs()
      .then((list) => setJobs(list.map((j, i) => toCard(j, me?.department, i))))
      .catch((err) => setJobsError(err instanceof ApiError ? err.message : "Không tải được tin tuyển dụng."));
    // Upcoming interviews on my own (internal) applications.
    interviewService.getInterviews()
      .then((list) => setUpcoming(list.filter((i) => i.is_own_application && i.status === "scheduled"
        && new Date(i.scheduled_time).getTime() >= Date.now()).slice(0, 3)))
      .catch(() => setUpcoming([]));
    referralService.getReferrals()
      .then((list) => setReferrals(list.slice(0, 3)))
      .catch(() => setReferrals([]));
  }, []);

  const toggleBookmark = (id: number) => {
    setBookmarkedJobs((prev) =>
      prev.includes(id) ? prev.filter((jId) => jId !== id) : [...prev, id]
    );
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "featured") return job.isFeatured;
    if (activeTab === "recommended") return job.isRecommended;
    return true;
  });

  return (
    <EmployeeAppShell activeTab="home">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* 1. HERO BANNER CARD (Soft Blue Light Background with Graphic & Search) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50/50 p-6 sm:p-8 border border-blue-100/80 shadow-xs">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Left text greeting & search input */}
            <div className="space-y-5 max-w-2xl">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  Xin chào, Nguyễn Văn Nam! <span className="inline-block animate-bounce">👋</span>
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
              <div className="text-2xl font-extrabold text-slate-900">12</div>
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
              <div className="text-2xl font-extrabold text-slate-900">3</div>
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
              <div className="text-2xl font-extrabold text-slate-900">1</div>
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
              <div className="text-2xl font-extrabold text-slate-900">2</div>
              <div className="text-xs font-medium text-slate-500">Lịch phỏng vấn sắp tới</div>
              <a href="#upcoming-interviews" className="text-[11px] font-bold text-[#4285F4] hover:underline flex items-center gap-1 pt-1">
                <span>Xem lịch</span>
                <ArrowRight className="w-3 h-3" />
              </a>
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
              {jobsError && <div className="col-span-full px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">{jobsError}</div>}
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
                      {job.daysLeft == null ? "Không giới hạn" : `Còn ${job.daysLeft} ngày`}
                    </span>

                    <Link
                      href={`/jobs/${job.id}`}
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
                <Link href="/employee/notifications" className="text-[11px] font-bold text-[#4285F4] hover:underline">
                  Thông báo &rarr;
                </Link>
              </div>

              <div className="space-y-3 text-xs font-medium">
                {upcoming.length === 0 && <div className="text-[11px] text-slate-400 text-center py-3">Bạn chưa có lịch phỏng vấn nào sắp tới.</div>}
                {upcoming.map((i) => {
                  const when = new Date(i.scheduled_time);
                  const end = new Date(when.getTime() + i.duration_minutes * 60000);
                  const hm = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={i.id} className="p-3.5 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 font-extrabold text-[11px] text-center leading-none">
                          <div>{when.getDate()}</div>
                          <div className="text-[9px] uppercase mt-0.5">Th{when.getMonth() + 1}</div>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">{i.round_name} · {i.job_title}</h4>
                          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" /> {hm(when)} - {hm(end)}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 bg-white p-2 rounded-xl border border-gray-100">
                        {i.meeting_link ? (
                          <><Video className="w-3 h-3 text-blue-500" /> <a href={i.meeting_link} target="_blank" rel="noreferrer" className="text-[#4285F4] font-bold">Tham gia trực tuyến</a></>
                        ) : (
                          <><Building2 className="w-3 h-3 text-slate-400" /> {i.location}</>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                {referrals.length === 0 && <div className="text-[11px] text-slate-400 text-center py-3">Bạn chưa giới thiệu ứng viên nào.</div>}
                {referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-blue-100 text-[#4285F4] font-extrabold text-xs flex items-center justify-center">
                        {r.candidate_name.split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{r.candidate_name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium truncate">
                          {r.job_title}{r.created_at ? ` • ${new Date(r.created_at).toLocaleDateString("vi-VN")}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-blue-50 text-[#4285F4] border border-blue-200 text-[10px] font-extrabold">
                      {r.candidate_status || r.status}
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
                {notifications.items.length === 0 && <div className="text-[11px] text-slate-400 text-center py-3">Chưa có thông báo nào.</div>}
                {notifications.items.map((n) => (
                  <Link key={n.id} href={n.link || "/employee/notifications"} onClick={() => !n.is_read && notifications.markRead(n.id)}
                    className={`flex gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors ${n.is_read ? "" : "bg-blue-50/40"}`}>
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{n.title}</h4>
                      {n.message && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>}
                      {n.created_at && <span className="text-[10px] text-slate-400 font-bold block mt-1">{new Date(n.created_at).toLocaleString("vi-VN")}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeAppShell>
  );
}
