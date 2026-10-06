"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  FileText,
  UserPlus,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  ChevronDown,
  Bell,
  LogOut,
  User as UserIcon,
  Phone,
  Calendar,
  Mail,
  Search,
  ArrowRight,
  Eye,
  Clock,
  DollarSign,
  Send,
  MapPin,
  Laptop,
  Lock,
  Camera,
  Layers,
  Sparkles,
  Gift,
  Check,
  Shield,
  FileSpreadsheet
} from "lucide-react";
import { UserProfileModal, UserProfileData } from "@/components/UserProfileModal";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { CroppedAvatarResult } from "@/lib/cropImage";
import { SessionTimeoutModal } from "@/components/SessionTimeoutModal";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

// ==========================================
// 1. DATA TYPES & INTERFACES
// ==========================================

export interface InternalJobItem {
  id: string;
  code: string;
  title: string;
  department: string;
  location: string;
  level: "Junior" | "Middle" | "Senior" | "Lead" | "Manager";
  salaryRange: string;
  referralBonus: string;
  openings: number;
  deadline: string;
  isUrgent?: boolean;
  isHot?: boolean;
  skills: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
}

export interface MyJobApplication {
  id: string;
  jobCode: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  cvFileName: string;
  status: "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
  statusText: string;
  currentStepIndex: number;
  interviewSchedule?: {
    time: string;
    format: string;
    interviewer: string;
  };
  feedbackNote?: string;
}

export interface ReferralCandidate {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  jobCode: string;
  jobTitle: string;
  relation: string;
  referredDate: string;
  status: "SUBMITTED" | "INTERVIEWING" | "PASSED_PROBATION" | "BONUS_PAID";
  statusText: string;
  bonusAmount: string;
  bonusPaid: boolean;
}

// ==========================================
// 2. MOCK DATA BẢNG TIN TUYỂN DỤNG NỘI BỘ
// ==========================================

const INITIAL_INTERNAL_JOBS: InternalJobItem[] = [
  {
    id: "job-1",
    code: "TECH-2026-01",
    title: "Senior Fullstack Engineer (React / Python)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    location: "Hà Nội (Hybrid)",
    level: "Senior",
    salaryRange: "35.000.000 - 50.000.000 VNĐ",
    referralBonus: "12.000.000 VNĐ",
    openings: 2,
    deadline: "30/11/2026",
    isHot: true,
    isUrgent: true,
    skills: ["React", "Next.js", "Python", "FastAPI", "PostgreSQL"],
    description:
      "Phát triển hệ thống microservices nội bộ, nền tảng số hóa quản trị doanh nghiệp và các công cụ tối ưu quy trình làm việc.",
    responsibilities: [
      "Thiết kế kiến trúc frontend và backend cho nền tảng tuyển dụng cốt lõi",
      "Tối ưu hóa hiệu năng cơ sở dữ liệu và tích hợp API bảo mật OAuth2",
      "Phối hợp với Product Owner và đội ngũ QA theo mô hình Agile/Scrum",
    ],
    requirements: [
      "Tối thiểu 3 năm kinh nghiệm lập trình React/TypeScript và backend Python",
      "Am hiểu Docker, CI/CD pipeline và kiến trúc hướng dịch vụ microservices",
      "Khả năng tư duy logic và giải quyết vấn đề độc lập",
    ],
    benefits: [
      "Được cộng 10% phụ cấp thâm niên nội bộ khi chuyển vị trí",
      "Thưởng referral hấp dẫn khi giới thiệu ứng viên thành công",
      "Gói bảo hiểm sức khỏe cao cấp và ngân sách đào tạo 15.000.000 VNĐ/năm",
    ],
  },
  {
    id: "job-2",
    code: "PROD-2026-03",
    title: "Product Manager (Core Recruitment Platform)",
    department: "Khối Quản Trị Sản Phẩm",
    location: "TP. Hồ Chí Minh",
    level: "Lead",
    salaryRange: "40.000.000 - 60.000.000 VNĐ",
    referralBonus: "15.000.000 VNĐ",
    openings: 1,
    deadline: "25/11/2026",
    isHot: true,
    skills: ["Product Strategy", "Agile", "User Research", "Roadmapping"],
    description:
      "Dẫn dắt lộ trình phát triển sản phẩm công nghệ cốt lõi của công ty, tối ưu hóa trải nghiệm người dùng nội bộ và đối tác.",
    responsibilities: [
      "Định hình tầm nhìn và Product Roadmap theo quý",
      "Thu thập và phân tích dữ liệu hành vi người dùng nội bộ",
      "Làm việc trực tiếp với ban lãnh đạo để ra quyết định tính năng chiến lược",
    ],
    requirements: [
      "Ít nhất 3 năm kinh nghiệm ở vai trò Product Owner hoặc Product Manager",
      "Kỹ năng đàm phán, quản trị kỳ vọng stakeholder xuất sắc",
    ],
    benefits: [
      "Thưởng KPI sản phẩm theo quý",
      "Cơ hội thăng tiến lên Trưởng bộ phận sản phẩm sau 1 năm",
    ],
  },
  {
    id: "job-3",
    code: "DATA-2026-07",
    title: "Data Analyst & Business Intelligence",
    department: "Phòng Phân Tích Dữ Liệu & Insight",
    location: "Hà Nội",
    level: "Middle",
    salaryRange: "22.000.000 - 32.000.000 VNĐ",
    referralBonus: "8.000.000 VNĐ",
    openings: 2,
    deadline: "15/12/2026",
    skills: ["SQL", "Power BI", "Python", "Data Modeling"],
    description:
      "Xây dựng báo cáo dữ liệu trực quan hóa, phân tích xu hướng kinh doanh và hỗ trợ các khối nghiệp vụ ra quyết định dựa trên dữ liệu.",
    responsibilities: [
      "Xây dựng và bảo trì các Dashboard điều hành trên Power BI",
      "Xử lý truy vấn dữ liệu lớn và trực quan hóa luồng vận hành tuyển dụng",
    ],
    requirements: [
      "Thành thạo SQL phức tạp, DAX và Python xử lý dữ liệu (Pandas)",
      "Tư duy số liệu sắc bén và kỹ năng thuyết trình báo cáo",
    ],
    benefits: [
      "Được tài trợ 100% chi phí thi các chứng chỉ quốc tế (PL-300, AWS Data Analytics)",
    ],
  },
  {
    id: "job-4",
    code: "HR-2026-02",
    title: "Chuyên Viên Thu Hút Nhân Tài (IT Talent Acquisition)",
    department: "Khối Nhân Sự & Phát Triển Tổ Chức",
    location: "Đà Nẵng / Remote",
    level: "Middle",
    salaryRange: "18.000.000 - 26.000.000 VNĐ",
    referralBonus: "6.000.000 VNĐ",
    openings: 1,
    deadline: "20/11/2026",
    skills: ["Tech Sourcing", "Interviewing", "Employer Branding"],
    description:
      "Tìm kiếm và thu hút các chuyên gia công nghệ thông tin cho các dự án trọng điểm của tập đoàn.",
    responsibilities: [
      "Tìm kiếm ứng viên qua LinkedIn, GitHub và các kênh công nghệ",
      "Phỏng vấn vòng 1 đánh giá văn hóa và mức độ phù hợp",
    ],
    requirements: [
      "Có ít nhất 1.5 năm kinh nghiệm tuyển dụng IT/Tech",
      "Giao tiếp tự tin, tác phong chuyên nghiệp",
    ],
    benefits: ["Thưởng tuyển dụng theo đầu việc (Commission không giới hạn)"],
  },
  {
    id: "job-5",
    code: "SEC-2026-09",
    title: "Security Engineer & DevSecOps",
    department: "Phòng An Ninh Thông Tin & Hạ Tầng",
    location: "Hà Nội",
    level: "Senior",
    salaryRange: "38.000.000 - 55.000.000 VNĐ",
    referralBonus: "14.000.000 VNĐ",
    openings: 1,
    deadline: "10/12/2026",
    skills: ["DevSecOps", "Cloud Security", "Penetration Testing"],
    description:
      "Bảo đảm an toàn bảo mật cho toàn bộ hạ tầng đám mây và hệ thống dữ liệu nhân sự nội bộ.",
    responsibilities: [
      "Rà quét lỗ hổng định kỳ, thiết lập hệ thống cảnh báo sớm rủi ro an ninh",
      "Tích hợp các bước kiểm thử bảo mật tự động vào quy trình CI/CD",
    ],
    requirements: [
      "Tối thiểu 3 năm kinh nghiệm trong lĩnh vực An ninh mạng / DevSecOps",
      "Ưu tiên ứng viên có chứng chỉ CISSP, CEH hoặc AWS Security",
    ],
    benefits: ["Phụ cấp an ninh bảo mật đặc thù 15% lương hàng tháng"],
  },
];

