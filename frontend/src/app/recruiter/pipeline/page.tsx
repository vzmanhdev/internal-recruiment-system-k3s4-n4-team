'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Search,
  Filter,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  Star,
  ExternalLink,
  Tag,
  MessageSquare,
  FileText,
  Upload,
  Linkedin,
  Phone,
  Mail,
  Send,
  MoreVertical,
  Check,
  AlertCircle,
  ArrowRight,
  Award,
  Layers,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Eye,
  Download,
} from 'lucide-react';
import clsx from 'clsx';

// ==========================================
// 1. DATA TYPES & ENUMS
// ==========================================

export type ColumnId = 'new' | 'screening' | 'interview' | 'offer' | 'hired';

export interface QuickNote {
  id: string;
  author: string;
  createdAt: string;
  content: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedInUrl: string;
  position: string;
  university: string;
  experience: string;
  matchScore: number; // 0 - 100
  appliedDate: string;
  source: string;
  avatar: string;
  columnId: ColumnId;
  daysInStage: number; // Số ngày nằm ở cột này (Nghiệp vụ SLA: > 3 ngày => Quá hạn)
  tags: string[];
  evaluation?: 'pass' | 'review' | 'fail' | null;
  cvSummary: {
    education: string;
    recentCompany: string;
    skills: string[];
    summary: string;
  };
  notes: QuickNote[];
  cvFileName?: string;
}

// 5 CỘT CỐ ĐỊNH THEO ĐÚNG YÊU CẦU:
// 1. CV Mới
// 2. Sàng lọc
// 3. Phỏng vấn
// 4. Offer
// 5. Đã nhận việc
export const KANBAN_COLUMNS: {
  id: ColumnId;
  title: string;
  accentColor: string;
  badgeColor: string;
  dotColor: string;
  headerBg: string;
}[] = [
  {
    id: 'new',
    title: 'CV Mới',
    accentColor: 'border-t-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500',
    headerBg: 'bg-blue-50/50',
  },
  {
    id: 'screening',
    title: 'Sàng lọc',
    accentColor: 'border-t-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-500',
    headerBg: 'bg-purple-50/50',
  },
  {
    id: 'interview',
    title: 'Phỏng vấn',
    accentColor: 'border-t-amber-500',
    badgeColor: 'bg-amber-100 text-amber-800',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50/50',
  },
  {
    id: 'offer',
    title: 'Offer',
    accentColor: 'border-t-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50/50',
  },
  {
    id: 'hired',
    title: 'Đã nhận việc',
    accentColor: 'border-t-teal-500',
    badgeColor: 'bg-teal-100 text-teal-800',
    dotColor: 'bg-teal-500',
    headerBg: 'bg-teal-50/50',
  },
];

