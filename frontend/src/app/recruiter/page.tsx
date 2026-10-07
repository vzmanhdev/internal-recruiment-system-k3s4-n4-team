"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserProfileModal } from "@/components/UserProfileModal";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { CroppedAvatarResult } from "@/lib/cropImage";
import {
  Bell,
  ShieldCheck,
  Briefcase,
  ChevronDown,
  Camera,
  User as UserIcon,
  LogOut,
  Laptop,
  Search,
  Plus,
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  Award,
  DollarSign,
  Check,
  X,
  Sparkles,
  LayoutDashboard,
  Tag,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

// =========================================================================
// 1. DATA TYPES & INTERFACES
// =========================================================================

export type RecruiterMenu = "dashboard" | "jobs" | "pipeline" | "interviews";
export type PipelineStage = "new" | "screening" | "interview" | "offer" | "completed";

export interface Candidate {
  id: string;
  name: string;
  avatarText: string;
  avatarBg: string;
  email: string;
  phone: string;
  jobTitle: string;
  jobCode: string;
  department: string;
  appliedDate: string;
  appliedTimeAgo: string;
  stage: PipelineStage;
  statusTag?: "Hired" | "Rejected" | "Active";
  matchScore: number;
  source: "Nội bộ (Internal)" | "Giới thiệu (Referral)" | "LinkedIn" | "TopCV" | "VietnamWorks";
  experience: string;
  skills: string[];
  currentSalary?: string;
  expectedSalary?: string;
  interviewSchedule?: {
    round: string;
    date: string;
    time: string;
    interviewer: string;
    location: string;
  };
  offerDetails?: {
    salary: string;
    onboardDate: string;
    status: "Draft" | "Pending Approval" | "Sent" | "Accepted";
  };
  rejectionReason?: string;
  notes?: string;
}

export interface JobRequisition {
  id: string;
  code: string;
  title: string;
  department: string;
  level: "Junior" | "Middle" | "Senior" | "Lead" | "Manager";
  openCount: number;
  filledCount: number;
  salaryRange: string;
  deadline: string;
  status: "Open" | "Urgent" | "Closed";
}

// =========================================================================
// 2. INITIAL MOCK DATA
// =========================================================================

const INITIAL_JOBS: JobRequisition[] = [
  {
    id: "JOB-01",
    code: "REQ-2026-01",
    title: "Senior Frontend Engineer (React/Next.js)",
    department: "Trung Tâm Phát Triển Phần Mềm",
    level: "Senior",
    openCount: 3,
    filledCount: 1,
    salaryRange: "28 - 42 Triệu",
    deadline: "30/10/2026",
    status: "Urgent",
  },
  {
    id: "JOB-02",
    code: "REQ-2026-02",
    title: "Java Backend Lead (Spring Boot)",
    department: "Trung Tâm Phát Triển Phần Mềm",
    level: "Lead",
    openCount: 2,
    filledCount: 0,
    salaryRange: "38 - 55 Triệu",
    deadline: "15/11/2026",
    status: "Open",
  },
  {
    id: "JOB-03",
    code: "REQ-2026-03",
    title: "Product Designer (UI/UX - Design System)",
    department: "Khối Phát Triển Sản Phẩm",
    level: "Senior",
    openCount: 1,
    filledCount: 0,
    salaryRange: "25 - 35 Triệu",
    deadline: "20/10/2026",
    status: "Open",
  },
  {
    id: "JOB-04",
    code: "REQ-2026-04",
    title: "DevOps & Cloud Architect",
    department: "Ban Hạ Tầng & Bảo Mật",
    level: "Senior",
    openCount: 2,
    filledCount: 0,
    salaryRange: "35 - 50 Triệu",
    deadline: "25/10/2026",
    status: "Urgent",
  },
  {
    id: "JOB-05",
    code: "REQ-2026-05",
    title: "Data Analyst & Business Intelligence",
    department: "Khối Dữ Liệu & Phân Tích",
    level: "Middle",
    openCount: 2,
    filledCount: 0,
    salaryRange: "20 - 30 Triệu",
    deadline: "10/11/2026",
    status: "Open",
  },
];

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "CAN-001",
    name: "Trần Minh Quân",
    avatarText: "MQ",
    avatarBg: "bg-blue-600",
    email: "quan.tran@company.com",
    phone: "0909 112 233",
    jobTitle: "Senior Frontend Engineer (React/Next.js)",
    jobCode: "REQ-2026-01",
    department: "Trung Tâm Phát Triển Phần Mềm",
    appliedDate: "06/10/2026",
    appliedTimeAgo: "2 giờ trước",
    stage: "new",
    matchScore: 95,
    source: "Nội bộ (Internal)",
    experience: "5 năm kinh nghiệm React, TypeScript, Next.js, Redux Toolkit",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    currentSalary: "26 Triệu",
    expectedSalary: "35 Triệu",
    notes: "Ứng viên chuyển bộ phận nội bộ xuất sắc từ khối Vận hành sang Core Product.",
  },
  {
    id: "CAN-002",
    name: "Lê Hải Yến",
    avatarText: "HY",
    avatarBg: "bg-purple-600",
    email: "haiyen.le@gmail.com",
    phone: "0938 223 344",
    jobTitle: "Product Designer (UI/UX - Design System)",
    jobCode: "REQ-2026-03",
    department: "Khối Phát Triển Sản Phẩm",
    appliedDate: "06/10/2026",
    appliedTimeAgo: "5 giờ trước",
    stage: "new",
    matchScore: 92,
    source: "Giới thiệu (Referral)",
    experience: "4 năm thiết kế SaaS B2B, Figma master, Token System",
    skills: ["Figma", "Design System", "User Research", "Prototyping"],
    currentSalary: "22 Triệu",
    expectedSalary: "30 Triệu",
  },
  {
    id: "CAN-003",
    name: "Phạm Quốc Dũng",
    avatarText: "QD",
    avatarBg: "bg-emerald-600",
    email: "quocdung.pham@outlook.com",
    phone: "0987 334 455",
    jobTitle: "Data Analyst & Business Intelligence",
    jobCode: "REQ-2026-05",
    department: "Khối Dữ Liệu & Phân Tích",
    appliedDate: "05/10/2026",
    appliedTimeAgo: "1 ngày trước",
    stage: "new",
    matchScore: 88,
    source: "LinkedIn",
    experience: "3 năm phân tích số liệu kinh doanh, Tableau, PowerBI, SQL nâng cao",
    skills: ["SQL", "PowerBI", "Python", "Data Modeling"],
    currentSalary: "18 Triệu",
    expectedSalary: "25 Triệu",
  },
  {
    id: "CAN-004",
    name: "Hoàng Thu Thảo",
    avatarText: "TT",
    avatarBg: "bg-rose-600",
    email: "thao.hoang@company.com",
    phone: "0976 445 566",
    jobTitle: "DevOps & Cloud Architect",
    jobCode: "REQ-2026-04",
    department: "Ban Hạ Tầng & Bảo Mật",
    appliedDate: "04/10/2026",
    appliedTimeAgo: "2 ngày trước",
    stage: "screening",
    matchScore: 96,
    source: "Nội bộ (Internal)",
    experience: "6 năm quản trị Kubernetes, AWS, Terraform, CI/CD Gitlab",
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Docker"],
    currentSalary: "32 Triệu",
    expectedSalary: "42 Triệu",
    notes: "CV đã được Lead Infra kiểm tra sơ bộ, đề xuất mời phỏng vấn kỹ thuật trực tiếp.",
  },
  {
    id: "CAN-005",
    name: "Đỗ Đình Trọng",
    avatarText: "DT",
    avatarBg: "bg-amber-600",
    email: "trong.dinhdo@gmail.com",
    phone: "0912 556 677",
    jobTitle: "Java Backend Lead (Spring Boot)",
    jobCode: "REQ-2026-02",
    department: "Trung Tâm Phát Triển Phần Mềm",
    appliedDate: "04/10/2026",
    appliedTimeAgo: "2 ngày trước",
    stage: "screening",
    matchScore: 90,
    source: "TopCV",
    experience: "7 năm Spring Boot, Microservices, Kafka, Redis, PostgreSQL",
    skills: ["Java", "Spring Boot", "Microservices", "Kafka", "PostgreSQL"],
    currentSalary: "35 Triệu",
    expectedSalary: "48 Triệu",
  },
  {
    id: "CAN-006",
    name: "Ngô Bích Ngọc",
    avatarText: "BN",
    avatarBg: "bg-indigo-600",
    email: "bichngoc.ngo@gmail.com",
    phone: "0903 667 788",
    jobTitle: "Senior Frontend Engineer (React/Next.js)",
    jobCode: "REQ-2026-01",
    department: "Trung Tâm Phát Triển Phần Mềm",
    appliedDate: "03/10/2026",
    appliedTimeAgo: "3 ngày trước",
    stage: "screening",
    matchScore: 93,
    source: "Giới thiệu (Referral)",
    experience: "5 năm Frontend, Web Performance, SSR, Micro-frontends",
    skills: ["React", "TypeScript", "Next.js", "Web Performance"],
    currentSalary: "27 Triệu",
    expectedSalary: "36 Triệu",
  },
  {
    id: "CAN-007",
    name: "Vũ Gia Huy",
    avatarText: "GH",
    avatarBg: "bg-teal-600",
    email: "huy.vugia@company.com",
    phone: "0988 778 899",
    jobTitle: "Senior Frontend Engineer (React/Next.js)",
    jobCode: "REQ-2026-01",
    department: "Trung Tâm Phát Triển Phần Mềm",
    appliedDate: "01/10/2026",
    appliedTimeAgo: "5 ngày trước",
    stage: "interview",
    matchScore: 94,
    source: "Nội bộ (Internal)",
    experience: "5 năm kinh nghiệm full-stack web, chuyên sâu kiến trúc frontend",
    skills: ["React", "Next.js", "Node.js", "GraphQL"],
    currentSalary: "28 Triệu",
    expectedSalary: "38 Triệu",
    interviewSchedule: {
      round: "Vòng 2: Phỏng vấn Kỹ thuật & Architecture",
      date: "08/10/2026",
      time: "14:30 - 15:30",
      interviewer: "Lê Trưởng Nhóm (Hiring Manager)",
      location: "Google Meet / Phòng họp 402",
    },
  },
  {
    id: "CAN-008",
    name: "Bùi Khánh Linh",
    avatarText: "KL",
    avatarBg: "bg-pink-600",
    email: "khanhlinh.bui@gmail.com",
    phone: "0915 889 900",
    jobTitle: "Java Backend Lead (Spring Boot)",
    jobCode: "REQ-2026-02",
    department: "Trung Tâm Phát Triển Phần Mềm",
    appliedDate: "30/09/2026",
    appliedTimeAgo: "6 ngày trước",
    stage: "interview",
    matchScore: 89,
    source: "VietnamWorks",
    experience: "6 năm Java Core, Spring Cloud, Kiến trúc phân tán High Traffic",
    skills: ["Java", "Spring Cloud", "Redis", "Distributed System"],
    currentSalary: "34 Triệu",
    expectedSalary: "46 Triệu",
    interviewSchedule: {
      round: "Vòng 1: Phỏng vấn Chuyên môn Backend",
      date: "09/10/2026",
      time: "10:00 - 11:00",
      interviewer: "Trần Đức Nam (Technical Director)",
      location: "Phòng họp Ban Công nghệ (P.501)",
    },
  },
  {
    id: "CAN-009",
    name: "Đặng Tuấn Kiệt",
    avatarText: "TK",
    avatarBg: "bg-sky-600",
    email: "kiet.dang@company.com",
    phone: "0966 990 011",
    jobTitle: "DevOps & Cloud Architect",
    jobCode: "REQ-2026-04",
    department: "Ban Hạ Tầng & Bảo Mật",
    appliedDate: "28/09/2026",
    appliedTimeAgo: "1 tuần trước",
    stage: "offer",
    matchScore: 98,
    source: "Nội bộ (Internal)",
    experience: "7 năm Cloud Platform, DevSecOps, SRE, Multi-region deployment",
    skills: ["AWS", "Kubernetes", "DevSecOps", "SRE", "Go"],
    currentSalary: "36 Triệu",
    expectedSalary: "46 Triệu",
    offerDetails: {
      salary: "45.000.000 VNĐ / tháng",
      onboardDate: "15/10/2026",
      status: "Pending Approval",
    },
    notes: "Đã qua 3 vòng đánh giá xuất sắc 10/10. Đang gửi Trưởng phòng Nhân sự duyệt Offer.",
  },
  {
    id: "CAN-010",
    name: "Trịnh Mai Hương",
    avatarText: "MH",
    avatarBg: "bg-fuchsia-600",
    email: "maihuong.trinh@gmail.com",
    phone: "0977 112 233",
    jobTitle: "Product Designer (UI/UX - Design System)",
    jobCode: "REQ-2026-03",
    department: "Khối Phát Triển Sản Phẩm",
    appliedDate: "25/09/2026",
    appliedTimeAgo: "10 ngày trước",
    stage: "offer",
    matchScore: 93,
    source: "Giới thiệu (Referral)",
    experience: "5 năm UI/UX Lead, DesignOps, Hệ thống Design Token chuẩn quốc tế",
    skills: ["Figma", "DesignOps", "UX Metrics", "Product Thinking"],
    currentSalary: "26 Triệu",
    expectedSalary: "34 Triệu",
    offerDetails: {
      salary: "33.500.000 VNĐ / tháng",
      onboardDate: "20/10/2026",
      status: "Sent",
    },
  },
  {
    id: "CAN-011",
    name: "Nguyễn Hoàng Long",
    avatarText: "HL",
    avatarBg: "bg-emerald-600",
    email: "long.nguyen@company.com",
    phone: "0944 556 677",
    jobTitle: "Senior Frontend Engineer (React/Next.js)",
    jobCode: "REQ-2026-01",
    department: "Trung Tâm Phát Triển Phần Mềm",
    appliedDate: "20/09/2026",
    appliedTimeAgo: "2 tuần trước",
    stage: "completed",
    statusTag: "Hired",
    matchScore: 97,
    source: "Nội bộ (Internal)",
    experience: "6 năm Web App, Micro-frontend, Next.js App Router",
    skills: ["Next.js", "React", "TypeScript", "Turborepo"],
    currentSalary: "30 Triệu",
    expectedSalary: "40 Triệu",
    offerDetails: {
      salary: "40.000.000 VNĐ / tháng",
      onboardDate: "01/10/2026",
      status: "Accepted",
    },
    notes: "Ứng viên đã ký Hợp đồng thử việc và chính thức nhận việc từ 01/10/2026.",
  },
  {
    id: "CAN-012",
    name: "Cao Văn Hưng",
    avatarText: "VH",
    avatarBg: "bg-slate-600",
    email: "hung.cao@itviec.vn",
    phone: "0933 778 899",
    jobTitle: "Data Analyst & Business Intelligence",
    jobCode: "REQ-2026-05",
    department: "Khối Dữ Liệu & Phân Tích",
    appliedDate: "18/09/2026",
    appliedTimeAgo: "2 tuần trước",
    stage: "completed",
    statusTag: "Rejected",
    matchScore: 78,
    source: "TopCV",
    experience: "2 năm Junior Data Analyst",
    skills: ["Excel", "Basic SQL", "PowerBI"],
    currentSalary: "14 Triệu",
    expectedSalary: "26 Triệu",
    rejectionReason: "Kỳ vọng mức lương chưa tương xứng với kinh nghiệm kỹ năng hiện tại; đã gửi thư cảm ơn trân trọng.",
  },
];

