"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { 
  Briefcase, Search, MapPin, Building, Sparkles, Filter, 
  CheckCircle2, FileText, Star, ArrowUpRight, Send, Compass, UserCheck, ShieldCheck
} from "lucide-react";
import { jobService, JobPostingItem } from "@/services/job.service";
import type { Job } from "@/types/job";
import { toJob } from "@/features/jobs/mapPosting";
import { JobDetailModal } from "@/features/jobs/components/JobDetailModal";
import { ApplyJobModal } from "@/features/jobs/components/ApplyJobModal";
import { MyApplicationsTab } from "@/features/jobs/components/MyApplicationsTab";
import { CareerMobilityTab } from "@/features/jobs/components/CareerMobilityTab";
import { apiRequest } from "@/lib/api-client";

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "applications" | "saved" | "mobility">("all");
  
  // Jobs Data
  const [dbJobs, setDbJobs] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");

  // Modals & Selection
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<Job | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // User session info
  const [userProfile, setUserProfile] = useState({
    name: "Nhân viên Nội bộ",
    department: "Khối Công Nghệ",
    code: "NV-2026",
  });

  useEffect(() => {
    let isMounted = true;
    jobService
      .getJobs()
      .then((data) => {
        if (isMounted) {
          setDbJobs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load jobs:", err);
        if (isMounted) setLoading(false);
      });

    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("user_info");
      if (uStr) {
        try {
          const u = JSON.parse(uStr);
          setUserProfile({
            name: u.full_name || "Nhân viên Nội bộ",
            department: u.department || "Khối Công Nghệ",
            code: u.employee_code ? `NV-${u.employee_code}` : "NV-882",
          });
        } catch (e) {
          console.error(e);
        }
      }
      // Load saved jobs
      const saved = localStorage.getItem("saved_internal_jobs");
      if (saved) setSavedJobIds(JSON.parse(saved));

      // Fetch active user applications to mark applied jobs
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (token) {
        apiRequest<any[]>("/applications?mine=true")
          .then((apps) => {
            if (isMounted && Array.isArray(apps)) {
              const activeApplied = apps
                .filter((app) => !["rejected", "withdrawn"].includes(app.status))
                .map((app) => String(app.job_posting_id));
              setAppliedJobIds(new Set(activeApplied));
            }
          })
          .catch((err) => {
            console.warn("Could not fetch user applications:", err);
          });
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const formattedJobs: Job[] = useMemo(() => {
    return dbJobs.map(toJob);
  }, [dbJobs]);

  const filteredJobs = useMemo(() => {
    return formattedJobs.filter(
      (job) =>
        `${job.title} ${job.description} ${job.skills.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!department || job.department === department) &&
        (!location || job.location === location) &&
        (!employmentType || job.employmentType === employmentType)
    );
  }, [formattedJobs, search, department, location, employmentType]);

  const savedJobsList = useMemo(() => {
    return formattedJobs.filter((job) => savedJobIds.includes(job.id));
  }, [formattedJobs, savedJobIds]);

  const departmentsList = useMemo(() => {
    return Array.from(new Set(formattedJobs.map((j) => j.department)));
  }, [formattedJobs]);

  const locationsList = useMemo(() => {
    return Array.from(new Set(formattedJobs.map((j) => j.location)));
  }, [formattedJobs]);

  const toggleSaveJob = (jobId: string) => {
    let nextSaved: string[];
    if (savedJobIds.includes(jobId)) {
      nextSaved = savedJobIds.filter((id) => id !== jobId);
    } else {
      nextSaved = [...savedJobIds, jobId];
    }
    setSavedJobIds(nextSaved);
    if (typeof window !== "undefined") {
      localStorage.setItem("saved_internal_jobs", JSON.stringify(nextSaved));
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-800 font-sans flex flex-col antialiased">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* HERO BANNER SECTION */}
        <div className="relative bg-gradient-to-br from-white via-sky-50/70 to-blue-50/80 rounded-[32px] p-6 sm:p-10 text-slate-900 shadow-xl shadow-blue-500/5 overflow-hidden border border-blue-100/90">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-sky-300/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Internal Mobility Career Hub</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
                Cổng Tuyển Dụng & Phát Triển Sự Nghiệp Nội Bộ
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
                Khám phá cơ hội điều chuyển vị trí, nâng cao bậc dải lương và thử sức ở các dự án trọng điểm toàn tập đoàn dành riêng cho cán bộ nhân viên.
              </p>
            </div>

            {/* Quick Employee Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-blue-100/90 shadow-sm shadow-blue-500/5 shrink-0 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-blue-500/20">
                {userProfile.name ? userProfile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "NV"}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">{userProfile.name}</div>
                <div className="text-xs text-slate-500">{userProfile.department} • {userProfile.code}</div>
                <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                  Tài khoản Nhân viên Chính thức
                </span>
              </div>
            </div>
          </div>

          {/* PORTAL STATS QUICK COUNTER */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-blue-100/80">
            <div className="bg-white/95 rounded-2xl p-3.5 border border-blue-100/90 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Vị trí tuyển mở</span>
              <span className="text-xl font-extrabold text-blue-600">{formattedJobs.length} công việc</span>
            </div>
            <div className="bg-white/95 rounded-2xl p-3.5 border border-blue-100/90 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Hạn phỏng vấn SLA</span>
              <span className="text-xl font-extrabold text-emerald-600">Rút gọn 3 ngày</span>
            </div>
            <div className="bg-white/95 rounded-2xl p-3.5 border border-blue-100/90 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Vị trí đã lưu</span>
              <span className="text-xl font-extrabold text-amber-600">{savedJobIds.length} vị trí</span>
            </div>
            <div className="bg-white/95 rounded-2xl p-3.5 border border-blue-100/90 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Quyền lợi thâm niên</span>
              <span className="text-xl font-extrabold text-indigo-600">100% Bảo lưu</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-blue-100 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Tất cả vị trí tuyển dụng ({formattedJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("applications")}
            className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "applications"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Hồ sơ đã ứng tuyển của tôi</span>
          </button>

          <button
            onClick={() => setActiveTab("saved")}
            className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "saved"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Vị trí đã lưu ({savedJobIds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("mobility")}
            className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === "mobility"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Lộ trình phát triển & Gợi ý AI</span>
          </button>
        </div>

        {/* TAB 1: TẤT CẢ VỊ TRÍ TUYỂN DỤNG */}
        {activeTab === "all" && (
          <div className="space-y-6">
            {/* SEARCH AND FILTERS BAR */}
            <div className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm shadow-blue-500/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Keyword Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên công việc, kỹ năng..."
                  className="w-full pl-10 pr-4 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-400/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-400/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                >
                  <option value="">Tất cả phòng ban</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-400/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                >
                  <option value="">Tất cả địa điểm</option>
                  {locationsList.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Employment Type Filter */}
              <div>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-blue-50/30 border border-blue-100 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-400/20 focus:border-blue-500 outline-none transition-all text-slate-700 font-medium"
                >
                  <option value="">Hình thức làm việc</option>
                  <option value="Toàn thời gian">Toàn thời gian</option>
                  <option value="Bán thời gian">Bán thời gian</option>
                  <option value="Hybrid">Hybrid / Linh hoạt</option>
                </select>
              </div>
            </div>

            {/* JOBS GRID */}
            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="font-bold text-slate-800 text-base">Đang tải danh sách vị trí tuyển dụng nội bộ...</h3>
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => {
                  const isSaved = savedJobIds.includes(job.id);
                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-3xl border border-blue-100/90 hover:border-blue-300 p-6 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200/60 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" />
                            {job.department}
                          </span>

                          <button
                            onClick={() => toggleSaveJob(job.id)}
                            title={isSaved ? "Bỏ lưu" : "Lưu vị trí"}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              isSaved ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-400"
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>
                        </div>

                        {/* Job Title */}
                        <h3 
                          onClick={() => setSelectedJobForDetail(job)}
                          className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer leading-snug"
                        >
                          {job.title}
                        </h3>

                        {/* Description excerpt */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Key Skills Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.skills.slice(0, 3).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2.5 py-0.5 bg-blue-50/60 text-blue-700 text-[11px] font-semibold rounded-lg border border-blue-100/60"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Job Metadata Footer & Buttons */}
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-600 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{job.openings}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => setSelectedJobForDetail(job)}
                            className="flex-1 py-2.5 px-3 bg-blue-50/70 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                          >
                            Xem chi tiết
                          </button>
                          {appliedJobIds.has(String(job.id)) ? (
                            <button
                              onClick={() => setActiveTab("applications")}
                              className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã ứng tuyển</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedJobForApply(job)}
                              disabled={job.isExpired}
                              className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{job.isExpired ? "Đã hết hạn" : "Ứng tuyển"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">Chưa tìm thấy vị trí tuyển dụng phù hợp</h3>
                <p className="text-xs text-slate-500 mt-1">Hãy thử tìm với từ khóa hoặc phòng ban khác.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HỒ SƠ ĐÃ ỨNG TUYỂN CỦA TÔI */}
        {activeTab === "applications" && <MyApplicationsTab />}

        {/* TAB 3: VỊ TRÍ ĐÃ LƯU */}
        {activeTab === "saved" && (
          <div>
            {savedJobsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedJobsList.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-3xl border border-blue-100/90 hover:border-blue-300 p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                        Vị trí đã lưu
                      </span>
                      <button
                        onClick={() => toggleSaveJob(job.id)}
                        className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
                      >
                        Bỏ lưu
                      </button>
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-500">{job.department} • {job.location}</p>

                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => setSelectedJobForDetail(job)}
                        className="flex-1 py-2 px-3 bg-blue-50/70 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Chi tiết
                      </button>
                      {appliedJobIds.has(String(job.id)) ? (
                        <button
                          onClick={() => setActiveTab("applications")}
                          className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã ứng tuyển</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedJobForApply(job)}
                          disabled={job.isExpired}
                          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {job.isExpired ? "Đã hết hạn" : "Ứng tuyển"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
                <Star className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-base">Bạn chưa lưu vị trí tuyển dụng nào</h3>
                <p className="text-xs text-slate-500 mt-1">Nhấp vào biểu tượng ngôi sao ở các thẻ công việc để lưu lại xem sau.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LỘ TRÌNH PHÁT TRIỂN & GỢI Ý AI */}
        {activeTab === "mobility" && (
          <CareerMobilityTab
            onSelectJob={(jobId) => {
              const target = formattedJobs.find((j) => j.id === jobId) || formattedJobs[0];
              if (target) setSelectedJobForDetail(target);
            }}
          />
        )}
      </main>

      <Footer />

      {/* MODALS */}
      <JobDetailModal
        job={selectedJobForDetail}
        isOpen={!!selectedJobForDetail}
        onClose={() => setSelectedJobForDetail(null)}
        onApply={(job) => setSelectedJobForApply(job)}
        isSaved={selectedJobForDetail ? savedJobIds.includes(selectedJobForDetail.id) : false}
        onToggleSave={toggleSaveJob}
        isApplied={selectedJobForDetail ? appliedJobIds.has(String(selectedJobForDetail.id)) : false}
      />

      <ApplyJobModal
        job={selectedJobForApply}
        isOpen={!!selectedJobForApply}
        onClose={() => setSelectedJobForApply(null)}
        isAlreadyApplied={selectedJobForApply ? appliedJobIds.has(String(selectedJobForApply.id)) : false}
        onAlreadyApplied={(jobId) => setAppliedJobIds((prev) => new Set([...prev, jobId]))}
        onSuccess={(appData) => {
          if (selectedJobForApply) {
            setAppliedJobIds((prev) => new Set([...prev, String(selectedJobForApply.id)]));
          }
          alert(`Đã nộp thành công hồ sơ ứng tuyển vị trí ${selectedJobForApply?.title}!`);
          setActiveTab("applications");
        }}
      />
    </div>
  );
}
