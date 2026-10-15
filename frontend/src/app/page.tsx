"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
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
  Settings,
  Coffee,
  Laptop,
  Plane,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { jobService, JobPostingItem } from "@/services/job.service";

interface CareerBenefit {
  title: string;
  description: string;
  icon?: string;
}

interface CareerSettings {
  configured?: boolean;
  company_name?: string;
  slogan?: string;
  logo_url?: string;
  banner_url?: string;
  about_us?: string;
  benefits?: CareerBenefit[];
  updated_at?: string;
}

const DEFAULT_CAREER_SETTINGS: CareerSettings = {
  company_name: "Tập Đoàn Doanh Nghiệp Enterprise",
  slogan: "Cùng nhau tạo nên những điều lớn lao và bứt phá nấc thang sự nghiệp",
  banner_url:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
  about_us:
    "Về danh tiếng và thị trường, công ty là điểm tựa vững chắc cho sự nghiệp của bạn. Chúng tôi tin rằng tài sản quý giá nhất chính là đội ngũ nhân sự. Sứ mệnh của chúng tôi là tạo nên không gian làm việc mở, công bằng và cơ hội phát triển không giới hạn cho mọi nhân viên.",
  benefits: [
    {
      title: "Bảo hiểm toàn diện",
      description: "Bảo hiểm toàn diện nhân lương, bảo hiểm y tế mở rộng cho cả gia đình.",
      icon: "ShieldCheck",
    },
    {
      title: "Đào tạo chuyên sâu",
      description: "Đào tạo chuyên sâu các kỹ năng mới, hỗ trợ 100% học bổng chứng chỉ quốc tế.",
      icon: "GraduationCap",
    },
    {
      title: "Thưởng thâm niên",
      description: "Thưởng thâm niên và các chế độ đãi ngộ vượt bậc khi cống hiến lâu dài.",
      icon: "Award",
    },
  ],
};

function resolveBenefitIcon(iconName?: string) {
  switch (iconName?.toLowerCase()) {
    case "award":
      return Award;
    case "graduationcap":
      return GraduationCap;
    case "shieldcheck":
      return ShieldCheck;
    case "zap":
      return Zap;
    case "coffee":
      return Coffee;
    case "laptop":
      return Laptop;
    case "plane":
      return Plane;
    case "users":
      return Users;
    case "hearthandshake":
    case "heart":
      return HeartHandshake;
    case "trendingup":
      return TrendingUp;
    default:
      return ShieldCheck;
  }
}