const INITIAL_MY_APPLICATIONS: MyJobApplication[] = [
  {
    id: "APP-2026-081",
    jobCode: "TECH-2026-01",
    jobTitle: "Senior Fullstack Engineer (React / Python)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    appliedDate: "02/10/2026",
    cvFileName: "Nguyen_Van_An_Senior_Fullstack_CV_2026.pdf",
    status: "INTERVIEW",
    statusText: "Vòng phỏng vấn chuyên môn",
    currentStepIndex: 2,
    interviewSchedule: {
      time: "09:30 - Thứ Năm, 08/10/2026",
      format: "Google Meet & Phòng họp Tech 302",
      interviewer: "Lê Trưởng Nhóm (Hiring Manager)",
    },
    feedbackNote:
      "Hồ sơ nội bộ của bạn được đánh giá cao về năng lực React. Vui lòng chuẩn bị thuyết trình kiến trúc dự án gần nhất.",
  },
  {
    id: "APP-2026-042",
    jobCode: "PROD-2026-03",
    jobTitle: "Product Manager (Core Platform)",
    department: "Khối Quản Trị Sản Phẩm",
    appliedDate: "15/09/2026",
    cvFileName: "Nguyen_Van_An_Product_Profile.pdf",
    status: "SCREENING",
    statusText: "Đang sàng lọc hồ sơ",
    currentStepIndex: 1,
    feedbackNote:
      "Bộ phận Nhân sự đã tiếp nhận hồ sơ luân chuyển nội bộ và đang đối chiếu tiêu chuẩn kinh nghiệm.",
  },
];

