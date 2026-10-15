"use client";

import React, { useState, useEffect } from "react";
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
import { authService } from "@/features/auth/services/auth.service";

export default function EmployeeDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"featured" | "recommended" | "latest">("featured");
  const [bookmarkedJobs, setBookmarkedJobs] = useState<number[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    // Initial jobs seed matching the exact reference screenshot items & backend connectivity
    setJobs([
      {
        id: 1,
        title: "Chuyên Viên Tuyển Dụng Cao Cấp (HR Specialist)",
        department: "Phòng Nhân sự",
        location: "Hà Nội",
        type: "Toàn thời gian",
        description: "Tham gia xây dựng chiến lược tuyển dụng, tìm kiếm và thu hút nhân tài cho các bộ phận.",
        tags: ["Tuyển dụng", "HR", "Giao tiếp"],
        daysLeft: 5,
        isFeatured: true,
        isRecommended: true,
      },
      {
        id: 2,
        title: "Senior Backend Engineer",
        department: "Phòng Công nghệ",
        location: "Hà Nội",
        type: "Toàn thời gian",
        description: "Phát triển và tối ưu hệ thống backend, tham gia thiết kế kiến trúc hệ thống quy mô lớn.",
        tags: ["Python", "FastAPI", "Database"],
        daysLeft: 10,
        isFeatured: false,
        isRecommended: true,
      },
      {
        id: 3,
        title: "Trưởng Nhóm Sản Phẩm",
        department: "Phòng Sản phẩm",
        location: "Hồ Chí Minh",
        type: "Toàn thời gian",
        description: "Dẫn dắt nhóm phát triển sản phẩm, định hướng chiến lược và triển khai các dự án quan trọng.",
        tags: ["Product", "Quản lý", "Agile"],
        daysLeft: 7,
        isFeatured: false,
        isRecommended: false,
      },
      {
        id: 4,
        title: "Chuyên Viên Marketing Internal",
        department: "Phòng Marketing",
        location: "Hà Nội",
        type: "Toàn thời gian",
        description: "Xây dựng và triển khai các hoạt động truyền thông nội bộ, thu hút nhân tài.",
        tags: ["Truyền thông", "Content", "Sự kiện"],
        daysLeft: 12,
        isFeatured: false,
        isRecommended: false,
      },
    ]);
  }, []);

  const toggleBookmark = (id: number) => {
    setBookmarkedJobs((prev) =>
      prev.includes(id) ? prev.filter((jId) => jId !== id) : [...prev, id]
    );
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "featured") return job.isFeatured || true;
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
                      Còn {job.daysLeft} ngày
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
                <a href="#" className="text-[11px] font-bold text-[#4285F4] hover:underline">
                  Xem tất cả &rarr;
                </a>
              </div>

              <div className="space-y-3 text-xs font-medium">
                {/* Item 1 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 font-extrabold text-[11px] text-center leading-none">
                        <div>25</div>
                        <div className="text-[9px] uppercase mt-0.5">Th10</div>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">Phỏng vấn vị trí Backend Engineer</h4>
                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" /> 09:00 - 10:00
                        </div>
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-[#4285F4] hover:underline shrink-0">
                      Chi tiết
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 bg-white p-2 rounded-xl border border-gray-100">
                    <Building2 className="w-3 h-3 text-slate-400" /> Phòng họp 3, Tầng 5
                  </div>
                </div>

                {/* Item 2 */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-100 text-[#4285F4] font-extrabold text-[11px] text-center leading-none">
                        <div>28</div>
                        <div className="text-[9px] uppercase mt-0.5">Th10</div>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">Phỏng vấn vị trí UX/UI Designer</h4>
                        <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" /> 14:00 - 15:00
                        </div>
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-[#4285F4] hover:underline shrink-0">
                      Chi tiết
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 bg-white p-2 rounded-xl border border-gray-100">
                    <Video className="w-3 h-3 text-blue-500" /> Online (Google Meet)
                  </div>
                </div>
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
                {/* Item 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#4285F4] font-extrabold text-xs flex items-center justify-center">
                      NT
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Nguyễn Thị Mai</h4>
                      <p className="text-[11px] text-slate-400 font-medium">UX/UI Designer • 12/10/2024</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">
                    Đang xét duyệt
                  </span>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center">
                      LH
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Lê Hoàng Minh</h4>
                      <p className="text-[11px] text-slate-400 font-medium">Backend Engineer • 05/10/2024</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#4285F4] border border-blue-200 text-[10px] font-extrabold">
                    Đã phỏng vấn
                  </span>
                </div>

                {/* Item 3 */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center">
                      PT
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Phạm Thu Hà</h4>
                      <p className="text-[11px] text-slate-400 font-medium">HR Specialist • 20/09/2024</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                    Đã tuyển
                  </span>
                </div>
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
                <div className="flex gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Tin tuyển dụng mới phù hợp với bạn</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Vị trí Senior Backend Engineer vừa được đăng.</p>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">2 giờ trước</span>
                  </div>
                </div>

                <div className="flex gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Lịch phỏng vấn sắp tới</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Bạn có lịch phỏng vấn vị trí Backend Engineer vào 25/10/2024.</p>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">4 giờ trước</span>
                  </div>
                </div>

                <div className="flex gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#4285F4] flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Trạng thái ứng viên đã thay đổi</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Ứng viên Nguyễn Thị Mai đã chuyển sang vòng phỏng vấn.</p>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">1 ngày trước</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeAppShell>
  );
}
