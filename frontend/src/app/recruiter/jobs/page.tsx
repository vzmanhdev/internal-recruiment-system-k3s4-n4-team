'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  Calendar,
  DollarSign,
  Check,
  X,
  MoreVertical,
  Sparkles,
  EyeOff,
  Eye,
  Share2,
  Copy,
  Edit3,
  AlertCircle,
  LayoutGrid,
  List,
  Building2,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import clsx from 'clsx';

// ==========================================
// 1. DATA TYPES & ENUMS
// ==========================================

export type JobStatus = 'active' | 'expired' | 'draft';

export interface ApprovedRequisition {
  id: string;
  code: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  headcount: number;
  level: string;
  employmentType: string;
  hiringManager: string;
  approvedDate: string;
  description: string;
  requirements: string;
  benefits: string;
}

export interface JobPosting {
  id: string;
  requisitionCode?: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  headcount: number;
  level: string;
  employmentType: string;
  applicantsCount: number;
  status: JobStatus;
  postedDate: string;
  expiryDate: string; // YYYY-MM-DD
  daysLeft: number;
  isExpiringSoon: boolean; // true nếu còn <= 5 ngày hoặc đã hết hạn
  autoUnpublish: boolean;
  description: string;
  requirements: string;
  benefits: string;
}

// ==========================================
// 2. MOCK DATA
// ==========================================

