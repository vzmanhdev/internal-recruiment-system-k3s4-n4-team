'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Search,
  Filter,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  X,
  Check,
  RotateCcw,
  Info,
  Calendar,
  Briefcase,
  Building,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import { ApprovalTimeline } from '@/features/approver/components/ApprovalTimeline';
import type { OfferApprovalItem, ApprovalTimelineItem } from '@/features/approver/types';
import { INITIAL_OFFERS } from '@/features/approver/mock-data';

export default function ApproverOffersPage() {
  const [offers, setOffers] = useState<OfferApprovalItem[]>(INITIAL_OFFERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedBudgetStatus, setSelectedBudgetStatus] = useState('ALL');

  // Modal State
  const [selectedOffer, setSelectedOffer] = useState<OfferApprovalItem | null>(null);
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast Feedback Notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Filtered List
  const filteredOffers = useMemo(() => {
    return offers.filter((offer) => {
      const matchSearch =
        offer.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.candidate_email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept =
        selectedDept === 'ALL' || offer.department.toLowerCase().includes(selectedDept.toLowerCase());

      const matchBudget =
        selectedBudgetStatus === 'ALL' ||
        (selectedBudgetStatus === 'OVER_BUDGET' && offer.is_over_budget) ||
        (selectedBudgetStatus === 'NORMAL' && !offer.is_over_budget);

      return matchSearch && matchDept && matchBudget;
    });
  }, [offers, searchQuery, selectedDept, selectedBudgetStatus]);

  const handleOpenOfferModal = (offer: OfferApprovalItem) => {
    setSelectedOffer(offer);
    setModalAction(null);
    setActionComment('');
  };

  const handleCloseModal = () => {
    setSelectedOffer(null);
    setModalAction(null);
    setActionComment('');
  };

  const handleSubmitOfferAction = async (action: 'approved' | 'rejected' | 'changes_requested') => {
    if (!selectedOffer) return;

    if ((action === 'rejected' || action === 'changes_requested') && !actionComment.trim()) {
      showToast('Vui lòng nhập lý do / ý kiến chỉ đạo để HR Manager đàm phán lại!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const timestamp =
        new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
        ' - ' +
        new Date().toLocaleDateString('vi-VN');

      let actionText = '';
      let newStatus: OfferApprovalItem['status'] = 'sent';

      if (action === 'approved') {
        actionText = `ĐÃ DUYỆT OFFER: Đề xuất lương ${selectedOffer.offered_salary.toLocaleString('vi-VN')} VNĐ cho ứng viên ${selectedOffer.candidate_name} đã được thông qua!`;
        newStatus = 'sent';
      } else if (action === 'rejected') {
        actionText = `ĐÃ BÁC BỎ OFFER: Hồ sơ đề xuất của ứng viên ${selectedOffer.candidate_name} đã bị từ chối.`;
        newStatus = 'rejected';
      } else {
        actionText = `YÊU CẦU ĐÀM PHÁN LẠI: Đã gửi thông báo yêu cầu HR Manager đàm phán lại mức đãi ngộ với ứng viên ${selectedOffer.candidate_name}!`;
        newStatus = 'changes_requested';
      }

      const newTimelineLog: ApprovalTimelineItem = {
        id: Date.now(),
        step_name: 'Thẩm Định Hạn Mức Ban Giám Đốc',
        approver_name: 'Phạm Văn Hùng',
        approver_role: 'Phó Tổng Giám Đốc / Ban Giám Đốc',
        action: action,
        comment: actionComment.trim() || (action === 'approved' ? 'Đã phê duyệt mức lương theo thẩm quyền Ban Giám Đốc.' : ''),
        created_at: timestamp,
      };

      setOffers((prev) =>
        prev.map((o) =>
          o.id === selectedOffer.id
            ? {
                ...o,
                status: newStatus,
                timeline: [...o.timeline, newTimelineLog],
              }
            : o
        )
      );

      showToast(actionText, action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'warning');
      handleCloseModal();
    } catch (err) {
      showToast('Có lỗi xảy ra khi xử lý đề xuất offer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-md animate-in slide-in-from-top-3 fade-in duration-300">
          <div
            className={clsx(
              'rounded-2xl p-4 shadow-xl border flex items-start gap-3 backdrop-blur-md',
              toast.type === 'success' && 'bg-emerald-50/95 border-emerald-200 text-emerald-900',
              toast.type === 'error' && 'bg-rose-50/95 border-rose-200 text-rose-900',
              toast.type === 'warning' && 'bg-amber-50/95 border-amber-200 text-amber-900',
              toast.type === 'info' && 'bg-blue-50/95 border-blue-200 text-blue-900'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
            <div className="flex-1 text-xs font-semibold leading-relaxed">{toast.message}</div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Trang Chuyên Biệt (Không còn 4 cards lớn ở trên) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/approver"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trung tâm phê duyệt</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              {offers.filter((o) => o.is_over_budget && o.status === 'pending').length} Offer Vượt Khung Cần Quyết Định
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <span>Danh Sách Đề Xuất Offer Chờ Duyệt</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Thẩm định và phê duyệt các thư mời nhận việc (Offer) vượt hạn mức dải lương chuẩn của công ty hoặc có chế độ đặc biệt.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-right">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Hội Đồng Thẩm Định</span>
            <span className="text-sm font-extrabold text-slate-900 block">Ban Giám Đốc (BOD)</span>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Quyết Định Vượt Trần Quỹ Lương
            </span>
          </div>
        </div>
      </div>

      {/* 2. Thanh Tìm Kiếm & Bộ Lọc */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col md:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo mã Offer, tên ứng viên, vị trí tuyển dụng, email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Trạng thái vượt khung */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedBudgetStatus}
              onChange={(e) => setSelectedBudgetStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Tất Cả Khung Lương</option>
              <option value="OVER_BUDGET">⚠️ Vượt Dải Lương Chuẩn</option>
              <option value="NORMAL">✅ Trong Dải Lương Chuẩn</option>
            </select>

            {/* Filter Phòng ban */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Tất Cả Phòng Ban</option>
              <option value="Dữ Liệu">Phân Tích Dữ Liệu</option>
              <option value="Thiết Kế">Thiết Kế UI/UX</option>
              <option value="AI">Trí Tuệ Nhân Tạo (AI Lab)</option>
              <option value="Công Nghệ">Công Nghệ Thông Tin</option>
            </select>
          </div>
        </div>

        {/* 3. Bảng Offer Full Màn Hình */}
        <div className="p-6">
          {filteredOffers.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-700">Không có đề xuất offer nào phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                Tất cả các thư mời nhận việc đã được phê duyệt hoặc không khớp bộ lọc tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="pb-3.5 pl-2">Mã & Ứng Viên Nhận Offer</th>
                    <th className="pb-3.5 px-4">Vị Trí & Phòng Ban</th>
                    <th className="pb-3.5 px-4">Lương Đề Xuất</th>
                    <th className="pb-3.5 px-4">Khung Lương Chuẩn</th>
                    <th className="pb-3.5 px-4">Cảnh Báo Hạn Mức</th>
                    <th className="pb-3.5 px-4">Trạng Thái</th>
                    <th className="pb-3.5 pr-2 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredOffers.map((offer) => {
                    return (
                      <tr
                        key={offer.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleOpenOfferModal(offer)}
                      >
                        {/* Mã & Ứng viên */}
                        <td className="py-4 pl-2">
                          <div className="flex items-start gap-3">
                            <div
                              className={clsx(
                                'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors',
                                offer.is_over_budget
                                  ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white'
                                  : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                              )}
                            >
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                                {offer.candidate_name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono text-slate-400 font-semibold">{offer.code}</span>
                                <span className="text-[10px] text-slate-400">• {offer.candidate_email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Vị trí & Phòng ban */}
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-800 block">{offer.job_title}</span>
                          <span className="text-[11px] text-slate-400">{offer.department}</span>
                        </td>

                        {/* Lương đề xuất */}
                        <td className="py-4 px-4 font-black text-slate-900 text-sm">
                          {offer.offered_salary.toLocaleString('vi-VN')} VNĐ
                        </td>

                        {/* Khung chuẩn (Band) */}
                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {offer.standard_salary_min.toLocaleString('vi-VN')} -{' '}
                          {offer.standard_salary_max.toLocaleString('vi-VN')} VNĐ
                        </td>

                        {/* Cảnh báo */}
                        <td className="py-4 px-4">
                          {offer.is_over_budget ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse shadow-xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Vượt khung +{offer.over_percentage}%</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Trong dải chuẩn</span>
                            </span>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-4 px-4">
                          {offer.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chờ Bạn Duyệt
                            </span>
                          ) : offer.status === 'sent' || offer.status === 'accepted' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã Duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              Đã Từ Chối
                            </span>
                          )}
                        </td>

                        {/* Nút thao tác */}
                        <td className="py-4 pr-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenOfferModal(offer);
                            }}
                            className={clsx(
                              'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs',
                              offer.is_over_budget
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
                            )}
                          >
                            Xem & Duyệt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. Modal 2 Cột Chi Tiết Offer & Thẩm Định Lương */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-2xl text-white flex items-center justify-center font-bold shadow-md',
                    selectedOffer.is_over_budget ? 'bg-rose-600 shadow-rose-600/20' : 'bg-blue-600 shadow-blue-500/20'
                  )}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">
                      Thẩm Định Đề Xuất Lương Ứng Viên
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                      {selectedOffer.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ứng viên: <strong className="text-slate-800">{selectedOffer.candidate_name}</strong> • Vị trí: {selectedOffer.job_title}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* CỘT TRÁI: CHI TIẾT ĐỀ XUẤT LƯƠNG & CHẾ ĐỘ (7 Cột) */}
              <div className="lg:col-span-7 p-6 space-y-6">
                {/* Cảnh báo vượt dải lương nếu có */}
                {selectedOffer.is_over_budget && (
                  <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <div className="font-extrabold text-rose-900 text-sm">
                        CẢNH BÁO: Mức lương đề xuất vượt dải chuẩn +{selectedOffer.over_percentage}%
                      </div>
                      <p className="text-rose-700 leading-relaxed">
                        Mức lương đề xuất{' '}
                        <strong>{selectedOffer.offered_salary.toLocaleString('vi-VN')} VNĐ</strong> cao hơn trần dải chuẩn{' '}
                        <strong>{selectedOffer.standard_salary_max.toLocaleString('vi-VN')} VNĐ</strong> của vị trí{' '}
                        <strong className="underline">
                          +{(selectedOffer.offered_salary - selectedOffer.standard_salary_max).toLocaleString('vi-VN')} VNĐ
                        </strong>
                        . Cần sự phê chuẩn ngoại lệ từ Ban Giám Đốc.
                      </p>
                    </div>
                  </div>
                )}

                {/* Candidate Info Grid */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400 font-bold">Họ & Tên ứng viên:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{selectedOffer.candidate_name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400 font-medium">Email & Điện thoại:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedOffer.candidate_email} {selectedOffer.candidate_phone ? `• ${selectedOffer.candidate_phone}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-400 font-medium">Vị trí áp dụng:</span>
                    <span className="font-bold text-slate-900">{selectedOffer.job_title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Phòng ban tiếp nhận:</span>
                    <span className="font-bold text-slate-900">{selectedOffer.department}</span>
                  </div>
                </div>

                {/* So Sánh Lương Dự Kiến & Dải Chuẩn */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Chi Tiết Gói Đãi Ngộ & Dải Chuẩn Vị Trí</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60">
                      <span className="text-[11px] text-emerald-700 font-bold block">Mức Lương Đề Xuất (Gross)</span>
                      <span className="text-xl font-black text-emerald-900 mt-1 block">
                        {selectedOffer.offered_salary.toLocaleString('vi-VN')} VNĐ
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium block mt-1">
                        Thử việc ({selectedOffer.probation_salary_percentage}%):{' '}
                        {((selectedOffer.offered_salary * selectedOffer.probation_salary_percentage) / 100).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-bold block">Khung Lương Chuẩn (Band Range)</span>
                      <span className="text-base font-extrabold text-slate-800 mt-1 block">
                        {selectedOffer.standard_salary_min.toLocaleString('vi-VN')} -{' '}
                        {selectedOffer.standard_salary_max.toLocaleString('vi-VN')} VNĐ
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">
                        Thời gian thử việc: {selectedOffer.probation_duration_months} tháng
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ngày Bắt Đầu & Địa Điểm */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Ngày dự kiến Onboard:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{selectedOffer.start_date}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Địa điểm làm việc:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{selectedOffer.work_location}</span>
                  </div>
                </div>

                {/* Ghi chú giải trình */}
                {selectedOffer.notes && (
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>Giải trình & Căn cứ phê duyệt từ HR</span>
                    </h4>
                    <p className="text-slate-600 leading-relaxed bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                      {selectedOffer.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: TIMELINE & ACTION BAR (5 Cột) */}
              <div className="lg:col-span-5 p-6 bg-slate-50/40 flex flex-col justify-between space-y-6">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Tiến Trình Thẩm Định Offer</span>
                  </h4>
                  <ApprovalTimeline timeline={selectedOffer.timeline} />
                </div>

                {/* Action Box */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ý kiến chỉ đạo & Quyết định của Ban Giám Đốc
                    </label>
                    <textarea
                      rows={3}
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      placeholder="Nhập căn cứ duyệt mức lương hoặc yêu cầu đàm phán lại..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleSubmitOfferAction('approved')}
                      className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Duyệt</span>
                    </button>

                    <button
                      disabled={isSubmitting}
                      onClick={() => handleSubmitOfferAction('changes_requested')}
                      className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đàm Phán Lại</span>
                    </button>

                    <button
                      disabled={isSubmitting}
                      onClick={() => handleSubmitOfferAction('rejected')}
                      className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Bác Bỏ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
