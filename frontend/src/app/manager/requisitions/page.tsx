'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ManagerAppShell } from '@/components/layout/ManagerAppShell';
import {
  FileCheck,
  Search,
  Filter,
  Plus,
  Copy,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Calendar,
  DollarSign,
  Send,
  Building,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

export interface ManagerRequisitionItem {
  id: string;
  title: string;
  department: string;
  level: string;
  targetCount: number;
  hiredCount: number;
  salaryRange: string;
  createdAt: string;
  targetDate: string;
  status: 'Pending' | 'Active' | 'Closed' | 'Draft';
  description: string;
  requirements: string;
  reason: string;
}

const INITIAL_REQUISITIONS: ManagerRequisitionItem[] = [
  {
    id: 'REQ-2026-003',
    title: 'Senior Backend Engineer (Golang/Python)',
    department: 'Phòng Phát Triển Công Nghệ & Phần Mềm',
    level: 'Senior',
    targetCount: 2,
    hiredCount: 1,
    salaryRange: '35.000.000 - 50.000.000 VNĐ',
    createdAt: '15/01/2026',
    targetDate: '28/02/2026',
    status: 'Pending',
    description:
      'Chịu trách nhiệm thiết kế và triển khai kiến trúc vi dịch vụ (Microservices) chịu tải cao với Golang và Python FastAPI. Tối ưu hóa truy vấn cơ sở dữ liệu phân tán, tích hợp Kafka message queue.',
    requirements:
      'Tối thiểu 4 năm kinh nghiệm với Golang hoặc Python. Hiểu sâu SQL, Redis, Docker, Kubernetes.',
    reason: 'Bổ sung định biên sprint Q1 mở rộng Core Services',
  },
  {
    id: 'REQ-2026-001',
    title: 'Lập trình viên Frontend (React/Next.js)',
    department: 'Phòng Phát Triển Công Nghệ & Phần Mềm',
    level: 'Middle',
    targetCount: 3,
    hiredCount: 2,
    salaryRange: '25.000.000 - 35.000.000 VNĐ',
    createdAt: '10/01/2026',
    targetDate: '20/02/2026',
    status: 'Active',
    description:
      'Xây dựng các module giao diện người dùng cho hệ thống tuyển dụng nội bộ, tối ưu hóa Core Web Vitals và thiết lập Design System đồng bộ.',
    requirements:
      'Thành thạo React 19, Next.js App Router, Tailwind CSS, TypeScript và tối ưu hiệu năng web.',
    reason: 'Mở rộng đội ngũ phát triển sản phẩm B2B',
  },
  {
    id: 'REQ-2026-004',
    title: 'Chuyên viên Thiết Kế Trải Nghiệm (UI/UX Designer)',
    department: 'Phòng Phát Triển Công Nghệ & Phần Mềm',
    level: 'Middle',
    targetCount: 1,
    hiredCount: 0,
    salaryRange: '20.000.000 - 28.000.000 VNĐ',
    createdAt: '28/01/2026',
    targetDate: '05/03/2026',
    status: 'Pending',
    description:
      'Nghiên cứu hành vi người dùng, thiết kế wireframe, prototype và hoàn thiện UI components Figma theo Design System.',
    requirements:
      'Có Portfolio dự án thực tế, am hiểu Design Thinking, Micro-interactions và Design System.',
    reason: 'Chuẩn hóa thiết kế cho toàn bộ hệ thống Enterprise ATS',
  },
  {
    id: 'REQ-2026-005',
    title: 'QA Automation Engineer Lead',
    department: 'Phòng Phát Triển Công Nghệ & Phần Mềm',
    level: 'Lead',
    targetCount: 1,
    hiredCount: 1,
    salaryRange: '32.000.000 - 42.000.000 VNĐ',
    createdAt: '02/01/2026',
    targetDate: '25/01/2026',
    status: 'Closed',
    description:
      'Xây dựng kiến trúc kiểm thử tự động toàn diện tích hợp GitLab CI/CD, đào tạo đội ngũ QC.',
    requirements:
      'Có trên 5 năm kinh nghiệm QA/QC, thành thạo Playwright, Cypress, Selenium, CI/CD pipeline.',
    reason: 'Thay thế nhân sự nghỉ việc',
  },
];

function RequisitionsContent() {
  const searchParams = useSearchParams();
  const [requisitions, setRequisitions] = useState<ManagerRequisitionItem[]>(INITIAL_REQUISITIONS);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal: Duplicate Requisition State
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedReqForDuplicate, setSelectedReqForDuplicate] = useState<ManagerRequisitionItem | null>(null);

  // Duplicate Form State
  const [duplicateForm, setDuplicateForm] = useState({
    title: '',
    department: '',
    level: '',
    salaryRange: '',
    targetCount: 1,
    targetDate: '2026-03-31',
    description: '',
    requirements: '',
    reason: 'Bổ sung định biên sprint mới',
  });

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open modal with pre-filled requisition data
  const handleOpenDuplicateModal = (req: ManagerRequisitionItem) => {
    setSelectedReqForDuplicate(req);
    setDuplicateForm({
      title: `${req.title} (Bản sao)`,
      department: req.department,
      level: req.level,
      salaryRange: req.salaryRange,
      targetCount: 1,
      targetDate: '2026-03-31',
      description: req.description,
      requirements: req.requirements,
      reason: 'Bổ sung định biên sprint mới (Sao chép từ ' + req.id + ')',
    });
    setIsDuplicateModalOpen(true);
  };

  // Check URL query param ?cloneId=...
  useEffect(() => {
    const cloneId = searchParams.get('cloneId');
    if (cloneId) {
      const target = requisitions.find((r) => r.id === cloneId);
      if (target) {
        handleOpenDuplicateModal(target);
      }
    }
  }, [searchParams]);

  // Submit Duplicate Requisition (Trình duyệt)
  const handleSubmitDuplicate = (e: React.FormEvent) => {
    e.preventDefault();

    const newReqId = `REQ-2026-00${requisitions.length + 1}`;
    const newReq: ManagerRequisitionItem = {
      id: newReqId,
      title: duplicateForm.title,
      department: duplicateForm.department,
      level: duplicateForm.level,
      targetCount: Number(duplicateForm.targetCount) || 1,
      hiredCount: 0,
      salaryRange: duplicateForm.salaryRange,
      createdAt: new Date().toLocaleDateString('vi-VN'),
      targetDate: duplicateForm.targetDate,
      status: 'Pending',
      description: duplicateForm.description,
      requirements: duplicateForm.requirements,
      reason: duplicateForm.reason,
    };

    setRequisitions([newReq, ...requisitions]);
    setIsDuplicateModalOpen(false);
    showToast(`Đã trình duyệt thành công yêu cầu mới (${newReqId}): ${newReq.title}`);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return requisitions.filter((req) => {
      const matchSearch =
        req.title.toLowerCase().includes(search.toLowerCase()) ||
        req.id.toLowerCase().includes(search.toLowerCase()) ||
        req.department.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requisitions, search, statusFilter]);

  // Counts
  const totalCount = requisitions.length;
  const activeCount = requisitions.filter((r) => r.status === 'Active').length;
  const pendingCount = requisitions.filter((r) => r.status === 'Pending').length;
  const closedCount = requisitions.filter((r) => r.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-blue-600" />
            Yêu Cầu Tuyển Dụng (Requisitions)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý danh sách tờ trình tuyển dụng của bộ phận, theo dõi phê duyệt và tái sử dụng mẫu yêu cầu cũ
          </p>
        </div>

        <button
          onClick={() => handleOpenDuplicateModal(requisitions[0])}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo Yêu Cầu Mới</span>
        </button>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng yêu cầu</span>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-500">Toàn bộ tờ trình</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đang tuyển (Active)</span>
          <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
          <p className="text-[11px] text-emerald-600/80">Đang nhận CV & PV</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chờ duyệt (Pending)</span>
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
          <p className="text-[11px] text-amber-600/80">Đang luân chuyển 4 cấp</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã hoàn thành</span>
          <div className="text-2xl font-black text-slate-600">{closedCount}</div>
          <p className="text-[11px] text-slate-500">Đủ chỉ tiêu hoặc đóng</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo chức danh, mã REQ hoặc phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Active">Đang mở (Active)</option>
            <option value="Pending">Chờ duyệt (Pending)</option>
            <option value="Closed">Đã đóng (Closed)</option>
          </select>
        </div>
      </div>

      {/* 4. DATA TABLE WITH "SAO CHÉP" (COPY) ACTION BUTTON */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs text-slate-500 font-semibold tracking-wider uppercase">
                <th className="py-4 px-6">Mã & Chức Danh</th>
                <th className="py-4 px-6">Cấp Bậc</th>
                <th className="py-4 px-6 text-center">Tiến Độ Tuyển</th>
                <th className="py-4 px-6">Dải Lương</th>
                <th className="py-4 px-6">Ngày Cần Người</th>
                <th className="py-4 px-6">Trạng Thái</th>
                <th className="py-4 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {filteredList.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Title & Code */}
                  <td className="py-4 px-6">
                    <Link
                      href={`/manager/requisitions/${req.id}`}
                      className="group font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                    >
                      <div className="text-sm font-extrabold group-hover:underline">{req.title}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{req.id} • {req.department}</div>
                    </Link>
                  </td>

                  {/* Level */}
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-700">{req.level}</span>
                  </td>

                  {/* Progress: Hired / Target */}
                  <td className="py-4 px-6 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-extrabold text-slate-900">
                        {req.hiredCount}/{req.targetCount} vị trí
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {Math.round((req.hiredCount / req.targetCount) * 100)}% chỉ tiêu
                      </span>
                    </div>
                  </td>

                  {/* Salary */}
                  <td className="py-4 px-6 text-slate-700 font-semibold">
                    {req.salaryRange}
                  </td>

                  {/* Deadline */}
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    {req.targetDate}
                  </td>

                  {/* Status Badges */}
                  <td className="py-4 px-6">
                    {req.status === 'Active' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đang mở tuyển
                      </span>
                    )}
                    {req.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Chờ phê duyệt
                      </span>
                    )}
                    {req.status === 'Closed' && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Đã đóng
                      </span>
                    )}
                  </td>

                  {/* Action Column with COPY & VIEW */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Detail Link */}
                      <Link
                        href={`/manager/requisitions/${req.id}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Xem chi tiết & Lịch sử duyệt"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* FEATURE 1: SAO CHÉP (COPY) ACTION BUTTON */}
                      <button
                        onClick={() => handleOpenDuplicateModal(req)}
                        className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer group"
                        title="Sao chép yêu cầu (Duplicate)"
                      >
                        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: "TẠO YÊU CẦU MỚI (BẢN SAO)" - PRE-FILLED FORM                  */}
      {/* ========================================================================= */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">
                    Tạo yêu cầu mới (Bản sao)
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Sao chép toàn bộ tiêu chuẩn từ yêu cầu {selectedReqForDuplicate?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification hint */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Dữ liệu chuyên môn đã được điền sẵn (Pre-filled):</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                Chức danh, Mô tả công việc, Yêu cầu kỹ năng và Dải lương đã tự động sao chép. Manager chỉ cần cập nhật <strong>Số lượng</strong> và <strong>Ngày cần người</strong> trước khi bấm Trình duyệt.
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmitDuplicate} className="space-y-4 text-xs">
              {/* Title & Department */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Chức danh tuyển dụng *</label>
                <input
                  type="text"
                  required
                  value={duplicateForm.title}
                  onChange={(e) => setDuplicateForm({ ...duplicateForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Two Column Grid for Key Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Level */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Cấp bậc</label>
                  <input
                    type="text"
                    value={duplicateForm.level}
                    onChange={(e) => setDuplicateForm({ ...duplicateForm, level: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Salary Range */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Dải lương đề xuất</label>
                  <input
                    type="text"
                    value={duplicateForm.salaryRange}
                    onChange={(e) => setDuplicateForm({ ...duplicateForm, salaryRange: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-emerald-700 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* KEY EDITABLE FIELDS: TARGET COUNT & TARGET DATE */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-700" />
                  <span>Các thông số cần xác nhận điều chỉnh:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Count (Số lượng cần tuyển) */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      Số lượng cần tuyển (Headcount) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={duplicateForm.targetCount}
                      onChange={(e) => setDuplicateForm({ ...duplicateForm, targetCount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-black text-blue-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Target Date (Ngày cần người) */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      Ngày cần người (Target Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={duplicateForm.targetDate}
                      onChange={(e) => setDuplicateForm({ ...duplicateForm, targetDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1 pt-1">
                  <label className="block font-bold text-slate-800">Lý do tuyển dụng bổ sung *</label>
                  <input
                    type="text"
                    required
                    value={duplicateForm.reason}
                    onChange={(e) => setDuplicateForm({ ...duplicateForm, reason: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl font-medium text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description (Pre-filled) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Mô tả công việc (JD)</label>
                <textarea
                  rows={3}
                  value={duplicateForm.description}
                  onChange={(e) => setDuplicateForm({ ...duplicateForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Requirements (Pre-filled) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Yêu cầu chuyên môn</label>
                <textarea
                  rows={3}
                  value={duplicateForm.requirements}
                  onChange={(e) => setDuplicateForm({ ...duplicateForm, requirements: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/30 transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Trình Duyệt Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerRequisitionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Đang tải danh sách yêu cầu...</div>}>
      <RequisitionsContent />
    </Suspense>
  );
}