// Danh sách Yêu cầu tuyển dụng ĐÃ DUYỆT (Approved Requisitions)
const APPROVED_REQUISITIONS: ApprovedRequisition[] = [
  {
    id: 'req-01',
    code: 'REQ-2026-08',
    title: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    salary: '35 - 55 Triệu VNĐ',
    headcount: 3,
    level: 'Senior',
    employmentType: 'Toàn thời gian (Hybrid)',
    hiringManager: 'Nguyễn Tiến Dũng (Engineering Director)',
    approvedDate: '28/09/2026',
    description:
      'Phát triển và tối ưu hóa hệ thống microservices backend xử lý dữ liệu giao dịch quy mô lớn. Xây dựng RESTful API và gRPC services với hiệu năng cao, độ trễ thấp và khả năng mở rộng hàng triệu requests/phút.',
    requirements:
      '- Tối thiểu 4+ năm kinh nghiệm làm việc chuyên sâu với Golang hoặc Python.\n- Thành thạo PostgreSQL, Redis, Kafka hoặc RabbitMQ.\n- Có kinh nghiệm với Docker, Kubernetes, CI/CD pipeline.\n- Tư duy giải quyết vấn đề tốt, hiểu sâu về System Design và Clean Architecture.',
    benefits:
      '- Thu nhập cạnh tranh: Lương cứng 35-55M + Thưởng hiệu quả kinh doanh (lên đến 3-5 tháng lương).\n- Bảo hiểm sức khỏe PVI Premium cho bản thân và người thân.\n- Cấp mới MacBook Pro M3 Max khi nhận việc.\n- 15 ngày phép năm + chế độ Hybrid 2 ngày Remote/tuần.',
  },
  {
    id: 'req-02',
    code: 'REQ-2026-12',
    title: 'Frontend React Lead (Next.js & Design System)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    salary: '40 - 60 Triệu VNĐ',
    headcount: 1,
    level: 'Lead',
    employmentType: 'Toàn thời gian',
    hiringManager: 'Phạm Văn Tuấn (Tech Lead)',
    approvedDate: '01/10/2026',
    description:
      'Dẫn dắt kiến trúc Frontend cho toàn bộ hệ sinh thái sản phẩm Enterprise ATS và Internal Portal. Định hình chuẩn UI/UX, tối ưu hóa Web Vitals, xây dựng Design System component thư viện dùng chung cho toàn công ty.',
    requirements:
      '- 5+ năm kinh nghiệm Frontend, thành thạo React, Next.js App Router, TypeScript, Tailwind CSS.\n- Khả năng lead team 5-8 kỹ sư, review code và thiết lập CI/CD frontend.\n- Am hiểu sâu về Performance optimization, Accessibility (a11y) và State Management.',
    benefits:
      '- Gói ESOP cổ phần đãi ngộ hấp dẫn cho cấp Lead.\n- Thưởng dự án hàng quý theo tiến độ sản phẩm.\n- Tài trợ ngân sách học tập và chứng chỉ quốc tế 25.000.000 VNĐ/năm.',
  },
  {
    id: 'req-03',
    code: 'REQ-2026-15',
    title: 'AI/ML Research Engineer (LLM & CV Matching)',
    department: 'Ban Công Nghệ AI & Dữ Liệu',
    location: 'Hà Nội (Lotte Center)',
    salary: '45 - 70 Triệu VNĐ',
    headcount: 2,
    level: 'Specialist / Senior',
    employmentType: 'Toàn thời gian (Linh hoạt)',
    hiringManager: 'TS. Hoàng Minh Quân (Head of AI)',
    approvedDate: '02/10/2026',
    description:
      'Nghiên cứu và phát triển các mô hình xử lý ngôn ngữ tự nhiên (NLP) phục vụ việc phân tích hồ sơ CV ứng viên, trích xuất thực thể (NER), tự động tóm tắt hồ sơ và matching kỹ năng ứng viên với JD tuyển dụng.',
    requirements:
      '- Có kinh nghiệm thực chiến với PyTorch/TensorFlow, Transformers, HuggingFace.\n- Hiểu sâu về Fine-tuning LLM (Llama, Mistral) và kiến trúc RAG.\n- Ưu tiên ứng viên có công bố khoa học hoặc sản phẩm AI thực tế đã launch production.',
    benefits:
      '- Hạ tầng GPU Cloud (NVIDIA H100/A100) không giới hạn phục vụ R&D.\n- Môi trường nghiên cứu chuyên nghiệp cùng các chuyên gia hàng đầu.\n- Thời gian làm việc linh hoạt Work from Anywhere 2 ngày/tuần.',
  },
  {
    id: 'req-04',
    code: 'REQ-2026-19',
    title: 'Product Manager (B2B SaaS / HR Tech)',
    department: 'Phòng Phát Triển Sản Phẩm',
    location: 'Hà Nội',
    salary: '35 - 50 Triệu VNĐ',
    headcount: 1,
    level: 'Senior',
    employmentType: 'Toàn thời gian',
    hiringManager: 'Lê Thị Bích Ngọc (CPO)',
    approvedDate: '05/10/2026',
    description:
      'Định hình Roadmap và chiến lược sản phẩm hệ thống Tuyển Dụng Nội Bộ. Làm việc chặt chẽ với Stakeholders (HR, Hiring Managers, Ban Giám Đốc) để chuyển hóa Business Needs thành User Stories và Epic chi tiết.',
    requirements:
      '- 3+ năm kinh nghiệm làm PM cho các sản phẩm B2B hoặc HR Tech.\n- Kỹ năng phân tích số liệu (Product Analytics), Wireframing và quản trị Agile/Scrum xuất sắc.\n- Kỹ năng giao tiếp và thuyết trình song ngữ Anh - Việt thành thạo.',
    benefits:
      '- Lương tháng 13 + thưởng KPI năm lên đến 4 tháng lương.\n- Tham gia hoạch định chiến lược sản phẩm cốt lõi của tập đoàn.\n- Nghỉ dưỡng 5 sao 2 lần/năm cùng công ty.',
  },
  {
    id: 'req-05',
    code: 'REQ-2026-22',
    title: 'DevOps / Site Reliability Engineer (SRE)',
    department: 'Khối Vận Hành & Hạ Tầng',
    location: 'Hà Nội (Hybrid)',
    salary: '30 - 48 Triệu VNĐ',
    headcount: 2,
    level: 'Mid-Senior',
    employmentType: 'Toàn thời gian',
    hiringManager: 'Trần Quang Huy (Infra Director)',
    approvedDate: '08/10/2026',
    description:
      'Vận hành và tối ưu hóa cụm Kubernetes trên AWS/GCP. Xây dựng GitOps pipeline, giám sát hạ tầng với Prometheus, Grafana, Datadog và đảm bảo SLA 99.99% cho hệ thống tuyển dụng.',
    requirements:
      '- 3+ năm kinh nghiệm với Kubernetes, Terraform, Helm, Docker.\n- Thành thạo CI/CD (GitHub Actions / GitLab CI) và an ninh mạng hạ tầng Cloud.\n- Có chứng chỉ CKA hoặc AWS Solution Architect là lợi thế lớn.',
    benefits:
      '- Thưởng on-call và phụ cấp ca trực hấp dẫn.\n- Tài trợ 100% lệ phí thi chứng chỉ quốc tế AWS, CKA.\n- Phụ cấp ăn trưa và gửi xe miễn phí tại tòa nhà hạng A.',
  },
];

