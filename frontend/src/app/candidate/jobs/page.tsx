'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  CheckCircle2,
  ChevronRight,
  Filter,
  X,
  UploadCloud,
  FileText,
  Sparkles,
  Share2,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Check,
  ShieldCheck,
  Award,
  Zap,
  Phone,
  Mail,
  User,
  SlidersHorizontal,
  Layers,
  Calendar,
} from 'lucide-react';
import clsx from 'clsx';

// ==========================================
// 1. DATA TYPES
// ==========================================

export interface CandidateJob {
  id: string;
  code: string;
  title: string;
  department: string;
  location: string;
  workMode: 'Onsite' | 'Hybrid' | 'Remote';
  salaryRange: string;
  level: string;
  experience: string;
  deadline: string;
  daysLeft: number;
  skills: string[];
  isHot?: boolean;
  isUrgent?: boolean;
  hasApplied?: boolean;
  description: string[];
  requirements: string[];
  benefits: string[];
  hiringProcess: { step: number; name: string; desc: string }[];
}

// ==========================================
// 2. MOCK JOB LISTINGS (US1: Public Jobs accessible when logged in)
// ==========================================

const INITIAL_JOBS: CandidateJob[] = [
  {
    id: 'job-01',
    code: 'JOB-2026-01',
    title: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    workMode: 'Hybrid',
    salaryRange: '45 - 55 Triệu VNĐ',
    level: 'Senior / Lead',
    experience: 'Từ 4 năm kinh nghiệm',
    deadline: '25/10/2026',
    daysLeft: 14,
    skills: ['Golang', 'Python', 'Kafka', 'Kubernetes', 'PostgreSQL', 'Microservices'],
    isHot: true,
    isUrgent: true,
    hasApplied: false,
    description: [
      'Thiết kế và triển khai kiến trúc Microservices chịu tải cao (hơn 50.000 RPS) cho hệ thống lõi Enterprise.',
      'Tối ưu hóa hiệu năng cơ sở dữ liệu phân tán PostgreSQL, Redis Cluster và hệ thống truyền thông điệp Apache Kafka.',
      'Xây dựng các API Gateway, gRPC services và đồng bộ hóa dữ liệu thời gian thực.',
      'Phối hợp chặt chẽ với đội ngũ DevOps và Product Owner để liên tục cải tiến hệ thống CI/CD và kiến trúc hạ tầng.',
    ],
    requirements: [
      'Từ 4+ năm kinh nghiệm lập trình Backend với Golang hoặc Python.',
      'Nắm vững kiến trúc phần mềm Clean Architecture, Microservices, Domain-Driven Design (DDD).',
      'Có kinh nghiệm làm việc thực tế với Kafka/RabbitMQ, Redis, Docker và Kubernetes.',
      'Tư duy giải quyết vấn đề tốt, khả năng đọc hiểu và giao tiếp tài liệu kỹ thuật tiếng Anh trôi chảy.',
    ],
    benefits: [
      'Thu nhập cạnh tranh: 45 - 55 Triệu VNĐ/tháng + Lương tháng 13 & Thưởng hiệu suất KPI lên tới 3 tháng lương.',
      'Gói Sign-on Bonus chào mừng 20 Triệu VNĐ cho ứng viên xuất sắc nhận việc trong tháng 10.',
      'Cấp mới 100% thiết bị làm việc: MacBook Pro M3 Max / Dell XPS + Màn hình Dell Ultrasharp 27 inch 4K.',
      'Bảo hiểm sức khỏe cao cấp PVI Care toàn diện cho cá nhân và hỗ trợ 50% cho người thân.',
      'Chế độ làm việc Hybrid linh hoạt (2 ngày WFH/tuần), thời gian làm việc thoải mái không chấm công gò bó.',
    ],
    hiringProcess: [
      { step: 1, name: 'Sàng lọc hồ sơ', desc: 'Phản hồi kết quả CV trong 48 giờ' },
      { step: 2, name: 'Phỏng vấn Kỹ thuật (Online)', desc: 'Trao đổi chuyên môn & System Design cùng Tech Director' },
      { step: 3, name: 'Phỏng vấn Ban Giám Đốc', desc: 'Gặp gỡ Giám đốc Khối Công nghệ & Văn hóa tổ chức' },
      { step: 4, name: 'Gửi Thư Mời (Offer)', desc: 'Thống nhất đãi ngộ & chào đón gia nhập' },
    ],
  },
  {
    id: 'job-02',
    code: 'JOB-2026-02',
    title: 'Frontend React Lead (Next.js 16/React 19)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    workMode: 'Hybrid',
    salaryRange: '40 - 50 Triệu VNĐ',
    level: 'Lead Engineer',
    experience: 'Từ 4 năm kinh nghiệm',
    deadline: '28/10/2026',
    daysLeft: 17,
    skills: ['React 19', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Design System', 'Web Vitals'],
    isHot: true,
    hasApplied: false,
    description: [
      'Dẫn dắt kiến trúc Frontend cho toàn bộ hệ thống SaaS Enterprise phục vụ hàng trăm nghìn người dùng doanh nghiệp.',
      'Xây dựng và phát triển thư viện Design System chuẩn mực, tái sử dụng cao trên nền React 19 và Tailwind CSS.',
      'Tối ưu hóa chỉ số Core Web Vitals (LCP, INP, CLS), áp dụng Server Components và Streaming SSR.',
      'Mentor và đào tạo các kỹ sư Frontend trẻ trong đội ngũ.',
    ],
    requirements: [
      'Từ 4+ năm kinh nghiệm phát triển ứng dụng web hiện đại với React, TypeScript và Next.js.',
      'Hiểu sâu kiến trúc State Management, Server Actions, Rendering Patterns và Testing (Jest, Playwright).',
      'Có mắt thẩm mỹ tốt, đam mê trải nghiệm người dùng mượt mà và chuyển động Micro-animations.',
    ],
    benefits: [
      'Mức lương 40 - 50 Triệu VNĐ + Thưởng dự án & Cổ phần ESOP theo lộ trình phát triển.',
      'Làm việc cùng các chuyên gia UI/UX hàng đầu, môi trường Agile chuyên nghiệp.',
      'Chính sách đào tạo: Tài trợ 100% ngân sách tham gia các hội nghị công nghệ quốc tế.',
    ],
    hiringProcess: [
      { step: 1, name: 'Sàng lọc CV', desc: 'Xem xét portfolio & dự án tiêu biểu' },
      { step: 2, name: 'Phỏng vấn Kỹ thuật', desc: 'Thảo luận kiến trúc Frontend & Live Coding' },
      { step: 3, name: 'Trao đổi Văn hóa', desc: 'Gặp gỡ VP of Engineering' },
      { step: 4, name: 'Phát hành Offer', desc: 'Thống nhất ngày nhận việc' },
    ],
  },
  {
    id: 'job-03',
    code: 'JOB-2026-03',
    title: 'Product Owner / BA Lead',
    department: 'Khối Phát Triển Sản Phẩm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    workMode: 'Onsite',
    salaryRange: '32 - 42 Triệu VNĐ',
    level: 'Lead / Manager',
    experience: 'Từ 3 năm kinh nghiệm',
    deadline: '20/10/2026',
    daysLeft: 9,
    skills: ['Agile/Scrum', 'Product Roadmap', 'Jira', 'Data Analytics', 'Wireframing', 'User Stories'],
    isUrgent: true,
    hasApplied: false,
    description: [
      'Xác định tầm nhìn sản phẩm (Product Vision), xây dựng Roadmap và quản trị Product Backlog.',
      'Chuyển đổi các bài toán kinh doanh phức tạp thành User Stories và Acceptance Criteria chi tiết.',
      'Làm việc chặt chẽ cùng các bên liên quan (Stakeholders) và Tech Lead để đảm bảo tiến độ bàn giao sprint.',
    ],
    requirements: [
      'Từ 3+ năm kinh nghiệm ở vị trí Product Owner hoặc Senior Business Analyst trong mảng phần mềm B2B/SaaS.',
      'Chứng chỉ CSPO/PSPO là một lợi thế lớn.',
      'Kỹ năng giao tiếp xuất sắc, tiếng Anh lưu loát trong môi trường quốc tế.',
    ],
    benefits: [
      'Mức lương 32 - 42 Triệu VNĐ + Thưởng hiệu quả sản phẩm khi đạt mốc tăng trưởng người dùng.',
      'Trực tiếp định hình sản phẩm chiến lược của công ty vươn tầm khu vực Đông Nam Á.',
      'Gói khám sức khỏe VIP hàng năm tại bệnh viện quốc tế Vinmec.',
    ],
    hiringProcess: [
      { step: 1, name: 'CV Review', desc: 'Đánh giá kinh nghiệm sản phẩm' },
      { step: 2, name: 'Product Case Study', desc: 'Trình bày giải pháp sản phẩm cùng CPO' },
      { step: 3, name: 'Phỏng vấn Ban Giám Đốc', desc: 'Thống nhất tầm nhìn' },
      { step: 4, name: 'Chốt Offer', desc: 'Hoàn tất thủ tục' },
    ],
  },
  {
    id: 'job-04',
    code: 'JOB-2026-04',
    title: 'DevOps / Cloud Solutions Architect',
    department: 'Khối Vận Hành & Hạ Tầng',
    location: 'Hà Nội / Remote Linh Hoạt',
    workMode: 'Remote',
    salaryRange: '38 - 48 Triệu VNĐ',
    level: 'Senior Architect',
    experience: 'Từ 4 năm kinh nghiệm',
    deadline: '30/10/2026',
    daysLeft: 19,
    skills: ['AWS', 'Kubernetes', 'Terraform', 'ArgoCD', 'CI/CD', 'Prometheus', 'Grafana'],
    hasApplied: false,
    description: [
      'Quản trị và vận hành cụm Kubernetes (EKS) môi trường Production chịu tải lớn.',
      'Tự động hóa toàn diện hạ tầng bằng Terraform (Infrastructure as Code) và GitOps qua ArgoCD.',
      'Thiết lập hệ thống giám sát cảnh báo Prometheus, Grafana, ELK Stack và đảm bảo SLA 99.99%.',
    ],
    requirements: [
      'Có chứng chỉ AWS Solutions Architect Professional hoặc CKA (Certified Kubernetes Administrator).',
      'Thành thạo Linux, mạng máy tính, bảo mật đám mây và tối ưu hóa chi phí hạ tầng AWS/GCP.',
    ],
    benefits: [
      'Lương 38 - 48 Triệu VNĐ + Ngân sách thi chứng chỉ quốc tế tài trợ 100%.',
      'Chính sách làm việc Remote hoàn toàn, chỉ lên văn phòng khi có sự kiện quý.',
    ],
    hiringProcess: [
      { step: 1, name: 'Sàng lọc hồ sơ', desc: 'Đánh giá kinh nghiệm Cloud & K8s' },
      { step: 2, name: 'Trao đổi Kỹ thuật', desc: 'Kiến trúc hạ tầng cùng Infra Director' },
      { step: 3, name: 'Phỏng vấn Văn hóa & Offer', desc: 'Phát hành thư mời chính thức' },
    ],
  },
  {
    id: 'job-05',
    code: 'JOB-2026-05',
    title: 'Senior UI/UX Designer (Design System)',
    department: 'Khối Phát Triển Sản Phẩm',
    location: 'Hà Nội (Keangnam Landmark 72)',
    workMode: 'Hybrid',
    salaryRange: '28 - 38 Triệu VNĐ',
    level: 'Senior Specialist',
    experience: 'Từ 3 năm kinh nghiệm',
    deadline: '05/11/2026',
    daysLeft: 25,
    skills: ['Figma', 'Design System', 'Prototyping', 'User Research', 'Micro-interactions'],
    hasApplied: false,
    description: [
      'Thiết kế giao diện người dùng (UI) hiện đại, tinh tế cho các ứng dụng Web và Mobile.',
      'Duy trì và mở rộng Design System toàn công ty theo tiêu chuẩn Material Design 3 và Atomic Design.',
      'Tiến hành nghiên cứu người dùng (User Research) và kiểm thử khả năng sử dụng (Usability Testing).',
    ],
    requirements: [
      'Portfolio thiết kế xuất sắc với các sản phẩm SaaS, Dashboard hoặc B2B phức tạp.',
      'Thành thạo Figma Variables, Auto Layout, Interactive Components và các công cụ Prototype.',
    ],
    benefits: [
      'Thu nhập 28 - 38 Triệu VNĐ/tháng + Thưởng dự án.',
      'Môi trường đề cao tư duy thiết kế (Design-driven culture), tự do sáng tạo.',
    ],
    hiringProcess: [
      { step: 1, name: 'Portfolio Review', desc: 'Đánh giá gu thẩm mỹ & tư duy UX' },
      { step: 2, name: 'Design Case Study', desc: 'Thuyết trình dự án tiêu biểu' },
      { step: 3, name: 'Offer', desc: 'Gửi thư mời nhận việc' },
    ],
  },
  {
    id: 'job-06',
    code: 'JOB-2026-06',
    title: 'AI / GenAI Research Engineer',
    department: 'Viện Công Nghệ & AI',
    location: 'Hà Nội (Keangnam Landmark 72)',
    workMode: 'Hybrid',
    salaryRange: '50 - 70 Triệu VNĐ',
    level: 'Lead / Principal',
    experience: 'Từ 3 năm kinh nghiệm',
    deadline: '15/11/2026',
    daysLeft: 35,
    skills: ['PyTorch', 'LLMs', 'RAG Architecture', 'LangChain', 'Python', 'Vector DB'],
    isHot: true,
    hasApplied: false,
    description: [
      'Nghiên cứu và phát triển các mô hình ngôn ngữ lớn (LLM), kỹ thuật Retrieval-Augmented Generation (RAG).',
      'Tích hợp các tác nhân AI (AI Agents) tự động hóa quy trình sàng lọc hồ sơ và tuyển dụng thông minh.',
      'Fine-tuning mô hình mã nguồn mở (Llama, Mistral) và tối ưu hóa chi phí suy luận (Inference).',
    ],
    requirements: [
      'Có nền tảng vững chắc về Khoa học máy tính, Học máy và Xử lý ngôn ngữ tự nhiên (NLP).',
      'Đã từng xây dựng các ứng dụng GenAI thực tế chạy trên Production.',
    ],
    benefits: [
      'Mức đãi ngộ đặc biệt: 50 - 70 Triệu VNĐ + Gói cổ phần ESOP.',
      'Được trang bị cụm GPU NVIDIA H100/A100 để nghiên cứu và huấn luyện mô hình.',
    ],
    hiringProcess: [
      { step: 1, name: 'Hồ sơ nghiên cứu', desc: 'Xem xét các bài báo & dự án AI' },
      { step: 2, name: 'Phỏng vấn chuyên sâu', desc: 'Trao đổi cùng Head of AI' },
      { step: 3, name: 'Thương lượng đãi ngộ', desc: 'Chốt gói thu nhập hấp dẫn' },
    ],
  },
];

export default function CandidateJobsPage() {
  const [jobs, setJobs] = useState<CandidateJob[]>(INITIAL_JOBS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedWorkMode, setSelectedWorkMode] = useState('all');
  const [savedJobIds, setSavedJobIds] = useState<string[]>(['job-01']);
  const [toast, setToast] = useState<string | null>(null);

  // Modal / Slide-over: Xem Chi Tiết JD
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<CandidateJob | null>(null);

  // Modal Ứng Tuyển Tối Ưu Mobile (Mobile Friendly Apply Modal)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [jobToApply, setJobToApply] = useState<CandidateJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Ứng Tuyển State (Pre-filled theo tài khoản mẫu: candidate@company.com)
  const [applyForm, setApplyForm] = useState({
    fullName: 'Nguyễn Văn An',
    phone: '0912 345 678',
    email: 'candidate@company.com',
    uploadedFileName: 'CV_NguyenVanAn_Backend_Senior.pdf',
    fileSizeDisplay: '2.4 MB (Đã lưu trong hồ sơ)',
    isUsingExistingCV: true,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  // Toggle Lưu việc làm (Bookmark)
  const handleToggleSaveJob = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedJobIds.includes(jobId)) {
      setSavedJobIds(savedJobIds.filter((id) => id !== jobId));
      showToast('Đã bỏ lưu vị trí việc làm.');
    } else {
      setSavedJobIds([...savedJobIds, jobId]);
      showToast('Đã lưu vị trí việc làm vào danh sách yêu thích!');
    }
  };

  // Mở Form Ứng Tuyển
  const handleOpenApplyModal = (job: CandidateJob, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setJobToApply(job);
    setIsApplyModalOpen(true);
  };

  // Xử lý nộp hồ sơ (Mobile Friendly Submission)
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobToApply) return;

    if (!applyForm.fullName.trim() || !applyForm.phone.trim()) {
      alert('Vui lòng điền đầy đủ Họ tên và Số điện thoại');
      return;
    }

    setIsSubmitting(true);

    // Mô phỏng tiến trình tải lên & nộp hồ sơ
    setTimeout(() => {
      setIsSubmitting(false);
      setIsApplyModalOpen(false);

      // Đánh dấu job này đã nộp
      setJobs((prev) =>
        prev.map((j) => (j.id === jobToApply.id ? { ...j, hasApplied: true } : j))
      );

      if (selectedJobForDetail && selectedJobForDetail.id === jobToApply.id) {
        setSelectedJobForDetail({ ...selectedJobForDetail, hasApplied: true });
      }

      showToast(
        `Nộp hồ sơ thành công cho vị trí "${jobToApply.title}"! Mã hồ sơ: APP-${Date.now().toString().slice(-4)}. Bộ phận Tuyển dụng sẽ phản hồi trong 48 giờ.`
      );
    }, 1000);
  };

  // Giả lập chọn file CV mới từ điện thoại / máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setApplyForm({
        ...applyForm,
        uploadedFileName: file.name,
        fileSizeDisplay: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        isUsingExistingCV: false,
      });
      showToast(`Đã chọn file CV: ${file.name}`);
    }
  };

  // Lọc danh sách việc làm
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.code.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === 'all' || job.department === selectedDept;
      const matchWorkMode = selectedWorkMode === 'all' || job.workMode === selectedWorkMode;

      return matchSearch && matchDept && matchWorkMode;
    });
  }, [jobs, searchTerm, selectedDept, selectedWorkMode]);

  return (
    <div className="space-y-6 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. TOP HERO BANNER & WELCOME */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-extrabold border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Chào mừng Nguyễn Văn An (candidate@company.com)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Khám Phá Cơ Hội Nghề Nghiệp Đột Phá
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed">
            Hơn 15+ vị trí tuyển dụng cấp cao đang mở tại Enterprise ATS. Hồ sơ của bạn đã sẵn sàng nộp ứng tuyển chỉ với 1 cú chạm.
          </p>
        </div>

        {/* Search Bar in Hero */}
        <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-3xl">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm vị trí, kỹ năng (Golang, React, Figma, Cloud)..."
              className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 rounded-2xl text-xs sm:text-sm font-semibold placeholder:text-slate-400 focus:outline-none shadow-md"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className="text-slate-900">Tất cả Khối</option>
              <option value="Khối Công Nghệ & Phần Mềm" className="text-slate-900">Khối Công Nghệ</option>
              <option value="Khối Phát Triển Sản Phẩm" className="text-slate-900">Khối Sản Phẩm</option>
              <option value="Khối Vận Hành & Hạ Tầng" className="text-slate-900">Khối Hạ Tầng</option>
              <option value="Viện Công Nghệ & AI" className="text-slate-900">Viện AI</option>
            </select>

            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className="text-slate-900">Tất cả hình thức</option>
              <option value="Hybrid" className="text-slate-900">🏢 Hybrid (Linh hoạt)</option>
              <option value="Remote" className="text-slate-900">🌐 Remote (Từ xa)</option>
              <option value="Onsite" className="text-slate-900">📍 Onsite</option>
            </select>
          </div>
        </div>

        {/* Background decorative glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. TOOLBAR & STATS */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
        <div>
          Hiển thị <span className="text-slate-900 font-black">{filteredJobs.length}</span> vị trí tuyển dụng phù hợp
        </div>

        <div className="flex items-center gap-2">
          <span>Sắp xếp theo: <strong>Mới nhất</strong></span>
        </div>
      </div>

      {/* 3. GRID THẺ CARD VIỆC LÀM (User Story 1 - Public Jobs Grid Card) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredJobs.map((job) => {
          const isSaved = savedJobIds.includes(job.id);

          return (
            <div
              key={job.id}
              onClick={() => setSelectedJobForDetail(job)}
              className={clsx(
                'bg-white rounded-3xl p-5 border shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between group space-y-4 relative overflow-hidden',
                job.hasApplied
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-100 hover:border-blue-300'
              )}
            >
              {/* Card Top: Badges & Save button */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {job.isHot && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-rose-600 fill-rose-600" />
                        <span>Hot</span>
                      </span>
                    )}
                    {job.isUrgent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase">
                        Tuyển Gấp
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      {job.workMode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleSaveJob(job.id, e)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    title={isSaved ? 'Bỏ lưu' : 'Lưu tin này'}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-blue-600 fill-blue-600" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Job Title & Department */}
                <div>
                  <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                    {job.department}
                  </p>
                </div>

                {/* Salary & Location Highlights */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                      Mức lương:
                    </span>
                    <span className="font-black text-blue-700 text-sm">
                      {job.salaryRange}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Địa điểm:
                    </span>
                    <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                      {job.location.split('(')[0]}
                    </span>
                  </div>
                </div>

                {/* Tech Skills Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.skills.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-bold">
                      +{job.skills.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Deadline & Action Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Còn {job.daysLeft} ngày
                </span>

                {job.hasApplied ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã ứng tuyển</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleOpenApplyModal(job, e)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                  >
                    <span>Ứng tuyển ngay</span>
                    <ArrowRight className="w-3 h-3 stroke-[3]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 4. MODAL / SLIDE-OVER: CHI TIẾT VIỆC LÀM (JOB DETAIL)     */}
      {/* ======================================================== */}
      {selectedJobForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col text-xs animate-in zoom-in-95 duration-200">
            {/* Header JD */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] border border-blue-200">
                    {selectedJobForDetail.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                    {selectedJobForDetail.workMode}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                  {selectedJobForDetail.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedJobForDetail.department} &bull; {selectedJobForDetail.location}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJobForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Mức lương đề xuất</span>
                <span className="font-black text-blue-600 text-sm">
                  {selectedJobForDetail.salaryRange}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Kinh nghiệm yêu cầu</span>
                <span className="font-extrabold text-slate-800">
                  {selectedJobForDetail.experience}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Hạn nộp hồ sơ</span>
                <span className="font-extrabold text-slate-800">
                  {selectedJobForDetail.deadline}
                </span>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-6 space-y-6 text-slate-700 leading-relaxed text-xs">
              {/* 1. Mô tả công việc */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Mô Tả Công Việc (Job Description)</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
                  {selectedJobForDetail.description.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 2. Yêu cầu ứng viên */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Yêu Cầu Năng Lực & Kỹ Năng</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
                  {selectedJobForDetail.requirements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 3. Quyền lợi & Đãi ngộ */}
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Quyền Lợi & Chế Độ Đãi Ngộ</span>
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-xs">
                  {selectedJobForDetail.benefits.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 4. Quy trình tuyển dụng */}
              <div className="space-y-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <h4 className="font-black text-xs text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>Quy Trình Tuyển Dụng Nhanh (Fast-track 4 Bước)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedJobForDetail.hiringProcess.map((proc) => (
                    <div
                      key={proc.step}
                      className="p-2.5 rounded-xl bg-white border border-blue-200/60 space-y-0.5"
                    >
                      <span className="font-black text-[11px] text-blue-700 block">
                        Bước {proc.step}: {proc.name}
                      </span>
                      <p className="text-[10px] text-slate-500 leading-normal">{proc.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer with Big Apply Button */}
            <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between gap-4 sticky bottom-0">
              <span className="text-xs text-slate-400 font-medium">
                Mức lương: <strong className="text-blue-600 font-black">{selectedJobForDetail.salaryRange}</strong>
              </span>

              {selectedJobForDetail.hasApplied ? (
                <span className="px-6 py-3 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bạn đã nộp hồ sơ cho vị trí này</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenApplyModal(selectedJobForDetail)}
                  className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-500/25 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ứng Tuyển Vị Trí Này Ngay</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL NỘP HỒ SƠ ỨNG TUYỂN (MOBILE FRIENDLY APPLY MODAL)  */}
      {/* ======================================================== */}
      {isApplyModalOpen && jobToApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                    Nộp Hồ Sơ Ứng Tuyển
                  </h3>
                  <p className="text-[11px] text-blue-600 font-extrabold truncate max-w-[240px] sm:max-w-xs mt-0.5">
                    {jobToApply.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Friendly Form */}
            <form onSubmit={handleSubmitApplication} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Họ và tên (Large Touch Input) */}
              <div className="space-y-1">
                <label className="block font-extrabold text-slate-800 text-xs sm:text-sm">
                  Họ và tên *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={applyForm.fullName}
                    onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                    placeholder="Nhập họ và tên đầy đủ..."
                    className="w-full pl-10 pr-4 py-3.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white min-h-[48px]"
                  />
                </div>
              </div>

              {/* Số điện thoại (Large Touch Input) */}
              <div className="space-y-1">
                <label className="block font-extrabold text-slate-800 text-xs sm:text-sm">
                  Số điện thoại *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    required
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full pl-10 pr-4 py-3.5 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white min-h-[48px]"
                  />
                </div>
              </div>

              {/* Email (Pre-filled from logged in account) */}
              <div className="space-y-1">
                <label className="block font-extrabold text-slate-800 text-xs sm:text-sm">
                  Email liên hệ (Tự động điền theo tài khoản)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    readOnly
                    value={applyForm.email}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono font-bold text-slate-600 min-h-[48px] cursor-not-allowed"
                  />
                </div>
              </div>

              {/* VÙNG TẢI LÊN CV (UPLOAD ZONE - Mobile Touch Friendly) */}
              <div className="space-y-2 pt-1">
                <label className="block font-extrabold text-slate-800 text-xs sm:text-sm flex items-center justify-between">
                  <span>File CV đính kèm (PDF/DOCX) *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Tối đa 10MB</span>
                </label>

                {/* Box hiển thị file hiện tại */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border-2 border-blue-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 block truncate max-w-[200px] sm:max-w-xs">
                        {applyForm.uploadedFileName}
                      </span>
                      <span className="text-[10px] text-blue-700 font-medium">
                        {applyForm.fileSizeDisplay}
                      </span>
                    </div>
                  </div>

                  <span className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                </div>

                {/* Nút Upload hoặc kéo thả từ điện thoại */}
                <label className="mt-2 block border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50/60 rounded-2xl p-4 text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                    <span className="font-extrabold text-xs text-slate-800">
                      Chạm vào đây để chọn CV mới từ điện thoại / máy tính
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Hỗ trợ định dạng PDF, DOCX (Khuyên dùng PDF)
                    </span>
                  </div>
                </label>
              </div>

              {/* Cam kết bảo mật thông tin */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Hồ sơ của bạn được bảo mật tuyệt đối theo tiêu chuẩn ISO 27001 và chỉ được chuyển tiếp tới Hội đồng tuyển dụng của vị trí này.
                </span>
              </div>

              {/* Nút Nộp Hồ Sơ Lớn (Big Touch Button) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-sm sm:text-base shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-98 min-h-[52px] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải lên hồ sơ...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Xác Nhận Nộp Hồ Sơ Ứng Tuyển</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