export default function LandingPage() {
  // Search & Filter State
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  // Job Category & Remote Data State
  const [activeCategory, setActiveCategory] = useState("all");
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Dynamic Career Page Settings (CMS by HR)
  const [careerSettings, setCareerSettings] = useState<CareerSettings>(DEFAULT_CAREER_SETTINGS);
  const [isHRUser, setIsHRUser] = useState(false);

  // Active step hovered on timeline
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    let isMounted = true;

    // Check if logged-in user is HR/Recruiter/Admin
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const roles: string[] = parsed.roles || [];
        if (
          roles.includes("hr") ||
          roles.includes("hrm") ||
          roles.includes("admin") ||
          roles.includes("recruiter")
        ) {
          setIsHRUser(true);
        }
      }
    } catch { }

    // Load CMS Career Page Settings
    fetch("/api/v1/public/career-page")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && data.configured !== false && data.company_name) {
          setCareerSettings({
            company_name: data.company_name,
            slogan: data.slogan || DEFAULT_CAREER_SETTINGS.slogan,
            banner_url: data.banner_url || DEFAULT_CAREER_SETTINGS.banner_url,
            about_us: data.about_us || DEFAULT_CAREER_SETTINGS.about_us,
            benefits:
              data.benefits && data.benefits.length > 0
                ? data.benefits
                : DEFAULT_CAREER_SETTINGS.benefits,
            configured: true,
          });
        }
      })
      .catch(() => { });

    // Load Real Job Postings from Database API
    jobService
      .getJobs()
      .then((data) => {
        if (isMounted) {
          setJobs(data || []);
          setLoadingJobs(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load real jobs:", err);
        if (isMounted) {
          setJobs([]);
          setLoadingJobs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { id: "all", label: "Tất Cả" },
    { id: "it", label: "Công Nghệ Thông Tin" },
    { id: "product", label: "Kinh Doanh & Marketing" },
    { id: "hr", label: "Nhân Sự" },
    { id: "finance", label: "Tài Chính" },
    { id: "operation", label: "Vận Hành" },
  ];

  const filteredJobs = jobs.filter((job) => {
    const deptStr = (job.department_name || job.department || "").toLowerCase();
    const titleStr = (job.title || "").toLowerCase();
    const locStr = (job.location || "").toLowerCase();

    const matchesCategory =
      activeCategory === "all" ||
      (activeCategory === "it" &&
        (deptStr.includes("công nghệ") ||
          deptStr.includes("it") ||
          titleStr.includes("backend") ||
          titleStr.includes("frontend") ||
          titleStr.includes("data"))) ||
      (activeCategory === "hr" &&
        (deptStr.includes("nhân sự") ||
          titleStr.includes("hr") ||
          titleStr.includes("tuyển dụng"))) ||
      (activeCategory === "product" &&
        (deptStr.includes("sản phẩm") ||
          deptStr.includes("thiết kế") ||
          deptStr.includes("marketing") ||
          titleStr.includes("product"))) ||
      (activeCategory === "finance" &&
        (deptStr.includes("tài chính") || deptStr.includes("kế toán"))) ||
      (activeCategory === "operation" &&
        (deptStr.includes("vận hành") || deptStr.includes("khách hàng")));

    const matchesKeyword =
      !searchKeyword ||
      titleStr.includes(searchKeyword.toLowerCase()) ||
      deptStr.includes(searchKeyword.toLowerCase()) ||
      locStr.includes(searchKeyword.toLowerCase());

    const matchesDept =
      selectedDept === "all" || deptStr.includes(selectedDept.toLowerCase());

    const matchesLoc =
      selectedLocation === "all" || locStr.includes(selectedLocation.toLowerCase());

    return matchesCategory && matchesKeyword && matchesDept && matchesLoc;
  });

  const faqs = [
    {
      q: "Ai có thể tham gia ứng tuyển các vị trí nội bộ?",
      a: "Tất cả nhân viên chính thức đã hoàn thành thời gian thử việc đều có quyền đăng ký ứng tuyển. Hệ thống khuyến khích mọi thành viên chủ động thử thách bản thân ở những nấc thang sự nghiệp mới.",
    },
    {
      q: "Tôi có cần thông báo cho Quản lý trực tiếp trước khi nộp hồ sơ không?",
      a: "Hệ thống bảo đảm tính bảo mật trong giai đoạn đầu tiếp nhận hồ sơ. Trước vòng phỏng vấn chuyên sâu hoặc khi nhận đề nghị thử việc (Offer), HR sẽ đồng hành cùng bạn để trao đổi với Quản lý hiện tại nhằm chuẩn bị kế hoạch bàn giao chu đáo nhất.",
    },
    {
      q: "Thông tin ứng tuyển của tôi có được bảo mật không?",
      a: "Tuyệt đối bảo mật 100%. Hồ sơ của bạn chỉ được truy cập bởi Chuyên viên Tuyển dụng (HR Recruiter) và Người duyệt tuyển dụng chuyên môn của vị trí ứng tuyển.",
    },
    {
      q: "Nếu chưa trúng tuyển đợt này, vị trí hiện tại của tôi có bị ảnh hưởng không?",
      a: "Hoàn toàn không bị ảnh hưởng. Công ty luôn ghi nhận và đánh giá cao tinh thần cầu tiến. Hồ sơ của bạn sẽ được lưu giữ trong Talent Pool nội bộ để ưu tiên khi có cơ hội phù hợp tiếp theo.",
    },
    {
      q: "Chế độ thâm niên, phép năm và đãi ngộ được tính thế nào khi chuyển bộ phận?",
      a: "Toàn bộ thâm niên làm việc, ngày phép tích lũy và các phúc lợi cốt lõi được bảo lưu 100%. Lương và phụ cấp chuyên môn sẽ được điều chỉnh tương ứng theo dải đãi ngộ của vị trí mới.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Global Navigation */}
      <Header />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* SECTION 1: HERO - Translucent with Blurry Photo & Vibrant Animated Aurora Mesh */}
        {/* ========================================================================= */}
        <section
          id="home"
          className="relative -mt-20 pt-36 pb-24 lg:pt-40 lg:pb-32 overflow-hidden scroll-mt-20 text-center"
        >
          {/* Background Layer 1: Modern Corporate Office Photo with Blurry Translucent Depth */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <Image
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop"
              alt="Môi trường làm việc"
              fill
              priority
              className="object-cover object-center filter blur-[10px] scale-105 opacity-[0.25]"
            />
          </div>

          {/* Background Layer 2: Vibrant Animated Aurora Gradient Mesh in Daylight Blue & Cyan (No Pink) */}
          {/* Left Orb: Rich Pastel Cyan / Aqua / Turquoise Aura */}
          <div className="absolute -top-16 -left-36 w-[700px] h-[700px] lg:w-[900px] lg:h-[900px] rounded-full bg-gradient-to-tr from-cyan-400/80 via-sky-300/70 to-teal-200/40 blur-[80px] pointer-events-none animate-mesh-drift-1" />

          {/* Right Orb: Luminous Sky Blue / Royal Blue / Soft Ice Blue Aura */}
          <div className="absolute -top-12 -right-36 w-[700px] h-[700px] lg:w-[900px] lg:h-[900px] rounded-full bg-gradient-to-bl from-blue-400/65 via-sky-300/55 to-cyan-200/35 blur-[85px] pointer-events-none animate-mesh-drift-2" />

          {/* Lower Left / Center Accent Orb: Soft Glowing Teal / Sky */}
          <div className="absolute -bottom-24 left-1/4 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-teal-300/60 via-cyan-200/45 to-transparent blur-[75px] pointer-events-none animate-mesh-drift-3" />

          {/* Background Layer 3: Satin Frosted Glass Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/40 to-white/90 backdrop-blur-[3px] pointer-events-none" />

          <Container>
            <div className="max-w-5xl xl:max-w-6xl mx-auto space-y-8 relative z-10">
              {/* Centered Pill Badge matching Mockup */}
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-xs sm:text-sm font-bold bg-sky-200/85 text-sky-800 border border-sky-300/80 shadow-xs mx-auto backdrop-blur-sm hover:scale-105 transition-all">
                <Sparkles className="w-4 h-4 text-sky-600 animate-spin-slow" />
                <span>Khám phá 117+ vị trí tuyển dụng nội bộ</span>
              </div>

              {/* Centered Main Headline with Expansive Breathing Room */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] xl:text-[62px] font-black text-slate-900 tracking-tight leading-[1.15] drop-shadow-2xs max-w-4xl mx-auto">
                Khám Phá Cơ Hội & Tự Hào<br />Đồng Hành Cùng Doanh Nghiệp
              </h1>

              {/* Centered Expansive Pill Search Bar */}
              <div className="relative flex items-center max-w-3xl lg:max-w-4xl mx-auto mt-6 w-full hero-search-bar rounded-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm cơ hội việc làm nội bộ, chức danh, phòng ban..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="w-full h-15 sm:h-16 pl-7 pr-18 bg-transparent rounded-full focus:outline-none text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  aria-label="Tìm kiếm vị trí"
                  onClick={() => {
                    document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="absolute right-2.5 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-md shadow-cyan-400/35 transition-all cursor-pointer"
                  style={{ color: "#ffffff" }}
                >
                  <Search className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Trust & Key Advantage Badges Row to Expand Width Harmoniously */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-2 text-xs sm:text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-500" />
                  <span>117+ vị trí tuyển dụng nội bộ</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Bảo mật hồ sơ 100%</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <span>Lộ trình thăng tiến minh bạch</span>
                </span>
              </div>
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: VỀ CHÚNG TÔI & MÔI TRƯỜNG LÀM VIỆC - Exactly matching Mockup 2 */}
        {/* ========================================================================= */}
        <section id="about" className="py-20 bg-white relative scroll-mt-20 border-b border-slate-100">
          <Container>
            {/* Centered Heading matching Mockup 2 */}
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Về Chúng Tôi & Môi Trường Làm Việc
              </h2>
              <p className="text-sm sm:text-base text-slate-500">
                Khám phá văn hóa gắn kết và hành trình phát triển không ngừng tại {careerSettings.company_name || "Doanh nghiệp"}
              </p>
            </div>

            {/* Top Row: Photo on Left, Story on Right matching Mockup 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
              {/* Photo on Left */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-xl shadow-sky-500/10 aspect-[4/3] group">
                  <Image
                    src={careerSettings.banner_url || DEFAULT_CAREER_SETTINGS.banner_url!}
                    alt="Môi trường làm việc"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Story on Right */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Giới thiệu công ty
                  </h3>
                  {isHRUser && (
                    <Link
                      href="/hr/career-page-config"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa trang này (HR)</span>
                    </Link>
                  )}
                </div>

                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                  {careerSettings.about_us || DEFAULT_CAREER_SETTINGS.about_us}
                </p>

                <p className="text-slate-500 leading-relaxed text-sm">
                  Sứ mệnh của chúng tôi là tạo nên một không gian làm việc nơi mỗi thành viên đều được trao quyền phát triển tối đa, công nhận đóng góp và bảo tồn toàn bộ quyền lợi khi chuyển đổi vai trò.
                </p>
              </div>
            </div>

            {/* Directly Underneath: Benefit Cards in a Row matching Mockup 2! */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {(careerSettings.benefits || DEFAULT_CAREER_SETTINGS.benefits!).slice(0, 3).map((b, idx) => {
                const IconComponent = resolveBenefitIcon(b.icon);
                return (
                  <div
                    key={idx}
                    className="rounded-2xl p-6 bg-white border border-sky-200/90 shadow-sm hover:shadow-md hover:border-sky-400 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        {b.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: VỊ TRÍ ĐANG TUYỂN DỤNG NỘI BỘ - Exactly matching Mockup 2 */}
        {/* ========================================================================= */}
        <section id="jobs" className="py-20 bg-slate-50/60 relative scroll-mt-20 border-b border-slate-100">
          <Container>
            {/* Centered Heading matching Mockup 2 */}
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Vị Trí Đang Tuyển Dụng Nội Bộ
              </h2>
              <p className="text-sm text-slate-500">
                Khám phá các cơ hội phát triển sự nghiệp hấp dẫn
              </p>
            </div>

            {/* Filter Pills matching Mockup 2 */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap mb-10">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${activeCategory === cat.id
                    ? "bg-blue-600 text-white !text-white shadow-md shadow-blue-500/25"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                    }`}
                  style={activeCategory === cat.id ? { color: "#ffffff", backgroundColor: "#2563eb" } : undefined}
                >
                  <span style={activeCategory === cat.id ? { color: "#ffffff" } : undefined}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Job Grid matching Mockup 2 */}
            {loadingJobs ? (
              <div className="text-center py-16 text-slate-500 font-medium">
                Đang đồng bộ dữ liệu vị trí tuyển dụng...
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-2xl p-6 bg-white border border-sky-200/80 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                        {job.title}
                      </h3>

                      <div className="space-y-1 text-xs text-slate-500">
                        <p>Phòng: {job.department_name || job.department}</p>
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {job.location}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 pt-2 text-xs">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {job.type}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-100">
                          {job.salary_range || job.salaryRange || "Thỏa thuận"}
                        </span>
                      </div>
                    </div>

                    {/* Luminous Solid Blue Pill Button with Pure White Text */}
                    <Link
                      href="/login"
                      className="btn-pill-apply mt-6 w-full py-3 rounded-full text-white !text-white font-black text-sm text-center shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      style={{ color: "#ffffff", backgroundColor: "#2563eb" }}
                    >
                      <span className="!text-white text-white font-black" style={{ color: "#ffffff" }}>
                        Ứng Tuyển Ngay
                      </span>
                      <ArrowRight className="w-4 h-4 text-white !text-white" style={{ color: "#ffffff" }} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">Không tìm thấy vị trí phù hợp</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Vui lòng thử tìm kiếm với từ khóa khác hoặc đổi danh mục phòng ban.
                </p>
              </div>
            )}
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: QUY TRÌNH 5 BƯỚC MINH BẠCH - ID: process */}
        {/* ========================================================================= */}
        <section
          id="process"
          className="py-24 bg-white relative overflow-hidden scroll-mt-20 border-b border-slate-100"
        >
          <Container>
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-20">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 uppercase tracking-wider">
                QUY TRÌNH PHÁT TRIỂN NỘI BỘ
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                5 bước minh bạch cho hành trình mới
              </h2>
              <p className="text-base text-slate-600">
                Quy trình chuẩn hóa, tối giản thủ tục và bảo mật tuyệt đối cho mọi nhân sự tham gia.
              </p>
            </div>

            {/* Timeline with Connected Glowing Laser Trail */}
            <div className="relative">
              {/* Horizontal Connecting Line for Desktop */}
              <div className="hidden lg:block absolute top-[28px] left-[8%] right-[8%] h-[3px] bg-slate-200 rounded-full z-0 overflow-hidden">
                <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-blue-500 to-sky-400 animate-laser-flow" />
              </div>

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
                        <span className="absolute -inset-2 rounded-2xl bg-blue-500/30 animate-ping pointer-events-none" />
                      )}
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-blue-500 shadow-md shadow-blue-500/20 text-blue-600 font-black text-lg flex items-center justify-center group-hover:bg-gradient-to-tr group-hover:from-blue-600 group-hover:to-sky-500 group-hover:text-white group-hover:border-transparent transition-all duration-300">
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
        {/* SECTION 5: TIN TỨC NỘI BỘ & CÂU CHUYỆN THÀNH CÔNG - ID: news */}
        {/* ========================================================================= */}
        <section
          id="news"
          className="py-24 bg-gradient-to-b from-sky-50/70 via-white to-blue-50/40 relative overflow-hidden scroll-mt-20 border-b border-slate-100"
        >
          {/* Animated floating background blur lights */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none animate-pulse-ring" />
          <div
            className="absolute bottom-10 -right-32 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none animate-pulse-ring"
            style={{ animationDelay: "3s" }}
          />

          <Container>
            {/* Section Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 relative z-10">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-blue-700 bg-blue-100/80 border border-blue-200 uppercase tracking-wider shadow-2xs">
                <Newspaper className="w-3.5 h-3.5 text-blue-600 animate-spin-slow" />
                TIN TỨC & HOẠT ĐỘNG NỘI BỘ
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                Cập nhật chuyển động & cơ hội mới
              </h2>
              <p className="text-base sm:text-lg text-slate-600 font-medium">
                Nắm bắt các chính sách luân chuyển mới nhất, chương trình giới thiệu đồng đội và câu
                chuyện truyền cảm hứng.
              </p>
            </div>

            {/* Featured Referral Banner with Motion & Dynamic Animations */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white p-8 sm:p-12 lg:p-14 shadow-2xl shadow-blue-600/25 mb-16 border border-white/20 group">
              {/* Animated Aurora Background Blobs inside Card */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-300/25 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
              <div
                className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-400/30 rounded-full blur-3xl pointer-events-none animate-glow-pulse"
                style={{ animationDelay: "2s" }}
              />

              {/* Shimmer Light Sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer-sweep pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-8 space-y-5">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-sky-100 border border-white/30 shadow-sm">
                    <UserPlus className="w-4 h-4 text-sky-200" />
                    <span>CHƯƠNG TRÌNH REFERRAL ĐỒNG ĐỘI</span>
                  </div>

                  <h3
                    className="text-2xl sm:text-3xl lg:text-4xl font-black !text-white text-white tracking-tight leading-tight drop-shadow-md"
                    style={{ color: "#ffffff" }}
                  >
                    Giới thiệu đồng nghiệp xuất sắc — Nhận thưởng tới 20.000.000đ
                  </h3>

                  <p
                    className="text-sm sm:text-base text-sky-100 !text-sky-100 max-w-xl leading-relaxed font-normal drop-shadow-xs"
                    style={{ color: "#e0f2fe" }}
                  >
                    Đồng đội bạn giới thiệu sẽ giúp tổ chức phát triển mạnh mẽ hơn, đồng thời bạn sẽ nhận ngay phần thưởng tri ân xứng đáng vào kỳ lương gần nhất khi ứng viên onboard thành công.
                  </p>

                  {/* Buttons with clear distinct colors and high contrast */}
                  <div className="flex flex-wrap items-center gap-4 pt-3">
                    <Link
                      href="/employee/referrals/new"
                      className="px-7 py-3.5 rounded-full bg-white hover:bg-sky-50 shadow-xl shadow-blue-950/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      style={{ backgroundColor: "#ffffff" }}
                    >
                      <UserPlus className="w-4 h-4 text-blue-700" style={{ color: "#1d4ed8" }} />
                      <span className="font-black text-sm text-blue-700" style={{ color: "#1d4ed8" }}>
                        Giới thiệu ứng viên ngay
                      </span>
                      <ArrowRight className="w-4 h-4 text-blue-700" style={{ color: "#1d4ed8" }} />
                    </Link>

                    <a
                      href="#faq"
                      className="px-6 py-3.5 rounded-full bg-white/15 hover:bg-white/25 border-2 border-white/40 !text-white text-white font-bold text-sm text-center backdrop-blur-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                      style={{ color: "#ffffff" }}
                    >
                      <span style={{ color: "#ffffff" }}>Xem chính sách thưởng</span>
                    </a>
                  </div>
                </div>

                {/* Right Interactive Animated Floating Bonus Widget */}
                <div className="lg:col-span-4 flex justify-center lg:justify-end">
                  <div className="relative w-full max-w-[280px] rounded-3xl bg-white/15 backdrop-blur-xl border-2 border-white/30 p-6 shadow-2xl text-center animate-float-smooth">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-400/30">
                      <Award className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-sky-200">
                      Thưởng Giới Thiệu
                    </p>
                    <div className="text-3xl font-black text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)] my-1">
                      20.000.000đ
                    </div>
                    <p className="text-[11px] text-sky-100 mb-3">
                      / mỗi ứng viên tuyển dụng thành công
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-bold text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Đang diễn ra</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 News & Internal Activities Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {[
                {
                  badge: "Chính Sách",
                  badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
                  date: "15/10/2026",
                  title: "Chính sách luân chuyển nội bộ Q4/2026: Rút ngắn thời gian xét duyệt",
                  desc: "Quy trình chuyển giao vị trí công tác mới được tối ưu hóa, đảm bảo phản hồi kết quả trong vòng tối đa 5 ngày làm việc.",
                },
                {
                  badge: "Workshop",
                  badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
                  date: "18/10/2026",
                  title: "Tech Talk hàng tuần: Microservices Architecture & AI Automation",
                  desc: "Chia sẻ kinh nghiệm thực tế về tối ưu hóa hiệu năng backend và tự động hóa quy trình tuyển dụng cùng đội ngũ Tech Lead.",
                },
                {
                  badge: "Vinh Danh",
                  badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  date: "12/10/2026",
                  title: "Vinh danh 12 nhân sự chuyển đổi vị trí thành công trong tháng 10",
                  desc: "Chúc mừng các đồng nghiệp đã xuất sắc bứt phá, khẳng định năng lực mới và đồng hành cùng sự phát triển của công ty.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-3 py-1 rounded-full font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
                    <span>Xem chi tiết</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonials (Câu chuyện thành công) */}
            <div className="pt-6">
              <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 uppercase tracking-wider">
                  <Quote className="w-3.5 h-3.5" />
                  CÂU CHUYỆN THÀNH CÔNG
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
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
                    className="glass-light-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden"
                  >
                    <Quote className="w-12 h-12 text-blue-100 absolute top-6 right-6 pointer-events-none" />

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
          className="py-20 bg-white border-t border-slate-200/60 relative scroll-mt-20"
        >
          <Container className="max-w-4xl">
            <div className="text-center space-y-3 mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-200 uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                CÂU HỎI THƯỜNG GẶP (FAQ)
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
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
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen
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
        {/* BOTTOM FINAL CTA */}
        {/* ========================================================================= */}
        <section className="py-24 bg-gradient-to-b from-white via-sky-50/30 to-blue-50/60 border-t border-blue-100 relative overflow-hidden">
          {/* Radial Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-sky-300/25 via-blue-200/20 to-indigo-200/15 blur-3xl rounded-full pointer-events-none" />

          <Container className="relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5" />
                SẴN SÀNG BẮT ĐẦU?
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Sẵn sàng cho bước tiến tiếp theo{" "}
                <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600">
                  trong sự nghiệp của bạn?
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Khám phá hàng chục cơ hội phát triển nghề nghiệp nội bộ hấp dẫn ngay hôm nay và nhận sự
                hỗ trợ tận tình từ đội ngũ Nhân sự.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
                <Link
                  href="/register"
                  className="relative group overflow-hidden px-9 py-4 rounded-full font-bold text-sm sm:text-base text-white bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_35px_rgba(37,99,235,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/35 before:to-transparent before:transition-transform before:duration-700 cursor-pointer"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span>Tạo tài khoản ứng viên</span>
                    <Sparkles className="w-4 h-4" />
                  </span>
                </Link>

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
