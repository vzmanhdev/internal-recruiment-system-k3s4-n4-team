'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import {
  Users,
  Search,
  Filter,
  Plus,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Sparkles,
  ExternalLink,
  Download,
  Upload,
  FileSpreadsheet,
  X,
  Tag,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  RotateCcw,
  Check,
  FileText,
  AlertCircle,
  MoreVertical,
  Mail,
  Phone,
  Eye,
  UserCheck,
  Send,
  Linkedin,
} from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import {
  MOCK_UNIFIED_CANDIDATES,
  UnifiedCandidate,
} from '@/features/candidates/mockCandidates';

export default function RecruiterCandidatesPage() {
  const [candidates, setCandidates] = useState<UnifiedCandidate[]>(MOCK_UNIFIED_CANDIDATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);

  // Modal State: Tải CV lên & Tự động bóc tách (AI Resume Parser)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStageText, setParseStageText] = useState('');
  const [parsedData, setParsedData] = useState<{
    name: string;
    email: string;
    phone: string;
    position: string;
    university: string;
    skills: string[];
    experience: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTag('all');
    setSelectedStatus('all');
    setSelectedSource('all');
    setSelectedSalaryRange('all');
    setSelectedSkill('all');
    showToast('Đã đặt lại toàn bộ bộ lọc!');
  };

  // ==========================================
  // XUẤT EXCEL (Export to Excel)
  // ==========================================
  const handleExportExcel = () => {
    try {
      const exportData = filteredCandidates.map((c, index) => ({
        STT: index + 1,
        'Mã Ứng Viên': c.id,
        'Họ và Tên': c.name,
        Email: c.email,
        'Số Điện Thoại': c.phone,
        'Vị Trí Gần Nhất': c.latestPosition,
        'Trạng Thái': c.latestStatus,
        'Nguồn Ứng Viên': c.source,
        'Mức Lương Mong Muốn': c.expectedSalary,
        'Kinh Nghiệm': c.experienceYears,
        'Trường Đại Học': c.university,
        'Số Lần Ứng Tuyển': c.applications.length,
        'Kỹ Năng': c.skills.join(', '),
        'Nhãn (Tags)': c.tags.join(', '),
        'Ngày Cập Nhật': c.updatedAt,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'HoSoUngVien');

      // Tạo và tải file
      XLSX.writeFile(workbook, `Danh_Sach_Ho_So_Hop_Nhat_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast(`Đã xuất thành công ${filteredCandidates.length} hồ sơ ra file Excel!`);
    } catch (err) {
      showToast('Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại.');
    }
  };

  // ==========================================
  // TỰ ĐỘNG BÓC TÁCH CV (AI Resume Parser Simulation)
  // ==========================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      simulateParsing(file.name);
    }
  };

  const simulateParsing = (fileName: string) => {
    setIsParsing(true);
    setParseProgress(15);
    setParseStageText('Đang đọc định dạng tệp và trích xuất văn bản thô...');
    setParsedData(null);

    setTimeout(() => {
      setParseProgress(45);
      setParseStageText('Mô hình AI đang bóc tách thực thể Tên, SĐT, Email, Học vấn...');
    }, 700);

    setTimeout(() => {
      setParseProgress(80);
      setParseStageText('Đang chuẩn hóa kỹ năng và phân tích số năm kinh nghiệm...');
    }, 1400);

    setTimeout(() => {
      setParseProgress(100);
      setParseStageText('Hoàn tất bóc tách dữ liệu!');
      setIsParsing(false);

      // Điền sẵn dữ liệu bóc tách được từ CV
      setParsedData({
        name: 'Đoàn Nhật Minh',
        email: 'nhatminh.doan@gmail.com',
        phone: '0978 654 321',
        position: 'Senior Backend Engineer (Go/Python)',
        university: 'Đại Học Bách Khoa Hà Nội (Khoa CNTT)',
        skills: ['Golang', 'PostgreSQL', 'Docker', 'Redis', 'Microservices', 'Kafka'],
        experience: '4.5 năm kinh nghiệm',
      });
    }, 2100);
  };

  const handleSaveParsedCandidate = () => {
    if (!parsedData) return;

    const newCandidate: UnifiedCandidate = {
      id: `CAN-${Math.floor(120 + Math.random() * 880)}`,
      name: parsedData.name,
      email: parsedData.email,
      phone: parsedData.phone,
      linkedInUrl: 'https://linkedin.com/in/nhatminh-doan',
      address: 'Hà Nội',
      dob: '10/10/1997',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=160&auto=format&fit=crop',
      latestPosition: parsedData.position,
      latestStatus: 'Đang phỏng vấn',
      source: 'LinkedIn Sourcing',
      expectedSalary: '40 - 50 Triệu VNĐ',
      salaryRange: '35_50',
      skills: parsedData.skills,
      tags: ['AI Bóc tách', 'Senior Golang', 'Ưu tiên cao'],
      university: parsedData.university,
      experienceYears: parsedData.experience,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
      cvFileName: uploadFile ? uploadFile.name : 'CV_DoanNhatMinh_Parsed.pdf',
      applications: [
        {
          id: `APP-${Date.now()}`,
          jobTitle: parsedData.position,
          jobCode: 'JOB-2026-01',
          department: 'Khối Công Nghệ & Phần Mềm',
          appliedDate: new Date().toLocaleDateString('vi-VN'),
          stage: 'CV Mới tiếp nhận (Bóc tách tự động)',
          status: 'active',
          matchScore: 92,
          recruiter: 'Trần Thị Recruiter',
          interviewerFeedback: 'Hồ sơ được bóc tách tự động từ AI Parser, kỹ năng và học vấn rất khớp tiêu chí.',
        },
      ],
      evaluation: {
        technicalSkill: 4,
        softSkill: 4,
        cultureFit: 4,
        recommendationLevel: 'Hire',
        summary: 'Hồ sơ bóc tách tự động có độ tương đồng cao với JD.',
      },
      notes: [
        {
          id: `n-${Date.now()}`,
          author: 'Trần Thị Recruiter',
          role: 'Recruiter',
          createdAt: 'Vừa xong',
          content: 'CV bóc tách tự động thành công. Đã gửi tin nhắn mời phỏng vấn sơ bộ.',
        },
      ],
    };

    setCandidates([newCandidate, ...candidates]);
    setIsUploadModalOpen(false);
    setUploadFile(null);
    setParsedData(null);
    showToast(`Đã thêm ứng viên "${newCandidate.name}" (${newCandidate.id}) vào cơ sở dữ liệu hồ sơ hợp nhất!`);
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // 1. Search keyword
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.latestPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.university.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Tag filter
      if (selectedTag !== 'all' && !c.tags.includes(selectedTag)) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'all' && c.latestStatus !== selectedStatus) {
        return false;
      }

      // 4. Source filter
      if (selectedSource !== 'all' && c.source !== selectedSource) {
        return false;
      }

      // 5. Salary Range filter
      if (selectedSalaryRange !== 'all' && c.salaryRange !== selectedSalaryRange) {
        return false;
      }

      // 6. Skill filter
      if (selectedSkill !== 'all' && !c.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [candidates, searchTerm, selectedTag, selectedStatus, selectedSource, selectedSalaryRange, selectedSkill]);

  // Danh sách tags & skills duy nhất phục vụ filter dropdown
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [candidates]);

  const allUniqueSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.skills.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [candidates]);

  // ==========================================
  // PHÂN TRANG (PAGINATION: 20 DÒNG / TRANG)
  // ==========================================
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const tableTopRef = useRef<HTMLDivElement>(null);

  // Tự động trở về trang 1 khi thay đổi điều kiện lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTag, selectedStatus, selectedSource, selectedSalaryRange, selectedSkill]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE));

  const currentCandidates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCandidates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    tableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
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
            <span className="text-slate-700 font-bold">Hồ sơ ứng viên hợp nhất</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-blue-600" />
            <span>Quản Lý Hồ Sơ Ứng Viên Hợp Nhất</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Toàn bộ cơ sở dữ liệu Talent Pool lưu trữ lịch sử nhiều lần nộp, hỗ trợ tìm lại hồ sơ cũ và tự động bóc tách CV.
          </p>
        </div>

        {/* Nút Tải CV lên & Bóc tách (User Story 3) */}
        <button
          type="button"
          onClick={() => {
            setUploadFile(null);
            setParsedData(null);
            setIsUploadModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4 stroke-[3]" />
          <span>+ Tải CV Lên (Tự Động Bóc Tách)</span>
        </button>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
            <span>Tổng hồ sơ Talent Pool</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{candidates.length}</div>
          <p className="text-[11px] text-slate-400">Đã hợp nhất lịch sử ứng tuyển</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-emerald-600 text-xs font-bold flex items-center justify-between">
            <span>Đang trong Pipeline</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {candidates.filter((c) => c.latestStatus === 'Đang phỏng vấn' || c.latestStatus === 'Đề xuất Offer').length}
          </div>
          <p className="text-[11px] text-emerald-600/80">Đang phỏng vấn hoặc xét Offer</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-teal-600 text-xs font-bold flex items-center justify-between">
            <span>Đã nhận việc thành công</span>
            <UserCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700">
            {candidates.filter((c) => c.latestStatus === 'Đã nhận việc').length}
          </div>
          <p className="text-[11px] text-teal-600/80">Nhân sự nội bộ chính thức</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-amber-600 text-xs font-bold flex items-center justify-between">
            <span>Hồ sơ lưu trữ tiềm năng</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">
            {candidates.filter((c) => c.latestStatus === 'Lưu trữ tiềm năng' || c.latestStatus === 'Đã từ chối').length}
          </div>
          <p className="text-[11px] text-amber-600/80">Sẵn sàng Re-engage cho vị trí mới</p>
        </div>
      </div>

      {/* 3. TÌM KIẾM & LỌC NÂNG CAO (ADVANCED FILTER BAR - User Story 2 & 3) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        {/* Row 1: Search box & Export Excel Button (User Story 3) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại, vị trí hoặc trường đại học..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Xuất Excel (Export) đặt cạnh ô tìm kiếm theo đúng User Story 3 */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Xuất danh sách hồ sơ ra tệp Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel ({filteredCandidates.length})</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Row 2: Bộ lọc đa điều kiện (Tag, Trạng thái cũ, Nguồn, Khoảng lương, Kỹ năng) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* Lọc theo Tag */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-purple-600" />
              <span>Nhãn (Tag)</span>
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả nhãn</option>
              {allUniqueTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Trạng thái cũ/gần nhất */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Trạng thái gần nhất</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Đang phỏng vấn">Đang phỏng vấn</option>
              <option value="Đề xuất Offer">Đề xuất Offer</option>
              <option value="Đã nhận việc">Đã nhận việc</option>
              <option value="Đã từ chối">Đã từ chối</option>
              <option value="Lưu trữ tiềm năng">Lưu trữ tiềm năng</option>
            </select>
          </div>

          {/* Lọc theo Nguồn ứng viên */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Nguồn ứng viên</span>
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả nguồn</option>
              <option value="LinkedIn Sourcing">LinkedIn Sourcing</option>
              <option value="TopCV">TopCV</option>
              <option value="VietnamWorks">VietnamWorks</option>
              <option value="Referral Nội Bộ">Referral Nội Bộ</option>
              <option value="Headhunter Agency">Headhunter Agency</option>
              <option value="Website Công Ty">Website Công Ty</option>
            </select>
          </div>

          {/* Lọc theo Khoảng lương */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>Khoảng lương</span>
            </label>
            <select
              value={selectedSalaryRange}
              onChange={(e) => setSelectedSalaryRange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả mức lương</option>
              <option value="under_20">Dưới 20 Triệu VNĐ</option>
              <option value="20_35">20 - 35 Triệu VNĐ</option>
              <option value="35_50">35 - 50 Triệu VNĐ</option>
              <option value="above_50">Trên 50 Triệu VNĐ</option>
            </select>
          </div>

          {/* Lọc theo Kỹ năng */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              <span>Kỹ năng cốt lõi</span>
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả kỹ năng</option>
              {allUniqueSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. DATA TABLE: TOÀN BỘ LỊCH SỬ ỨNG VIÊN (User Story 1) */}
      <div ref={tableTopRef} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Ứng Viên</th>
                <th className="py-4 px-4">Vị Trí & Lịch Sử Nộp</th>
                <th className="py-4 px-4">Kỹ Năng & Nhãn (Tags)</th>
                <th className="py-4 px-4 text-center">Trạng Thái</th>
                <th className="py-4 px-4">Mức Lương & Nguồn</th>
                <th className="py-4 px-6 text-right">Chi Tiết Hồ Sơ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <Users className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                      <p className="font-bold text-slate-600">Không tìm thấy ứng viên phù hợp</p>
                      <p className="text-xs text-slate-400">
                        Vui lòng nới lỏng các điều kiện lọc nâng cao hoặc tải thêm CV mới.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Cột 1: Thông tin ứng viên */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-0.5">
                          <Link
                            href={`/recruiter/candidates/${cand.id}`}
                            className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
                          >
                            {cand.name}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono font-bold text-slate-500">{cand.id}</span>
                            <span>&bull;</span>
                            <span>{cand.phone}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {cand.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Vị trí & Lịch sử nộp */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1">
                        <div className="font-extrabold text-slate-800 line-clamp-1">
                          {cand.latestPosition}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cand.university}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold">
                          <span>{cand.applications.length} lần ứng tuyển</span>
                        </div>
                      </div>
                    </td>

                    {/* Cột 3: Kỹ năng & Nhãn */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {cand.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cand.skills.slice(0, 3).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {cand.skills.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-bold">
                              +{cand.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột 4: Trạng thái gần nhất */}
                    <td className="py-4 px-4 text-center">
                      {cand.latestStatus === 'Đang phỏng vấn' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-extrabold shadow-2xs">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Đang phỏng vấn
                        </span>
                      ) : cand.latestStatus === 'Đề xuất Offer' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold shadow-2xs">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Đề xuất Offer
                        </span>
                      ) : cand.latestStatus === 'Đã nhận việc' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-extrabold shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          Đã nhận việc
                        </span>
                      ) : cand.latestStatus === 'Lưu trữ tiềm năng' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold shadow-2xs">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          Lưu trữ tiềm năng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-extrabold">
                          Đã từ chối
                        </span>
                      )}
                    </td>

                    {/* Cột 5: Mức lương & Nguồn */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="font-extrabold text-blue-600 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{cand.expectedSalary}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Nguồn: <strong className="text-slate-700">{cand.source}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cập nhật: {cand.updatedAt}
                        </div>
                      </div>
                    </td>

                    {/* Cột 6: Nút Xem chi tiết hồ sơ */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/recruiter/candidates/${cand.id}`}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <span>Hồ sơ hợp nhất</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân Trang (Pagination) */}
        <div className="px-6 pb-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCandidates.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            itemLabel="hồ sơ"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. MODAL: TỰ ĐỘNG BÓC TÁCH CV (AI RESUME PARSER - User Story 3) */}
      {/* ======================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    Bóc Tách CV Thông Minh (AI Resume Parser)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tải lên file CV PDF/DOCX, hệ thống tự động trích xuất Tên, SĐT, Email và Kỹ năng.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vùng Dropzone Upload */}
            {!parsedData && !isParsing && (
              <div className="space-y-4">
                <label className="block border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-3xl p-8 bg-blue-50/30 hover:bg-blue-50/60 transition-all text-center cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Kéo thả file CV vào đây hoặc bấm để chọn tệp
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hỗ trợ tệp định dạng .PDF, .DOCX (Dung lượng tối đa 15MB)
                  </p>
                </label>

                {/* Hoặc bấm nút thử file mẫu */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => simulateParsing('CV_DoanNhatMinh_Backend_Senior.pdf')}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Thử nghiệm nhanh với file CV mẫu (Demo 1-Click)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Progress Bar: Đang quét dữ liệu... (User Story 3) */}
            {isParsing && (
              <div className="py-8 space-y-4 text-center">
                <div className="w-14 h-14 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900">
                    Đang Quét & Bóc Tách Dữ Liệu CV...
                  </h4>
                  <p className="text-xs text-blue-600 font-bold">{parseStageText}</p>
                </div>

                {/* Progress bar visual */}
                <div className="max-w-md mx-auto w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${parseProgress}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {parseProgress}% hoàn thành
                </span>
              </div>
            )}

            {/* Kết quả bóc tách tự động (Pre-fill Form) */}
            {parsedData && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>AI đã tự động bóc tách thành công thông tin ứng viên từ CV!</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold">Họ và tên</label>
                      <input
                        type="text"
                        value={parsedData.name}
                        onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold">Số điện thoại</label>
                      <input
                        type="text"
                        value={parsedData.phone}
                        onChange={(e) => setParsedData({ ...parsedData, phone: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold">Email</label>
                      <input
                        type="email"
                        value={parsedData.email}
                        onChange={(e) => setParsedData({ ...parsedData, email: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold">Học vấn</label>
                      <input
                        type="text"
                        value={parsedData.university}
                        onChange={(e) =>
                          setParsedData({ ...parsedData, university: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">
                      Kỹ năng trích xuất
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedData.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-bold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setParsedData(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    Quét Lại File Khác
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveParsedCandidate}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    Xác Nhận & Lưu Vào Talent Pool
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