// Danh sách nhãn gợi ý có sẵn
const PRESET_TAGS = [
  { name: 'Giao tiếp tốt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Tiếng Anh lưu loát', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Deal lương cao', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Phù hợp văn hóa', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Senior Golang', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'Ưu tiên cao', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

// ==========================================
// 2. MOCK DATA INITIAL CANDIDATES
// ==========================================

const INITIAL_CANDIDATES: Candidate[] = [
  // CỘT 1: CV MỚI
  {
    id: 'CAN-101',
    name: 'Vũ Đức Thịnh',
    email: 'thinh.vuduc@gmail.com',
    phone: '0988123456',
    linkedInUrl: 'https://linkedin.com/in/thinh-vuduc-backend',
    position: 'Senior Backend Engineer (Go/Python)',
    university: 'ĐH Bách Khoa Hà Nội',
    experience: '4 năm kinh nghiệm',
    matchScore: 88, // Xanh
    appliedDate: 'Hôm nay, 10:15',
    source: 'LinkedIn Sourcing',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
    columnId: 'new',
    daysInStage: 1, // Bình thường
    tags: ['Senior Golang', 'Tiếng Anh lưu loát'],
    evaluation: null,
    cvSummary: {
      education: 'Cử nhân CNTT - Đại học Bách Khoa Hà Nội (GPA 3.6/4.0)',
      recentCompany: 'Fintech Unicorn Vietnam - Senior Backend Engineer (2 năm)',
      skills: ['Golang', 'Python', 'PostgreSQL', 'Kafka', 'Kubernetes', 'Redis'],
      summary:
        'Kỹ sư Backend giàu kinh nghiệm thiết kế kiến trúc phân tán microservices xử lý 50k req/s. Khả năng giao tiếp song ngữ tốt, tư duy hệ thống bài bản.',
    },
    notes: [
      {
        id: 'n-1',
        author: 'Trần Thị Recruiter',
        createdAt: 'Hôm nay 10:30',
        content: 'Profile LinkedIn rất ấn tượng, từng giải nhì Olympic Tin học sinh viên.',
      },
    ],
    cvFileName: 'CV_VuDucThinh_Backend_Senior.pdf',
  },
  {
    id: 'CAN-102',
    name: 'Nguyễn Tuấn Kiệt',
    email: 'kiet.nguyen@outlook.com',
    phone: '0912345678',
    linkedInUrl: 'https://linkedin.com/in/kiet-nguyen-dev',
    position: 'Senior Backend Engineer (Go/Python)',
    university: 'ĐH Công Nghệ - ĐHQGHN',
    experience: '2 năm kinh nghiệm',
    matchScore: 40, // Đỏ (User story yêu cầu 40% - Đỏ)
    appliedDate: '07/10/2026',
    source: 'TopCV',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=120&auto=format&fit=crop',
    columnId: 'new',
    daysInStage: 4, // > 3 ngày => QUÁ HẠN SLA! Viền đỏ & Icon nhấp nháy!
    tags: ['Chưa đủ kinh nghiệm'],
    evaluation: 'review',
    cvSummary: {
      education: 'Cử nhân Khoa học Máy tính - ĐH Công Nghệ ĐHQG',
      recentCompany: 'Software Outsourcing - Junior Developer',
      skills: ['PHP', 'Laravel', 'MySQL', 'C bản'],
      summary:
        'Ứng viên có kỹ năng nền tảng cơ bản nhưng thiếu kinh nghiệm Golang/Microservices theo tiêu chí tuyển dụng Senior. Cần phỏng vấn sàng lọc thêm.',
    },
    notes: [
      {
        id: 'n-2',
        author: 'Trần Thị Recruiter',
        createdAt: '08/10/2026',
        content: 'Chưa đạt tiêu chí 4 năm kinh nghiệm. Đang chờ Hiring Manager duyệt ngoại lệ.',
      },
    ],
    cvFileName: 'CV_NguyenTuanKiet_2026.pdf',
  },
  {
    id: 'CAN-103',
    name: 'Phạm Thu Trang',
    email: 'thutrang.uiux@gmail.com',
    phone: '0977889900',
    linkedInUrl: 'https://linkedin.com/in/thutrang-design',
    position: 'UI/UX Designer',
    university: 'ĐH Mỹ Thuật Công Nghiệp',
    experience: '3 năm kinh nghiệm',
    matchScore: 72, // Vàng
    appliedDate: 'Hôm qua, 14:00',
    source: 'Referral Nội Bộ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
    columnId: 'new',
    daysInStage: 1,
    tags: ['Giao tiếp tốt', 'Phù hợp văn hóa'],
    evaluation: null,
    cvSummary: {
      education: 'Thiết kế Đồ họa & Tương tác - ĐH Mỹ Thuật CN',
      recentCompany: 'Product Studio - UI/UX Designer',
      skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping'],
      summary:
        'Portfolio thiết kế chỉn chu, có kinh nghiệm xây dựng Design System từ đầu. Giao tiếp tự tin và ham học hỏi.',
    },
    notes: [],
    cvFileName: 'Portfolio_ThuTrang_UIUX.pdf',
  },

  // CỘT 2: SÀNG LỌC
  {
    id: 'CAN-091',
    name: 'Lê Thảo My',
    email: 'thaomy.fe@gmail.com',
    phone: '0933221100',
    linkedInUrl: 'https://linkedin.com/in/thaomy-frontend',
    position: 'Frontend React Lead',
    university: 'ĐH FPT Hà Nội',
    experience: '5 năm kinh nghiệm',
    matchScore: 92, // Xanh
    appliedDate: '06/10/2026',
    source: 'LinkedIn Sourcing',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
    columnId: 'screening',
    daysInStage: 5, // > 3 ngày => QUÁ HẠN SLA! Viền đỏ & Icon nhấp nháy!
    tags: ['Giao tiếp tốt', 'Tiếng Anh lưu loát', 'Ưu tiên cao'],
    evaluation: 'pass',
    cvSummary: {
      education: 'Kỹ sư phần mềm - Đại học FPT (Tốt nghiệp loại Giỏi)',
      recentCompany: 'SaaS Platform SEA - Frontend Lead (3 năm)',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux', 'CI/CD'],
      summary:
        'Có kinh nghiệm lead team 6 Frontend Engineers. Tối ưu Core Web Vitals đạt 95+ điểm. Thuyết trình tiếng Anh lưu loát.',
    },
    notes: [
      {
        id: 'n-3',
        author: 'Trần Thị Recruiter',
        createdAt: '07/10/2026',
        content: 'Đã phỏng vấn sơ bộ qua điện thoại 20 phút. Thái độ rất nhiệt huyết, sẵn sàng nhận việc trong 1 tháng.',
      },
    ],
    cvFileName: 'CV_LeThaoMy_FrontendLead.pdf',
  },
  {
    id: 'CAN-092',
    name: 'Trần Minh Quân',
    email: 'quan.tran@techcorp.vn',
    phone: '0944556677',
    linkedInUrl: 'https://linkedin.com/in/minhquan-fullstack',
    position: 'Frontend React Lead',
    university: 'ĐH Khoa Học Tự Nhiên',
    experience: '4 năm kinh nghiệm',
    matchScore: 85, // Xanh
    appliedDate: '08/10/2026',
    source: 'Referral Nội Bộ',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
    columnId: 'screening',
    daysInStage: 2,
    tags: ['Phù hợp văn hóa'],
    evaluation: 'pass',
    cvSummary: {
      education: 'Cử nhân CNTT - ĐH KHTN Hà Nội',
      recentCompany: 'Enterprise ATS Corp - Senior Frontend',
      skills: ['React', 'TypeScript', 'State Machine', 'Jest', 'Webpack'],
      summary: 'Kỹ sư chuyên sâu về React và Testing. Code sạch, tuân thủ nguyên lý SOLID.',
    },
    notes: [],
    cvFileName: 'CV_TranMinhQuan.pdf',
  },

  // CỘT 3: PHỎNG VẤN
  {
    id: 'CAN-085',
    name: 'Nguyễn Văn An',
    email: 'an.nguyenvan@gmail.com',
    phone: '0909123888',
    linkedInUrl: 'https://linkedin.com/in/an-nguyen-golang',
    position: 'Senior Backend Engineer (Go/Python)',
    university: 'ĐH Bách Khoa TP.HCM',
    experience: '5 năm kinh nghiệm',
    matchScore: 96, // Xanh
    appliedDate: '02/10/2026',
    source: 'LinkedIn Sourcing',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    columnId: 'interview',
    daysInStage: 2,
    tags: ['Senior Golang', 'Deal lương cao', 'Ưu tiên cao'],
    evaluation: 'pass',
    cvSummary: {
      education: 'Kỹ sư Phần mềm - ĐH Bách Khoa TP.HCM',
      recentCompany: 'Payment Gateway Platform - Tech Lead Backend',
      skills: ['Golang', 'PostgreSQL', 'Kafka', 'Redis Cluster', 'System Design'],
      summary: 'Chuyên gia thiết kế hạ tầng thanh toán có tính sẵn sàng cao (High Availability). Đã vượt qua vòng Tech Interview đạt 9.5/10.',
    },
    notes: [
      {
        id: 'n-4',
        author: 'Nguyễn Tiến Dũng (Interviewer)',
        createdAt: '09/10/2026',
        content: 'Vòng phỏng vấn chuyên môn xuất sắc. Đề xuất làm vòng Offer ngay.',
      },
    ],
    cvFileName: 'CV_NguyenVanAn_BackendLead.pdf',
  },
  {
    id: 'CAN-086',
    name: 'Hoàng Kim Ngân',
    email: 'ngan.hoangkim@gmail.com',
    phone: '0966778899',
    linkedInUrl: 'https://linkedin.com/in/ngan-hoang-po',
    position: 'Product Owner / BA Lead',
    university: 'ĐH Ngoại Thương Hà Nội',
    experience: '4 năm kinh nghiệm',
    matchScore: 89, // Xanh
    appliedDate: '03/10/2026',
    source: 'VietnamWorks',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop',
    columnId: 'interview',
    daysInStage: 4, // > 3 ngày => QUÁ HẠN SLA! Viền đỏ & Icon nhấp nháy!
    tags: ['Giao tiếp tốt', 'Phù hợp văn hóa'],
    evaluation: 'pass',
    cvSummary: {
      education: 'Kinh tế Đối ngoại - ĐH Ngoại Thương + Chứng chỉ CSPO',
      recentCompany: 'B2B SaaS Startup - Product Manager',
      skills: ['Product Roadmap', 'Agile/Scrum', 'Data Analytics', 'Wireframing'],
      summary: 'Kỹ năng quản trị sản phẩm xuất sắc. Tư duy hướng dữ liệu và đặt khách hàng làm trung tâm.',
    },
    notes: [],
    cvFileName: 'CV_HoangKimNgan_PO.pdf',
  },

  // CỘT 4: OFFER
  {
    id: 'CAN-077',
    name: 'Lê Hoàng Cường',
    email: 'cuong.lehoang@gmail.com',
    phone: '0988776655',
    linkedInUrl: 'https://linkedin.com/in/cuong-le-architect',
    position: 'Senior Backend Engineer (Go/Python)',
    university: 'Học Viện Công Nghệ Bưu Chính Viễn Thông',
    experience: '6 năm kinh nghiệm',
    matchScore: 98, // Xanh
    appliedDate: '25/09/2026',
    source: 'Headhunter Agency',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop',
    columnId: 'offer',
    daysInStage: 2,
    tags: ['Senior Golang', 'Ưu tiên cao'],
    evaluation: 'pass',
    cvSummary: {
      education: 'Kỹ sư CNTT - PTIT',
      recentCompany: 'Cloud Infrastructure Corp - Principal Architect',
      skills: ['Golang', 'Kubernetes', 'gRPC', 'Distributed Tracing', 'AWS'],
      summary: 'Đã hoàn tất toàn bộ các vòng phỏng vấn. Ban Giám Đốc đã phê duyệt gói Offer lương 52 Triệu + ESOP.',
    },
    notes: [
      {
        id: 'n-5',
        author: 'Trần Thị Recruiter',
        createdAt: '10/10/2026',
        content: 'Đã gửi thư Offer chính thức. Ứng viên phản hồi rất tích cực, hẹn ký hợp đồng trong tuần tới.',
      },
    ],
    cvFileName: 'CV_LeHoangCuong_Arch.pdf',
  },

  // CỘT 5: ĐÃ NHẬN VIỆC
  {
    id: 'CAN-065',
    name: 'Đặng Mai Linh',
    email: 'linh.dang@gmail.com',
    phone: '0911223344',
    linkedInUrl: 'https://linkedin.com/in/mailinh-devops',
    position: 'DevOps / Cloud Engineer',
    university: 'ĐH Bách Khoa Hà Nội',
    experience: '4 năm kinh nghiệm',
    matchScore: 95, // Xanh
    appliedDate: '15/09/2026',
    source: 'LinkedIn Sourcing',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
    columnId: 'hired',
    daysInStage: 1,
    tags: ['Tiếng Anh lưu loát', 'Đã onboard'],
    evaluation: 'pass',
    cvSummary: {
      education: 'Kỹ sư Mạng & Hạ tầng - ĐH Bách Khoa',
      recentCompany: 'Logistics Tech - Senior DevOps',
      skills: ['AWS', 'Kubernetes', 'Terraform', 'ArgoCD', 'Prometheus'],
      summary: 'Đã ký hợp đồng lao động và nhận máy tính làm việc. Onboarding chính thức ngày 01/10/2026.',
    },
    notes: [],
    cvFileName: 'CV_DangMaiLinh_DevOps.pdf',
  },
];

// ==========================================
// 3. MAIN PIPELINE COMPONENT
// ==========================================

export default function RecruiterPipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [slaFilterOnly, setSlaFilterOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Drag and Drop state
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<ColumnId | null>(null);

  // Quick View Slide-over Panel state (User Story 4)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [quickNoteInput, setQuickNoteInput] = useState('');

  // Modal 2: Form Thêm ứng viên thủ công (User Story 2)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    linkedInUrl: '',
    position: 'Senior Backend Engineer (Go/Python)',
    university: '',
    experience: '3 năm kinh nghiệm',
    matchScore: 85,
    source: 'LinkedIn Sourcing',
    notes: '',
    cvFileName: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Sync selectedCandidate when candidates state updates
  useEffect(() => {
    if (selectedCandidate) {
      const updated = candidates.find((c) => c.id === selectedCandidate.id);
      if (updated) setSelectedCandidate(updated);
    }
  }, [candidates]);

  // Handle open Quick View Panel
  const handleOpenQuickView = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsSlideOverOpen(true);
    setQuickNoteInput('');
    setNewTagInput('');
  };

  // ==========================================
  // DRAG & DROP LOGIC (HTML5 Native Drag & Drop)
  // ==========================================

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCandidateId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColId: ColumnId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const candidateId = e.dataTransfer.getData('text/plain') || draggedCandidateId;
    if (!candidateId) return;

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId && c.columnId !== targetColId) {
          const colInfo = KANBAN_COLUMNS.find((col) => col.id === targetColId);
          showToast(`Đã chuyển ứng viên ${c.name} sang cột "${colInfo?.title}"!`);
          return {
            ...c,
            columnId: targetColId,
            daysInStage: 1, // Reset ngày ở cột mới
          };
        }
        return c;
      })
    );
    setDraggedCandidateId(null);
  };

  const handleDragEnd = () => {
    setDraggedCandidateId(null);
    setDragOverColumnId(null);
  };

  // Di chuyển bằng nút bấm mũi tên nhanh
  const handleMoveStage = (candidateId: string, targetColId: ColumnId) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === candidateId) {
          const colInfo = KANBAN_COLUMNS.find((col) => col.id === targetColId);
          showToast(`Đã chuyển ứng viên ${c.name} sang "${colInfo?.title}"!`);
          return { ...c, columnId: targetColId, daysInStage: 1 };
        }
        return c;
      })
    );
  };

  // ==========================================
  // QUICK VIEW PANEL ACTIONS (Sàng lọc nhanh)
  // ==========================================

  // Đánh giá Pass / Fail / Review
  const handleSetEvaluation = (evalType: 'pass' | 'review' | 'fail') => {
    if (!selectedCandidate) return;
    const newEval = selectedCandidate.evaluation === evalType ? null : evalType;

    setCandidates((prev) =>
      prev.map((c) => (c.id === selectedCandidate.id ? { ...c, evaluation: newEval } : c))
    );

    const labelMap = { pass: 'Đạt (Pass)', review: 'Cân nhắc', fail: 'Không đạt (Fail)' };
    showToast(
      newEval
        ? `Đã đánh giá "${labelMap[evalType]}" cho ứng viên ${selectedCandidate.name}.`
        : 'Đã hủy đánh giá.'
    );
  };

  // Thêm Tag
  const handleAddTag = (tagName: string) => {
    if (!selectedCandidate || !tagName.trim()) return;
    const cleanTag = tagName.trim();
    if (selectedCandidate.tags.includes(cleanTag)) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === selectedCandidate.id ? { ...c, tags: [...c.tags, cleanTag] } : c
      )
    );
    setNewTagInput('');
    showToast(`Đã thêm nhãn "${cleanTag}".`);
  };

  // Xóa Tag
  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedCandidate) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === selectedCandidate.id
          ? { ...c, tags: c.tags.filter((t) => t !== tagToRemove) }
          : c
      )
    );
  };

  // Thêm Ghi chú nhanh (Quick Note)
  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !quickNoteInput.trim()) return;

    const newNote: QuickNote = {
      id: `note-${Date.now()}`,
      author: 'Trần Thị Recruiter',
      createdAt: 'Vừa xong',
      content: quickNoteInput.trim(),
    };

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === selectedCandidate.id ? { ...c, notes: [newNote, ...c.notes] } : c
      )
    );
    setQuickNoteInput('');
    showToast('Đã lưu ghi chú nhanh thành công!');
  };

  // ==========================================
  // THÊM ỨNG VIÊN THỦ CÔNG (User Story 2)
  // ==========================================

  const handleAddManualCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      alert('Vui lòng nhập họ và tên ứng viên');
      return;
    }

    const newId = `CAN-${Math.floor(110 + Math.random() * 890)}`;
    const newCand: Candidate = {
      id: newId,
      name: addForm.name.trim(),
      email: addForm.email.trim() || 'candidate@example.com',
      phone: addForm.phone.trim() || '0900000000',
      linkedInUrl: addForm.linkedInUrl.trim() || 'https://linkedin.com',
      position: addForm.position,
      university: addForm.university.trim() || 'Đại học chuyên ngành',
      experience: addForm.experience,
      matchScore: Number(addForm.matchScore) || 80,
      appliedDate: 'Hôm nay (Thủ công)',
      source: addForm.source,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
      columnId: 'new', // Đẩy thẳng vào cột CV Mới
      daysInStage: 1,
      tags: ['Sourcing ngoài', 'Mới tiếp nhận'],
      evaluation: null,
      cvSummary: {
        education: addForm.university || 'Cử nhân CNTT',
        recentCompany: 'Công ty hiện tại (Sourced từ LinkedIn)',
        skills: ['Kỹ năng chuyên môn', 'Kinh nghiệm thực tế'],
        summary: `Hồ sơ được Recruiter tìm kiếm từ nguồn ${addForm.source}. ${addForm.notes || ''}`,
      },
      notes: addForm.notes
        ? [
            {
              id: `note-${Date.now()}`,
              author: 'Trần Thị Recruiter',
              createdAt: 'Vừa xong',
              content: addForm.notes,
            },
          ]
        : [],
      cvFileName: addForm.cvFileName || 'CV_UngVien_Sourcing.pdf',
    };

    setCandidates([newCand, ...candidates]);
    setIsAddModalOpen(false);
    showToast(`Đã thêm ứng viên "${newCand.name}" (${newCand.id}) vào cột "CV Mới"!`);

    // Reset form
    setAddForm({
      name: '',
      email: '',
      phone: '',
      linkedInUrl: '',
      position: 'Senior Backend Engineer (Go/Python)',
      university: '',
      experience: '3 năm kinh nghiệm',
      matchScore: 85,
      source: 'LinkedIn Sourcing',
      notes: '',
      cvFileName: '',
    });
  };

  // ==========================================
  // FILTERING & STATS
  // ==========================================

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPos = selectedPosition === 'all' || c.position === selectedPosition;
      const matchSla = slaFilterOnly ? c.daysInStage > 3 : true;

      return matchSearch && matchPos && matchSla;
    });
  }, [candidates, searchQuery, selectedPosition, slaFilterOnly]);

  // Đếm số lượng quá hạn SLA (> 3 ngày)
  const overdueCount = useMemo(() => {
    return candidates.filter((c) => c.daysInStage > 3).length;
  }, [candidates]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-4 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <Link href="/recruiter" className="hover:text-blue-600 transition-colors">
              Recruiter Workspace
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Kanban Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Kanban className="w-8 h-8 text-blue-600" />
            <span>Kanban Pipeline Điều Phối Ứng Viên</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Quản lý vòng đời ứng viên 5 giai đoạn, kéo thả phân loại, giám sát vi phạm SLA và sàng lọc nhanh CV.
          </p>
        </div>

        {/* Nút Thêm ứng viên thủ công (User Story 2) */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Thêm Ứng Viên Thủ Công</span>
        </button>
      </div>

      {/* 2. FILTER & TOOLBAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Position Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã hồ sơ, kỹ năng..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">🎯 Tất cả vị trí tuyển dụng</option>
              <option value="Senior Backend Engineer (Go/Python)">
                Senior Backend Engineer (Go/Python)
              </option>
              <option value="Frontend React Lead">Frontend React Lead</option>
              <option value="Product Owner / BA Lead">Product Owner / BA Lead</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
            </select>
          </div>
        </div>

        {/* SLA Status Widget & Action Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSlaFilterOnly(!slaFilterOnly)}
            className={clsx(
              'px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border',
              slaFilterOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            )}
          >
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Quá hạn SLA (&gt; 3 ngày): {overdueCount} hồ sơ</span>
          </button>

          <span className="text-xs text-slate-400 font-bold hidden lg:inline">
            Tổng số: <strong className="text-slate-800">{filteredCandidates.length}</strong> ứng viên
          </span>
        </div>
      </div>

      {/* 3. KANBAN BOARD (CUỘN NGANG: overflow-x-auto flex gap-4) */}
      <div className="flex-1 overflow-x-auto pb-4 pt-1">
        <div className="flex gap-4 min-w-[1360px] h-full items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colCandidates = filteredCandidates.filter((c) => c.columnId === col.id);
            const isDragTarget = dragOverColumnId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={clsx(
                  'w-72 sm:w-80 shrink-0 rounded-3xl border flex flex-col max-h-[calc(100vh-14rem)] transition-all duration-150 border-t-4 shadow-xs',
                  col.accentColor,
                  isDragTarget
                    ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-400/40'
                    : 'bg-slate-100/70 border-slate-200/80'
                )}
              >
                {/* Column Header */}
                <div
                  className={clsx(
                    'p-4 flex items-center justify-between border-b border-slate-200/60 rounded-t-2xl',
                    col.headerBg
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={clsx('w-2.5 h-2.5 rounded-full', col.dotColor)} />
                    <h3 className="font-black text-xs text-slate-900 tracking-tight uppercase">
                      {col.title}
                    </h3>
                  </div>

                  <span
                    className={clsx(
                      'text-[10px] font-black px-2.5 py-0.5 rounded-full border',
                      col.badgeColor
                    )}
                  >
                    {colCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[300px]">
                  {colCandidates.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-2xl bg-white/40 flex flex-col items-center justify-center space-y-1">
                      <Layers className="w-5 h-5 opacity-40" />
                      <span className="font-medium text-[11px]">Kéo thẻ thả vào đây</span>
                    </div>
                  ) : (
                    colCandidates.map((cand) => {
                      const isSlaBreached = cand.daysInStage > 3;

                      return (
                        <div
                          key={cand.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, cand.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleOpenQuickView(cand)}
                          className={clsx(
                            'rounded-2xl p-4 shadow-xs hover:shadow-md transition-all space-y-3 cursor-grab active:cursor-grabbing group border relative select-none',
                            // CẢNH BÁO SLA QUÁ HẠN: Viền đỏ nhạt, nền đỏ-50 nếu ở 1 cột > 3 ngày (User Story 3)
                            isSlaBreached
                              ? 'border-red-400 bg-red-50/70 ring-1 ring-red-400/40'
                              : 'bg-white border-slate-200/90 hover:border-blue-300'
                          )}
                        >
                          {/* Top: Avatar, Name & Match Score Badge (User Story 3) */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {cand.avatar ? (
                                <img
                                  src={cand.avatar}
                                  alt={cand.name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-sky-100 text-[#0284C7] font-extrabold text-xs flex items-center justify-center border border-sky-200 shrink-0 select-none">
                                  {(cand.name || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                                </div>
                              )}
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {cand.name}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  {cand.id}
                                </span>
                              </div>
                            </div>

                            {/* Match Score Badge (85% Xanh, 40% Đỏ theo User Story) */}
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={clsx(
                                  'text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border flex items-center gap-1 shadow-2xs',
                                  cand.matchScore >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : cand.matchScore >= 50
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : 'bg-rose-50 text-rose-700 border-rose-300'
                                )}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{cand.matchScore}% Match</span>
                              </span>

                              {/* Evaluation Status Badge if available */}
                              {cand.evaluation === 'pass' && (
                                <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                                  ✓ Đạt
                                </span>
                              )}
                              {cand.evaluation === 'fail' && (
                                <span className="text-[9px] font-extrabold text-rose-600 bg-rose-100/60 px-1.5 py-0.2 rounded">
                                  ✕ Loại
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Position */}
                          <div className="text-[11px] font-extrabold text-slate-800 line-clamp-1">
                            {cand.position}
                          </div>

                          {/* University & Experience */}
                          <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{cand.university}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{cand.experience}</span>
                            </div>
                          </div>

                          {/* Tags Preview */}
                          {cand.tags && cand.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {cand.tags.map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/50"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Cảnh báo SLA Quá hạn (> 3 ngày): Icon Đồng hồ đỏ nhấp nháy (User Story 3) */}
                          {isSlaBreached && (
                            <div className="p-2 rounded-xl bg-rose-100/80 border border-rose-300 text-rose-800 text-[10px] font-extrabold flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                                <span>Quá hạn SLA ({cand.daysInStage} ngày ở cột này)</span>
                              </div>
                              <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-black">
                                &gt; 3 ngày
                              </span>
                            </div>
                          )}

                          {/* Footer Card: Ngày nộp + Nút di chuyển nhanh */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{cand.appliedDate}</span>

                            {/* Stage quick move buttons */}
                            <div
                              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {col.id !== 'new' && (
                                <button
                                  type="button"
                                  title="Lùi về vòng trước"
                                  onClick={() => {
                                    const colIds: ColumnId[] = [
                                      'new',
                                      'screening',
                                      'interview',
                                      'offer',
                                      'hired',
                                    ];
                                    const currIdx = colIds.indexOf(col.id);
                                    if (currIdx > 0) {
                                      handleMoveStage(cand.id, colIds[currIdx - 1]);
                                    }
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-200 text-slate-600 cursor-pointer"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {col.id !== 'hired' && (
                                <button
                                  type="button"
                                  title="Chuyển sang vòng kế tiếp"
                                  onClick={() => {
                                    const colIds: ColumnId[] = [
                                      'new',
                                      'screening',
                                      'interview',
                                      'offer',
                                      'hired',
                                    ];
                                    const currIdx = colIds.indexOf(col.id);
                                    if (currIdx < colIds.length - 1) {
                                      handleMoveStage(cand.id, colIds[currIdx + 1]);
                                    }
                                  }}
                                  className="p-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. QUICK VIEW SLIDE-OVER PANEL (CẠNH PHẢI - User Story 4) */}
      {/* ======================================================== */}
      {isSlideOverOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop mờ */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsSlideOverOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250">
              {/* Header Panel */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  {selectedCandidate.avatar ? (
                    <img
                      src={selectedCandidate.avatar}
                      alt={selectedCandidate.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-200 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 text-[#0284C7] font-extrabold text-xl flex items-center justify-center border-2 border-blue-200 shadow-sm shrink-0 select-none">
                      {(selectedCandidate.name || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {selectedCandidate.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-mono font-bold text-slate-600">
                        {selectedCandidate.id}
                      </span>
                      <span>&bull;</span>
                      <span>{selectedCandidate.source}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedCandidate.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                    title="Mở hồ sơ LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsSlideOverOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body Panel (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* 1. MỨC ĐỘ PHÙ HỢP (MATCH SCORE) & ĐÁNH GIÁ (PASS/FAIL) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Điểm phù hợp tiêu chí JD
                    </span>
                    <span
                      className={clsx(
                        'text-xs font-black px-2.5 py-0.5 rounded-full border',
                        selectedCandidate.matchScore >= 80
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : selectedCandidate.matchScore >= 50
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      )}
                    >
                      {selectedCandidate.matchScore}% Phù hợp
                    </span>
                  </div>

                  {/* Bộ đánh giá nhanh Pass / Review / Fail */}
                  <div className="space-y-1.5 pt-2 border-t border-blue-100/80">
                    <div className="font-bold text-slate-600 text-[11px]">
                      Sàng lọc nhanh (Quyết định):
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetEvaluation('pass')}
                        className={clsx(
                          'py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border',
                          selectedCandidate.evaluation === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetEvaluation('review')}
                        className={clsx(
                          'py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border',
                          selectedCandidate.evaluation === 'review'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                            : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Cân nhắc</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetEvaluation('fail')}
                        className={clsx(
                          'py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border',
                          selectedCandidate.evaluation === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                            : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                        )}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. CHUYỂN GIAI ĐOẠN TRỰC TIẾP (STAGE SWITCHER) */}
                <div className="space-y-2">
                  <div className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>Giai đoạn hiện tại:</span>
                    <span className="text-blue-600 font-black">
                      {KANBAN_COLUMNS.find((c) => c.id === selectedCandidate.columnId)?.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 bg-slate-100 p-1 rounded-2xl">
                    {KANBAN_COLUMNS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => handleMoveStage(selectedCandidate.id, col.id)}
                        className={clsx(
                          'py-2 px-1 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center',
                          selectedCandidate.columnId === col.id
                            ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        {col.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. TÓM TẮT CV & NÚT XEM CV GỐC */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                    <span className="font-extrabold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Trích yếu hồ sơ ứng viên (CV)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        alert(`Đang tải file ${selectedCandidate.cvFileName || 'CV_UngVien.pdf'}...`)
                      }
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xem file PDF</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium">Học vấn: </span>
                      <span className="font-bold text-slate-800">
                        {selectedCandidate.cvSummary.education}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Gần nhất: </span>
                      <span className="font-bold text-slate-800">
                        {selectedCandidate.cvSummary.recentCompany}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-200/60">
                      {selectedCandidate.cvSummary.summary}
                    </p>
                  </div>

                  {/* Kỹ năng cốt lõi */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">
                      Kỹ năng trích xuất:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.cvSummary.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. GẮN NHÃN MÀU (TAGGING SYSTEM - User Story 4) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-purple-600" />
                      Nhãn phân loại (Tags)
                    </label>
                  </div>

                  {/* Danh sách Tags hiện tại */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Input thêm tag mới */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(newTagInput);
                        }
                      }}
                      placeholder="Gõ nhãn mới & bấm Enter..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(newTagInput)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
                    >
                      + Thêm
                    </button>
                  </div>

                  {/* Preset Tags gợi ý */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Nhãn mẫu gợi ý:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_TAGS.map((pt, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleAddTag(pt.name)}
                          className={clsx(
                            'px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer',
                            pt.color
                          )}
                        >
                          + {pt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. GHI CHÚ NHANH (QUICK NOTES) */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Ghi chú nhanh của Recruiter
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {selectedCandidate.notes.length} ghi chú
                    </span>
                  </div>

                  {/* Form nhập note */}
                  <form onSubmit={handleAddQuickNote} className="space-y-2">
                    <textarea
                      rows={2}
                      value={quickNoteInput}
                      onChange={(e) => setQuickNoteInput(e.target.value)}
                      placeholder="Ghi lại ấn tượng, mức lương mong muốn, hoặc câu hỏi cho Hiring Manager..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Lưu Ghi Chú</span>
                      </button>
                    </div>
                  </form>

                  {/* Danh sách ghi chú */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCandidate.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-800">{note.author}</span>
                          <span className="text-slate-400">{note.createdAt}</span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Panel */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCandidate.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSlideOverOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Đóng Panel
                  </button>
                  <a
                    href={`mailto:${selectedCandidate.email}`}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Gửi Thư</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: THÊM ỨNG VIÊN THỦ CÔNG (User Story 2)           */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-in zoom-in-95 duration-200 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Thêm Ứng Viên Thủ Công Vào Pipeline
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Đẩy ứng viên tìm từ nguồn ngoài (LinkedIn/Sourcing) trực tiếp vào cột "CV Mới".
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddManualCandidate} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ và tên ứng viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Đình Trọng"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Link LinkedIn - Yêu cầu cốt lõi của User Story 2 */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đường dẫn LinkedIn (Profile Link)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={addForm.linkedInUrl}
                  onChange={(e) => setAddForm({ ...addForm, linkedInUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    placeholder="ungvien@gmail.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0987654321"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Vị trí ứng tuyển */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Vị trí đẩy vào Pipeline</label>
                <select
                  value={addForm.position}
                  onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                >
                  <option value="Senior Backend Engineer (Go/Python)">
                    Senior Backend Engineer (Go/Python)
                  </option>
                  <option value="Frontend React Lead">Frontend React Lead</option>
                  <option value="Product Owner / BA Lead">Product Owner / BA Lead</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
                </select>
              </div>

              {/* Upload CV - Yêu cầu User Story 2 */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload hồ sơ CV (PDF / DOCX)</span>
                </label>
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-center cursor-pointer">
                  <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Kéo thả CV hoặc bấm để chọn tệp</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Hỗ trợ định dạng PDF, DOCX (Dung lượng tối đa 10MB)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nguồn tìm kiếm</label>
                  <select
                    value={addForm.source}
                    onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="LinkedIn Sourcing">LinkedIn Sourcing</option>
                    <option value="Headhunter Agency">Headhunter Agency</option>
                    <option value="TopCV Chủ động">TopCV Chủ động</option>
                    <option value="Giới thiệu trực tiếp">Giới thiệu trực tiếp</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Điểm Match tự tính</label>
                  <input
                    type="number"
                    min="30"
                    max="100"
                    value={addForm.matchScore}
                    onChange={(e) =>
                      setAddForm({ ...addForm, matchScore: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ghi chú ban đầu</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về ứng viên..."
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Thêm Vào Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
