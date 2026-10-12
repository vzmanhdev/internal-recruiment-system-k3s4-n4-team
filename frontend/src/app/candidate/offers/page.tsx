'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  HeartHandshake,
  FileText,
  Send,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Phone,
  Mail,
  DollarSign,
} from 'lucide-react';

export default function CandidateOffersPage() {
  const [actionState, setActionState] = useState<'reviewing' | 'accepted_success' | 'declined_success'>('reviewing');
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const [declineReason, setDeclineReason] = useState('');
  const [customDeclineNote, setCustomDeclineNote] = useState('');
  const [declineError, setDeclineError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const offer = {
    id: 'OF-2026-99',
    candidateName: 'Nguyễn Văn A',
    jobTitle: 'Senior Frontend Engineer (React/Next.js)',
    department: 'Khối Công Nghệ & Trải Nghiệm Số',
    salaryGross: '42.000.000 VNĐ / tháng',
    salaryNetEstimated: '~36.200.000 VNĐ (sau thuế & bảo hiểm bắt buộc)',
    startDate: 'Thứ Hai, 02/11/2026',
    probationPeriod: '02 tháng (100% lương chính thức)',
    workLocation: 'Tầng 8, Tòa nhà Tech Tower, 19 Duy Tân, Cầu Giấy, Hà Nội',
    workModel: 'Hybrid (3 ngày văn phòng, 2 ngày WFH)',
    expiresAt: '23:59 ngày 18/10/2026',
    dateIssued: '12/10/2026',
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    }, 800);
  };

  const handleConfirmAccept = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowAcceptModal(false);
      setActionState('accepted_success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
  };

  const handleConfirmDecline = (e: React.FormEvent) => {
    e.preventDefault();
    setDeclineError('');

    if (!declineReason) {
      setDeclineError('Vui lòng chọn 1 lý do để hoàn tất phản hồi.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowDeclineModal(false);
      setActionState('declined_success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 600);
  };

  return (
    <div className="w-full space-y-8 pb-20">
      {/* 1. STATE: ĐÃ CHẤP NHẬN THÀNH CÔNG */}
      {actionState === 'accepted_success' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 p-8 md:p-12 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Chào Mừng Tân Thành Viên!
            </span>
            <h1 className="text-2xl font-bold text-slate-800">
              Xác Nhận Nhận Việc Thành Công!
            </h1>
            <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
              Cảm ơn <strong>{offer.candidateName}</strong> đã đồng ý gia nhập đại gia đình chúng tôi ở vị trí{' '}
              <strong className="text-blue-600">{offer.jobTitle}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 text-left text-xs sm:text-sm text-slate-700 max-w-lg mx-auto space-y-2 border border-slate-100">
            <p>• <strong>Ngày đi làm đầu tiên:</strong> 08:30 sáng {offer.startDate}.</p>
            <p>• <strong>Địa điểm:</strong> {offer.workLocation}.</p>
            <p>• <strong>Thủ tục:</strong> HR sẽ gửi email hướng dẫn chuẩn bị hồ sơ trước ngày bắt đầu.</p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/candidate/tracking"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors"
            >
              Về trang tiến độ ứng tuyển
            </Link>
          </div>
        </div>
      )}

      {/* 2. STATE: ĐÃ TỪ CHỐI */}
      {actionState === 'declined_success' && (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 p-8 md:p-12 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
            <HeartHandshake className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-800">
              Cảm Ơn Bạn Đã Dành Thời Gian
            </h1>
            <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
              Chúng tôi đã ghi nhận phản hồi từ chối của bạn cho vị trí <strong>{offer.jobTitle}</strong>. Chúc bạn luôn thành công trên chặng đường sự nghiệp sắp tới!
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/candidate/jobs"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors"
            >
              Khám phá các vị trí khác
            </Link>
            <button
              onClick={() => setActionState('reviewing')}
              className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Xem lại thư mời
            </button>
          </div>
        </div>
      )}

      {/* 3. STATE: THƯ MỜI CHÍNH (Giao diện mở rộng toàn chiều rộng) */}
      {actionState === 'reviewing' && (
        <>
          {/* Top Hero Banner */}
          <div className="w-full rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-md">
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-1/4 -bottom-16 w-56 h-56 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff18_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-blue-100 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>THƯ MỜI GIA NHẬP CHÍNH THỨC • JOB OFFER</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Thư Mời Nhận Việc (Job Offer Letter)
                </h1>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá. Vui lòng xem kỹ chi tiết chế độ đãi ngộ và xác nhận trước hạn quy định.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2.5 shrink-0">
                <span className="px-3.5 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm text-xs font-bold border border-white/20 text-white">
                  MÃ: {offer.id}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-bold">
                  Hạn: {offer.expiresAt}
                </span>
              </div>
            </div>
          </div>

          {/* Grid Nội dung 2 cột mở rộng */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Cột Trái (Thư mời chính - lg:col-span-8) */}
            <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 border-t-8 border-t-blue-600 p-6 sm:p-10 relative overflow-hidden space-y-8">
              {/* Header Thư mời */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">HỆ THỐNG DOANH NGHIỆP CÔNG NGHỆ</h2>
                  <p className="text-xs sm:text-sm text-slate-500">Ban Nhân Sự & Thu Hút Tài Năng Toàn Cầu</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                    CHÍNH THỨC • {offer.id}
                  </span>
                  <p className="text-xs text-slate-400 mt-1.5">Ngày phát hành: {offer.dateIssued}</p>
                </div>
              </div>

              {/* Lời chào & Nội dung */}
              <div className="prose max-w-none text-slate-700 text-sm sm:text-base">
                <h3 className="text-lg font-bold text-slate-900 mb-3">
                  Thân gửi bạn {offer.candidateName},
                </h3>
                <p className="mb-4 leading-relaxed text-slate-600">
                  Thay mặt Hội đồng Tuyển dụng và toàn thể Ban Lãnh đạo Công ty, chúng tôi trân trọng gửi đến bạn{' '}
                  <strong className="text-slate-800">Thư Mời Nhận Việc Chính Thức (Job Offer Letter)</strong>. Chúng tôi rất ấn tượng với
                  năng lực chuyên môn, tư duy giải quyết vấn đề và tinh thần nhiệt huyết của bạn qua các vòng đánh giá vừa qua.
                </p>

                {/* Hộp mức lương cơ bản đề xuất */}
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-6 my-6 not-prose">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                    MỨC LƯƠNG CƠ BẢN ĐỀ XUẤT (MONTHLY SALARY)
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-600 mb-2">
                    {offer.salaryGross}
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-700 font-medium">
                    Ước tính thu nhập thực nhận (Net): <strong>{offer.salaryNetEstimated}</strong>
                  </p>
                </div>

                {/* Bảng thông số chi tiết */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm my-6 not-prose">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-xs text-slate-400 block font-semibold mb-0.5">Chức danh công việc:</span>
                    <span className="font-bold text-slate-900">{offer.jobTitle}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-xs text-slate-400 block font-semibold mb-0.5">Bộ phận / Khối:</span>
                    <span className="font-bold text-slate-900">{offer.department}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-xs text-slate-400 block font-semibold mb-0.5">Ngày bắt đầu làm việc:</span>
                    <span className="font-bold text-blue-700">{offer.startDate}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-xs text-slate-400 block font-semibold mb-0.5">Thời gian thử việc:</span>
                    <span className="font-bold text-slate-900">{offer.probationPeriod}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 sm:col-span-2">
                    <span className="text-xs text-slate-400 block font-semibold mb-0.5">Địa điểm làm việc:</span>
                    <span className="font-medium text-slate-800">{offer.workLocation} ({offer.workModel})</span>
                  </div>
                </div>
              </div>

              {/* Dải nút hành động */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(true)}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm"
                >
                  Từ chối Offer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(true)}
                  className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Chấp nhận & Gia nhập</span>
                </button>
              </div>
            </div>

            {/* Cột Phải (Thông tin bổ trợ & Tải PDF - lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: Tóm Tắt Đãi Ngộ */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Tóm Tắt Quyền Lợi Chính
                </h3>
                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Lương cơ bản:</span>
                    <span className="font-bold text-emerald-600">42 Triệu / tháng</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Thưởng hiệu suất:</span>
                    <span className="font-semibold text-slate-800">Tháng lương thứ 13 + KPI</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Bảo hiểm sức khỏe:</span>
                    <span className="font-semibold text-slate-800">Gói Premium Bảo Việt</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Chế độ làm việc:</span>
                    <span className="font-semibold text-slate-800">Hybrid (2 ngày WFH)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-500">Thời hạn phản hồi:</span>
                    <span className="font-bold text-amber-600">{offer.expiresAt}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Tệp Đính Kèm */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Tài Liệu Đính Kèm
                </h3>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">Official_Offer_Letter.pdf</p>
                      <p className="text-[11px] text-slate-400">Dung lượng: 245 KB</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    {downloadSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã tải</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tải PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 3: Hỗ Trợ Tuyển Dụng */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs sm:text-sm">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Cần Trao Đổi Thêm?
                </h3>
                <p className="text-slate-600 leading-relaxed text-xs">
                  Nếu bạn cần giải đáp thêm về chế độ đãi ngộ hoặc thủ tục onboarding, vui lòng liên hệ phòng Nhân sự:
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  <p className="text-slate-700">
                    • <strong>Hotline:</strong> (024) 3788 9999 (Máy lẻ 102)
                  </p>
                  <p className="text-slate-700">
                    • <strong>Email:</strong> talent@congty.com
                  </p>
                  <p className="text-slate-700">
                    • <strong>Chuyên viên:</strong> Vũ Thị Mai (Senior HR)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: CHẤP NHẬN OFFER */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Xác nhận gia nhập công ty?
                </h3>
                <p className="text-xs text-slate-500">
                  Vui lòng kiểm tra kỹ trước khi đưa ra quyết định cuối cùng.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 leading-relaxed">
              Bạn có chắc chắn muốn xác nhận gia nhập công ty? Sau khi bấm xác nhận, thông tin sẽ được gửi đến Ban Nhân Sự để chuẩn bị hợp đồng và thủ tục đón tiếp vào ngày <strong>{offer.startDate}</strong>.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
              >
                Xem lại điều khoản
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Tôi chắc chắn đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TỪ CHỐI OFFER */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Từ Chối Lời Mời Nhận Việc
                </h3>
                <p className="text-xs text-slate-500">
                  Vui lòng chia sẻ lý do để giúp công ty cải thiện chính sách tuyển dụng.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmDecline} className="space-y-4">
              <div className="space-y-2 text-xs">
                {[
                  { id: 'salary', label: 'Mức thu nhập / Đãi ngộ chưa đạt kỳ vọng' },
                  { id: 'another_offer', label: 'Đã nhận lời mời làm việc từ đơn vị khác' },
                  { id: 'location', label: 'Địa điểm hoặc thời gian di chuyển chưa thuận tiện' },
                  { id: 'other', label: 'Lý do cá nhân khác' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="declineReason"
                      value={opt.id}
                      checked={declineReason === opt.id}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      className="text-rose-600"
                    />
                    <span className="text-slate-700 font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>

              {declineError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {declineError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? 'Đang gửi...' : <><Send className="w-3.5 h-3.5" /> Xác nhận từ chối</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
