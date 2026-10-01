"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Copy,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Bell,
  LogOut,
  User as UserIcon,
  Mail,
  Building,
  DollarSign,
  Calendar,
  AlertCircle,
  FileText,
  Check,
  X,
  Camera,
  Star,
  Sparkles,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  UserCheck,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  AlertTriangle,
  Info,
  Send
} from "lucide-react";

// Types
export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  level: "Junior" | "Middle" | "Senior" | "Lead" | "Manager";
  targetCount: number;
  receivedCount: number;
  status: "Draft" | "Pending" | "Active" | "Closed";
  salaryRange: string;
  createdAt: string;
  deadline: string;
  description?: string;
  requirements?: string;
  workType?: string;
  proposedSalary?: number;
  salaryJustification?: string;
}

export interface ShortlistCandidate {
  id: string;
  name: string;
  avatarColor: string;
  email: string;
  phone: string;
  positionId: string;
  positionTitle: string;
  experienceYears: number;
  appliedDate: string;
  round1: {
    interviewer: string;
    score: number; // Max 10
    comment: string;
    status: "Passed" | "Failed";
  };
  round2: {
    interviewer: string;
    score: number; // Max 10
    comment: string;
    status: "Passed" | "Failed";
  };
  overallAssessment: string;
  proposedSalary: string;
  decision: "Pending" | "Hired" | "Rejected";
  decisionNote?: string;
  decidedAt?: string;
}

// Initial Mock Data: Requisitions
const INITIAL_REQUISITIONS: JobRequisition[] = [
  {
    id: "REQ-2026-001",
    title: "Lập trình viên Frontend (React/Next.js)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Senior",
    targetCount: 2,
    receivedCount: 8,
    status: "Active",
    salaryRange: "28 - 38 triệu VNĐ",
    createdAt: "10/01/2026",
    deadline: "15/02/2026",
    description: "Chịu trách nhiệm kiến trúc Frontend, xây dựng hệ thống UI Design System và tối ưu hiệu năng web nội bộ.",
    requirements: "Tối thiểu 3 năm kinh nghiệm React, TypeScript, Tailwind CSS, có kinh nghiệm Next.js App Router.",
  },
  {
    id: "REQ-2026-002",
    title: "Chuyên viên Marketing & Truyền thông Nội bộ",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Middle",
    targetCount: 1,
    receivedCount: 5,
    status: "Active",
    salaryRange: "18 - 25 triệu VNĐ",
    createdAt: "15/01/2026",
    deadline: "20/02/2026",
    description: "Lên chiến dịch truyền thông tuyển dụng nội bộ, xây dựng thương hiệu tuyển dụng kỹ thuật (Tech Branding).",
    requirements: "Tối thiểu 2 năm kinh nghiệm Tech Marketing, thành thạo content & tổ chức Tech Talk.",
  },
  {
    id: "REQ-2026-003",
    title: "Senior Backend Engineer (Golang/Python)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Senior",
    targetCount: 3,
    receivedCount: 12,
    status: "Active",
    salaryRange: "35 - 50 triệu VNĐ",
    createdAt: "18/01/2026",
    deadline: "28/02/2026",
    description: "Phát triển hệ thống microservices phục vụ tuyển dụng, xử lý dữ liệu lớn và bảo mật phân quyền.",
    requirements: "Thành thạo Golang hoặc Python FastAPI, hiểu sâu SQL, Redis, Docker, Kubernetes.",
  },
  {
    id: "REQ-2026-004",
    title: "Chuyên viên Thiết Kế Trải Nghiệm (UI/UX Designer)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Middle",
    targetCount: 1,
    receivedCount: 3,
    status: "Pending",
    salaryRange: "20 - 28 triệu VNĐ",
    createdAt: "28/01/2026",
    deadline: "05/03/2026",
    description: "Thiết kế luồng trải nghiệm người dùng cho ứng dụng tuyển dụng nội bộ, chuẩn hóa Design System Figma.",
    requirements: "Có Portfolio chỉn chu, thành thạo Figma, Design Tokens, thấu hiểu tư duy người dùng sản phẩm B2B.",
  },
  {
    id: "REQ-2026-005",
    title: "QA Automation Engineer Lead",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Lead",
    targetCount: 1,
    receivedCount: 6,
    status: "Closed",
    salaryRange: "32 - 42 triệu VNĐ",
    createdAt: "02/01/2026",
    deadline: "25/01/2026",
    description: "Xây dựng khung kiểm thử tự động toàn diện (CI/CD Test Automation Framework).",
    requirements: "Kinh nghiệm Playwright, Cypress, Selenium, tích hợp kiểm thử vào GitLab CI.",
  },
];