const INITIAL_REFERRALS: ReferralCandidate[] = [
  {
    id: "REF-001",
    candidateName: "Phạm Minh Hoàng",
    candidateEmail: "hoang.pham@gmail.com",
    candidatePhone: "0988 123 456",
    jobCode: "TECH-2026-01",
    jobTitle: "Senior Fullstack Engineer",
    relation: "Đồng nghiệp cũ tại công ty trước",
    referredDate: "28/09/2026",
    status: "INTERVIEWING",
    statusText: "Đang phỏng vấn kỹ thuật",
    bonusAmount: "12.000.000 VNĐ",
    bonusPaid: false,
  },
  {
    id: "REF-002",
    candidateName: "Vũ Hoàng My",
    candidateEmail: "my.vuhoang@gmail.com",
    candidatePhone: "0912 888 999",
    jobCode: "DATA-2026-07",
    jobTitle: "Data Analyst & BI",
    relation: "Bạn đại học chuyên ngành CNTT",
    referredDate: "12/08/2026",
    status: "BONUS_PAID",
    statusText: "Đã tuyển dụng & Chi trả thưởng",
    bonusAmount: "8.000.000 VNĐ",
    bonusPaid: true,
  },
  {
    id: "REF-003",
    candidateName: "Đỗ Quốc Bảo",
    candidateEmail: "baodo.dev@outlook.com",
    candidatePhone: "0905 555 777",
    jobCode: "HR-2026-02",
    jobTitle: "IT Talent Acquisition",
    relation: "Bạn trong cộng đồng HR Tech",
    referredDate: "15/09/2026",
    status: "PASSED_PROBATION",
    statusText: "Đã qua thử việc (Chờ duyệt thưởng)",
    bonusAmount: "6.000.000 VNĐ",
    bonusPaid: false,
  },
];