// Danh sách Tin tuyển dụng ban đầu
const INITIAL_JOBS: JobPosting[] = [
  {
    id: 'JOB-2026-01',
    requisitionCode: 'REQ-2026-08',
    title: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    salary: '35 - 55 Triệu VNĐ',
    headcount: 3,
    level: 'Senior',
    employmentType: 'Toàn thời gian (Hybrid)',
    applicantsCount: 14,
    status: 'active',
    postedDate: '2026-10-01',
    expiryDate: '2026-10-15', // Còn 4 ngày -> Sắp hết hạn!
    daysLeft: 4,
    isExpiringSoon: true,
    autoUnpublish: true,
    description:
      'Phát triển và tối ưu hóa hệ thống microservices backend xử lý dữ liệu giao dịch quy mô lớn...',
    requirements: 'Tối thiểu 4+ năm kinh nghiệm với Golang hoặc Python...',
    benefits: 'Lương tháng 13 + thưởng hiệu quả kinh doanh lên tới 3-5 tháng lương...',
  },
  {
    id: 'JOB-2026-02',
    requisitionCode: 'REQ-2026-12',
    title: 'Frontend React Lead (Next.js & Design System)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    salary: '40 - 60 Triệu VNĐ',
    headcount: 1,
    level: 'Lead',
    employmentType: 'Toàn thời gian',
    applicantsCount: 8,
    status: 'active',
    postedDate: '2026-10-02',
    expiryDate: '2026-10-31', // Còn 20 ngày -> An toàn
    daysLeft: 20,
    isExpiringSoon: false,
    autoUnpublish: true,
    description:
      'Dẫn dắt kiến trúc Frontend cho toàn bộ hệ sinh thái sản phẩm Enterprise ATS...',
    requirements: '5+ năm kinh nghiệm Frontend, thành thạo React, Next.js App Router...',
    benefits: 'Gói ESOP đãi ngộ hấp dẫn cho cấp Lead...',
  },
  {
    id: 'JOB-2026-03',
    requisitionCode: 'REQ-2026-04',
    title: 'Product Owner / BA Lead',
    department: 'Phòng Phát Triển Sản Phẩm',
    location: 'Hà Nội',
    salary: '30 - 45 Triệu VNĐ',
    headcount: 2,
    level: 'Lead',
    employmentType: 'Toàn thời gian',
    applicantsCount: 11,
    status: 'expired', // Đã hết hạn -> Màu đỏ
    postedDate: '2026-09-01',
    expiryDate: '2026-10-05', // Đã quá hạn 6 ngày
    daysLeft: -6,
    isExpiringSoon: true,
    autoUnpublish: true,
    description: 'Quản lý yêu cầu nghiệp vụ và backlog sản phẩm...',
    requirements: 'Kinh nghiệm BA/PO từ 4 năm trở lên...',
    benefits: 'Chế độ đãi ngộ cạnh tranh...',
  },
  {
    id: 'JOB-2026-04',
    requisitionCode: 'REQ-2026-22',
    title: 'DevOps / Site Reliability Engineer (SRE)',
    department: 'Khối Vận Hành & Hạ Tầng',
    location: 'Hà Nội (Hybrid)',
    salary: '30 - 48 Triệu VNĐ',
    headcount: 2,
    level: 'Mid-Senior',
    employmentType: 'Toàn thời gian',
    applicantsCount: 6,
    status: 'active',
    postedDate: '2026-10-03',
    expiryDate: '2026-10-14', // Còn 3 ngày -> Sắp hết hạn!
    daysLeft: 3,
    isExpiringSoon: true,
    autoUnpublish: true,
    description: 'Vận hành và tối ưu hóa cụm Kubernetes trên AWS/GCP...',
    requirements: '3+ năm kinh nghiệm với Kubernetes, Terraform, Helm...',
    benefits: 'Thưởng on-call và phụ cấp ca trực hấp dẫn...',
  },
  {
    id: 'JOB-2026-05',
    requisitionCode: 'REQ-2026-11',
    title: 'UI/UX Designer Senior (Figma & Design Tokens)',
    department: 'Phòng Phát Triển Sản Phẩm',
    location: 'Hà Nội',
    salary: '25 - 38 Triệu VNĐ',
    headcount: 1,
    level: 'Senior',
    employmentType: 'Toàn thời gian',
    applicantsCount: 0,
    status: 'draft', // Bản nháp -> Màu xám
    postedDate: '2026-10-05',
    expiryDate: '2026-11-15',
    daysLeft: 35,
    isExpiringSoon: false,
    autoUnpublish: false,
    description: 'Thiết kế giao diện người dùng cho ứng dụng web và mobile...',
    requirements: 'Thành thạo Figma, Design Tokens, UX Research...',
    benefits: 'Môi trường làm việc trẻ trung, sáng tạo...',
  },
  {
    id: 'JOB-2026-06',
    requisitionCode: 'REQ-2026-15',
    title: 'AI/ML Research Engineer (LLM & CV Matching)',
    department: 'Ban Công Nghệ AI & Dữ Liệu',
    location: 'Hà Nội (Lotte Center)',
    salary: '45 - 70 Triệu VNĐ',
    headcount: 2,
    level: 'Senior',
    employmentType: 'Toàn thời gian',
    applicantsCount: 7,
    status: 'active',
    postedDate: '2026-10-08',
    expiryDate: '2026-11-08',
    daysLeft: 28,
    isExpiringSoon: false,
    autoUnpublish: true,
    description: 'Nghiên cứu và phát triển các mô hình xử lý ngôn ngữ tự nhiên (NLP)...',
    requirements: 'Kinh nghiệm với PyTorch/TensorFlow, Transformers, HuggingFace...',
    benefits: 'Hạ tầng GPU Cloud không giới hạn...',
  },
];

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus | 'expiring'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modal 1: Form Tạo tin tuyển dụng
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [createForm, setCreateForm] = useState({
    title: '',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    salary: '',
    headcount: 1,
    level: 'Senior',
    employmentType: 'Toàn thời gian',
    expiryDate: '2026-11-15',
    autoUnpublish: true,
    description: '',
    requirements: '',
    benefits: '',
    status: 'active' as JobStatus,
    requisitionCode: '',
  });
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);

  // Modal 2: Cài đặt tự động hết hạn (Set Expiry Date)
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [jobToSetExpiry, setJobToSetExpiry] = useState<JobPosting | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newAutoUnpublish, setNewAutoUnpublish] = useState(true);

  // Modal 3: Xác nhận Gỡ tin ngay (Unpublish Confirmation)
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [jobToUnpublish, setJobToUnpublish] = useState<JobPosting | null>(null);

  // Dropdown 3 chấm (Actions Menu) state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Toast feedback helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  // 1. Khi chọn Yêu cầu tuyển dụng đã duyệt -> Tự động pre-fill Form!
  const handleSelectRequisition = (reqId: string) => {
    setSelectedReqId(reqId);
    if (!reqId) {
      setPrefillNotice(null);
      return;
    }

    const req = APPROVED_REQUISITIONS.find((r) => r.id === reqId);
    if (req) {
      setCreateForm({
        title: req.title,
        department: req.department,
        location: req.location,
        salary: req.salary,
        headcount: req.headcount,
        level: req.level,
        employmentType: req.employmentType,
        expiryDate: '2026-11-15',
        autoUnpublish: true,
        description: req.description,
        requirements: req.requirements,
        benefits: req.benefits,
        status: 'active',
        requisitionCode: req.code,
      });

      setPrefillNotice(
        `✅ Đã tự động điền thông tin từ Yêu cầu tuyển dụng đã duyệt ${req.code} (${req.hiringManager}).`
      );
    }
  };

  // 2. Submit form tạo tin tuyển dụng mới
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề tin tuyển dụng');
      return;
    }

    const newId = `JOB-2026-0${jobs.length + 1}`;
    const newJob: JobPosting = {
      id: newId,
      requisitionCode: createForm.requisitionCode || 'REQ-CUSTOM',
      title: createForm.title,
      department: createForm.department,
      location: createForm.location,
      salary: createForm.salary || 'Thỏa thuận',
      headcount: Number(createForm.headcount) || 1,
      level: createForm.level,
      employmentType: createForm.employmentType,
      applicantsCount: 0,
      status: createForm.status,
      postedDate: new Date().toISOString().split('T')[0],
      expiryDate: createForm.expiryDate,
      daysLeft: 30,
      isExpiringSoon: false,
      autoUnpublish: createForm.autoUnpublish,
      description: createForm.description,
      requirements: createForm.requirements,
      benefits: createForm.benefits,
    };

    setJobs([newJob, ...jobs]);
    setIsCreateModalOpen(false);
    showToast(`Tạo tin tuyển dụng "${newJob.title}" (${newJob.id}) thành công!`);

    // Reset form
    setSelectedReqId('');
    setPrefillNotice(null);
  };

  // 3. Mở Modal Cài đặt tự động hết hạn
  const handleOpenSetExpiry = (job: JobPosting) => {
    setJobToSetExpiry(job);
    setNewExpiryDate(job.expiryDate);
    setNewAutoUnpublish(job.autoUnpublish);
    setOpenActionMenuId(null);
    setIsExpiryModalOpen(true);
  };

  // 4. Lưu cài đặt tự động hết hạn
  const handleSaveExpiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobToSetExpiry || !newExpiryDate) return;

    // Giả lập tính số ngày còn lại
    const today = new Date('2026-10-11');
    const target = new Date(newExpiryDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isSoon = diffDays <= 5;

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobToSetExpiry.id) {
          return {
            ...j,
            expiryDate: newExpiryDate,
            daysLeft: diffDays,
            isExpiringSoon: isSoon,
            autoUnpublish: newAutoUnpublish,
            status: diffDays < 0 ? 'expired' : j.status === 'expired' ? 'active' : j.status,
          };
        }
        return j;
      })
    );

    setIsExpiryModalOpen(false);
    showToast(`Đã cập nhật ngày hết hạn cho tin ${jobToSetExpiry.id} đến ngày ${newExpiryDate}.`);
  };

  // 5. Mở Modal xác nhận Gỡ tin ngay (Unpublish)
  const handleOpenUnpublish = (job: JobPosting) => {
    setJobToUnpublish(job);
    setOpenActionMenuId(null);
    setIsUnpublishModalOpen(true);
  };

  // 6. Xác nhận Gỡ tin ngay
  const handleConfirmUnpublish = () => {
    if (!jobToUnpublish) return;

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobToUnpublish.id) {
          return {
            ...j,
            status: 'expired',
            daysLeft: 0,
            isExpiringSoon: true,
          };
        }
        return j;
      })
    );

    setIsUnpublishModalOpen(false);
    showToast(`Đã gỡ tin tuyển dụng ${jobToUnpublish.id} khỏi cổng việc làm công khai.`);
  };

  // 7. Đăng lại tin tuyển dụng đã hết hạn
  const handleRepublish = (job: JobPosting) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === job.id) {
          return {
            ...j,
            status: 'active',
            expiryDate: '2026-11-15',
            daysLeft: 35,
            isExpiringSoon: false,
          };
        }
        return j;
      })
    );
    setOpenActionMenuId(null);
    showToast(`Đã tái kích hoạt tin tuyển dụng ${job.id} thành công!`);
  };

  // ==========================================
  // FILTERED JOBS & KPI STATS
  // ==========================================

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search term
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'expiring') return job.isExpiringSoon && job.status === 'active';
      return job.status === statusFilter;
    });
  }, [jobs, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => j.status === 'active').length;
    const expired = jobs.filter((j) => j.status === 'expired').length;
    const draft = jobs.filter((j) => j.status === 'draft').length;
    const expiringSoon = jobs.filter((j) => j.status === 'active' && j.isExpiringSoon).length;
    const totalApplicants = jobs.reduce((acc, cur) => acc + cur.applicantsCount, 0);

    return { total, active, expired, draft, expiringSoon, totalApplicants };
  }, [jobs]);

  // Format date display: YYYY-MM-DD -> DD/MM/YYYY
  const formatDateDisplay = (isoStr: string) => {
    if (!isoStr) return '--';
    const parts = isoStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
  };

  return (
    <div className="space-y-6 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200',
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          )}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. TOP HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <Link href="/recruiter" className="hover:text-blue-600 transition-colors">
              Recruiter Workspace
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Quản lý tin tuyển dụng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-blue-600" />
            <span>Quản Lý Tin Tuyển Dụng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Soạn thảo tin từ Yêu cầu đã duyệt, kiểm soát hạn nộp hồ sơ và thiết lập tự động hết hạn tin đăng.
          </p>
        </div>

        {/* Nút Tạo tin tuyển dụng (User Story 1) */}
        <button
          type="button"
          onClick={() => {
            setSelectedReqId('');
            setPrefillNotice(null);
            setIsCreateModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Tạo Tin Tuyển Dụng Mới</span>
        </button>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số tin */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Tổng số tin</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400 font-semibold">vị trí</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Thu hút tổng cộng <strong className="text-slate-700">{stats.totalApplicants} hồ sơ</strong>
          </p>
        </div>

        {/* Card 2: Đang đăng (Active) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đang đăng tuyển
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.active}</span>
            <span className="text-xs text-emerald-600 font-semibold">tin mở</span>
          </div>
          <p className="text-[11px] text-emerald-600/90 font-medium">Hiển thị công khai trên cổng Job</p>
        </div>

        {/* Card 3: Sắp hết hạn (Expiring Soon - Cảnh báo đỏ) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Sắp hết hạn
            </span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">
              {stats.expiringSoon}
            </span>
            <span className="text-xs text-rose-500 font-semibold">tin &le; 5 ngày</span>
          </div>
          <p className="text-[11px] text-rose-500 font-medium">Cần gia hạn hoặc đóng ứng tuyển</p>
        </div>

        {/* Card 4: Bản nháp & Hết hạn */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Bản nháp / Hết hạn</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-700">
              {stats.draft + stats.expired}
            </span>
            <span className="text-xs text-slate-400 font-semibold">tin lưu</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {stats.draft} bản nháp &bull; {stats.expired} đã đóng
          </p>
        </div>
      </div>

      {/* 3. FILTER BAR & VIEW TOGGLE */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Search box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề tin, mã JOB hoặc phòng ban..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Right: Status Filters & View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              )}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'hover:text-slate-900'
              )}
            >
              Đang đăng ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('expiring')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'expiring'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'hover:text-slate-900'
              )}
            >
              Sắp hết hạn ({stats.expiringSoon})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('expired')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'expired'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              )}
            >
              Hết hạn ({stats.expired})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'draft' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              )}
            >
              Bản nháp ({stats.draft})
            </button>
          </div>

          {/* Table / Grid View switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-slate-500">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-1.5 rounded-xl transition-colors cursor-pointer',
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              )}
              title="Xem dạng Bảng (Table)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-1.5 rounded-xl transition-colors cursor-pointer',
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              )}
              title="Xem dạng Thẻ (Grid Cards)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN JOB LISTINGS (TABLE OR GRID) */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-slate-800">Không tìm thấy tin tuyển dụng nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Không có kết quả phù hợp với bộ lọc hiện tại. Vui lòng thử tìm kiếm với từ khóa khác hoặc tạo tin mới.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Tin Tuyển Dụng</th>
                  <th className="py-4 px-4">Phòng Ban & Đãi Ngộ</th>
                  <th className="py-4 px-4 text-center">Trạng Thái</th>
                  <th className="py-4 px-4">Ngày Hết Hạn</th>
                  <th className="py-4 px-4 text-center">Hồ Sơ Nộp</th>
                  <th className="py-4 px-6 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredJobs.map((job) => {
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Cột 1: Thông tin tin đăng */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {job.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono font-semibold text-slate-500">{job.id}</span>
                            {job.requisitionCode && (
                              <>
                                <span>&bull;</span>
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                                  {job.requisitionCode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Phòng ban & Đãi ngộ */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{job.department}</span>
                          </div>
                          <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{job.salary}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Badge Trạng thái chuẩn (Đang đăng - Xanh, Hết hạn - Đỏ, Bản nháp - Xám) */}
                      <td className="py-4 px-4 text-center">
                        {job.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang đăng
                          </span>
                        ) : job.status === 'expired' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-extrabold shadow-xs">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            Hết hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-extrabold">
                            Bản nháp
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Ngày hết hạn (Hiển thị MÀU ĐỎ nếu sắp hết hạn <= 5 ngày hoặc đã quá hạn) */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div
                            className={clsx(
                              'font-extrabold flex items-center gap-1.5',
                              job.isExpiringSoon || job.status === 'expired'
                                ? 'text-rose-600'
                                : 'text-slate-700'
                            )}
                          >
                            <Calendar
                              className={clsx(
                                'w-3.5 h-3.5',
                                job.isExpiringSoon || job.status === 'expired'
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              )}
                            />
                            <span>{formatDateDisplay(job.expiryDate)}</span>
                          </div>

                          {/* Dòng cảnh báo thời gian */}
                          {job.status === 'active' && job.isExpiringSoon && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Sắp hết hạn: còn {job.daysLeft} ngày
                            </span>
                          )}

                          {job.status === 'active' && !job.isExpiringSoon && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Còn {job.daysLeft} ngày
                            </span>
                          )}

                          {job.status === 'expired' && (
                            <span className="text-[10px] text-rose-500 font-bold">
                              Đã đóng tuyển dụng
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Số hồ sơ nộp */}
                      <td className="py-4 px-4 text-center">
                        <div className="space-y-0.5">
                          <span className="font-black text-sm text-slate-900">
                            {job.applicantsCount} CV
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            Chỉ tiêu: {job.headcount}
                          </span>
                        </div>
                      </td>

                      {/* Cột 6: Menu hành động (3 chấm) */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          <Link
                            href="/recruiter/pipeline"
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-all"
                          >
                            <span>Pipeline</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>

                          {/* Nút 3 chấm mở Dropdown menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId(
                                  openActionMenuId === job.id ? null : job.id
                                )
                              }
                              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                              title="Tùy chọn thao tác"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu của từng dòng */}
                            {openActionMenuId === job.id && (
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                  Hành động tin #{job.id}
                                </div>

                                {/* Tính năng 1: Gỡ tin ngay (Unpublish) */}
                                {job.status === 'active' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUnpublish(job)}
                                    className="w-full px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <EyeOff className="w-4 h-4" />
                                    <span>Gỡ tin ngay (Unpublish)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRepublish(job)}
                                    className="w-full px-3.5 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>Đăng lại tin này</span>
                                  </button>
                                )}

                                {/* Tính năng 2: Cài đặt tự động hết hạn (Set Expiry Date) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenSetExpiry(job)}
                                  className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span>Cài đặt tự động hết hạn</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <Link
                                  href="/recruiter/pipeline"
                                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                  onClick={() => setOpenActionMenuId(null)}
                                >
                                  <Users className="w-4 h-4 text-slate-400" />
                                  <span>Xem hồ sơ ứng viên</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `https://careers.company.com/jobs/${job.id}`
                                    );
                                    showToast('Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm!');
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Share2 className="w-4 h-4 text-slate-400" />
                                  <span>Sao chép link công khai</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative"
            >
              <div className="space-y-3">
                {/* Header Card: ID, Badges & 3-dot menu */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-slate-400">
                      {job.id}
                    </span>
                    {job.requisitionCode && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                        {job.requisitionCode}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  {job.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đang đăng
                    </span>
                  ) : job.status === 'expired' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      Hết hạn
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold">
                      Bản nháp
                    </span>
                  )}
                </div>

                {/* Job Title */}
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.department}</span>
                  </p>
                </div>

                {/* Details snippet */}
                <div className="p-3.5 rounded-2xl bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-400">Đãi ngộ:</span>
                    <span className="text-blue-600 font-extrabold">{job.salary}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-400">Địa điểm:</span>
                    <span className="text-slate-700 truncate max-w-[170px]">{job.location}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-400">Hạn nộp:</span>
                    <span
                      className={clsx(
                        'font-black flex items-center gap-1',
                        job.isExpiringSoon || job.status === 'expired'
                          ? 'text-rose-600'
                          : 'text-slate-700'
                      )}
                    >
                      <Calendar className="w-3 h-3" />
                      {formatDateDisplay(job.expiryDate)}
                    </span>
                  </div>
                </div>

                {/* Expiring Soon alert badge for Card view */}
                {job.status === 'active' && job.isExpiringSoon && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Sắp hết hạn: Chỉ còn {job.daysLeft} ngày nữa!</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Applicants count & Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-slate-900">
                    {job.applicantsCount} hồ sơ
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Chỉ tiêu: {job.headcount}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenSetExpiry(job)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    title="Cài đặt tự động hết hạn"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                  </button>

                  {job.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleOpenUnpublish(job)}
                      className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                      title="Gỡ tin ngay"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <Link
                    href="/recruiter/pipeline"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Pipeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: TẠO TIN TUYỂN DỤNG MỚI (User Story 1 & Form)      */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Soạn Thảo Tin Tuyển Dụng Mới
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Chọn yêu cầu đã duyệt để tự động điền sẵn thông tin hoặc tự soạn thảo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateJob} className="p-6 sm:p-7 space-y-6 text-xs flex-1">
              {/* PHẦN TRỌNG TÂM: Chọn Yêu Cầu Tuyển Dụng Đã Duyệt (Pre-fill) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-2 border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    <label className="font-extrabold text-sm text-slate-900">
                      Chọn Yêu cầu tuyển dụng đã duyệt (Tự động điền dữ liệu)
                    </label>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Tính năng thông minh
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Hệ thống sẽ tự động điền Tiêu đề, Phòng ban, Mức lương, JD, Yêu cầu và Quyền lợi từ Yêu cầu đã được Ban Giám Đốc và HR duyệt.
                </p>

                {/* Dropdown Requisitions */}
                <div className="relative">
                  <select
                    value={selectedReqId}
                    onChange={(e) => handleSelectRequisition(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shadow-xs appearance-none pr-10"
                  >
                    <option value="">-- Bấm để chọn Yêu cầu tuyển dụng đã duyệt --</option>
                    {APPROVED_REQUISITIONS.map((req) => (
                      <option key={req.id} value={req.id}>
                        [{req.code}] {req.title} - {req.department} ({req.salary})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-blue-600 absolute right-3.5 top-3 pointer-events-none" />
                </div>

                {/* Notice thông báo đã pre-fill */}
                {prefillNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{prefillNotice}</span>
                  </div>
                )}
              </div>

              {/* Thông tin cốt lõi của Tin Tuyển Dụng */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  Thông Tin Chung Tin Tuyển Dụng
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tiêu đề tin */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      Tiêu đề tin tuyển dụng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="Ví dụ: Senior Backend Engineer (Go/Python)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Phòng ban */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Phòng ban</label>
                    <input
                      type="text"
                      value={createForm.department}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, department: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Mức lương đãi ngộ */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Mức lương đãi ngộ (Công khai)
                    </label>
                    <input
                      type="text"
                      value={createForm.salary}
                      onChange={(e) => setCreateForm({ ...createForm, salary: e.target.value })}
                      placeholder="Ví dụ: 35 - 55 Triệu VNĐ hoặc Thỏa thuận"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Địa điểm làm việc */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Địa điểm làm việc</label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Chỉ tiêu số lượng */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Số lượng cần tuyển</label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.headcount}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, headcount: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cài đặt thời hạn & Tự động hết hạn (User Story 2) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Thời Hạn & Cài Đặt Tự Động Hết Hạn</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngày hết hạn tin</label>
                    <input
                      type="date"
                      value={createForm.expiryDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, expiryDate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.autoUnpublish}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, autoUnpublish: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-800 text-xs">
                        Tự động gỡ tin (Unpublish) khi đến ngày hết hạn
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-6">
                      Hệ thống sẽ tự động chuyển tin về trạng thái Hết hạn để tránh ứng viên nộp trễ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nội dung JD, Yêu cầu & Quyền lợi */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  Nội Dung Chi Tiết (JD)
                </h3>

                {/* Mô tả công việc */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Mô tả công việc (JD)</label>
                  <textarea
                    rows={4}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, description: e.target.value })
                    }
                    placeholder="Mô tả trách nhiệm công việc..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                  />
                </div>

                {/* Yêu cầu ứng viên */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Yêu cầu ứng viên</label>
                  <textarea
                    rows={4}
                    value={createForm.requirements}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, requirements: e.target.value })
                    }
                    placeholder="Kinh nghiệm, kỹ năng cần thiết..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                  />
                </div>

                {/* Quyền lợi */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Chế độ đãi ngộ & Quyền lợi</label>
                  <textarea
                    rows={3}
                    value={createForm.benefits}
                    onChange={(e) => setCreateForm({ ...createForm, benefits: e.target.value })}
                    placeholder="Chế độ bảo hiểm, thưởng, phúc lợi..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateForm({ ...createForm, status: 'draft' });
                    setTimeout(() => {
                      const dummyEvent = { preventDefault: () => {} } as React.FormEvent;
                      handleCreateJob(dummyEvent);
                    }, 50);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold transition-colors cursor-pointer"
                >
                  Lưu bản nháp
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Xuất Bản & Đăng Tin Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CÀI ĐẶT TỰ ĐỘNG HẾT HẠN (Set Expiry Date Modal)   */}
      {/* ======================================================== */}
      {isExpiryModalOpen && jobToSetExpiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Cài Đặt Tự Động Hết Hạn</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Mã tin: {jobToSetExpiry.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpiryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Job Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="font-extrabold text-slate-900 text-xs">{jobToSetExpiry.title}</div>
              <div className="text-[11px] text-slate-500">
                Ngày hết hạn hiện tại:{' '}
                <strong className="text-slate-800">{formatDateDisplay(jobToSetExpiry.expiryDate)}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveExpiry} className="space-y-4">
              {/* Preset buttons */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Gia hạn nhanh:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date('2026-10-11');
                      d.setDate(d.getDate() + 7);
                      setNewExpiryDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-[11px] transition-colors cursor-pointer text-center"
                  >
                    + 7 Ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date('2026-10-11');
                      d.setDate(d.getDate() + 15);
                      setNewExpiryDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-[11px] transition-colors cursor-pointer text-center"
                  >
                    + 15 Ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date('2026-10-11');
                      d.setDate(d.getDate() + 30);
                      setNewExpiryDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-[11px] transition-colors cursor-pointer text-center"
                  >
                    + 30 Ngày
                  </button>
                </div>
              </div>

              {/* Custom Date Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn ngày hết hạn mới:</label>
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Auto Unpublish checkbox */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAutoUnpublish}
                    onChange={(e) => setNewAutoUnpublish(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="font-extrabold text-blue-900 text-xs">
                    Tự động gỡ tin ngay khi chạm mốc thời gian
                  </span>
                </label>
                <p className="text-[10px] text-blue-700 ml-6">
                  Tin sẽ tự động chuyển sang trạng thái "Hết hạn" và ẩn khỏi website công khai.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExpiryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Lưu Cài Đặt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: XÁC NHẬN GỠ TIN NGAY (Unpublish Confirmation)    */}
      {/* ======================================================== */}
      {isUnpublishModalOpen && jobToUnpublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <EyeOff className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">Gỡ Tin Tuyển Dụng Ngay?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn gỡ tin <strong>{jobToUnpublish.title}</strong> (
                {jobToUnpublish.id}) khỏi cổng việc làm công khai không?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-rose-800 text-[11px] leading-relaxed">
              ⚠️ Ứng viên sẽ không thể tìm thấy hoặc nộp thêm CV vào vị trí này nữa. Các hồ sơ đã nộp vẫn sẽ được bảo lưu trong Pipeline.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUnpublishModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmUnpublish}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Gỡ Tin Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