// Initial Mock Data: Shortlist Candidates
const INITIAL_CANDIDATES: ShortlistCandidate[] = [
  {
    id: "CAN-001",
    name: "Trần Minh Quang",
    avatarColor: "bg-blue-600",
    email: "quang.tran@gmail.com",
    phone: "0903 112 334",
    positionId: "REQ-2026-001",
    positionTitle: "Lập trình viên Frontend (React/Next.js)",
    experienceYears: 4,
    appliedDate: "12/01/2026",
    round1: {
      interviewer: "Hoàng Long (Senior FE)",
      score: 8.5,
      comment: "Nắm vững React internals, tối ưu re-render và Component Life Cycle tốt. Code bài test thuật toán sáng sủa.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 9.0,
      comment: "Tư duy sản phẩm sắc bén, giao tiếp tự tin, có kinh nghiệm lead nhóm nhỏ 3 người. Rất phù hợp văn hóa team.",
      status: "Passed",
    },
    overallAssessment: "Ứng viên nổi bật nhất đợt tuyển này. Đề xuất mức lương 34 triệu/tháng, sẵn sàng onboard đầu tháng sau.",
    proposedSalary: "34.000.000 VNĐ",
    decision: "Pending",
  },
  {
    id: "CAN-002",
    name: "Nguyễn Hải Đăng",
    avatarColor: "bg-emerald-600",
    email: "haidang.dev@gmail.com",
    phone: "0918 554 221",
    positionId: "REQ-2026-001",
    positionTitle: "Lập trình viên Frontend (React/Next.js)",
    experienceYears: 3,
    appliedDate: "14/01/2026",
    round1: {
      interviewer: "Hoàng Long (Senior FE)",
      score: 8.0,
      comment: "Thành thạo Tailwind CSS và Next.js App Router. Kinh nghiệm về State Management Redux/Zustand vững.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 7.5,
      comment: "Kỹ năng mềm tốt, cầu tiến. Tuy nhiên chưa có nhiều kinh nghiệm xử lý bài toán Web Vitals quy mô lớn.",
      status: "Passed",
    },
    overallAssessment: "Phù hợp vị trí Middle-Strong Frontend. Dự phòng tốt nếu ứng viên hàng đầu từ chối offer.",
    proposedSalary: "29.000.000 VNĐ",
    decision: "Pending",
  },
  {
    id: "CAN-003",
    name: "Phạm Thùy Linh",
    avatarColor: "bg-purple-600",
    email: "linh.pham@yahoo.com",
    phone: "0977 443 219",
    positionId: "REQ-2026-002",
    positionTitle: "Chuyên viên Marketing & Truyền thông Nội bộ",
    experienceYears: 3,
    appliedDate: "18/01/2026",
    round1: {
      interviewer: "Thu Hà (HR Manager)",
      score: 9.0,
      comment: "Kỹ năng viết lách cuốn hút, có kinh nghiệm chạy chiến dịch tuyển dụng cho startup công nghệ kỳ lân.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 8.5,
      comment: "Hiểu rõ insight của kỹ sư công nghệ, thuyết trình kế hoạch quý 1 rất thuyết phục và sáng tạo.",
      status: "Passed",
    },
    overallAssessment: "Rất phù hợp để thúc đẩy phong trào Tech Branding cho phòng ban. Đề xuất tuyển ngay mức 22 triệu.",
    proposedSalary: "22.000.000 VNĐ",
    decision: "Hired",
    decisionNote: "Đã chốt tuyển mức 22.500.000 VNĐ, bắt đầu nhận việc từ ngày 15/02/2026.",
    decidedAt: "28/01/2026",
  },
  {
    id: "CAN-004",
    name: "Đỗ Quốc Bảo",
    avatarColor: "bg-amber-600",
    email: "baodo.cloud@gmail.com",
    phone: "0934 887 990",
    positionId: "REQ-2026-003",
    positionTitle: "Senior Backend Engineer (Golang/Python)",
    experienceYears: 5,
    appliedDate: "20/01/2026",
    round1: {
      interviewer: "Minh Quân (Tech Lead)",
      score: 8.5,
      comment: "Chuyên sâu kiến trúc vi dịch vụ Golang, am hiểu distributed locking và PostgreSQL query optimization.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 8.0,
      comment: "Thái độ làm việc chuyên nghiệp, chịu được áp lực cao. Đã từng làm việc với khối lượng tải 100k CCU.",
      status: "Passed",
    },
    overallAssessment: "Đáp ứng đầy đủ yêu cầu cho vị trí Senior Backend trọng điểm. Kỳ vọng mức lương 42 triệu.",
    proposedSalary: "42.000.000 VNĐ",
    decision: "Pending",
  },
  {
    id: "CAN-005",
    name: "Vũ Đình Trọng",
    avatarColor: "bg-rose-600",
    email: "trongvu.tech@gmail.com",
    phone: "0966 332 118",
    positionId: "REQ-2026-003",
    positionTitle: "Senior Backend Engineer (Golang/Python)",
    experienceYears: 4,
    appliedDate: "22/01/2026",
    round1: {
      interviewer: "Minh Quân (Tech Lead)",
      score: 7.0,
      comment: "Kỹ năng lập trình đạt chuẩn, tuy nhiên tư duy hệ thống phân tán còn hạn chế, chưa chủ động về CI/CD.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 6.5,
      comment: "Mục tiêu nghề nghiệp chưa tương thích với định hướng dự án dài hạn của công ty. Yêu cầu mức lương quá cao so với năng lực.",
      status: "Passed",
    },
    overallAssessment: "Chưa đạt kỳ vọng đối với cấp bậc Senior. Cần xem xét loại hoặc điều chỉnh sang ứng viên khác.",
    proposedSalary: "45.000.000 VNĐ",
    decision: "Rejected",
    decisionNote: "Chưa đáp ứng tiêu chuẩn chuyên môn cấp Senior và định hướng phát triển chung của phòng ban.",
    decidedAt: "27/01/2026",
  },
];