export default function EmployeePortalDashboard() {
  const router = useRouter();

  // ==========================================
  // STATE THÔNG TIN NHÂN SỰ
  // ==========================================
  const [employeeProfile, setEmployeeProfile] = useState<UserProfileData>({
    employeeCode: "NV-2026-088",
    name: "Nguyễn Văn An",
    email: "nhanvien@company.com",
    role: "Nhân sự nội bộ (Employee)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    phone: "0901 234 567",
    gender: "Nam",
    dateOfBirth: "1994-08-15",
    avatarUrl: "",
    bio: "Kỹ sư phần mềm đam mê công nghệ mới, mong muốn phát triển sự nghiệp lâu dài trong nội bộ doanh nghiệp.",
  });

  // State menu active: "jobs" | "applications" | "referrals" | "profile"
  const [activeMenu, setActiveMenu] = useState<"jobs" | "applications" | "referrals" | "profile">("jobs");

  // State thông báo Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State Dropdown Header
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // State UserProfileModal & AvatarCropModal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<"profile" | "security">("profile");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedRawAvatar, setSelectedRawAvatar] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);

  // Hook quản lý session timeout (Inactivity check + Mock timeout)
  const { isExpired, setIsExpired, triggerMockTimeout } = useSessionTimeout({
    timeoutMinutes: 15,
    enabled: true,
  });

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đồng bộ thông tin từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) {
          setEmployeeProfile((prev) => ({
            ...prev,
            email: parsed.email,
            name: parsed.full_name || prev.name,
            role: parsed.role === "employee" ? "Nhân sự nội bộ (Employee)" : prev.role,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // ==========================================
  // STATE DỮ LIỆU CÔNG VIỆC, ỨNG TUYỂN & REFERRAL
  // ==========================================
  const [jobsList] = useState<InternalJobItem[]>(INITIAL_INTERNAL_JOBS);
  const [myApplications, setMyApplications] = useState<MyJobApplication[]>(INITIAL_MY_APPLICATIONS);
  const [referralsList, setReferralsList] = useState<ReferralCandidate[]>(INITIAL_REFERRALS);

  // Bộ lọc cho danh sách tuyển dụng
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");

  // Modal Chi tiết JD & Modal Ứng tuyển nhanh
  const [viewingJob, setViewingJob] = useState<InternalJobItem | null>(null);
  const [applyingJob, setApplyingJob] = useState<InternalJobItem | null>(null);
  const [applyMotivation, setApplyMotivation] = useState("");
  const [applyCvFileName, setApplyCvFileName] = useState("Nguyen_Van_An_CV_Default.pdf");
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);

  // Form Giới thiệu ứng viên (Referral)
  const [referralForm, setReferralForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    jobCode: INITIAL_INTERNAL_JOBS[0].code,
    relation: "Đồng nghiệp cũ",
    note: "",
  });
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  // Lọc danh sách công việc mở
  const filteredJobs = useMemo(() => {
    return jobsList.filter((job) => {
      const matchKeyword =
        !searchTerm.trim() ||
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDept = selectedDepartment === "ALL" || job.department === selectedDepartment;
      const matchLevel = selectedLevel === "ALL" || job.level === selectedLevel;

      return matchKeyword && matchDept && matchLevel;
    });
  }, [jobsList, searchTerm, selectedDepartment, selectedLevel]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(jobsList.map((j) => j.department)));
  }, [jobsList]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        alert("Kích thước tệp quá lớn! Vui lòng chọn ảnh dưới 8MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedRawAvatar(reader.result as string);
        setIsAvatarCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarCropComplete = (croppedResult: CroppedAvatarResult) => {
    setEmployeeProfile((prev) => ({
      ...prev,
      avatarUrl: croppedResult.avatarUrl,
      thumbnailUrl: croppedResult.thumbnailUrl,
    }));
    setIsAvatarCropOpen(false);
    setSelectedRawAvatar(null);
    showToast("Cập nhật ảnh đại diện thành công!");
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("internal-recruitment-session");
    } catch {
      // ignore
    }
    router.push("/login");
  };

  const handleConfirmApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;

    setIsSubmittingApply(true);
    setTimeout(() => {
      const newApp: MyJobApplication = {
        id: `APP-2026-${String(Math.floor(100 + Math.random() * 900))}`,
        jobCode: applyingJob.code,
        jobTitle: applyingJob.title,
        department: applyingJob.department,
        appliedDate: new Date().toLocaleDateString("vi-VN"),
        cvFileName: applyCvFileName,
        status: "SCREENING",
        statusText: "Đang sàng lọc hồ sơ",
        currentStepIndex: 1,
        feedbackNote: "Hồ sơ chuyển vị trí nội bộ của bạn đã được chuyển tới Trưởng bộ phận.",
      };

      setMyApplications([newApp, ...myApplications]);
      setIsSubmittingApply(false);
      setApplyingJob(null);
      setApplyMotivation("");
      showToast(`Đã nộp đơn ứng tuyển vị trí "${applyingJob.title}" thành công!`);
      setActiveMenu("applications");
    }, 500);
  };

  const handleSubmitReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralForm.candidateName.trim() || !referralForm.candidateEmail.trim()) {
      alert("Vui lòng điền họ tên và email của người quen.");
      return;
    }

    setIsSubmittingReferral(true);
    setTimeout(() => {
      const selectedJob = jobsList.find((j) => j.code === referralForm.jobCode);
      const newRef: ReferralCandidate = {
        id: `REF-${String(Math.floor(100 + Math.random() * 900))}`,
        candidateName: referralForm.candidateName.trim(),
        candidateEmail: referralForm.candidateEmail.trim(),
        candidatePhone: referralForm.candidatePhone.trim() || "Chưa cung cấp",
        jobCode: referralForm.jobCode,
        jobTitle: selectedJob ? selectedJob.title : referralForm.jobCode,
        relation: referralForm.relation,
        referredDate: new Date().toLocaleDateString("vi-VN"),
        status: "SUBMITTED",
        statusText: "Đã gửi thông tin",
        bonusAmount: selectedJob ? selectedJob.referralBonus : "8.000.000 VNĐ",
        bonusPaid: false,
      };

      setReferralsList([newRef, ...referralsList]);
      setIsSubmittingReferral(false);
      setReferralForm({
        candidateName: "",
        candidateEmail: "",
        candidatePhone: "",
        jobCode: INITIAL_INTERNAL_JOBS[0].code,
        relation: "Đồng nghiệp cũ",
        note: "",
      });
      showToast(`Đã gửi thông tin giới thiệu cho "${newRef.candidateName}"!`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Hidden File Input phục vụ Upload ảnh đại diện */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER (ĐỒNG BỘ 100% VỚI BỐ CỤC TRANG ADMIN) */}
      {/* ========================================================================= */}
      <header className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-50">
        {/* Góc trên bên trái: Logo & Vai trò (flex items-center gap-3) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-[#6ba5ff] flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Tuyển Dụng Nội Bộ
              </span>
              <span className="bg-blue-50 text-[#4285F4] px-3 py-1 rounded-full text-xs font-semibold border border-blue-100">
                Nhân sự nội bộ
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Cổng Cơ Hội Việc Làm & Giới Thiệu Nhân Tài (Employee Portal)
            </p>
          </div>
        </div>

        {/* Góc trên bên phải: Hồ sơ & Đăng xuất (flex items-center gap-4 hoặc gap-6) */}
        <div className="flex items-center gap-4">
          {/* Nút kiểm thử Session Timeout Modal (Tiện ích xem thử) */}
          <button
            type="button"
            onClick={triggerMockTimeout}
            title="Nhấn để kích hoạt ngay Modal Hết Hạn Phiên"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Thử nghiệm Hết hạn phiên</span>
          </button>

          {/* Icon chuông thông báo */}
          <button
            type="button"
            aria-label="Thông báo"
            className="relative w-10 h-10 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4285F4] ring-2 ring-white"></span>
          </button>

          {/* Avatar & Hồ sơ người dùng với Dropdown Menu giống Admin */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 pl-3 border-l border-gray-100 hover:bg-slate-50/80 p-1.5 rounded-2xl transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20"
              aria-expanded={isProfileDropdownOpen}
            >
              <div className="relative shrink-0">
                {employeeProfile.avatarUrl ? (
                  <img
                    src={employeeProfile.avatarUrl}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-100">
                    {employeeProfile.name.split(" ").slice(-2).map((n) => n[0]).join("") || "VA"}
                  </div>
                )}
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                  title="Đang trực tuyến"
                ></span>
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 leading-tight">
                    {employeeProfile.name}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180 text-[#4285F4]" : ""
                    }`}
                  />
                </div>
                <span className="text-xs text-slate-500 block leading-tight">
                  {employeeProfile.email}
                </span>
              </div>
            </button>

            {/* Dropdown Menu (Hồ sơ cá nhân, Upload ảnh đại diện, Đổi mật khẩu) */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Summary Card */}
                <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3 mb-2 border border-gray-100/70">
                  <div
                    onClick={() => {
                      avatarInputRef.current?.click();
                    }}
                    className="relative group cursor-pointer shrink-0"
                    title="Nhấp để tải lên ảnh mới"
                  >
                    {employeeProfile.avatarUrl ? (
                      <img
                        src={employeeProfile.avatarUrl}
                        alt="Avatar"
                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#4285F4] text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {employeeProfile.name.split(" ").slice(-2).map((n) => n[0]).join("") || "VA"}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">
                      {employeeProfile.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {employeeProfile.email}
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                      {employeeProfile.employeeCode}
                    </span>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="space-y-1">
                  {/* Tùy chọn 1: Upload ảnh đại diện */}
                  <button
                    type="button"
                    onClick={() => {
                      avatarInputRef.current?.click();
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#4285F4]" />
                    <span>Upload ảnh đại diện</span>
                  </button>

                  {/* Tùy chọn 2: Hồ sơ cá nhân */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setProfileModalTab("profile");
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Hồ sơ cá nhân</span>
                  </button>

                  {/* Tùy chọn 3: Đổi mật khẩu & Bảo mật */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setProfileModalTab("security");
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Đổi mật khẩu & Bảo mật</span>
                  </button>
                </div>

                <div className="my-1.5 border-t border-gray-100"></div>

                {/* Tùy chọn 4: Đăng xuất trong Dropdown */}
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>

          {/* Nút Đăng xuất: Nằm ngay bên phải khối Avatar, rõ ràng, nền trắng, viền xám nhạt, chữ xám đậm kèm icon Logout */}
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất khỏi hệ thống"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-rose-600 hover:border-gray-300 transition-colors text-sm font-medium cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT: SIDEBAR DỌC BÊN TRÁI + NỘI DUNG CHÍNH BÊN PHẢI */}
      {/* ========================================================================= */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR MENU DỌC (BÊN TRÁI) */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 lg:sticky lg:top-28">
            {/* Tiêu đề nhỏ: "MENU NHÂN SỰ" */}
            <div className="px-4 py-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                MENU NHÂN SỰ
              </span>
            </div>

            {/* Các mục Menu */}
            <nav className="flex flex-col space-y-2">
              {/* Mục 1: Bảng tin tuyển dụng (Mặc định chọn) */}
              <button
                type="button"
                onClick={() => setActiveMenu("jobs")}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer ${
                  activeMenu === "jobs"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 transition-colors"
                }`}
              >
                <Briefcase className="w-5 h-5 shrink-0 flex-none" />
                <span className="text-sm font-medium text-left leading-snug">
                  Bảng tin tuyển dụng
                </span>
              </button>

              {/* Mục 2: Việc làm đã ứng tuyển */}
              <button
                type="button"
                onClick={() => setActiveMenu("applications")}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer ${
                  activeMenu === "applications"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 transition-colors"
                }`}
              >
                <FileText className="w-5 h-5 shrink-0 flex-none" />
                <span className="text-sm font-medium text-left leading-snug">
                  Việc làm đã ứng tuyển
                </span>
              </button>

              {/* Mục 3: Giới thiệu ứng viên (Referral) */}
              <button
                type="button"
                onClick={() => setActiveMenu("referrals")}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer ${
                  activeMenu === "referrals"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 transition-colors"
                }`}
              >
                <UserPlus className="w-5 h-5 shrink-0 flex-none" />
                <span className="text-sm font-medium text-left leading-snug">
                  Giới thiệu ứng viên (Referral)
                </span>
              </button>

              {/* Mục 4: Hồ sơ cá nhân */}
              <button
                type="button"
                onClick={() => {
                  setProfileModalTab("profile");
                  setIsProfileModalOpen(true);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer ${
                  activeMenu === "profile"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 transition-colors"
                }`}
              >
                <UserIcon className="w-5 h-5 shrink-0 flex-none" />
                <span className="text-sm font-medium text-left leading-snug">
                  Hồ sơ cá nhân
                </span>
              </button>
            </nav>

            {/* Dưới cùng Sidebar: Tích hợp lại khối "Trạng thái máy chủ" giống hệt Admin */}
            <div className="mt-8 pt-6 border-t border-gray-100 px-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                  <Laptop className="w-4 h-4 text-[#4285F4]" />
                  <span>Trạng thái máy chủ</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Hoạt động ổn định (99.98%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Cổng kết nối nội bộ: v2.4.0-prod
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* KHU VỰC NỘI DUNG CHÍNH (BÊN PHẢI) */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Tiêu đề & mô tả phân hệ */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeMenu === "jobs" && "Bảng Tin Tuyển Dụng Nội Bộ"}
              {activeMenu === "applications" && "Việc Làm Đã Ứng Tuyển"}
              {activeMenu === "referrals" && "Chương Trình Giới Thiệu Ứng Viên (Referral)"}
              {activeMenu === "profile" && "Hồ Sơ Cá Nhân & Bảo Mật"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeMenu === "jobs" &&
                "Xem các vị trí công việc đang mở, tra cứu quyền lợi luân chuyển và ứng tuyển vị trí mới."}
              {activeMenu === "applications" &&
                "Theo dõi thời gian thực tiến trình thẩm định CV, lịch phỏng vấn và phản hồi tuyển dụng."}
              {activeMenu === "referrals" &&
                "Giới thiệu bạn bè người quen gia nhập đội ngũ và nhận tiền thưởng lên tới 15.000.000 VNĐ."}
              {activeMenu === "profile" &&
                "Xem thông tin mã nhân sự, phòng ban và cấu hình bảo mật tài khoản cá nhân."}
            </p>
          </div>

          {/* ===================================================================== */}
          {/* PHẦN THỐNG KÊ NHANH (CARDS): 3 THẺ NGANG GIỐNG HỆT ADMIN */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1: Tổng số tin tuyển dụng (VD: 15 hoặc jobsList.length) */}
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tổng số tin tuyển dụng
                </span>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {jobsList.length}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  100% Nội bộ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Các vị trí đang mở nhận hồ sơ luân chuyển nhân sự
              </p>
            </div>

            {/* Card 2: Đã ứng tuyển (VD: 2) */}
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Đã ứng tuyển
                </span>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">
                  {myApplications.length}
                </span>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Đang xử lý
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Hồ sơ CV của bạn đang trong các vòng thẩm định
              </p>
            </div>

            {/* Card 3: Đã giới thiệu (VD: 3) */}
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Đã giới thiệu (Referral)
                </span>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {referralsList.length}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Thưởng tới 15M
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Ứng viên người quen đã được ghi nhận gắn mã nhân sự
              </p>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* PHẦN DỮ LIỆU CHÍNH: KHUNG TRẮNG BO GÓC LỚN rounded-3xl / rounded-[24px] */}
          {/* ===================================================================== */}

          {/* TAB 1: BẢNG TIN TUYỂN DỤNG (BẢNG DỮ LIỆU CHUẨN DASHBOARD) */}
          {activeMenu === "jobs" && (
            <div className="bg-[#ffffff] rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              {/* THANH TÌM KIẾM & BỘ LỌC PHÍA TRÊN BẢNG GIỐNG ADMIN */}
              <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search Bar bo tròn rounded-full */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên vị trí, mã job hoặc kỹ năng..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Controls bo tròn rounded-full */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Lọc phòng ban */}
                  <div className="relative">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-4 pr-9 py-2.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] cursor-pointer"
                    >
                      <option value="ALL">Tất cả phòng ban</option>
                      {uniqueDepartments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Lọc cấp bậc */}
                  <div className="relative">
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-4 pr-9 py-2.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] cursor-pointer"
                    >
                      <option value="ALL">Tất cả cấp bậc</option>
                      <option value="Junior">Junior</option>
                      <option value="Middle">Middle</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead</option>
                      <option value="Manager">Manager</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* BẢNG DỮ LIỆU HIỂN THỊ CÁC VỊ TRÍ ĐANG TUYỂN DỤNG NỘI BỘ */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                    <tr>
                      <th className="py-4 px-6">Mã & Vị trí tuyển dụng</th>
                      <th className="py-4 px-4">Phòng ban</th>
                      <th className="py-4 px-4">Địa điểm & Cấp bậc</th>
                      <th className="py-4 px-4">Mức lương dự kiến</th>
                      <th className="py-4 px-4">Thưởng Referral</th>
                      <th className="py-4 px-4">Hạn nộp</th>
                      <th className="py-4 px-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          Không tìm thấy vị trí tuyển dụng phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => (
                        <tr
                          key={job.id}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Cột 1: Mã & Tên vị trí */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {job.code}
                              </span>
                              {job.isUrgent && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                  Tuyển gấp
                                </span>
                              )}
                            </div>
                            <div
                              onClick={() => setViewingJob(job)}
                              className="font-bold text-sm text-slate-900 group-hover:text-[#4285F4] transition-colors cursor-pointer"
                            >
                              {job.title}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {job.skills.slice(0, 3).map((s) => (
                                <span
                                  key={s}
                                  className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                                >
                                  {s}
                                </span>
                              ))}
                              {job.skills.length > 3 && (
                                <span className="text-[10px] text-slate-400">
                                  +{job.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Cột 2: Phòng ban */}
                          <td className="py-4 px-4 font-medium text-slate-700">
                            {job.department}
                          </td>

                          {/* Cột 3: Địa điểm & Cấp bậc */}
                          <td className="py-4 px-4">
                            <div className="font-medium text-slate-800">
                              {job.location}
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Cấp bậc: <strong>{job.level}</strong>
                            </span>
                          </td>

                          {/* Cột 4: Mức lương */}
                          <td className="py-4 px-4 font-semibold text-emerald-600">
                            {job.salaryRange}
                          </td>

                          {/* Cột 5: Thưởng Referral */}
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-[11px]">
                              <Gift className="w-3 h-3" />
                              {job.referralBonus}
                            </span>
                          </td>

                          {/* Cột 6: Hạn nộp */}
                          <td className="py-4 px-4 text-slate-500 font-medium">
                            {job.deadline}
                          </td>

                          {/* Cột 7: Thao tác */}
                          <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                            {/* Nút Xem JD */}
                            <button
                              type="button"
                              onClick={() => setViewingJob(job)}
                              className="px-3 py-1.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium text-xs transition-colors cursor-pointer"
                            >
                              Chi tiết JD
                            </button>

                            {/* Nút Ứng tuyển ngay */}
                            <button
                              type="button"
                              onClick={() => setApplyingJob(job)}
                              className="px-4 py-1.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Ứng tuyển</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VIỆC LÀM ĐÃ ỨNG TUYỂN */}
          {activeMenu === "applications" && (
            <div className="bg-[#ffffff] rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Danh Sách Việc Làm Đã Ứng Tuyển
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hồ sơ luân chuyển nội bộ của bạn và trạng thái duyệt của từng vòng
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu("jobs")}
                  className="px-4 py-2 rounded-full bg-blue-50 text-[#4285F4] hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Xem thêm tin tuyển dụng
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {myApplications.map((app) => (
                  <div key={app.id} className="p-6 space-y-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {app.id}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            Ngày nộp: {app.appliedDate}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          {app.jobTitle}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {app.department}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 self-start sm:self-center ${
                          app.status === "INTERVIEW"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : app.status === "OFFER"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {app.statusText}
                      </span>
                    </div>

                    {/* Stepper Quy trình */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs pt-1">
                      {[
                        "1. Nộp hồ sơ",
                        "2. Sàng lọc CV",
                        "3. Phỏng vấn chuyên môn",
                        "4. Đề nghị (Offer)",
                        "5. Nhận việc mới",
                      ].map((stepLabel, idx) => {
                        const isDone = idx < app.currentStepIndex;
                        const isCurrent = idx === app.currentStepIndex;

                        return (
                          <div
                            key={stepLabel}
                            className={`p-2.5 rounded-xl border text-[11px] font-medium transition-all ${
                              isDone
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-700"
                                : isCurrent
                                ? "bg-blue-50 border-blue-300 text-[#4285F4] font-bold shadow-xs"
                                : "bg-slate-50/70 border-gray-100 text-slate-400"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              {isDone ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : isCurrent ? (
                                <Clock className="w-3 h-3 text-[#4285F4] animate-spin" />
                              ) : null}
                            </div>
                            <span className="line-clamp-1">{stepLabel}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ghi chú & Lịch phỏng vấn */}
                    {(app.interviewSchedule || app.feedbackNote) && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                        {app.interviewSchedule && (
                          <div className="flex items-start gap-2 text-indigo-900 bg-indigo-50/80 p-3 rounded-xl border border-indigo-100">
                            <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">
                                Lịch phỏng vấn: {app.interviewSchedule.time}
                              </span>
                              <span className="text-slate-600 block mt-0.5">
                                Hình thức: {app.interviewSchedule.format} • Người phỏng vấn: {app.interviewSchedule.interviewer}
                              </span>
                            </div>
                          </div>
                        )}
                        {app.feedbackNote && (
                          <div className="flex items-start gap-2 text-slate-600">
                            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-slate-700">Phản hồi: </span>
                              <span>{app.feedbackNote}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: GIỚI THIỆU ỨNG VIÊN (REFERRAL) */}
          {activeMenu === "referrals" && (
            <div className="space-y-6">
              {/* Form gửi thông tin giới thiệu */}
              <div className="bg-[#ffffff] rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="mb-5 pb-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Gửi Thông Tin Giới Thiệu Ứng Viên (Referral)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gắn mã nhân viên của bạn ({employeeProfile.employeeCode}) vào hồ sơ ứng viên để nhận thưởng khi trúng tuyển
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitReferral} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Họ và tên ứng viên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Trần Minh Tuấn"
                        value={referralForm.candidateName}
                        onChange={(e) =>
                          setReferralForm({ ...referralForm, candidateName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Email liên hệ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="tuan.tran@gmail.com"
                        value={referralForm.candidateEmail}
                        onChange={(e) =>
                          setReferralForm({ ...referralForm, candidateEmail: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        placeholder="0912 xxx xxx"
                        value={referralForm.candidatePhone}
                        onChange={(e) =>
                          setReferralForm({ ...referralForm, candidatePhone: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Vị trí giới thiệu <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={referralForm.jobCode}
                        onChange={(e) =>
                          setReferralForm({ ...referralForm, jobCode: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        {jobsList.map((job) => (
                          <option key={job.code} value={job.code}>
                            [{job.code}] {job.title} - Thưởng: {job.referralBonus}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Mối quan hệ với ứng viên
                      </label>
                      <select
                        value={referralForm.relation}
                        onChange={(e) =>
                          setReferralForm({ ...referralForm, relation: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="Đồng nghiệp cũ">Đồng nghiệp cũ tại công ty trước</option>
                        <option value="Bạn học đại học">Bạn học đại học / cùng ngành</option>
                        <option value="Người quen trong ngành">Người quen trong mạng lưới nghề nghiệp</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingReferral}
                      className="px-6 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all shadow-md shadow-amber-600/20 cursor-pointer inline-flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingReferral ? "Đang gửi hồ sơ..." : "Gửi thông tin giới thiệu"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Bảng danh sách ứng viên đã giới thiệu */}
              <div className="bg-[#ffffff] rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Lịch Sử Giới Thiệu Ứng Viên & Trạng Thái Tiền Thưởng
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {referralsList.length} hồ sơ
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-gray-100">
                      <tr>
                        <th className="py-3.5 px-6">Ứng viên</th>
                        <th className="py-3.5 px-4">Vị trí</th>
                        <th className="py-3.5 px-4">Ngày gửi</th>
                        <th className="py-3.5 px-4">Trạng thái tuyển dụng</th>
                        <th className="py-3.5 px-4">Tiền thưởng</th>
                        <th className="py-3.5 px-6 text-right">Chi trả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {referralsList.map((ref) => (
                        <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-900">{ref.candidateName}</div>
                            <div className="text-[11px] text-slate-400">
                              {ref.candidateEmail} • {ref.candidatePhone}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-700">{ref.jobTitle}</td>
                          <td className="py-4 px-4 text-slate-500">{ref.referredDate}</td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                ref.status === "BONUS_PAID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : ref.status === "PASSED_PROBATION"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}
                            >
                              {ref.statusText}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-amber-600">{ref.bonusAmount}</td>
                          <td className="py-4 px-6 text-right">
                            {ref.bonusPaid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã thanh toán
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                                <Clock className="w-3.5 h-3.5" />
                                Chờ xét duyệt
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL PROFILE & PASSWORD CHANGE (TÁI SỬ DỤNG USERPROFILEMODAL) */}
      {/* ========================================================================= */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userRole="Nhân sự nội bộ (Employee)"
        initialTab={profileModalTab}
        initialData={{
          employeeCode: employeeProfile.employeeCode || "NV-2026-088",
          name: employeeProfile.name,
          email: employeeProfile.email,
          role: employeeProfile.role,
          department: employeeProfile.department,
          phone: employeeProfile.phone,
          avatarUrl: employeeProfile.avatarUrl,
          bio: employeeProfile.bio,
          gender: employeeProfile.gender || "Nam",
          dateOfBirth: employeeProfile.dateOfBirth || "1994-08-15",
        }}
        onSaveProfile={(updated) => {
          setEmployeeProfile((prev) => ({
            ...prev,
            name: updated.name,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl || prev.avatarUrl,
            bio: updated.bio || prev.bio,
            gender: updated.gender || prev.gender,
            dateOfBirth: updated.dateOfBirth || prev.dateOfBirth,
          }));
          showToast("Đã cập nhật thông tin hồ sơ nhân viên thành công!");
        }}
        onAvatarChange={handleAvatarCropComplete}
        onChangePassword={async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          showToast("Đổi mật khẩu thành công! Mật khẩu mới đã được lưu.");
        }}
      />

      {/* MODAL CẮT ẢNH CHO HEADER (AVATARCROPMODAL) */}
      <AvatarCropModal
        isOpen={isAvatarCropOpen}
        imageSrc={selectedRawAvatar}
        onClose={() => {
          setIsAvatarCropOpen(false);
          setSelectedRawAvatar(null);
          if (avatarInputRef.current) avatarInputRef.current.value = "";
        }}
        onCropSave={handleAvatarCropComplete}
      />

      {/* ========================================================================= */}
      {/* 4. MODAL HẾT HẠN PHIÊN (SESSION TIMEOUT MODAL) */}
      {/* ========================================================================= */}
      <SessionTimeoutModal
        isOpen={isExpired}
        title="Phiên đăng nhập đã hết hạn"
        message="Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống"
        onLoginAgain={() => {
          setIsExpired(false);
          router.push("/login");
        }}
      />

      {/* ========================================================================= */}
      {/* 5. MODAL ỨNG TUYỂN NHANH (QUICK APPLY MODAL) */}
      {/* ========================================================================= */}
      {applyingJob && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ứng Tuyển Chuyển Vị Trí Nội Bộ
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {applyingJob.code} • {applyingJob.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingJob(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmApply} className="p-6 space-y-4">
              <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-100 text-xs space-y-1">
                <span className="font-bold text-blue-900 block">Thông tin ứng viên nội bộ:</span>
                <div className="text-blue-800">
                  Họ tên: <strong>{employeeProfile.name}</strong> • Mã NV: <strong>{employeeProfile.employeeCode}</strong>
                </div>
                <div className="text-blue-800">
                  Phòng ban hiện tại: {employeeProfile.department}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  File CV đính kèm
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-slate-50 text-xs">
                  <FileText className="w-4 h-4 text-[#4285F4]" />
                  <span className="font-mono text-slate-700 flex-1 truncate">
                    {applyCvFileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newName = prompt("Nhập tên tệp CV muốn đính kèm:", applyCvFileName);
                      if (newName) setApplyCvFileName(newName);
                    }}
                    className="text-[#4285F4] hover:underline font-semibold cursor-pointer shrink-0"
                  >
                    Đổi file
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Thư giới thiệu / Lý do ứng tuyển chuyển vị trí
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nêu tóm tắt nguyện vọng phát triển, năng lực phù hợp với vị trí mới..."
                  value={applyMotivation}
                  onChange={(e) => setApplyMotivation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setApplyingJob(null)}
                  className="px-4 py-2.5 rounded-full border border-gray-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApply}
                  className="px-6 py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingApply ? "Đang gửi hồ sơ..." : "Xác nhận nộp đơn"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL XEM CHI TIẾT JD (JOB DETAIL MODAL) */}
      {/* ========================================================================= */}
      {viewingJob && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                    {viewingJob.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    {viewingJob.level}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {viewingJob.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Phòng ban</span>
                  <span className="font-bold text-slate-800">{viewingJob.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Địa điểm</span>
                  <span className="font-bold text-slate-800">{viewingJob.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Mức lương</span>
                  <span className="font-bold text-emerald-600">{viewingJob.salaryRange}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thưởng Referral</span>
                  <span className="font-bold text-amber-600">{viewingJob.referralBonus}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Mô tả công việc</h4>
                <p className="leading-relaxed text-slate-600">{viewingJob.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Trách nhiệm chính</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                  {viewingJob.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Yêu cầu năng lực</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                  {viewingJob.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Đặc quyền nội bộ</h4>
                <ul className="list-disc pl-4 space-y-1 text-emerald-700 leading-relaxed">
                  {viewingJob.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="px-4 py-2 rounded-full border border-gray-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const jobToApply = viewingJob;
                  setViewingJob(null);
                  setApplyingJob(jobToApply);
                }}
                className="px-6 py-2 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ứng tuyển ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
