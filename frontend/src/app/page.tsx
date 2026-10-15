"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Compass,
  Target,
  GraduationCap,
  ArrowRight,
  Search,
  MapPin,
  Building2,
  Briefcase,
  Users,
  Award,
  Zap,
  HeartHandshake,
  CheckCircle2,
  Quote,
  Clock,
  DollarSign,
  UserPlus,
  Star,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  Newspaper,
  Calendar,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { jobService, JobPostingItem } from "@/services/job.service";

export default function LandingPage() {
  // Search & Filter State
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  // Job Category & Remote Data State
  const [activeCategory, setActiveCategory] = useState("all");
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Active step hovered on timeline
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    let isMounted = true;
    jobService
      .getJobs()
      .then((data) => {
        if (isMounted) {
          if (data && data.length > 0) {
            setJobs(data);
          } else {
            // Fallback demo data if DB is initially empty
            setJobs([
              {
                id: 1,
                slug: "senior-backend-engineer",
                title: "Senior Backend Engineer (Python / FastAPI)",
                department_id: 1,
                department: "Khối Công Nghệ Thông Tin",
                department_name: "Khối Công Nghệ Thông Tin",
                location: "Hà Nội",
                type: "Toàn thời gian",
                level: "Senior",
                salary_range: "25 - 35 Triệu",
                description:
                  "Tham gia thiết kế kiến trúc Backend microservices, tối ưu API tuyển dụng nội bộ quy mô lớn.",
                requirements: "Python, FastAPI, SQLAlchemy, PostgreSQL, Docker",
                status: "published",
                views_count: 142,
                applications_count: 8,
              },
              {
                id: 2,
                slug: "hr-recruitment-lead",
                title: "Trưởng Nhóm Tuyển Dụng & Đào Tạo (HR Lead)",
                department_id: 2,
                department: "Khối Nhân Sự & Đào Tạo",
                department_name: "Khối Nhân Sự & Đào Tạo",
                location: "Hà Nội",
                type: "Toàn thời gian",
                level: "Trưởng nhóm",
                salary_range: "20 - 30 Triệu",
                description:
                  "Điều phối toàn bộ quy trình tuyển mộ nhân tài nội bộ và thiết lập chương trình phát triển năng lực.",
                requirements: "3+ năm kinh nghiệm quản lý tuyển dụng, kỹ năng giao tiếp xuất sắc",
                status: "published",
                views_count: 98,
                applications_count: 5,
              },
              {
                id: 3,
                slug: "product-manager",
                title: "Chuyên Viên Quản Lý Sản Phẩm (Product Manager)",
                department_id: 3,
                department: "Khối Sản Phẩm & Thiết Kế",
                department_name: "Khối Sản Phẩm & Thiết Kế",
                location: "Hồ Chí Minh",
                type: "Toàn thời gian",
                level: "Mid - Senior",
                salary_range: "28 - 40 Triệu",
                description:
                  "Dẫn dắt lộ trình phát triển sản phẩm SaaS, phân tích dữ liệu hành vi người dùng và tối ưu trải nghiệm.",
                requirements: "Kinh nghiệm Agile/Scrum, tư duy sản phẩm hướng dữ liệu, UX/UI mindset",
                status: "published",
                views_count: 115,
                applications_count: 6,
              },
            ]);
          }
          setLoadingJobs(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingJobs(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { id: "all", label: `Tất cả vị trí (${jobs.length})` },
    { id: "it", label: "Công nghệ thông tin" },
    { id: "hr", label: "Nhân sự & Đào tạo" },
    { id: "product", label: "Sản phẩm & Quản trị" },
    { id: "finance", label: "Tài chính & Kinh doanh" },
  ];

  const filteredJobs = jobs.filter((job) => {
    const matchesCategory =
      activeCategory === "all" ||
      (activeCategory === "it" &&
        (job.department.toLowerCase().includes("công nghệ") ||
          job.department.toLowerCase().includes("it"))) ||
      (activeCategory === "hr" && job.department.toLowerCase().includes("nhân sự")) ||
      (activeCategory === "product" &&
        (job.department.toLowerCase().includes("sản phẩm") ||
          job.title.toLowerCase().includes("product"))) ||
      (activeCategory === "finance" &&
        (job.department.toLowerCase().includes("tài chính") ||
          job.department.toLowerCase().includes("kinh doanh")));

    const matchesKeyword =
      !searchKeyword ||
      job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      job.department.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesDept =
      selectedDept === "all" ||
      job.department.toLowerCase().includes(selectedDept.toLowerCase());

    const matchesLoc =
      selectedLocation === "all" ||
      job.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesCategory && matchesKeyword && matchesDept && matchesLoc;
  });

  const faqs = [
    {
      q: "Ai có thể tham gia ứng tuyển các vị trí nội bộ?",
      a: "Tất cả nhân viên chính thức đã hoàn thành thời gian thử việc đều có quyền đăng ký ứng tuyển. Hệ thống khuyến khích mọi thành viên chủ động thử thách bản thân ở những nấc thang sự nghiệp mới.",
    },
    {
      q: "Tôi có cần thông báo cho Quản lý trực tiếp trước khi nộp hồ sơ không?",
      a: "Hệ thống bảo đảm tính bảo mật trong giai đoạn đầu tiếp nhận hồ sơ. Tuy nhiên, trước vòng phỏng vấn chuyên sâu hoặc khi nhận đề nghị thử việc (Offer), HR sẽ đồng hành cùng bạn để trao đổi với Quản lý hiện tại nhằm chuẩn bị kế hoạch bàn giao chu đáo.",
    },
    {
      q: "Thông tin ứng tuyển của tôi có được bảo mật không?",
      a: "Tuyệt đối bảo mật. Hồ sơ của bạn chỉ được truy cập bởi Chuyên viên Tuyển dụng (HR Recruiter) và Người phụ trách duyệt tuyển dụng chuyên môn của vị trí ứng tuyển.",
    },
    {
      q: "Nếu chưa trúng tuyển đợt này, vị trí hiện tại của tôi có bị ảnh hưởng không?",
      a: "Hoàn toàn không bị ảnh hưởng. Công ty luôn ghi nhận và đánh giá cao tinh thần cầu tiến. Hồ sơ của bạn sẽ được lưu giữ trong Talent Pool nội bộ để ưu tiên khi có cơ hội phù hợp tiếp theo.",
    },
    {
      q: "Chế độ thâm niên, phép năm và đãi ngộ được tính thế nào khi chuyển bộ phận?",
      a: "Toàn bộ thâm niên làm việc, ngày phép tích lũy và các phúc lợi cốt lõi được giữ nguyên 100%. Lương và phụ cấp chuyên môn sẽ được điều chỉnh tương ứng theo dải đãi ngộ của vị trí mới.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Global Navigation */}
      <Header />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* SECTION 1: TRANG CHỦ (HERO) - ID: home */}
        {/* ========================================================================= */}
        <section
          id="home"
          className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden bg-grid-pattern bg-white/70 scroll-mt-20"
        >
          {/* Ambient Glowing Blobs in Background */}
          <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-blue-400/25 via-indigo-400/20 to-purple-400/10 blur-3xl pointer-events-none animate-glow-pulse" />
          <div
            className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-cyan-400/20 via-blue-400/20 to-indigo-400/10 blur-3xl pointer-events-none animate-glow-pulse"
            style={{ animationDelay: "2.5s" }}
          />

          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Brand Statement & CTA */}
              <div className="lg:col-span-7 space-y-7 z-10">
                {/* Glowing Pill Chip */}
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-blue-700 border border-blue-200/90 shadow-xs shadow-blue-500/10 hover:border-blue-400 transition-all">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>CỔNG TUYỂN DỤNG & PHÁT TRIỂN NỘI BỘ ENTERPRISE</span>
                </div>

                {/* Main Headline with Gradient Text */}
                <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-black text-slate-900 tracking-tight leading-[1.12]">
                  Cùng nhau tạo nên{" "}
                  <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                    những điều lớn lao
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                  Chủ động kiến tạo nấc thang sự nghiệp kế tiếp ngay tại doanh nghiệp bạn đang gắn bó.
                  Minh bạch tiêu chuẩn, công bằng cơ hội và đồng hành bứt phá năng lực.
                </p>

                {/* Uiverse Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  {/* Primary Button: Shimmer Sweep + Glowing Shadow */}
                  <a
                    href="#jobs"
                    className="relative group overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex items-center gap-2.5 before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-transform before:duration-700 cursor-pointer"
                  >
                    <span>Xem vị trí đang tuyển</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>

                  {/* Secondary Button: Glassmorphic Border */}
                  <a
                    href="#process"
                    className="px-7 py-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 font-bold text-sm sm:text-base hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xs cursor-pointer"
                  >
                    Quy trình 5 bước
                  </a>
                </div>

                {/* Micro Highlights Pill Row */}
                <div className="pt-6 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Minh bạch 100%</p>
                      <p className="text-[11px] text-slate-500">Mọi cấp bậc & tiêu chí</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-xs">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Lộ trình rõ ràng</p>
                      <p className="text-[11px] text-slate-500">Không mất thâm niên</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0 shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Đãi ngộ xứng tầm</p>
                      <p className="text-[11px] text-slate-500">Thưởng & ghi nhận</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Showcase (Floating + Deep Offset Shadow) */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Glowing background halo */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-indigo-500/25 to-purple-500/20 rounded-[32px] blur-2xl -z-10" />

                  {/* Floating Container */}
                  <div className="animate-uiverse-float relative rounded-3xl overflow-hidden border-4 border-white bg-slate-100 shadow-[0_25px_60px_-15px_rgba(59,130,246,0.3)] aspect-[4/3] sm:aspect-[4/3]">
                    <Image
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop"
                      alt="Đội ngũ nhân sự hợp tác chuyên nghiệp"
                      fill
                      priority
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 45vw"
                    />

                    {/* Gradient Overlay for photo depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Handwriting floating callout banner */}
                  <div className="absolute -top-6 -right-3 sm:-right-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-blue-200/90 shadow-xl shadow-blue-500/10 rotate-2 z-20">
                    <p className="font-handwriting text-2xl font-bold text-blue-600 leading-tight">
                      Better People ✨<br />
                      <span className="text-indigo-600">Brighter Tomorrow</span>
                    </p>
                  </div>

                  {/* Floating Glassmorphic Stat Chip */}
                  <div className="absolute -bottom-5 -left-3 sm:-left-6 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 z-20 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                      <Star className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">95% Tỷ lệ thành công</p>
                      <p className="text-[11px] text-slate-500">Đồng đội chuyển vị trí hài lòng</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>

          {/* Glassmorphic Search & Quick Filter Bar */}
          <Container className="relative mt-16 z-20">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all hover:shadow-[0_25px_60px_rgba(59,130,246,0.12)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* Search text input */}
                <div className="lg:col-span-5 relative flex items-center">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm vị trí tuyển dụng, kỹ năng, chuyên môn..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full h-13 pl-12 pr-4 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Department Select */}
                <div className="lg:col-span-3 relative flex items-center">
                  <Building2 className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full h-13 pl-12 pr-8 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none"
                  >
                    <option value="all">Tất cả phòng ban</option>
                    <option value="công nghệ">Khối Công Nghệ</option>
                    <option value="nhân sự">Khối Nhân Sự</option>
                    <option value="sản phẩm">Khối Sản Phẩm</option>
                    <option value="tài chính">Khối Tài Chính</option>
                  </select>
                </div>

                {/* Location Select */}
                <div className="lg:col-span-2 relative flex items-center">
                  <MapPin className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full h-13 pl-12 pr-8 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none"
                  >
                    <option value="all">Mọi địa điểm</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                  </select>
                </div>

                {/* Search Button (Uiverse Shimmer) */}
                <div className="lg:col-span-2">
                  <a
                    href="#jobs"
                    className="relative group w-full h-13 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Tìm ({filteredJobs.length})</span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 pointer-events-none" />
                  </a>
                </div>
              </div>
            </div>
          </Container>

          {/* Business Metrics Row */}
          <Container className="mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  value: "500+",
                  label: "Nhân sự nội bộ",
                  desc: "Đồng hành và phát triển bền vững",
                  icon: Users,
                  color: "text-blue-600 bg-blue-50 border-blue-100",
                },
                {
                  value: "120+",
                  label: "Vị trí phát triển",
                  desc: "Mở ra cơ hội thăng tiến mới",
                  icon: Briefcase,
                  color: "text-emerald-600 bg-emerald-50 border-emerald-100",
                },
                {
                  value: "12",
                  label: "Phòng ban / Khối",
                  desc: "Môi trường kết nối linh hoạt",
                  icon: Building2,
                  color: "text-indigo-600 bg-indigo-50 border-indigo-100",
                },
                {
                  value: "95%",
                  label: "Hài lòng phát triển",
                  desc: "Tỉ lệ hài lòng về lộ trình",
                  icon: Award,
                  color: "text-purple-600 bg-purple-50 border-purple-100",
                },
              ].map((m, idx) => {
                const IconComp = m.icon;
                return (
                  <div
                    key={idx}
                    className="group relative rounded-3xl p-[1px] bg-gradient-to-b from-slate-200 to-slate-100 hover:from-blue-400 hover:via-indigo-400 hover:to-cyan-400 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <div className="h-full bg-white rounded-[23px] p-6 flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${m.color} group-hover:scale-110 transition-transform`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                          {m.value}
                        </h3>
                        <p className="text-sm font-bold text-slate-700 mt-0.5">{m.label}</p>
                        <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: CƠ HỘI NGHỀ NGHIỆP - ID: jobs */}
        {/* ========================================================================= */}
        <section
          id="jobs"
          className="py-20 bg-slate-50/70 border-y border-slate-200/60 relative scroll-mt-20"
        >
          <Container>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 tracking-wider uppercase">
                  <Briefcase className="w-4 h-4" />
                  CƠ HỘI MỞ RỘNG DÀNH CHO BẠN
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Những vị trí đang tuyển dụng nội bộ
                </h2>
                <p className="text-base text-slate-600 max-w-xl">
                  Khám phá các vị trí chiến lược và ứng tuyển nhanh chóng với quy trình tối ưu cho
                  nhân sự hiện tại.
                </p>
              </div>

              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all shrink-0 cursor-pointer"
              >
                <span>Xem toàn bộ vị trí</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Category Filter Tabs with Smooth Active Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                      : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Job Grid with Uiverse Card Glow */}
            {loadingJobs ? (
              <div className="text-center py-16 text-slate-500 font-medium">
                Đang đồng bộ dữ liệu vị trí tuyển dụng...
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="group relative rounded-3xl p-[1px] bg-gradient-to-b from-slate-200 to-slate-100 hover:from-blue-400 hover:via-indigo-400 hover:to-cyan-400 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between"
                  >
                    <div className="h-full bg-white rounded-[23px] p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* Badges top */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                            {job.department_name || job.department}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Ưu tiên nội bộ
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {job.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>

                        {/* Meta tags */}
                        <div className="pt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {job.type}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold">
                            <DollarSign className="w-3.5 h-3.5" />
                            {job.salary_range || job.salaryRange || "Thoả thuận"}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer CTA */}
                      <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {job.applications_count || 0} hồ sơ đã nộp
                        </span>
                        <Link
                          href={`/jobs/${job.slug || job.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <span>Ứng tuyển ngay</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-500">
                Không tìm thấy vị trí tuyển dụng phù hợp với bộ lọc tìm kiếm của bạn.
              </div>
            )}
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: LỘ TRÌNH PHÁT TRIỂN - ID: career-path */}
        {/* ========================================================================= */}
        <section
          id="career-path"
          className="py-20 bg-white relative overflow-hidden scroll-mt-20"
        >
          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

          <Container className="relative z-10">
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                PHÁT TRIỂN TỪ NỘI LỰC
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Nơi tài năng của bạn được tôn vinh và chắp cánh
              </h2>
              <p className="text-base text-slate-600">
                Chúng tôi tin rằng nguồn tài năng xuất sắc nhất luôn bắt đầu từ những đồng đội nhiệt
                huyết hiện tại.
              </p>
            </div>

            {/* 3 Cards Balanced Grid (Uiverse Gradient Border) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Compass,
                  title: "Cơ hội nghề nghiệp phong phú",
                  description:
                    "Chủ động lựa chọn hướng đi chuyên môn chuyên sâu hoặc quản lý theo nguyện vọng và thế mạnh cá nhân.",
                  color: "bg-blue-50 text-blue-600 border-blue-200",
                  tag: "Lộ trình kép",
                },
                {
                  icon: Target,
                  title: "Quy trình minh bạch & Công bằng",
                  description:
                    "Mọi vị trí được công khai nội bộ với tiêu chuẩn đánh giá nhất quán, công bằng cho tất cả ứng viên.",
                  color: "bg-emerald-50 text-emerald-600 border-emerald-200",
                  tag: "100% Khách quan",
                },
                {
                  icon: GraduationCap,
                  title: "Đào tạo & Nâng cao năng lực",
                  description:
                    "Hệ thống khóa học, coaching 1:1 và ngân sách đào tạo liên tục đồng hành cùng sự bứt phá của bạn.",
                  color: "bg-purple-50 text-purple-600 border-purple-200",
                  tag: "Mentorship 1:1",
                },
              ].map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={idx}
                    className="relative group rounded-3xl p-[1.5px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-400 transition-all duration-500 hover:-translate-y-2.5 hover:shadow-[0_20px_45px_-10px_rgba(59,130,246,0.25)] flex flex-col cursor-pointer"
                  >
                    <div className="h-full bg-white rounded-[22px] p-8 flex flex-col justify-between backdrop-blur-xl">
                      <div className="space-y-6">
                        {/* Header icon + tag */}
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${card.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs`}
                          >
                            <IconComponent className="w-7 h-7" />
                          </div>
                          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {card.tag}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {card.title}
                        </h3>

                        <p className="text-sm text-slate-600 leading-relaxed">
                          {card.description}
                        </p>
                      </div>

                      <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                        <span>Khám phá lộ trình</span>
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-grid: 4 Core Advantages (Vì sao nên ứng tuyển nội bộ) */}
            <div className="mt-20 pt-16 border-t border-slate-100">
              <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VÌ SAO NÊN ỨNG TUYỂN NỘI BỘ
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Không chỉ là vị trí mới. Đó là bước tiến vững chắc.
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: Zap,
                    title: "Phát triển linh hoạt",
                    desc: "Chuyển đổi vị trí giữa các phòng ban mà không mất đi thâm niên hay chế độ đãi ngộ hiện có.",
                    color: "bg-amber-50 text-amber-600 border-amber-200",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Môi trường chuyên nghiệp",
                    desc: "Làm việc cùng những đồng nghiệp xuất sắc trong môi trường cởi mở và tôn trọng đóng góp.",
                    color: "bg-blue-50 text-blue-600 border-blue-200",
                  },
                  {
                    icon: Award,
                    title: "Tiêu chuẩn minh bạch",
                    desc: "Mọi tiêu chuẩn đánh giá và mô tả công việc được niêm yết công khai trên cổng tuyển dụng.",
                    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
                  },
                  {
                    icon: HeartHandshake,
                    title: "Ghi nhận xứng đáng",
                    desc: "Chính sách đãi ngộ, thưởng nóng và điều chỉnh thu nhập tương xứng với năng lực thực tế.",
                    color: "bg-rose-50 text-rose-600 border-rose-200",
                  },
                ].map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={idx}
                      className="group relative rounded-3xl p-6 bg-white/90 backdrop-blur-md border border-slate-200/80 hover:border-indigo-400 hover:shadow-[0_15px_35px_rgba(99,102,241,0.18)] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div
                          className={`w-13 h-13 rounded-2xl flex items-center justify-center mb-5 border ${item.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-xs`}
                        >
                          <IconComp className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                      </div>

                      <div className="pt-4 mt-6 border-t border-slate-100/80 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                        <span>Được bảo chứng</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: QUY TRÌNH 5 BƯỚC - ID: process */}
        {/* ========================================================================= */}
        <section
          id="process"
          className="py-24 bg-slate-50/80 border-t border-slate-200/60 relative overflow-hidden scroll-mt-20"
        >
          <Container>
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-20">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 uppercase tracking-wider">
                QUY TRÌNH PHÁT TRIỂN NỘI BỘ
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                5 bước minh bạch cho hành trình mới
              </h2>
              <p className="text-base text-slate-600">
                Quy trình chuẩn hóa, tối giản thủ tục và bảo mật tuyệt đối cho mọi nhân sự tham gia.
              </p>
            </div>

            {/* Timeline with Connected Glowing Line */}
            <div className="relative">
              {/* Horizontal Connecting Line for Desktop */}
              <div className="hidden lg:block absolute top-[28px] left-[8%] right-[8%] h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full z-0 opacity-70" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
                {[
                  {
                    step: 1,
                    num: "01",
                    title: "Khám phá cơ hội",
                    desc: "Tìm kiếm các vị trí tuyển dụng nội bộ phù hợp với năng lực và định hướng cá nhân.",
                  },
                  {
                    step: 2,
                    num: "02",
                    title: "Ứng tuyển bảo mật",
                    desc: "Gửi hồ sơ trực tiếp qua hệ thống. Thông tin được mã hóa và bảo mật tuyệt đối.",
                  },
                  {
                    step: 3,
                    num: "03",
                    title: "Đánh giá phù hợp",
                    desc: "HR và bộ phận chuyên môn đánh giá kinh nghiệm và lịch sử đóng góp nội bộ.",
                  },
                  {
                    step: 4,
                    num: "04",
                    title: "Phỏng vấn chuyên sâu",
                    desc: "Trao đổi cởi mở về kỳ vọng công việc, kỹ năng chuyên môn và lộ trình thăng tiến.",
                  },
                  {
                    step: 5,
                    num: "05",
                    title: "Nhận Offer & Bàn giao",
                    desc: "Nhận thư mời nhận việc chính thức và thực hiện chuyển giao vị trí trơn tru.",
                  },
                ].map((item) => (
                  <div
                    key={item.num}
                    onMouseEnter={() => setHoveredStep(item.step)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className="group relative flex flex-col items-center cursor-pointer"
                  >
                    {/* Glowing Ping Node */}
                    <div className="relative mb-6">
                      {hoveredStep === item.step && (
                        <span className="absolute -inset-2 rounded-2xl bg-blue-500/40 animate-ping pointer-events-none" />
                      )}
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-blue-500 shadow-md shadow-blue-500/20 text-blue-600 font-black text-lg flex items-center justify-center group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:text-white group-hover:border-transparent transition-all duration-300">
                        {item.num}
                      </div>
                    </div>

                    {/* Step Card Details */}
                    <div className="w-full bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs group-hover:border-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/10 group-hover:-translate-y-1.5 transition-all duration-300 text-center flex flex-col justify-between min-h-[160px]">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: TIN TỨC NỘI BỘ & CÂU CHUYỆN - ID: news */}
        {/* ========================================================================= */}
        <section
          id="news"
          className="py-20 bg-white border-t border-slate-200/60 relative scroll-mt-20"
        >
          <Container>
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 uppercase tracking-wider">
                <Newspaper className="w-3.5 h-3.5" />
                TIN TỨC & HOẠT ĐỘNG NỘI BỘ
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Cập nhật chuyển động & cơ hội mới
              </h2>
              <p className="text-base text-slate-600">
                Nắm bắt các chính sách luân chuyển mới nhất, chương trình giới thiệu đồng đội và câu
                chuyện truyền cảm hứng.
              </p>
            </div>

            {/* Featured Referral Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white p-8 sm:p-12 shadow-2xl shadow-indigo-900/20 mb-16">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
                    <UserPlus className="w-3.5 h-3.5" />
                    CHƯƠNG TRÌNH REFERRAL ĐỒNG ĐỘI
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                    Giới thiệu đồng nghiệp xuất sắc — Nhận thưởng tới 20.000.000đ
                  </h3>
                  <p className="text-sm sm:text-base text-blue-100 max-w-xl leading-relaxed">
                    Đồng đội bạn giới thiệu sẽ giúp tổ chức phát triển mạnh mẽ hơn, đồng thời bạn sẽ
                    nhận ngay phần thưởng tri ân xứng đáng khi ứng viên onboard thành công.
                  </p>
                </div>

                <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
                  <Link
                    href="/employee/referrals/new"
                    className="relative group overflow-hidden px-6 py-3.5 rounded-2xl bg-white text-indigo-900 font-extrabold text-sm text-center shadow-xl shadow-slate-950/20 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Giới thiệu ứng viên ngay</span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-blue-400/20 to-transparent transition-transform duration-700 pointer-events-none" />
                  </Link>
                  <a
                    href="#faq"
                    className="px-6 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 text-white font-bold text-sm text-center hover:bg-white/20 transition-all cursor-pointer"
                  >
                    Xem chính sách thưởng
                  </a>
                </div>
              </div>
            </div>

            {/* Internal News Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {[
                {
                  id: "news-1",
                  title: "Ban hành Quy chế Luân chuyển nội bộ & Khung năng lực mới",
                  date: "15/10/2026",
                  category: "Chính sách",
                  summary:
                    "Toàn bộ quy chuẩn về thâm niên, điều kiện ứng tuyển và cam kết bảo lưu quyền lợi khi chuyển bộ phận đã chính thức được áp dụng.",
                },
                {
                  id: "news-2",
                  title: "Workshop: Chiến lược phát triển bản thân và thăng tiến nghề nghiệp",
                  date: "22/10/2026",
                  category: "Đào tạo",
                  summary:
                    "Buổi chia sẻ trực tiếp cùng các Trưởng Khối chuyên môn về kỹ năng phỏng vấn, portfolio và lộ trình thăng cấp quản lý.",
                },
                {
                  id: "news-3",
                  title: "Vinh danh 18 nhân sự chuyển đổi vị trí xuất sắc Quý 3",
                  date: "28/10/2026",
                  category: "Vinh danh",
                  summary:
                    "Ghi nhận nỗ lực bứt phá và đóng góp vượt trội của những thành viên đã nắm bắt cơ hội mới qua Cổng tuyển dụng nội bộ.",
                },
              ].map((article) => (
                <div
                  key={article.id}
                  className="group relative rounded-3xl p-6 bg-white border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {article.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {article.date}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h4>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {article.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Đọc chi tiết</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonials (Câu chuyện thành công) */}
            <div className="pt-12 border-t border-slate-100">
              <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 uppercase tracking-wider">
                  <Quote className="w-3.5 h-3.5" />
                  CÂU CHUYỆN THÀNH CÔNG
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Đồng đội nói gì về lộ trình phát triển nội bộ
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    id: "1",
                    name: "Nguyễn Văn An",
                    role: "Trưởng nhóm Phát triển Phần mềm",
                    department: "Khối Công nghệ Thông tin",
                    avatar:
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
                    quote:
                      "Ứng tuyển nội bộ giúp tôi tự tin chuyển giao từ Senior Engineer lên vị trí Management. Quy trình minh bạch, quản lý ủng hộ và lộ trình đào tạo rõ ràng.",
                  },
                  {
                    id: "2",
                    name: "Trần Thị Minh",
                    role: "Senior Product Designer",
                    department: "Phát triển Sản phẩm",
                    avatar:
                      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop",
                    quote:
                      "Tôi chuyển đổi vị trí từ Marketing sang UI/UX nhờ chương trình luân chuyển nội bộ. Môi trường công ty thực sự tạo điều kiện tối đa cho sự học hỏi.",
                  },
                  {
                    id: "3",
                    name: "Lê Hoàng Nam",
                    role: "Quản lý Dự án Công nghệ",
                    department: "Tài chính - Kế toán",
                    avatar:
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
                    quote:
                      "Cổng tuyển dụng nội bộ rất tiện lợi. Mọi thông tin mô tả công việc và tiêu chuẩn đều công khai, phản hồi từ HR cực kỳ nhanh chóng và chuyên nghiệp.",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="relative group before:absolute before:inset-0 before:-z-10 before:rounded-3xl before:bg-gradient-to-r before:from-blue-400/20 before:via-indigo-400/20 before:to-purple-400/20 before:blur-2xl before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-500 cursor-pointer"
                  >
                    <div className="h-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xs group-hover:border-blue-400 group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                      <Quote className="w-12 h-12 text-blue-100 absolute top-6 right-6 pointer-events-none group-hover:text-blue-200 transition-colors" />

                      <p className="text-sm text-slate-600 leading-relaxed italic mb-8 relative z-10">
                        &quot;{item.quote}&quot;
                      </p>

                      <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-blue-200 shadow-xs">
                          <Image src={item.avatar} alt={item.name} fill className="object-cover" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                          <p className="text-xs text-blue-600 font-semibold">{item.role}</p>
                          <p className="text-[11px] text-slate-400">{item.department}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: CÂU HỎI THƯỜNG GẶP - ID: faq */}
        {/* ========================================================================= */}
        <section
          id="faq"
          className="py-20 bg-slate-50/70 border-t border-slate-200/60 relative scroll-mt-20"
        >
          <Container className="max-w-4xl">
            <div className="text-center space-y-4 mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                CÂU HỎI THƯỜNG GẶP (FAQ)
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Giải đáp mọi băn khoăn của bạn
              </h2>
              <p className="text-base text-slate-600">
                Tìm hiểu chi tiết về quy trình tuyển chọn, tính bảo mật và quyền lợi khi tham gia ứng
                tuyển nội bộ.
              </p>
            </div>

            {/* Accordion FAQ Items */}
            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "bg-white border-blue-300 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                        : "bg-white/80 hover:bg-white border-slate-200 shadow-xs"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 cursor-pointer"
                    >
                      <span className="text-base font-bold text-slate-900 leading-snug">
                        {faq.q}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                          isOpen
                            ? "bg-blue-600 text-white rotate-180"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-6 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FAQ Footer Helper */}
            <div className="mt-10 p-6 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Bạn có câu hỏi riêng cần bảo mật trao đổi?
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đội ngũ Nhân sự sẵn sàng tư vấn 1:1 bảo mật cho bạn.
                </p>
              </div>
              <Link
                href="/faq"
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shrink-0 shadow-xs cursor-pointer"
              >
                Xem toàn bộ FAQ
              </Link>
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* BOTTOM FINAL CTA (Cyberpunk / Liquid Glowing Button) */}
        {/* ========================================================================= */}
        <section className="py-24 bg-gradient-to-b from-white to-blue-50/50 border-t border-blue-100 relative overflow-hidden">
          {/* Radial Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-300/30 via-indigo-300/25 to-purple-300/20 blur-3xl rounded-full pointer-events-none" />

          <Container className="relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-100/80 text-blue-700 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5" />
                SẴN SÀNG BẮT ĐẦU?
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Sẵn sàng cho bước tiến tiếp theo{" "}
                <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                  trong sự nghiệp của bạn?
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Khám phá hàng chục cơ hội phát triển nghề nghiệp nội bộ hấp dẫn ngay hôm nay và nhận sự
                hỗ trợ tận tình từ đội ngũ Nhân sự.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
                {/* Cyberpunk / Liquid Glow Button: "Tạo tài khoản ứng viên" */}
                <Link
                  href="/register"
                  className="relative group overflow-hidden px-9 py-4 rounded-full font-bold text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-[0_0_25px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent before:transition-transform before:duration-700 cursor-pointer"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Tạo tài khoản ứng viên</span>
                    <Sparkles className="w-4 h-4" />
                  </span>
                </Link>

                {/* Secondary Button: "Xem vị trí đang tuyển" */}
                <a
                  href="#jobs"
                  className="px-8 py-4 rounded-full font-bold text-sm sm:text-base text-slate-700 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  <span>Xem vị trí đang tuyển</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Container>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