export default function HiringManagerDashboardPage() {
  const router = useRouter();

  // State: Requisitions & Shortlist Candidates
  const [requisitions, setRequisitions] = useState<JobRequisition[]>(INITIAL_REQUISITIONS);
  const [candidates, setCandidates] = useState<ShortlistCandidate[]>(INITIAL_CANDIDATES);

  // Filters & Search
  const [reqSearch, setReqSearch] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState<string>("ALL");

  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidatePosFilter, setCandidatePosFilter] = useState<string>("ALL");
  const [candidateDecisionFilter, setCandidateDecisionFilter] = useState<string>("ALL");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile State
  const [managerProfile, setManagerProfile] = useState({
    name: "Lê Trưởng Nhóm",
    email: "truongbophan@company.com",
    phone: "0912 345 678",
    role: "Trưởng Bộ Phận (Hiring Manager)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    avatarUrl: "",
    bio: "Chịu trách nhiệm hoạch định nhu cầu tuyển dụng, phỏng vấn chuyên môn và ra quyết định nhân sự then chốt cho khối Công nghệ.",
  });

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Modals State
  const [isCreateReqOpen, setIsCreateReqOpen] = useState(false);
  const [isCloneReqOpen, setIsCloneReqOpen] = useState(false);
  const [selectedReqForClone, setSelectedReqForClone] = useState<string>("");

  // Candidate Decisions Modals
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCandidateDetailOpen, setIsCandidateDetailOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<ShortlistCandidate | null>(null);

  // Decision Form Inputs
  const [hireNote, setHireNote] = useState("");
  const [hireSalary, setHireSalary] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Sprint 2: Date helpers
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const defaultTargetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Standard salary ceiling: 30,000,000 VNĐ
  const SALARY_STANDARD_CEILING = 30000000;

  // Create Requisition Form State (Sprint 2)
  const [reqFormData, setReqFormData] = useState({
    title: "",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Senior" as JobRequisition["level"],
    workType: "Toàn thời gian (Full-time)",
    targetCount: 1,
    targetDate: defaultTargetDate,
    proposedSalary: 35000000, // Default 35M to demonstrate justification logic (> 30M)
    salaryJustification: "",
    description: "",
    requirements: "",
  });

  // Validation errors
  const [reqFormErrors, setReqFormErrors] = useState<{
    title?: string;
    targetDate?: string;
    proposedSalary?: string;
    salaryJustification?: string;
    description?: string;
  }>({});

  // Rich Text Editor formatting state
  const [editorActiveFormats, setEditorActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: "left" as "left" | "center" | "right",
  });
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Rich text formatting actions
  const applyFormatting = (format: "bold" | "italic" | "underline") => {
    const textarea = jdTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = reqFormData.description;
    const selectedText = currentText.substring(start, end);

    let prefix = "";
    let suffix = "";
    if (format === "bold") {
      prefix = "**";
      suffix = "**";
      setEditorActiveFormats((prev) => ({ ...prev, bold: !prev.bold }));
    } else if (format === "italic") {
      prefix = "*";
      suffix = "*";
      setEditorActiveFormats((prev) => ({ ...prev, italic: !prev.italic }));
    } else if (format === "underline") {
      prefix = "<u>";
      suffix = "</u>";
      setEditorActiveFormats((prev) => ({ ...prev, underline: !prev.underline }));
    }

    const insertContent = selectedText || (format === "bold" ? "văn bản in đậm" : format === "italic" ? "văn bản in nghiêng" : "văn bản gạch chân");
    const newText = currentText.substring(0, start) + prefix + insertContent + suffix + currentText.substring(end);

    setReqFormData((prev) => ({ ...prev, description: newText }));
    if (reqFormErrors.description) {
      setReqFormErrors((prev) => {
        const next = { ...prev };
        delete next.description;
        return next;
      });
    }

    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  const applyListFormatting = (type: "bullet" | "ordered") => {
    const textarea = jdTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const currentText = reqFormData.description;
    const bullet = type === "bullet" ? "• " : "1. ";
    const newText = currentText.substring(0, start) + `\n${bullet}` + currentText.substring(start);

    setReqFormData((prev) => ({ ...prev, description: newText }));
    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  const insertJDTemplate = () => {
    const sampleJD = `I. MỤC TIÊU & MÔ TẢ CÔNG VIỆC:
• Chịu trách nhiệm thiết kế, phát triển và tối ưu hóa hệ thống phần mềm cốt lõi của công ty.
• Phối hợp chặt chẽ với Product Owner, Tech Lead và UI/UX Designer để hoàn thiện các tính năng tuyển dụng.
• Tham gia review mã nguồn, hướng dẫn các thành viên junior và đảm bảo chất lượng kỹ thuật theo chuẩn Clean Architecture.
• Đề xuất giải pháp cải tiến hiệu năng, mở rộng hệ thống và nâng cao trải nghiệm ứng viên.

II. YÊU CẦU CHUYÊN MÔN:
• Tối thiểu 3+ năm kinh nghiệm làm việc thực tế ở vị trí tương đương.
• Nắm vững React, TypeScript, Next.js (hoặc Golang/Python), Microservices và RESTful API.
• Có tư duy giải thuật, cấu trúc dữ liệu tốt và thấu hiểu các nguyên tắc bảo mật thông tin.
• Kỹ năng giao tiếp tự tin, tinh thần làm việc nhóm và chủ động giải quyết sự cố.

III. QUYỀN LỢI ĐÃI NGỘ:
• Thu nhập cạnh tranh theo năng lực, thưởng hiệu suất định kỳ và thưởng dự án.
• Được tham gia các chương trình đào tạo chuyên môn và lộ trình thăng tiến rõ ràng (Tech Lead / Architect).
• Gói chăm sóc sức khỏe cao cấp cho nhân viên, thiết bị làm việc hiện đại và môi trường làm việc cởi mở.`;

    setReqFormData((prev) => ({ ...prev, description: sampleJD }));
    setReqFormErrors((prev) => {
      const next = { ...prev };
      delete next.description;
      return next;
    });
    showToast("Đã chèn nội dung Mô tả công việc (JD) mẫu thành công!");
  };

  const handleDateChange = (val: string) => {
    setReqFormData((prev) => ({ ...prev, targetDate: val }));
    if (val && val < todayStr) {
      setReqFormErrors((prev) => ({
        ...prev,
        targetDate: "Ngày cần nhân sự không thể ở trong quá khứ. Vui lòng chọn một ngày trong tương lai (tối thiểu sau hôm nay)."
      }));
    } else {
      setReqFormErrors((prev) => {
        const next = { ...prev };
        delete next.targetDate;
        return next;
      });
    }
  };

  const handleSalaryChange = (amount: number) => {
    setReqFormData((prev) => ({ ...prev, proposedSalary: amount }));
    if (amount <= SALARY_STANDARD_CEILING) {
      setReqFormErrors((prev) => {
        const next = { ...prev };
        delete next.salaryJustification;
        delete next.proposedSalary;
        return next;
      });
    } else {
      if (reqFormData.salaryJustification.trim()) {
        setReqFormErrors((prev) => {
          const next = { ...prev };
          delete next.salaryJustification;
          return next;
        });
      }
    }
  };

  // Edit Profile Form State
  const [editProfileForm, setEditProfileForm] = useState({
    name: "Lê Trưởng Nhóm",
    phone: "0912 345 678",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    bio: "Chịu trách nhiệm hoạch định nhu cầu tuyển dụng, phỏng vấn chuyên môn và ra quyết định nhân sự then chốt cho khối Công nghệ.",
  });

  // Sync profile from localStorage if user logged in
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) {
          setManagerProfile((prev) => ({
            ...prev,
            email: parsed.email,
            name: parsed.full_name || prev.name,
          }));
          setEditProfileForm((prev) => ({
            ...prev,
            name: parsed.full_name || prev.name,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Logout Handler
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("internal-recruitment-session");
    }
    showToast("Đã đăng xuất khỏi phiên làm việc!");
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  // Avatar Upload Handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setManagerProfile((prev) => ({ ...prev, avatarUrl: url }));
      showToast("Đã cập nhật ảnh đại diện mới thành công!");
    }
  };

  // Filtered Requisitions
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchesSearch =
        req.title.toLowerCase().includes(reqSearch.toLowerCase()) ||
        req.id.toLowerCase().includes(reqSearch.toLowerCase()) ||
        req.department.toLowerCase().includes(reqSearch.toLowerCase());
      const matchesStatus =
        reqStatusFilter === "ALL" || req.status === reqStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requisitions, reqSearch, reqStatusFilter]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((can) => {
      const matchesSearch =
        can.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        can.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        can.id.toLowerCase().includes(candidateSearch.toLowerCase());
      const matchesPos =
        candidatePosFilter === "ALL" || can.positionId === candidatePosFilter;
      const matchesDecision =
        candidateDecisionFilter === "ALL" || can.decision === candidateDecisionFilter;
      return matchesSearch && matchesPos && matchesDecision;
    });
  }, [candidates, candidateSearch, candidatePosFilter, candidateDecisionFilter]);

  // Metric Stats
  const totalRequisitions = requisitions.length;
  const activeRequisitions = requisitions.filter((r) => r.status === "Active").length;
  const pendingCandidates = candidates.filter((c) => c.decision === "Pending").length;
  const hiredCandidates = candidates.filter((c) => c.decision === "Hired").length;

  // Handlers: Create Requisition (Sprint 2 Logic)
  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // 1. Validate Title
    if (!reqFormData.title.trim()) {
      errors.title = "Vui lòng nhập vị trí/chức danh cần tuyển";
    }

    // 2. Validate Target Date (Không cho phép ngày trong quá khứ)
    if (!reqFormData.targetDate) {
      errors.targetDate = "Vui lòng chọn ngày cần nhân sự";
    } else if (reqFormData.targetDate < todayStr) {
      errors.targetDate =
        "Ngày cần nhân sự không thể ở trong quá khứ. Vui lòng chọn một ngày trong tương lai (tối thiểu sau hôm nay).";
    }

    // 3. Validate Proposed Salary & Justification (> 30.000.000 VNĐ)
    if (!reqFormData.proposedSalary || reqFormData.proposedSalary <= 0) {
      errors.proposedSalary = "Vui lòng nhập mức lương đề xuất hợp lệ";
    } else if (reqFormData.proposedSalary > SALARY_STANDARD_CEILING) {
      if (!reqFormData.salaryJustification.trim()) {
        errors.salaryJustification =
          "Bắt buộc giải trình lý do đề xuất mức lương vượt khung ngân sách chuẩn (> 30.000.000 VNĐ).";
      }
    }

    // 4. Validate Job Description
    if (!reqFormData.description.trim()) {
      errors.description = "Vui lòng nhập nội dung mô tả công việc (Job Description)";
    }

    if (Object.keys(errors).length > 0) {
      setReqFormErrors(errors);
      showToast("Vui lòng kiểm tra và hoàn thiện các trường thông tin bắt buộc!");
      return;
    }

    const formattedSalary =
      new Intl.NumberFormat("vi-VN").format(reqFormData.proposedSalary) + " VNĐ";

    const newReq: JobRequisition = {
      id: `REQ-2026-00${requisitions.length + 1}`,
      title: reqFormData.title.trim(),
      department: reqFormData.department || managerProfile.department,
      level: reqFormData.level,
      targetCount: Number(reqFormData.targetCount) || 1,
      receivedCount: 0,
      status: "Pending",
      salaryRange: formattedSalary,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      deadline: new Date(reqFormData.targetDate).toLocaleDateString("vi-VN"),
      description: reqFormData.description,
      requirements: reqFormData.requirements,
      workType: reqFormData.workType,
      proposedSalary: reqFormData.proposedSalary,
      salaryJustification: reqFormData.salaryJustification,
    };

    setRequisitions([newReq, ...requisitions]);
    setIsCreateReqOpen(false);
    setReqFormErrors({});

    // Reset Form to initial values
    setReqFormData({
      title: "",
      department: managerProfile.department,
      level: "Senior",
      workType: "Toàn thời gian (Full-time)",
      targetCount: 1,
      targetDate: defaultTargetDate,
      proposedSalary: 35000000,
      salaryJustification: "",
      description: "",
      requirements: "",
    });

    showToast(`Đã gửi yêu cầu mở tuyển: "${newReq.title}" với ngân sách ${formattedSalary} (Đang chờ duyệt)!`);
  };

  // Handlers: Clone Requisition
  const handleOpenCloneModal = (prefillId?: string) => {
    if (prefillId) {
      setSelectedReqForClone(prefillId);
    } else if (requisitions.length > 0) {
      setSelectedReqForClone(requisitions[0].id);
    }
    setIsCloneReqOpen(true);
  };

  const handleConfirmClone = () => {
    const sourceReq = requisitions.find((r) => r.id === selectedReqForClone);
    if (!sourceReq) return;

    const clonedReq: JobRequisition = {
      ...sourceReq,
      id: `REQ-2026-00${requisitions.length + 1}`,
      title: `${sourceReq.title} (Bổ sung)`,
      status: "Pending",
      receivedCount: 0,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      deadline: "20/03/2026",
    };

    setRequisitions([clonedReq, ...requisitions]);
    setIsCloneReqOpen(false);
    showToast(`Đã sao chép thành công yêu cầu: ${clonedReq.title}!`);
  };

  // Handlers: Hire Candidate
  const handleOpenHireModal = (can: ShortlistCandidate) => {
    setActiveCandidate(can);
    setHireSalary(can.proposedSalary || "");
    setHireNote(can.overallAssessment || "");
    setIsHireModalOpen(true);
  };

  const handleConfirmHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === activeCandidate.id
          ? {
              ...c,
              decision: "Hired",
              decisionNote: hireNote || "Đồng ý tuyển dụng theo đề xuất chuyên môn.",
              proposedSalary: hireSalary || c.proposedSalary,
              decidedAt: new Date().toLocaleDateString("vi-VN"),
            }
          : c
      )
    );

    setIsHireModalOpen(false);
    showToast(`Đã đưa ra quyết định TUYỂN DỤNG cho ứng viên ${activeCandidate.name}!`);
    setActiveCandidate(null);
  };

  // Handlers: Reject Candidate
  const handleOpenRejectModal = (can: ShortlistCandidate) => {
    setActiveCandidate(can);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === activeCandidate.id
          ? {
              ...c,
              decision: "Rejected",
              decisionNote: rejectReason || "Chưa phù hợp với yêu cầu hiện tại của dự án.",
              decidedAt: new Date().toLocaleDateString("vi-VN"),
            }
          : c
      )
    );

    setIsRejectModalOpen(false);
    showToast(`Đã lưu kết quả KHÔNG CHỌN ứng viên ${activeCandidate.name}.`);
    setActiveCandidate(null);
  };

  // Profile Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setManagerProfile((prev) => ({
      ...prev,
      name: editProfileForm.name,
      phone: editProfileForm.phone,
      department: editProfileForm.department,
      bio: editProfileForm.bio,
    }));
    setIsEditProfileModalOpen(false);
    showToast("Đã cập nhật hồ sơ cá nhân thành công!");
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />

      {/* Floating Toast Notification */}
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
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Branding & Role Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-[#6ba5ff] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 tracking-tight">
                    Tuyển Dụng Nội Bộ
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                    Trưởng Bộ Phận
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {managerProfile.department}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions, Notifications & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <button
              title="Thông báo tuyển dụng"
              className="relative w-10 h-10 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4285F4] ring-2 ring-white"></span>
            </button>

            {/* User Profile Dropdown Menu */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 pl-3 border-l border-gray-100 hover:bg-slate-50/80 p-1.5 rounded-2xl transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="relative shrink-0">
                  {managerProfile.avatarUrl ? (
                    <img
                      src={managerProfile.avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4285F4] to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-100">
                      LT
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Đang hoạt động"
                  ></span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {managerProfile.name}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180 text-[#4285F4]" : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-500 block leading-tight">
                    {managerProfile.email}
                  </span>
                </div>
              </button>

              {/* DROPDOWN POPUP */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Summary Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3 mb-2 border border-gray-100/70">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative group cursor-pointer shrink-0"
                      title="Nhấp để tải lên ảnh mới"
                    >
                      {managerProfile.avatarUrl ? (
                        <img
                          src={managerProfile.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#4285F4] text-white flex items-center justify-center font-bold text-base shadow-sm">
                          LT
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {managerProfile.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {managerProfile.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#4285F4]">
                        Hiring Manager
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1 text-sm font-medium text-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50/70 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-[#4285F4]" />
                      <span>Hồ sơ cá nhân</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setEditProfileForm({
                          name: managerProfile.name,
                          phone: managerProfile.phone,
                          department: managerProfile.department,
                          bio: managerProfile.bio,
                        });
                        setIsEditProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50/70 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-slate-400 group-hover:text-[#4285F4]" />
                      <span>Chỉnh sửa hồ sơ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        avatarInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50/70 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-slate-400 group-hover:text-[#4285F4]" />
                      <span>Upload ảnh đại diện</span>
                    </button>

                    <div className="pt-1.5 mt-1.5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Standalone Logout Button */}
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi tài khoản"
              className="w-10 h-10 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Welcome & Fast Summary: Cấu trúc flex justify-between items-center, lời chào bên trái */}
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-900 to-indigo-900 rounded-[32px] p-6 sm:p-8 text-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 backdrop-blur-sm border border-white/10 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Cổng Điều Phối Tuyển Dụng Bộ Phận
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {managerProfile.name}! 👋
            </h1>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">
              Bạn có <span className="font-bold text-white underline">{pendingCandidates} ứng viên Shortlist</span> đã qua 2 vòng phỏng vấn đang chờ quyết định chốt tuyển.
            </p>
          </div>

          {/* Decorative Background Circles */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
          <div className="absolute right-40 -top-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-xl pointer-events-none"></div>
        </div>

        {/* 4 Metric Cards (Bo tròn rounded-[32px]) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Tổng yêu cầu */}
          <div className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tổng yêu cầu tuyển
              </span>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalRequisitions}
              </span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Vị trí
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Bao gồm cả các yêu cầu đang mở tuyển và dự thảo
            </p>
          </div>

          {/* Card 2: Đang mở tuyển */}
          <div className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Vị trí đang tuyển
              </span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                {activeRequisitions}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Đang nhận CV
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              HR đang tích cực lọc hồ sơ và phỏng vấn vòng 1
            </p>
          </div>

          {/* Card 3: Ứng viên Shortlist chờ duyệt */}
          <div className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ứng viên Shortlist
              </span>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                {pendingCandidates}
              </span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Chờ quyết định
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Đã hoàn thành 2 vòng phỏng vấn chuyên môn
            </p>
          </div>

          {/* Card 4: Đã chốt tuyển */}
          <div className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Đã chốt tuyển dụng
              </span>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-purple-600 tracking-tight">
                {hiredCandidates}
              </span>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Thành công
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Đã chấp nhận Offer và chuẩn bị gia nhập bộ phận
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PHẦN 1: YÊU CẦU TUYỂN DỤNG CỦA TÔI */}
        {/* ========================================================================= */}
        <section className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Section Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Yêu Cầu Tuyển Dụng Của Tôi
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-10">
                Theo dõi các vị trí đang mở tuyển, tiến độ tiếp nhận hồ sơ thực tế so với mục tiêu.
              </p>
            </div>

            {/* Toolbar Buttons & Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  placeholder="Tìm theo tên vị trí..."
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-gray-200 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={reqStatusFilter}
                  onChange={(e) => setReqStatusFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="Active">Đang tuyển</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="Closed">Đã đóng</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Nút: Sao chép yêu cầu cũ */}
              <button
                type="button"
                onClick={() => handleOpenCloneModal()}
                className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#4285F4] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép yêu cầu cũ</span>
              </button>

              {/* Nút: Tạo yêu cầu tuyển dụng */}
              <button
                type="button"
                onClick={() => setIsCreateReqOpen(true)}
                className="bg-[#4285F4] hover:bg-blue-600 text-white px-5 py-2 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo yêu cầu tuyển dụng</span>
              </button>
            </div>
          </div>

          {/* Table Requisitions */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-[13px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Mã & Vị trí tuyển dụng</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6">Tiến độ hồ sơ / Mục tiêu</th>
                  <th className="py-4 px-6">Mức lương dự kiến</th>
                  <th className="py-4 px-6">Hạn chót</th>
                  <th className="py-4 px-6 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredRequisitions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        Không tìm thấy yêu cầu tuyển dụng nào phù hợp
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Hãy thử tìm kiếm với từ khóa khác hoặc tạo một yêu cầu tuyển dụng mới.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequisitions.map((req) => {
                    const percentage = Math.min(
                      Math.round((req.receivedCount / (req.targetCount * 3)) * 100),
                      100
                    );
                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-blue-50/20 transition-colors group"
                      >
                        {/* 1. Vị trí & Cấp bậc */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                              {req.level.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-[#4285F4] transition-colors">
                                {req.title}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-slate-500">{req.id}</span>
                                <span>•</span>
                                <span>Cấp bậc: <strong>{req.level}</strong></span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Trạng thái (Dạng Badge) */}
                        <td className="py-4 px-6">
                          {req.status === "Active" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#4285F4] border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] animate-pulse"></span>
                              Đang tuyển
                            </span>
                          )}
                          {req.status === "Pending" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Chờ duyệt
                            </span>
                          )}
                          {req.status === "Closed" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Đã đóng
                            </span>
                          )}
                          {req.status === "Draft" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              Dự thảo
                            </span>
                          )}
                        </td>

                        {/* 3. Tiến độ (Số lượng hồ sơ / Mục tiêu) */}
                        <td className="py-4 px-6 min-w-[200px]">
                          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <span className="text-slate-800">
                              <span className="text-[#4285F4] text-sm">
                                {req.receivedCount}
                              </span>{" "}
                              / {req.targetCount} mục tiêu
                            </span>
                            <span className="text-slate-500 text-[11px] font-normal">
                              ({Math.round((req.receivedCount / req.targetCount) * 100)}%)
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                req.status === "Active"
                                  ? "bg-gradient-to-r from-blue-500 to-[#4285F4]"
                                  : "bg-slate-300"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Chỉ tiêu tuyển: <strong>{req.targetCount} nhân sự</strong>
                          </span>
                        </td>

                        {/* 4. Mức lương */}
                        <td className="py-4 px-6 text-xs text-slate-700 font-medium">
                          <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-gray-100">
                            {req.salaryRange}
                          </span>
                        </td>

                        {/* 5. Hạn nộp */}
                        <td className="py-4 px-6 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.deadline}</span>
                          </div>
                        </td>

                        {/* 6. Cột hành động */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Nút Sao chép yêu cầu này */}
                            <button
                              type="button"
                              onClick={() => handleOpenCloneModal(req.id)}
                              title="Sao chép yêu cầu tuyển dụng này"
                              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-[#4285F4] text-slate-600 flex items-center justify-center transition-colors border border-gray-100 cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Nút Xem chi tiết */}
                            <button
                              type="button"
                              onClick={() => {
                                setCandidatePosFilter(req.id);
                                showToast(`Đang lọc danh sách ứng viên của: ${req.title}`);
                              }}
                              title="Lọc ứng viên cho vị trí này"
                              className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 flex items-center justify-center transition-colors border border-gray-100 cursor-pointer"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PHẦN 2: ĐÁNH GIÁ ỨNG VIÊN (SHORTLIST) */}
        {/* ========================================================================= */}
        <section className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Section Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Đánh Giá Ứng Viên (Shortlist)
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-10">
                Bảng so sánh chi tiết các ứng viên đã hoàn thành vòng phỏng vấn chuyên môn. Trưởng bộ phận trực tiếp đưa ra quyết định.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search candidate */}
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Tìm tên hoặc email..."
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-gray-200 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              {/* Filter by Position */}
              <div className="relative">
                <select
                  value={candidatePosFilter}
                  onChange={(e) => setCandidatePosFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 cursor-pointer max-w-[200px] truncate"
                >
                  <option value="ALL">Tất cả vị trí</option>
                  {requisitions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filter by Decision */}
              <div className="relative">
                <select
                  value={candidateDecisionFilter}
                  onChange={(e) => setCandidateDecisionFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 cursor-pointer"
                >
                  <option value="ALL">Tất cả quyết định</option>
                  <option value="Pending">Chờ quyết định</option>
                  <option value="Hired">Đã chọn tuyển</option>
                  <option value="Rejected">Đã loại</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Shortlist Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-100 text-[13px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Tên ứng viên</th>
                  <th className="py-4 px-6">Vị trí ứng tuyển</th>
                  <th className="py-4 px-6">Kết quả Vòng 1 (Tech)</th>
                  <th className="py-4 px-6">Kết quả Vòng 2 (Fit)</th>
                  <th className="py-4 px-6">Đánh giá tổng hợp</th>
                  <th className="py-4 px-6 text-center min-w-[200px]">Hành động & Quyết định</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        Không có ứng viên Shortlist nào
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Thay đổi bộ lọc hoặc đợi HR phỏng vấn xong các ứng viên mới.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      {/* 1. Tên ứng viên */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${candidate.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm`}
                          >
                            {candidate.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(-2)
                              .join("")}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#4285F4] transition-colors">
                              {candidate.name}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-slate-500">{candidate.id}</span>
                              <span>•</span>
                              <span>{candidate.experienceYears} năm KN</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {candidate.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Vị trí ứng tuyển */}
                      <td className="py-4 px-6">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {candidate.positionTitle}
                        </span>
                      </td>

                      {/* 3. Kết quả vòng 1 */}
                      <td className="py-4 px-6 max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ⭐ {candidate.round1.score}/10
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {candidate.round1.interviewer}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 italic">
                          "{candidate.round1.comment}"
                        </p>
                      </td>

                      {/* 4. Kết quả vòng 2 */}
                      <td className="py-4 px-6 max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#4285F4] border border-blue-200">
                            ⭐ {candidate.round2.score}/10
                          </span>
                          <span className="text-xs text-slate-500 truncate">
                            {candidate.round2.interviewer}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 italic">
                          "{candidate.round2.comment}"
                        </p>
                      </td>

                      {/* 5. Đánh giá tổng hợp */}
                      <td className="py-4 px-6 max-w-[240px]">
                        <p className="text-xs text-slate-800 font-medium line-clamp-2">
                          {candidate.overallAssessment}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                          <span>Mức lương:</span>
                          <strong className="text-slate-700 font-bold">{candidate.proposedSalary}</strong>
                        </div>
                      </td>

                      {/* 6. Cụm nút hành động: "Quyết định Tuyển" (Màu xanh lá) và "Loại" (Màu đỏ) */}
                      <td className="py-4 px-6 text-center">
                        {candidate.decision === "Pending" ? (
                          <div className="flex items-center justify-center gap-2">
                            {/* Nút Quyết định Tuyển (Màu xanh lá) */}
                            <button
                              type="button"
                              onClick={() => handleOpenHireModal(candidate)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-full inline-flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02]"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>Quyết định Tuyển</span>
                            </button>

                            {/* Nút Loại (Màu đỏ) */}
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(candidate)}
                              className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200 px-3.5 py-2 rounded-full font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>Loại</span>
                            </button>
                          </div>
                        ) : candidate.decision === "Hired" ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã chọn tuyển
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Ngày: {candidate.decidedAt}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" />
                              Đã loại
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Ngày: {candidate.decidedAt}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO YÊU CẦU TUYỂN DỤNG (SPRINT 2 - MODAL LỚN 75-80%) */}
      {/* ========================================================================= */}
      {isCreateReqOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateReqOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl sm:rounded-[28px] border border-gray-100 shadow-2xl w-full max-w-4xl lg:w-[75vw] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="p-6 sm:p-7 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold shadow-sm border border-blue-100/60">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      Tạo Yêu Cầu Tuyển Dụng Mới
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#4285F4] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      Sprint 2
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thiết lập thông tin vị trí, tiến độ nhân sự, ngân sách đề xuất và bản mô tả công việc (JD)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateReqOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form
              id="create-requisition-form"
              onSubmit={handleCreateRequisition}
              className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-slate-800"
            >
              {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#4285F4] text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Thông tin cơ bản vị trí
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Chức danh/Vị trí tuyển dụng */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Chức danh / Vị trí tuyển dụng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Senior Frontend Developer (React/Next.js), Data Engineer..."
                      value={reqFormData.title}
                      onChange={(e) => {
                        setReqFormData({ ...reqFormData, title: e.target.value });
                        if (reqFormErrors.title) {
                          setReqFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.title;
                            return next;
                          });
                        }
                      }}
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        reqFormErrors.title ? "border-rose-400 ring-2 ring-rose-200" : "border-gray-200"
                      } rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all`}
                    />
                    {reqFormErrors.title && (
                      <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {reqFormErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Số lượng cần tuyển */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Số lượng cần tuyển <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={reqFormData.targetCount}
                      onChange={(e) =>
                        setReqFormData({
                          ...reqFormData,
                          targetCount: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Phòng ban */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phòng ban <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={reqFormData.department}
                      onChange={(e) =>
                        setReqFormData({ ...reqFormData, department: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all cursor-pointer"
                    >
                      <option value="Phòng Phát Triển Công Nghệ & Phần Mềm">Phòng Phát Triển Công Nghệ & Phần Mềm</option>
                      <option value="Phòng Sản Phẩm & Trải Nghiệm (Product & UI/UX)">Phòng Sản Phẩm & Trải Nghiệm (Product & UI/UX)</option>
                      <option value="Phòng Hạ Tầng Kỹ Thuật & Cloud DevOps">Phòng Hạ Tầng Kỹ Thuật & Cloud DevOps</option>
                      <option value="Phòng Kiểm Thử Chất Lượng (QA/QC)">Phòng Kiểm Thử Chất Lượng (QA/QC)</option>
                      <option value="Phòng Marketing & Truyền Thông">Phòng Marketing & Truyền Thông</option>
                      <option value="Phòng Nhân Sự & Đào Tạo (HR)">Phòng Nhân Sự & Đào Tạo (HR)</option>
                    </select>
                  </div>

                  {/* Cấp bậc */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Cấp bậc (Level) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={reqFormData.level}
                      onChange={(e) =>
                        setReqFormData({
                          ...reqFormData,
                          level: e.target.value as JobRequisition["level"],
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all cursor-pointer"
                    >
                      <option value="Junior">Junior (1-2 năm kinh nghiệm)</option>
                      <option value="Middle">Middle (2-4 năm kinh nghiệm)</option>
                      <option value="Senior">Senior (4+ năm kinh nghiệm)</option>
                      <option value="Lead">Team Lead / Tech Lead</option>
                      <option value="Manager">Quản lý / Manager</option>
                    </select>
                  </div>

                  {/* Hình thức làm việc */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Hình thức làm việc
                    </label>
                    <select
                      value={reqFormData.workType}
                      onChange={(e) =>
                        setReqFormData({ ...reqFormData, workType: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all cursor-pointer"
                    >
                      <option value="Toàn thời gian (Full-time)">Toàn thời gian (Full-time)</option>
                      <option value="Linh hoạt (Hybrid)">Linh hoạt (Hybrid)</option>
                      <option value="Làm việc từ xa (Remote)">Làm việc từ xa (Remote)</option>
                      <option value="Bán thời gian (Part-time)">Bán thời gian (Part-time)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: THỜI HẠN & NGÀY CẦN NHÂN SỰ (DATE PICKER VỚI VALIDATE QUÁ KHỨ) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#4285F4] text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Kế hoạch & Thời gian cần nhân sự
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ô Date Picker: Ngày cần nhân sự */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Ngày cần nhân sự (Onboard Target Date) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={reqFormData.targetDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all ${
                          reqFormErrors.targetDate
                            ? "bg-rose-50/60 border-2 border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-200"
                            : "bg-slate-50 border border-gray-200 text-slate-900 focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                        }`}
                      />
                    </div>

                    {/* Dòng ghi chú nhỏ màu đỏ hoặc thông báo lỗi nếu chọn ngày trong quá khứ */}
                    {reqFormErrors.targetDate ? (
                      <div className="flex items-start gap-1.5 text-xs text-rose-600 font-semibold mt-1.5 p-2 bg-rose-50 rounded-lg border border-rose-200 animate-in fade-in duration-150">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <span>{reqFormErrors.targetDate}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Thời hạn kỳ vọng nhân sự mới hoàn tất thủ tục và bắt đầu nhận việc.</span>
                      </p>
                    )}
                  </div>

                  {/* Thông tin hỗ trợ tuyển dụng */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex flex-col justify-center text-xs space-y-1.5 text-slate-600">
                    <span className="font-bold text-slate-800">Quy chuẩn thời gian tuyển dụng (SLA):</span>
                    <p>• Vị trí Junior / Middle: Khuyến nghị tối thiểu 2 - 3 tuần chuẩn bị.</p>
                    <p>• Vị trí Senior / Lead: Khuyến nghị tối thiểu 4 - 6 tuần để đảm bảo tìm đúng nhân sự then chốt.</p>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: NGÂN SÁCH & DẢI LƯƠNG ĐỀ XUẤT + GIẢI TRÌNH (> 30M VNĐ) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#4285F4] text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Ngân sách & Mức lương đề xuất
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Trần chuẩn: 30.000.000 VNĐ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* Ô nhập Mức lương đề xuất */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mức lương đề xuất (VNĐ/tháng) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1000000"
                        min="5000000"
                        max="200000000"
                        required
                        value={reqFormData.proposedSalary}
                        onChange={(e) => handleSalaryChange(parseInt(e.target.value) || 0)}
                        placeholder="Ví dụ: 25000000 hoặc 35000000"
                        className={`w-full pl-4 pr-16 py-2.5 bg-slate-50 border ${
                          reqFormData.proposedSalary > SALARY_STANDARD_CEILING
                            ? "border-amber-300 ring-2 ring-amber-100 bg-amber-50/20"
                            : "border-gray-200"
                        } rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all`}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        VNĐ
                      </span>
                    </div>

                    {/* Hiển thị định dạng tiền tệ trực quan */}
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Quy đổi:{" "}
                        <strong className="text-slate-800 font-bold">
                          {new Intl.NumberFormat("vi-VN").format(reqFormData.proposedSalary)} VNĐ
                        </strong>
                      </span>
                      {reqFormData.proposedSalary > SALARY_STANDARD_CEILING ? (
                        <span className="font-bold text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Vượt khung chuẩn (+{(reqFormData.proposedSalary - SALARY_STANDARD_CEILING).toLocaleString("vi-VN")} đ)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Trong khung chuẩn
                        </span>
                      )}
                    </div>

                    {/* Quick presets */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] text-slate-400 mr-1">Mức nhanh:</span>
                      {[
                        { label: "18 triệu", val: 18000000 },
                        { label: "25 triệu", val: 25000000 },
                        { label: "30 triệu (Trần)", val: 30000000 },
                        { label: "35 triệu", val: 35000000 },
                        { label: "45 triệu", val: 45000000 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleSalaryChange(item.val)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                            reqFormData.proposedSalary === item.val
                              ? "bg-[#4285F4] text-white border-[#4285F4] shadow-sm"
                              : "bg-white text-slate-600 border-gray-200 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thẻ ghi chú chính sách ngân sách */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs space-y-1.5 text-slate-600">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <Info className="w-4 h-4 text-[#4285F4]" />
                      Chính sách phê duyệt ngân sách lương:
                    </span>
                    <p>• <strong>Dưới 30.000.000 VNĐ:</strong> Trưởng bộ phận có thẩm quyền đề xuất và HR duyệt tiêu chuẩn.</p>
                    <p>• <strong>Trên 30.000.000 VNĐ:</strong> Bắt buộc có bản giải trình chi tiết gửi Ban Giám Đốc phê duyệt.</p>
                  </div>
                </div>

                {/* TÍNH NĂNG GIẢI TRÌNH TỰ ĐỘNG KHI MỨC LƯƠNG > 30,000,000 VNĐ */}
                {reqFormData.proposedSalary > SALARY_STANDARD_CEILING && (
                  <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-3 duration-200">
                    {/* Banner cảnh báo màu vàng/cam */}
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <span className="font-bold text-amber-800 uppercase tracking-wide block mb-0.5">
                          Yêu cầu giải trình bắt buộc (Vượt khung chuẩn)
                        </span>
                        Mức lương đề xuất <strong className="font-bold text-amber-950">{new Intl.NumberFormat("vi-VN").format(reqFormData.proposedSalary)} VNĐ</strong> vượt quá khung tiêu chuẩn (30.000.000 VNĐ). Trưởng bộ phận bắt buộc phải giải trình lý do cụ thể vào ô bên dưới trước khi gửi yêu cầu.
                      </div>
                    </div>

                    {/* Textarea Giải trình bắt buộc */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-rose-700">
                          Giải trình lý do đề xuất mức lương vượt khung chuẩn <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Bắt buộc điền
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Nêu rõ lý do: Vị trí cấp bách ảnh hưởng trực tiếp đến deadline dự án, yêu cầu kỹ năng chuyên sâu hiếm có trên thị trường (AI/Cloud/SecOps), mức lương mặt bằng ngành đối thủ, bằng cấp hoặc chứng chỉ quốc tế..."
                        value={reqFormData.salaryJustification}
                        onChange={(e) => {
                          setReqFormData({ ...reqFormData, salaryJustification: e.target.value });
                          if (reqFormErrors.salaryJustification) {
                            setReqFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.salaryJustification;
                              return next;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-white border ${
                          reqFormErrors.salaryJustification
                            ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/20"
                            : "border-amber-300 ring-1 ring-amber-200"
                        } rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none shadow-sm transition-all`}
                      />
                      {reqFormErrors.salaryJustification && (
                        <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {reqFormErrors.salaryJustification}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 4: SOẠN THẢO MÔ TẢ CÔNG VIỆC (GIẢ LẬP TRÌNH SOẠN THẢO RICH TEXT EDITOR) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#4285F4] text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Soạn thảo Mô tả công việc (Job Description)
                    </h4>
                    <span className="text-rose-500 font-bold">*</span>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Trình soạn thảo văn bản trực quan
                  </span>
                </div>

                {/* Simulated Rich Text Editor Wrapper */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:border-[#4285F4] focus-within:ring-2 focus-within:ring-[#4285F4]/20 transition-all">
                  {/* Toolbar */}
                  <div className="bg-slate-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between gap-1.5 text-slate-700">
                    {/* Left: Format actions */}
                    <div className="flex items-center gap-1">
                      {/* Bold (B) */}
                      <button
                        type="button"
                        onClick={() => applyFormatting("bold")}
                        title="In đậm (Bold)"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                          editorActiveFormats.bold
                            ? "bg-[#4285F4] text-white shadow-sm"
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <Bold className="w-4 h-4" />
                      </button>

                      {/* Italic (I) */}
                      <button
                        type="button"
                        onClick={() => applyFormatting("italic")}
                        title="In nghiêng (Italic)"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm italic transition-all cursor-pointer ${
                          editorActiveFormats.italic
                            ? "bg-[#4285F4] text-white shadow-sm"
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <Italic className="w-4 h-4" />
                      </button>

                      {/* Underline (U) */}
                      <button
                        type="button"
                        onClick={() => applyFormatting("underline")}
                        title="Gạch chân (Underline)"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm underline transition-all cursor-pointer ${
                          editorActiveFormats.underline
                            ? "bg-[#4285F4] text-white shadow-sm"
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <Underline className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1.5" />

                      {/* Align Left */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditorActiveFormats((prev) => ({ ...prev, align: "left" }))
                        }
                        title="Căn lề trái"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          editorActiveFormats.align === "left"
                            ? "bg-slate-200 text-slate-900 font-bold"
                            : "hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>

                      {/* Align Center */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditorActiveFormats((prev) => ({ ...prev, align: "center" }))
                        }
                        title="Căn lề giữa"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          editorActiveFormats.align === "center"
                            ? "bg-slate-200 text-slate-900 font-bold"
                            : "hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>

                      {/* Align Right */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditorActiveFormats((prev) => ({ ...prev, align: "right" }))
                        }
                        title="Căn lề phải"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          editorActiveFormats.align === "right"
                            ? "bg-slate-200 text-slate-900 font-bold"
                            : "hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1.5" />

                      {/* Bullet list */}
                      <button
                        type="button"
                        onClick={() => applyListFormatting("bullet")}
                        title="Danh sách dấu đầu dòng (Bullet List)"
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                      >
                        <List className="w-4 h-4" />
                      </button>

                      {/* Numbered list */}
                      <button
                        type="button"
                        onClick={() => applyListFormatting("ordered")}
                        title="Danh sách đánh số (Numbered List)"
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right: Quick JD Template Button */}
                    <div>
                      <button
                        type="button"
                        onClick={insertJDTemplate}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#4285F4] hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer shadow-sm"
                        title="Điền tự động mẫu JD chuẩn chuyên nghiệp"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#4285F4]" />
                        <span>Chèn mẫu JD gợi ý</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Textarea Area */}
                  <textarea
                    ref={jdTextareaRef}
                    required
                    rows={8}
                    placeholder="Nhập nội dung mô tả chi tiết vị trí tuyển dụng:
- Mục tiêu vai trò & khối lượng trách nhiệm chính
- Các yêu cầu kỹ năng chuyên môn, kinh nghiệm thực chiến
- Quyền lợi, chế độ đãi ngộ & lộ trình thăng tiến..."
                    value={reqFormData.description}
                    onChange={(e) => {
                      setReqFormData({ ...reqFormData, description: e.target.value });
                      if (reqFormErrors.description) {
                        setReqFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.description;
                          return next;
                        });
                      }
                    }}
                    className={`w-full p-4 sm:p-5 text-sm text-slate-800 focus:outline-none resize-y min-h-[200px] leading-relaxed ${
                      editorActiveFormats.align === "center"
                        ? "text-center"
                        : editorActiveFormats.align === "right"
                        ? "text-right"
                        : "text-left"
                    } ${editorActiveFormats.bold ? "font-semibold" : "font-normal"} ${
                      editorActiveFormats.italic ? "italic" : ""
                    } ${editorActiveFormats.underline ? "underline" : ""}`}
                  />

                  {/* Editor Bottom Info Bar */}
                  <div className="bg-slate-50/80 px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>
                        {reqFormData.description.trim().split(/\s+/).filter(Boolean).length} từ
                      </span>
                      <span>•</span>
                      <span>{reqFormData.description.length} ký tự</span>
                    </div>
                    <span className="hidden sm:inline">
                      Có thể sử dụng Markdown: **in đậm**, *in nghiêng*, • danh sách
                    </span>
                  </div>
                </div>

                {reqFormErrors.description && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {reqFormErrors.description}
                  </p>
                )}
              </div>
            </form>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                Các trường có dấu (<span className="text-rose-500 font-bold">*</span>) là bắt buộc theo quy định Sprint 2.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* Nút "Hủy bỏ" (Nền trắng, viền xám) */}
                <button
                  type="button"
                  onClick={() => setIsCreateReqOpen(false)}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full border border-gray-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all cursor-pointer shadow-sm"
                >
                  Hủy bỏ
                </button>

                {/* Nút "Gửi yêu cầu duyệt" (Nền xanh #4285F4, chữ trắng, rounded-full) */}
                <button
                  type="submit"
                  form="create-requisition-form"
                  className="flex-1 sm:flex-initial bg-[#4285F4] hover:bg-blue-600 text-white px-7 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md shadow-blue-500/25 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi yêu cầu duyệt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SAO CHÉP YÊU CẦU CŨ (CLONE REQUISITION) */}
      {/* ========================================================================= */}
      {isCloneReqOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCloneReqOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Sao Chép Yêu Cầu Cũ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tái sử dụng mẫu yêu cầu tuyển dụng đã có để tiết kiệm thời gian
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloneReqOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Chọn một yêu cầu tuyển dụng trong danh sách mẫu bên dưới. Hệ thống sẽ tạo một bản sao mới kèm toàn bộ mô tả và yêu cầu:
              </p>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {requisitions.map((req) => (
                  <label
                    key={req.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedReqForClone === req.id
                        ? "border-[#4285F4] bg-blue-50/50 shadow-sm"
                        : "border-gray-100 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="clone_req"
                      checked={selectedReqForClone === req.id}
                      onChange={() => setSelectedReqForClone(req.id)}
                      className="mt-1 text-[#4285F4] focus:ring-[#4285F4]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {req.title}
                        </h4>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {req.level}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>Lương: {req.salaryRange}</span>
                        <span>•</span>
                        <span>Mục tiêu: {req.targetCount} người</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCloneReqOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClone}
                  className="bg-[#4285F4] hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Xác nhận sao chép</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XÁC NHẬN "QUYẾT ĐỊNH TUYỂN" (HIRE CONFIRMATION) */}
      {/* ========================================================================= */}
      {isHireModalOpen && activeCandidate && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHireModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Xác Nhận Quyết Định Tuyển Dụng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phê duyệt ứng viên và gửi thông tin sang HR ban hành thư mời nhận việc (Offer)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHireModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmHire} className="p-6 space-y-4">
              {/* Candidate Info Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-full ${activeCandidate.avatarColor} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}
                >
                  {activeCandidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {activeCandidate.name}
                    </h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700">
                      Điểm: {((activeCandidate.round1.score + activeCandidate.round2.score) / 2).toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">
                    {activeCandidate.positionTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeCandidate.email} • {activeCandidate.phone}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mức lương đề xuất (Gross/tháng) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 32.000.000 VNĐ"
                  value={hireSalary}
                  onChange={(e) => setHireSalary(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ghi chú đề xuất & Điều kiện tuyển dụng
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhận xét tóm tắt năng lực, dự kiến ngày onboard, thời gian thử việc..."
                  value={hireNote}
                  onChange={(e) => setHireNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsHireModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận Tuyển</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: XÁC NHẬN "LOẠI ỨNG VIÊN" (REJECT CONFIRMATION) */}
      {/* ========================================================================= */}
      {isRejectModalOpen && activeCandidate && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRejectModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Xác Nhận Không Chọn Ứng Viên
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ghi nhận kết quả từ chối và chuyển lưu hồ sơ nhân tài tiềm năng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              {/* Candidate Info */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-full ${activeCandidate.avatarColor} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}
                >
                  {activeCandidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {activeCandidate.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">
                    {activeCandidate.positionTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeCandidate.email}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Lý do từ chối / Đóng góp cho HR <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập lý do chưa phù hợp (kỹ năng, kỳ vọng lương, định hướng công việc...)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-md shadow-rose-600/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Xác nhận Loại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: HỒ SƠ CÁ NHÂN (PERSONAL PROFILE) */}
      {/* ========================================================================= */}
      {isProfileModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsProfileModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Hồ Sơ Trưởng Bộ Phận
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thông tin định danh quản lý bộ phận tuyển dụng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar & Main Info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-gray-100">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative group cursor-pointer shrink-0"
                  title="Nhấp để thay đổi ảnh đại diện"
                >
                  {managerProfile.avatarUrl ? (
                    <img
                      src={managerProfile.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                      LT
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {managerProfile.name}
                    </h4>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Trực tuyến"></span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{managerProfile.email}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                    {managerProfile.role}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50/60 rounded-xl border border-gray-100">
                  <span className="text-slate-400 block font-medium">Số điện thoại:</span>
                  <span className="text-slate-800 font-semibold text-sm mt-0.5 block">{managerProfile.phone}</span>
                </div>
                <div className="p-3 bg-slate-50/60 rounded-xl border border-gray-100">
                  <span className="text-slate-400 block font-medium">Phòng ban quản lý:</span>
                  <span className="text-slate-800 font-semibold text-sm mt-0.5 block">{managerProfile.department}</span>
                </div>
              </div>

              {/* Bio */}
              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-gray-100 text-xs">
                <span className="text-slate-400 block font-medium mb-1">Mô tả chức trách:</span>
                <p className="text-slate-600 leading-relaxed">{managerProfile.bio}</p>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#4285F4] hover:underline cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Upload ảnh mới
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setEditProfileForm({
                        name: managerProfile.name,
                        phone: managerProfile.phone,
                        department: managerProfile.department,
                        bio: managerProfile.bio,
                      });
                      setIsEditProfileModalOpen(true);
                    }}
                    className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CHỈNH SỬA HỒ SƠ (EDIT PROFILE) */}
      {/* ========================================================================= */}
      {isEditProfileModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditProfileModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Chỉnh Sửa Hồ Sơ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật thông tin cá nhân Trưởng bộ phận
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editProfileForm.name}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email công việc (Cố định)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={managerProfile.email}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editProfileForm.phone}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phòng ban / Bộ phận
                </label>
                <input
                  type="text"
                  value={editProfileForm.department}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, department: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mô tả trách nhiệm & Chuyên môn
                </label>
                <textarea
                  rows={3}
                  value={editProfileForm.bio}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, bio: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