const KANBAN_COLUMNS: {
  id: PipelineStage;
  title: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
}[] = [
  {
    id: "new",
    title: "Nguồn mới",
    badgeBg: "bg-blue-50",
    badgeText: "text-[#4285F4]",
    borderColor: "border-blue-100",
    dotColor: "bg-[#4285F4]",
  },
  {
    id: "screening",
    title: "Sàng lọc hồ sơ",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-600",
    borderColor: "border-purple-100",
    dotColor: "bg-purple-500",
  },
  {
    id: "interview",
    title: "Chờ phỏng vấn",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-600",
    borderColor: "border-amber-100",
    dotColor: "bg-amber-500",
  },
  {
    id: "offer",
    title: "Đề xuất Offer",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-600",
    borderColor: "border-indigo-100",
    dotColor: "bg-indigo-500",
  },
  {
    id: "completed",
    title: "Đã tuyển / Từ chối",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-600",
    borderColor: "border-emerald-100",
    dotColor: "bg-emerald-500",
  },
];

// =========================================================================
// 3. MAIN COMPONENT: RECRUITER DASHBOARD LAYOUT (CHUẨN ADMIN)
// =========================================================================

export default function RecruiterDashboardPage() {
  const router = useRouter();

  // Active Menu Tabs: "dashboard" | "jobs" | "pipeline" | "interviews"
  const [activeMenu, setActiveMenu] = useState<RecruiterMenu>("pipeline");

  // Candidates & Job Requisitions state
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [jobs, setJobs] = useState<JobRequisition[]>(INITIAL_JOBS);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobCode, setSelectedJobCode] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");

  // Drag & Drop State
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<PipelineStage | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => setToastMessage(msg);
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Recruiter Profile State (Thông tin đăng nhập mẫu)
  const [recruiterProfile, setRecruiterProfile] = useState({
    name: "Nguyễn Tuyển Dụng",
    email: "tuyendung@company.com",
    roleText: "Nhân viên tuyển dụng",
    role: "Recruiter",
    department: "Ban Nhân sự & Thu hút Nhân tài",
    phone: "0912 345 678",
    bio: "Chuyên trách quản lý luồng ứng viên, điều phối phỏng vấn và phát triển Talent Pool nội bộ.",
    avatarText: "TD",
    avatarUrl: "",
  });

  // Dropdown Profile & Modals State
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<"profile" | "security">("profile");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedRawAvatar, setSelectedRawAvatar] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);

  // Action Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTargetCandidate, setScheduleTargetCandidate] = useState<Candidate | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    round: "Vòng 1: Phỏng vấn Kỹ thuật & Chuyên môn",
    date: "2026-10-10",
    time: "14:00",
    interviewer: "Lê Trưởng Nhóm (Hiring Manager)",
    locationType: "Google Meet (Online)",
    meetLink: "https://meet.google.com/rec-hire-2026",
    notes: "Ứng viên vui lòng chuẩn bị máy tính xách tay để demo sản phẩm thực tế.",
  });

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerTargetCandidate, setOfferTargetCandidate] = useState<Candidate | null>(null);
  const [offerForm, setOfferForm] = useState({
    salary: "35.000.000",
    onboardDate: "2026-11-01",
    probationRate: "100%",
    benefits: "Bảo hiểm sức khỏe PTI cao cấp, thưởng hiệu suất tháng 13, laptop Macbook Pro",
  });

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTargetCandidate, setRejectTargetCandidate] = useState<Candidate | null>(null);
  const [rejectForm, setRejectForm] = useState({
    reason: "Kinh nghiệm thực tế chưa hoàn toàn phù hợp với yêu cầu hiện tại của vị trí",
    emailSubject: "Thư cảm ơn và thông báo kết quả ứng tuyển - Hệ thống Tuyển Dụng Nội Bộ",
    saveToTalentPool: true,
  });

  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    title: "",
    department: "Trung Tâm Phát Triển Phần Mềm",
    level: "Senior" as JobRequisition["level"],
    openCount: 2,
    salaryMin: "25",
    salaryMax: "40",
    deadline: "2026-11-30",
    description: "",
  });

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCandidate, setDetailCandidate] = useState<Candidate | null>(null);

  // Sync user info from localStorage if exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) {
          setRecruiterProfile((prev) => ({
            ...prev,
            email: parsed.email || prev.email,
            name: parsed.full_name || prev.name,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Close profile dropdown on outside click
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

  // Avatar select & crop complete handlers
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        showToast("Vui lòng chọn file hình ảnh hợp lệ!");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast("Kích thước tệp quá lớn! Vui lòng chọn ảnh dưới 8MB.");
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

  const handleAvatarCropComplete = (result: CroppedAvatarResult) => {
    setRecruiterProfile((prev) => ({
      ...prev,
      avatarUrl: result.avatarUrl,
    }));
    setIsAvatarCropOpen(false);
    setSelectedRawAvatar(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    showToast("Đã cập nhật ảnh đại diện Chuyên viên tuyển dụng thành công!");
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    router.push("/login");
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, candidateId: string) => {
    e.dataTransfer.setData("text/plain", candidateId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedCandidateId(candidateId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stageId: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumnId !== stageId) setDragOverColumnId(stageId);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, stageId: PipelineStage) => {
    if (dragOverColumnId === stageId) setDragOverColumnId(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStage: PipelineStage) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const candidateId = e.dataTransfer.getData("text/plain") || draggedCandidateId;
    if (!candidateId) return;

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.stage === targetStage) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              stage: targetStage,
              statusTag: targetStage === "completed" ? c.statusTag || "Hired" : undefined,
            }
          : c
      )
    );

    const stageName = KANBAN_COLUMNS.find((col) => col.id === targetStage)?.title || targetStage;
    showToast(`Đã chuyển ứng viên "${candidate.name}" sang giai đoạn "${stageName}"!`);
    setDraggedCandidateId(null);
  };

  const handleMoveCandidateStage = (candidateId: string, newStage: PipelineStage) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
    );
    const stageName = KANBAN_COLUMNS.find((col) => col.id === newStage)?.title || newStage;
    showToast(`Đã chuyển ứng viên "${candidate.name}" sang cột "${stageName}".`);
  };

  // Schedule, Offer, Reject, Create Job handlers
  const openScheduleModal = (candidate: Candidate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScheduleTargetCandidate(candidate);
    setIsScheduleModalOpen(true);
  };

  const handleConfirmSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTargetCandidate) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === scheduleTargetCandidate.id
          ? {
              ...c,
              stage: "interview",
              interviewSchedule: {
                round: scheduleForm.round,
                date: scheduleForm.date,
                time: scheduleForm.time,
                interviewer: scheduleForm.interviewer,
                location: scheduleForm.locationType.includes("Online")
                  ? scheduleForm.meetLink
                  : "Phòng phỏng vấn Trụ sở",
              },
            }
          : c
      )
    );

    setIsScheduleModalOpen(false);
    showToast(`Đã lên lịch phỏng vấn thành công cho "${scheduleTargetCandidate.name}" và chuyển sang cột Chờ phỏng vấn!`);
  };

  const openOfferModal = (candidate: Candidate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOfferTargetCandidate(candidate);
    setOfferForm((prev) => ({
      ...prev,
      salary: candidate.expectedSalary?.replace(" Triệu", ".000.000") || "35.000.000",
    }));
    setIsOfferModalOpen(true);
  };

  const handleConfirmOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTargetCandidate) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === offerTargetCandidate.id
          ? {
              ...c,
              stage: "offer",
              offerDetails: {
                salary: `${offerForm.salary} VNĐ/tháng`,
                onboardDate: offerForm.onboardDate,
                status: "Pending Approval",
              },
            }
          : c
      )
    );

    setIsOfferModalOpen(false);
    showToast(`Đã tạo và gửi dự thảo Offer cho "${offerTargetCandidate.name}" thành công!`);
  };

  const openRejectModal = (candidate: Candidate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRejectTargetCandidate(candidate);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTargetCandidate) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === rejectTargetCandidate.id
          ? {
              ...c,
              stage: "completed",
              statusTag: "Rejected",
              rejectionReason: rejectForm.reason,
            }
          : c
      )
    );

    setIsRejectModalOpen(false);
    showToast(`Đã gửi email từ chối lịch sự và đóng hồ sơ ứng viên "${rejectTargetCandidate.name}".`);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.title.trim()) {
      alert("Vui lòng nhập tiêu đề vị trí tuyển dụng!");
      return;
    }

    const newCode = `REQ-2026-0${jobs.length + 1}`;
    const newJob: JobRequisition = {
      id: `JOB-0${jobs.length + 1}`,
      code: newCode,
      title: jobFormData.title.trim(),
      department: jobFormData.department,
      level: jobFormData.level,
      openCount: Number(jobFormData.openCount) || 1,
      filledCount: 0,
      salaryRange: `${jobFormData.salaryMin} - ${jobFormData.salaryMax} Triệu`,
      deadline: jobFormData.deadline || "30/11/2026",
      status: "Open",
    };

    setJobs([newJob, ...jobs]);
    setSelectedJobCode(newCode);
    setIsCreateJobModalOpen(false);
    setJobFormData({
      title: "",
      department: "Trung Tâm Phát Triển Phần Mềm",
      level: "Senior",
      openCount: 2,
      salaryMin: "25",
      salaryMax: "40",
      deadline: "2026-11-30",
      description: "",
    });
    showToast(`Đã đăng tin tuyển dụng "${newJob.title}" thành công!`);
  };

  // Filtered candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchJob = selectedJobCode === "ALL" || c.jobCode === selectedJobCode;
      const matchSource = selectedSource === "ALL" || c.source === selectedSource;

      return matchSearch && matchJob && matchSource;
    });
  }, [candidates, searchQuery, selectedJobCode, selectedSource]);

  // Upcoming interviews list
  const interviewList = useMemo(() => {
    return candidates.filter((c) => c.interviewSchedule || c.stage === "interview");
  }, [candidates]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Hidden File Input phục vụ Upload ảnh đại diện */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-medium shadow-2xl animate-fade-in border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. THANH HEADER TRÊN CÙNG (ĐỒNG BỘ 100% VỚI BỐ CỤC ADMIN DASHBOARD) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Góc trái: Logo, tiêu đề "Tuyển Dụng Nội Bộ" và nhãn Badge */}
          <div className="flex items-center gap-4">
            <Link href="/recruiter" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-[#6ba5ff] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-[#4285F4] transition-colors">
                    Tuyển Dụng Nội Bộ
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                    Nhân viên tuyển dụng
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Bảng Điều Phối Tuyển Dụng & Sàng Lọc Nhân Tài Chuyên Nghiệp
                </p>
              </div>
            </Link>
          </div>

          {/* Góc phải: Chuông thông báo + Khối Avatar Dropdown chuẩn Admin + Nút Đăng xuất */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Chuông thông báo */}
            <button
              type="button"
              className="relative w-10 h-10 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4285F4] ring-2 ring-white"></span>
            </button>

            {/* Khối Avatar Dropdown chuẩn Admin */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 pl-3 border-l border-gray-100 hover:bg-slate-50/80 p-1.5 rounded-2xl transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="relative shrink-0">
                  {recruiterProfile.avatarUrl ? (
                    <img
                      src={recruiterProfile.avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-100">
                      {recruiterProfile.avatarText}
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
                      {recruiterProfile.name}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180 text-[#4285F4]" : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-500 block leading-tight">
                    {recruiterProfile.email}
                  </span>
                </div>
              </button>

              {/* DROPDOWN MENU */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Summary Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3 mb-2 border border-gray-100/70">
                    <div
                      onClick={() => {
                        avatarInputRef.current?.click();
                      }}
                      className="relative group cursor-pointer shrink-0"
                      title="Nhấp để tải lên ảnh mới"
                    >
                      {recruiterProfile.avatarUrl ? (
                        <img
                          src={recruiterProfile.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#4285F4] text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {recruiterProfile.avatarText}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {recruiterProfile.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {recruiterProfile.email}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                        {recruiterProfile.roleText}
                      </span>
                    </div>
                  </div>

                  {/* Menu Options (4 mục chuẩn) */}
                  <div className="space-y-1">
                    {/* Mục 1: Upload ảnh đại diện */}
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

                    {/* Mục 2: Hồ sơ cá nhân */}
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

                    {/* Mục 3: Đổi mật khẩu & Bảo mật */}
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

                  <hr className="my-1.5 border-gray-100" />

                  {/* Mục 4: Đăng xuất */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nút Đăng xuất nhanh cạnh Profile */}
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all text-xs font-semibold cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT: SIDEBAR MENU BÊN TRÁI + NỘI DUNG CHÍNH BÊN PHẢI */}
      {/* ========================================================================= */}
      <div className="flex-1 max-w-[1760px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* ========================================================================= */}
        {/* CỘT SIDEBAR MENU (BÊN TRÁI) */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 lg:sticky lg:top-28">
            <div className="px-4 py-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                MENU TUYỂN DỤNG
              </span>
            </div>

            <nav className="space-y-1.5">
              {/* Mục 1: Tổng quan (Dashboard) */}
              <button
                type="button"
                onClick={() => setActiveMenu("dashboard")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "dashboard"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span>Tổng quan (Dashboard)</span>
              </button>

              {/* Mục 2: Vị trí được phân công */}
              <button
                type="button"
                onClick={() => setActiveMenu("jobs")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "jobs"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Briefcase className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">Vị trí được phân công</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeMenu === "jobs" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {jobs.length}
                </span>
              </button>

              {/* Mục 3: Quản lý Ứng viên (Pipeline) */}
              <button
                type="button"
                onClick={() => setActiveMenu("pipeline")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "pipeline"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Users className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">Quản lý Ứng viên (Pipeline)</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeMenu === "pipeline" ? "bg-white/20 text-white" : "bg-blue-50 text-[#4285F4]"
                  }`}
                >
                  {candidates.length}
                </span>
              </button>

              {/* Mục 4: Lịch phỏng vấn */}
              <button
                type="button"
                onClick={() => setActiveMenu("interviews")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "interviews"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">Lịch phỏng vấn</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeMenu === "interviews" ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {interviewList.length}
                </span>
              </button>
            </nav>

            {/* Khối Trạng thái máy chủ (Dưới cùng Sidebar) */}
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
                  Phiên bản hệ thống: v2.4.0-prod
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* KHU VỰC NỘI DUNG CHÍNH (BÊN PHẢI) */}
        {/* ========================================================================= */}
        <main className="flex-1 min-w-0 space-y-6 lg:space-y-8">
          {/* Welcome & Overview Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {activeMenu === "dashboard" && "Tổng Quan Tuyển Dụng"}
                {activeMenu === "jobs" && "Vị Trí Tuyển Dụng Được Phân Công"}
                {activeMenu === "pipeline" && "Quản Lý Ứng Viên (Pipeline Kanban)"}
                {activeMenu === "interviews" && "Lịch Phỏng Vấn Tuyển Dụng"}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {activeMenu === "dashboard" && "Theo dõi các chỉ số hiệu suất, ứng viên mới và nhiệm vụ trọng tâm hôm nay."}
                {activeMenu === "jobs" && "Quản lý tiến độ lấp đầy headcount các Job Requisitions đang phụ trách."}
                {activeMenu === "pipeline" && "Kéo thả ứng viên qua các giai đoạn sàng lọc, phỏng vấn và chốt Offer."}
                {activeMenu === "interviews" && "Điều phối và theo dõi các vòng phỏng vấn kỹ thuật & văn hóa."}
              </p>
            </div>

            {/* CTA Soạn tin tuyển dụng */}
            <button
              type="button"
              onClick={() => setIsCreateJobModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Soạn tin tuyển dụng</span>
            </button>
          </div>

          {/* 4 Thẻ Thống Kê Nhanh (KPI Cards) nằm ngang ở trên cùng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Vị trí đang mở */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Vị trí đang mở
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{jobs.length}</h3>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  10 chỉ tiêu cần tuyển dụng
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Hồ sơ cần xử lý */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hồ sơ cần xử lý
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {candidates.filter((c) => c.stage === "new" || c.stage === "screening").length}
                </h3>
                <p className="text-xs text-amber-600 font-medium mt-1">
                  3 hồ sơ mới nộp trong 24h
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Phỏng vấn hôm nay */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Phỏng vấn hôm nay
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">2</h3>
                <p className="text-xs text-[#4285F4] font-medium mt-1">
                  1 Online • 1 Trực tiếp
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Offer chờ duyệt */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Offer chờ duyệt
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {candidates.filter((c) => c.stage === "offer").length}
                </h3>
                <p className="text-xs text-indigo-600 font-medium mt-1">
                  Tỷ lệ nhận việc dự kiến 90%
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KHỐI NỘI DUNG CHÍNH (NỀN TRẮNG, BO GÓC LỚN ROUNDED-3XL, SHADOW NHẸ) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
            {/* VIEW 1: QUẢN LÝ ỨNG VIÊN (PIPELINE KANBAN KÉO THẢ) */}
            {activeMenu === "pipeline" && (
              <div className="space-y-6">
                {/* Search & Filter Bar */}
                <div className="my-6 p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3.5 flex-1">
                    {/* Search */}
                    <div className="relative min-w-[280px] sm:min-w-[340px] flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm ứng viên, kỹ năng, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Vị trí tuyển dụng */}
                    <select
                      value={selectedJobCode}
                      onChange={(e) => setSelectedJobCode(e.target.value)}
                      className="min-w-[220px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] transition-all cursor-pointer"
                    >
                      <option value="ALL">Tất cả vị trí phụ trách ({jobs.length})</option>
                      {jobs.map((job) => (
                        <option key={job.code} value={job.code}>
                          [{job.code}] {job.title}
                        </option>
                      ))}
                    </select>

                    {/* Nguồn ứng viên */}
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="min-w-[190px] px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] transition-all cursor-pointer"
                    >
                      <option value="ALL">Tất cả nguồn hồ sơ</option>
                      <option value="Nội bộ (Internal)">Nội bộ (Internal)</option>
                      <option value="Giới thiệu (Referral)">Giới thiệu (Referral)</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="TopCV">TopCV</option>
                      <option value="VietnamWorks">VietnamWorks</option>
                    </select>
                  </div>

                  {(searchQuery || selectedJobCode !== "ALL" || selectedSource !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedJobCode("ALL");
                        setSelectedSource("ALL");
                      }}
                      className="px-3.5 py-2 text-xs text-[#4285F4] hover:bg-blue-50 font-semibold rounded-xl border border-blue-200 transition-colors self-end lg:self-auto shrink-0 cursor-pointer"
                    >
                      Xóa bộ lọc
                    </button>
                  )}
                </div>

                {/* 5 CỘT KANBAN BOARD (CUỘN NGANG VỚI FLEX GAP-6 VÀ CỘT CỐ ĐỊNH MIN-W-[320PX]) */}
                <div className="flex gap-6 overflow-x-auto pb-4 pt-1 items-start [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full">
                  {KANBAN_COLUMNS.map((column) => {
                    const columnCandidates = filteredCandidates.filter((c) => c.stage === column.id);
                    const isOver = dragOverColumnId === column.id;

                    return (
                      <div
                        key={column.id}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDragLeave={(e) => handleDragLeave(e, column.id)}
                        onDrop={(e) => handleDrop(e, column.id)}
                        className={`w-80 min-w-[320px] flex-shrink-0 rounded-2xl p-4 transition-all duration-200 min-h-[580px] flex flex-col ${
                          isOver
                            ? "bg-blue-50/70 border-2 border-dashed border-[#4285F4] shadow-md"
                            : "bg-[#f8fafc] border border-slate-200/70 shadow-xs"
                        }`}
                      >
                        {/* Header Cột */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`}></span>
                            <h3 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                              {column.title}
                            </h3>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${column.badgeBg} ${column.badgeText} ${column.borderColor}`}
                          >
                            {columnCandidates.length}
                          </span>
                        </div>

                        {/* Danh sách Thẻ ứng viên (Cuộn dọc độc lập) */}
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[460px] pr-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
                          {columnCandidates.length === 0 ? (
                            <div className="h-44 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                              <Users className="w-6 h-6 text-slate-300 mb-1.5" />
                              <p className="text-xs font-semibold text-slate-400">Trống</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Kéo thả ứng viên vào đây</p>
                            </div>
                          ) : (
                            columnCandidates.map((candidate) => (
                              /* THẺ ỨNG VIÊN NỀN TRẮNG, SHADOW-SM, HOVER EFFECT */
                              <div
                                key={candidate.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, candidate.id)}
                                onClick={() => {
                                  setDetailCandidate(candidate);
                                  setIsDetailModalOpen(true);
                                }}
                                className={`bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing select-none ${
                                  draggedCandidateId === candidate.id ? "opacity-50 scale-95" : ""
                                }`}
                              >
                                {/* Top: Avatar + Tên + Match */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-8 h-8 rounded-xl ${candidate.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                                    >
                                      {candidate.avatarText}
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate hover:text-[#4285F4]">
                                        {candidate.name}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {candidate.source}
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                      candidate.matchScore >= 90
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-blue-50 text-[#4285F4] border-blue-200"
                                    }`}
                                  >
                                    {candidate.matchScore}%
                                  </span>
                                </div>

                                {/* Vị trí & Ngày apply */}
                                <div className="mt-2.5 pt-2 border-t border-slate-100">
                                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                                    {candidate.jobTitle}
                                  </p>
                                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                    <span className="font-mono text-[10px]">{candidate.jobCode}</span>
                                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {candidate.appliedTimeAgo}
                                    </span>
                                  </div>
                                </div>

                                {/* Thông tin mở rộng */}
                                {candidate.interviewSchedule && column.id === "interview" && (
                                  <div className="mt-2 p-1.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[10px] text-amber-800">
                                    <p className="font-bold flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-amber-600" />
                                      {candidate.interviewSchedule.date} • {candidate.interviewSchedule.time}
                                    </p>
                                  </div>
                                )}

                                {candidate.offerDetails && column.id === "offer" && (
                                  <div className="mt-2 p-1.5 rounded-lg bg-indigo-50 border border-indigo-200/80 text-[10px] text-indigo-800">
                                    <p className="font-bold flex items-center gap-1">
                                      <DollarSign className="w-3 h-3 text-indigo-600" />
                                      {candidate.offerDetails.salary}
                                    </p>
                                  </div>
                                )}

                                {column.id === "completed" && candidate.statusTag && (
                                  <div className="mt-2">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        candidate.statusTag === "Hired"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : "bg-rose-50 text-rose-700 border-rose-200"
                                      }`}
                                    >
                                      {candidate.statusTag === "Hired" ? (
                                        <>
                                          <Check className="w-3 h-3" /> Đã tuyển
                                        </>
                                      ) : (
                                        <>
                                          <X className="w-3 h-3" /> Đã từ chối
                                        </>
                                      )}
                                    </span>
                                  </div>
                                )}

                                {/* Nút icon nhỏ hành động (Đặt lịch PV, Soạn Offer, Từ chối) */}
                                <div
                                  className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-[10px] text-slate-400">Thao tác:</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      title="Đặt lịch phỏng vấn"
                                      onClick={(e) => openScheduleModal(candidate, e)}
                                      className="w-6 h-6 rounded bg-slate-50 hover:bg-amber-50 hover:text-amber-600 text-slate-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
                                    >
                                      <Calendar className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Soạn thảo Offer"
                                      onClick={(e) => openOfferModal(candidate, e)}
                                      className="w-6 h-6 rounded bg-slate-50 hover:bg-blue-50 hover:text-[#4285F4] text-slate-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
                                    >
                                      <FileText className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Gửi Email từ chối"
                                      onClick={(e) => openRejectModal(candidate, e)}
                                      className="w-6 h-6 rounded bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Xem hồ sơ đầy đủ"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDetailCandidate(candidate);
                                        setIsDetailModalOpen(true);
                                      }}
                                      className="w-6 h-6 rounded bg-slate-50 hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 2: VỊ TRÍ ĐƯỢC PHÂN CÔNG (JOBS REQUISITIONS) */}
            {activeMenu === "jobs" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">
                    Danh Sách Vị Trí Tuyển Dụng Phụ Trách ({jobs.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateJobModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#4285F4] font-semibold text-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm vị trí mới</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3.5 px-4">Mã & Vị trí tuyển dụng</th>
                        <th className="py-3.5 px-4">Phòng ban</th>
                        <th className="py-3.5 px-4 text-center">Cấp bậc</th>
                        <th className="py-3.5 px-4 text-center">Chỉ tiêu (Đã tuyển / Mở)</th>
                        <th className="py-3.5 px-4">Dải lương</th>
                        <th className="py-3.5 px-4">Hạn nộp</th>
                        <th className="py-3.5 px-4 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jobs.map((job) => {
                        const jobCandidateCount = candidates.filter((c) => c.jobCode === job.code).length;
                        return (
                          <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-mono text-xs font-bold text-[#4285F4] block">
                                {job.code}
                              </span>
                              <span className="font-bold text-slate-900">{job.title}</span>
                            </td>
                            <td className="py-4 px-4 text-slate-600 font-medium">{job.department}</td>
                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                {job.level}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-bold text-slate-900">
                                {job.filledCount} / {job.openCount}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-semibold text-emerald-600">{job.salaryRange}</td>
                            <td className="py-4 px-4 text-slate-500">{job.deadline}</td>
                            <td className="py-4 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedJobCode(job.code);
                                  setActiveMenu("pipeline");
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#4285F4] hover:bg-blue-100 font-semibold text-xs cursor-pointer"
                              >
                                Xem Pipeline ({jobCandidateCount})
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 3: LỊCH PHỎNG VẤN (INTERVIEWS SCHEDULE) */}
            {activeMenu === "interviews" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">
                    Lịch Phỏng Vấn Sắp Diễn Ra ({interviewList.length})
                  </h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {interviewList.map((cand) => (
                    <div
                      key={cand.id}
                      className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/80 p-3 rounded-2xl transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-2xl ${cand.avatarBg} text-white flex items-center justify-center font-bold text-sm`}
                        >
                          {cand.avatarText}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{cand.name}</h4>
                          <p className="text-xs text-slate-500">
                            Vị trí: <strong>{cand.jobTitle}</strong> • {cand.phone}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-amber-700">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {cand.interviewSchedule?.date || "Chờ sắp xếp"} (
                              {cand.interviewSchedule?.time || "Chưa xác định"})
                            </span>
                            <span>• {cand.interviewSchedule?.round || "Vòng phỏng vấn"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => openScheduleModal(cand)}
                          className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-xs cursor-pointer"
                        >
                          Đổi lịch PV
                        </button>
                        <button
                          type="button"
                          onClick={() => openOfferModal(cand)}
                          className="px-3.5 py-2 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-semibold text-xs cursor-pointer shadow-xs"
                        >
                          Đạt & Soạn Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: TỔNG QUAN (DASHBOARD SUMMARY) */}
            {activeMenu === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Phễu Tuyển dụng Tóm tắt */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#4285F4]" />
                      <span>Tiến Độ Phễu Tuyển Dụng Tổng Thể</span>
                    </h4>
                    <div className="space-y-2 text-xs">
                      {KANBAN_COLUMNS.map((col) => {
                        const count = candidates.filter((c) => c.stage === col.id).length;
                        const percent = Math.round((count / candidates.length) * 100) || 0;
                        return (
                          <div key={col.id} className="space-y-1">
                            <div className="flex justify-between font-semibold text-slate-700">
                              <span>{col.title}</span>
                              <span>
                                {count} ứng viên ({percent}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full ${col.dotColor}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lịch phỏng vấn gần nhất */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span>Phỏng Vấn Trọng Tâm Tuần Này</span>
                    </h4>
                    <div className="space-y-2.5">
                      {interviewList.slice(0, 3).map((cand) => (
                        <div
                          key={cand.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{cand.name}</span>
                            <span className="text-slate-500">{cand.jobTitle}</span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold">
                            {cand.interviewSchedule?.date} {cand.interviewSchedule?.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveMenu("pipeline")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4285F4] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-600 transition-all cursor-pointer"
                  >
                    <span>Mở Pipeline Kéo Thả Đầy Đủ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. CÁC MODAL THAO TÁC CỦA RECRUITER */}
      {/* ========================================================================= */}

      {/* MODAL ĐẶT LỊCH PHỎNG VẤN */}
      {isScheduleModalOpen && scheduleTargetCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Đặt Lịch Phỏng Vấn</h3>
                  <p className="text-xs text-slate-500">
                    Ứng viên: <span className="font-semibold text-slate-800">{scheduleTargetCandidate.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Vòng Phỏng Vấn
                </label>
                <select
                  value={scheduleForm.round}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, round: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                >
                  <option value="Vòng 1: Phỏng vấn Kỹ thuật & Chuyên môn">Vòng 1: Phỏng vấn Kỹ thuật & Chuyên môn</option>
                  <option value="Vòng 2: Phỏng vấn Hiring Manager & Culture Fit">Vòng 2: Phỏng vấn Hiring Manager & Culture Fit</option>
                  <option value="Vòng 3: Phỏng vấn Giám đốc Nhân sự & Offer">Vòng 3: Phỏng vấn Giám đốc Nhân sự & Offer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Ngày phỏng vấn
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Thời gian
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Người phỏng vấn (Interviewer)
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.interviewer}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interviewer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Hình thức phỏng vấn
                </label>
                <select
                  value={scheduleForm.locationType}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, locationType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                >
                  <option value="Google Meet (Online)">Google Meet (Online)</option>
                  <option value="Trực tiếp tại văn phòng">Trực tiếp tại văn phòng công ty (P.402)</option>
                </select>
              </div>

              {scheduleForm.locationType.includes("Online") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Link phòng họp
                  </label>
                  <input
                    type="url"
                    value={scheduleForm.meetLink}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, meetLink: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition-all cursor-pointer"
                >
                  Xác nhận & Gửi Thư Mời PV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SOẠN OFFER */}
      {isOfferModalOpen && offerTargetCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Soạn Đề Xuất Offer</h3>
                  <p className="text-xs text-slate-500">
                    Ứng viên: <span className="font-semibold text-slate-800">{offerTargetCandidate.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmOffer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Lương đề xuất (Gross/tháng)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={offerForm.salary}
                    onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                    className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Ngày dự kiến Onboard
                </label>
                <input
                  type="date"
                  required
                  value={offerForm.onboardDate}
                  onChange={(e) => setOfferForm({ ...offerForm, onboardDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tỷ lệ lương thử việc
                </label>
                <select
                  value={offerForm.probationRate}
                  onChange={(e) => setOfferForm({ ...offerForm, probationRate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                >
                  <option value="100%">100% lương chính thức (Tuyển dụng nội bộ)</option>
                  <option value="85%">85% lương chính thức (Tiêu chuẩn)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  Gửi Phê Duyệt Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI HỒ SƠ */}
      {isRejectModalOpen && rejectTargetCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Gửi Thư Từ Chối Hồ Sơ</h3>
                  <p className="text-xs text-slate-500">
                    Ứng viên: <span className="font-semibold text-slate-800">{rejectTargetCandidate.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Lý do từ chối chính
                </label>
                <select
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                  <option value="Kinh nghiệm thực tế chưa hoàn toàn phù hợp với yêu cầu hiện tại của vị trí">
                    Kinh nghiệm thực tế chưa hoàn toàn phù hợp
                  </option>
                  <option value="Kỳ vọng mức lương chưa tương xứng với khung ngân sách">
                    Kỳ vọng mức lương vượt khung ngân sách
                  </option>
                  <option value="Ứng viên chủ động rút hồ sơ">Ứng viên chủ động rút hồ sơ</option>
                  <option value="Đã tuyển đủ chỉ tiêu cho đợt tuyển dụng này">
                    Đã tuyển đủ chỉ tiêu cho đợt này
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tiêu đề thư cảm ơn
                </label>
                <input
                  type="text"
                  required
                  value={rejectForm.emailSubject}
                  onChange={(e) => setRejectForm({ ...rejectForm, emailSubject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                >
                  Gửi Email & Đóng Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SOẠN TIN TUYỂN DỤNG */}
      {isCreateJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Soạn Tin Tuyển Dụng Mới</h3>
                  <p className="text-xs text-slate-500">Khởi tạo Job Requisition để mở pipeline nhận hồ sơ</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateJobModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Tiêu đề vị trí tuyển dụng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Senior Cloud DevOps Engineer"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phòng ban
                  </label>
                  <select
                    value={jobFormData.department}
                    onChange={(e) => setJobFormData({ ...jobFormData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  >
                    <option value="Trung Tâm Phát Triển Phần Mềm">Trung Tâm Phát Triển Phần Mềm</option>
                    <option value="Khối Phát Triển Sản Phẩm">Khối Phát Triển Sản Phẩm</option>
                    <option value="Ban Hạ Tầng & Bảo Mật">Ban Hạ Tầng & Bảo Mật</option>
                    <option value="Khối Dữ Liệu & Phân Tích">Khối Dữ Liệu & Phân Tích</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Cấp bậc
                  </label>
                  <select
                    value={jobFormData.level}
                    onChange={(e) => setJobFormData({ ...jobFormData, level: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Middle">Middle</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={jobFormData.openCount}
                    onChange={(e) => setJobFormData({ ...jobFormData, openCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Lương Min (Triệu)
                  </label>
                  <input
                    type="number"
                    value={jobFormData.salaryMin}
                    onChange={(e) => setJobFormData({ ...jobFormData, salaryMin: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Lương Max (Triệu)
                  </label>
                  <input
                    type="number"
                    value={jobFormData.salaryMax}
                    onChange={(e) => setJobFormData({ ...jobFormData, salaryMax: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateJobModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                >
                  Đăng Tin & Tạo Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT ỨNG VIÊN */}
      {isDetailModalOpen && detailCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl ${detailCandidate.avatarBg} text-white flex items-center justify-center font-extrabold text-sm shadow-sm`}
                >
                  {detailCandidate.avatarText}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{detailCandidate.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{detailCandidate.jobTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-semibold text-slate-800">{detailCandidate.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số điện thoại:</span>
                  <span className="font-semibold text-slate-800">{detailCandidate.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nguồn hồ sơ:</span>
                  <span className="font-semibold text-blue-600">{detailCandidate.source}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Match Score:</span>
                  <span className="font-bold text-emerald-600">{detailCandidate.matchScore}%</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Kỹ năng:</span>
                <div className="flex flex-wrap gap-1.5">
                  {detailCandidate.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#4285F4] font-semibold text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Kinh nghiệm:</span>
                <p className="text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {detailCandidate.experience}
                </p>
              </div>

              {detailCandidate.notes && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Ghi chú:</span>
                  <p className="text-slate-600 p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                    {detailCandidate.notes}
                  </p>
                </div>
              )}

              {/* Chuyển nhanh giai đoạn */}
              <div>
                <span className="font-bold text-slate-700 block mb-2">Chuyển nhanh giai đoạn:</span>
                <div className="flex flex-wrap gap-1.5">
                  {KANBAN_COLUMNS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      disabled={detailCandidate.stage === col.id}
                      onClick={() => {
                        handleMoveCandidateStage(detailCandidate.id, col.id);
                        setDetailCandidate({ ...detailCandidate, stage: col.id });
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        detailCandidate.stage === col.id
                          ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {col.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openScheduleModal(detailCandidate);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Đặt Lịch PV
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openOfferModal(detailCandidate);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Soạn Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL & AVATAR CROP MODAL */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userRole="Nhân viên tuyển dụng (Recruiter)"
        initialTab={profileModalTab}
        initialData={{
          employeeCode: "REC-2026-002",
          name: recruiterProfile.name,
          email: recruiterProfile.email,
          role: recruiterProfile.role,
          department: recruiterProfile.department,
          phone: recruiterProfile.phone,
          avatarUrl: recruiterProfile.avatarUrl,
          bio: recruiterProfile.bio,
          gender: "Nam",
          dateOfBirth: "1994-06-18",
        }}
        onSaveProfile={(updated) => {
          setRecruiterProfile((prev) => ({
            ...prev,
            name: updated.name,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl || prev.avatarUrl,
            bio: updated.bio || prev.bio,
            department: updated.department || prev.department,
          }));
          showToast("Đã cập nhật thông tin Chuyên viên tuyển dụng thành công!");
        }}
        onAvatarChange={handleAvatarCropComplete}
        onChangePassword={async () => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          showToast("Đổi mật khẩu Chuyên viên tuyển dụng thành công! Mật khẩu mới đã được lưu.");
        }}
      />

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
    </div>
  );
}
