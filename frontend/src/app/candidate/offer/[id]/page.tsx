'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Building2,
  Gift,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  ChevronLeft,
  ArrowRight,
  Send,
  HelpCircle,
  HeartHandshake,
} from 'lucide-react';

export default function CandidateOfferActionPage() {
  const params = useParams();
  const offerId = (params?.id as string) || 'OF-2026-99';

  // Interaction State: 'pending' | 'accepted_success' | 'declined_success'
  const [actionState, setActionState] = useState<'pending' | 'accepted_success' | 'declined_success'>('pending');

  // Modals state
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  // Decline form state
  const [declineReason, setDeclineReason] = useState('');
  const [customDeclineNote, setCustomDeclineNote] = useState('');
  const [declineError, setDeclineError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // PDF Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Mock Offer details
  const offer = useMemo(() => {
    return {
      id: offerId,
      candidateName: 'Nguyễn Văn A',
      jobTitle: 'Senior Frontend Engineer (React/Next.js)',
      department: 'Khối Công Nghệ & Trải Nghiệm Số',
      reportsTo: 'Engineering Director & Product Lead',
      salaryGross: '42.000.000 VNĐ / tháng',
      salaryNetEstimated: '~36.200.000 VNĐ / tháng (sau thuế & bảo hiểm bắt buộc)',
      startDate: 'Thứ Hai, 02/11/2026',
      probationPeriod: '02 tháng (100% lương chính thức và đóng đủ BHXH ngay từ tháng đầu)',
      bonusPolicy: 'Tháng lương 13 đảm bảo + Thưởng KPI theo hiệu suất kinh doanh (1.5 - 3 tháng lương)',
      workLocation: 'Tầng 8, Tòa nhà Tech Tower, 19 Duy Tân, Cầu Giấy, Hà Nội',
      workModel: 'Hybrid (3 ngày văn phòng, 2 ngày làm việc linh hoạt từ xa/WFH)',
      workingHours: 'Thứ Hai - Thứ Sáu, 08:30 - 17:30 (Nghỉ Thứ Bảy & Chủ Nhật)',
      expiresAt: '23:59 ngày 18/10/2026',
      daysLeft: 3,
      healthInsurance: 'Gói bảo hiểm sức khỏe cao cấp PVI Care toàn diện cho cá nhân và trợ cấp 50% cho người thân',
      devices: 'MacBook Pro M3 Pro / Dell XPS 15 + Màn hình 4K 27 inch tại văn phòng',
      annualLeave: '15 ngày phép hưởng nguyên lương / năm (+1 ngày phép thâm niên mỗi năm)',
      hrContact: {
        name: 'Trần Thị Mỹ Linh',
        title: 'Senior Talent Acquisition Specialist',
        email: 'recruitment@example.com',
        phone: '024 7300 8899 (Ext: 104)',
      },
    };
  }, [offerId]);

  // Handle PDF Download Simulation
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1000);
  };

  // Handle Accept Confirmation
  const handleConfirmAccept = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowAcceptModal(false);
      setActionState('accepted_success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 700);
  };

  // Handle Decline Submission
  const handleConfirmDecline = (e: React.FormEvent) => {
    e.preventDefault();
    setDeclineError('');

    if (!declineReason) {
      setDeclineError('Vui lòng chọn 1 lý do chính để chúng tôi cải thiện chất lượng tuyển dụng.');
      return;
    }

    if (declineReason === 'other' && !customDeclineNote.trim()) {
      setDeclineError('Vui lòng điền chi tiết lý do từ chối.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowDeclineModal(false);
      setActionState('declined_success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 700);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-16 antialiased">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại Cổng tuyển dụng
        </Link>
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          Hạn phản hồi: Còn {offer.daysLeft} ngày
        </span>
      </div>

      {/* STATE 1: ACCEPTED SUCCESS */}
      {actionState === 'accepted_success' && (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl overflow-hidden p-6 md:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Chào mừng Tân Thành Viên!
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Xác Nhận Nhận Việc Thành Công!
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto">
              Cảm ơn <strong className="text-slate-900">{offer.candidateName}</strong> đã tin tưởng và đồng ý gia nhập đại gia đình chúng tôi với vị trí{' '}
              <strong className="text-blue-600">{offer.jobTitle}</strong>.
            </p>
          </div>

          {/* Next Steps for Onboarding */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Các bước chuẩn bị tiếp theo (Onboarding Kit)
            </h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <strong>Email Hướng dẫn Onboarding:</strong> Bộ phận Nhân sự sẽ gửi tài liệu hướng dẫn và liên kết khai báo hồ sơ nhân sự trực tuyến trước ngày <strong>{offer.startDate}</strong>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <strong>Hồ sơ cần nộp trong tuần đầu tiên:</strong> Bản sao CCCD gắn chip, Sơ yếu lý lịch, Giấy khám sức khỏe, Bản sao văn bằng chứng chỉ liên quan và Mã số thuế cá nhân.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <strong>Ngày đầu tiên đi làm:</strong> Có mặt tại <strong>{offer.workLocation}</strong> lúc <strong>08:30 ngày {offer.startDate}</strong> để nhận máy tính làm việc và làm quen với Team.
                </div>
              </li>
            </ul>
          </div>

          {/* HR Contact Box */}
          <div className="border border-blue-100 bg-blue-50/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Nhân sự phụ trách tiếp nhận</p>
              <p className="font-bold text-slate-900 text-base">{offer.hrContact.name}</p>
              <p className="text-xs text-slate-600">{offer.hrContact.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`mailto:${offer.hrContact.email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" />
                {offer.hrContact.email}
              </a>
              <a
                href={`tel:${offer.hrContact.phone}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                {offer.hrContact.phone}
              </a>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Tải lại Thư mời làm việc (PDF)
            </button>
            <Link
              href="/candidate/track"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors text-sm"
            >
              Xem trang Tiến độ hồ sơ
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* STATE 2: DECLINED SUCCESS */}
      {actionState === 'declined_success' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 md:p-10 space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-slate-50">
              <HeartHandshake className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
              Đã ghi nhận phản hồi
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              Cảm Ơn Bạn Đã Dành Thời Gian
            </h1>
            <p className="text-sm md:text-base text-slate-600 max-w-lg mx-auto">
              Hệ thống đã ghi nhận việc bạn từ chối lời mời làm việc cho vị trí{' '}
              <strong className="text-slate-800">{offer.jobTitle}</strong>. 
              Công ty xin gửi lời cảm ơn chân thành tới bạn vì đã dành thời gian tham gia quá trình ứng tuyển và phỏng vấn.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">Thông tin phản hồi đã được lưu trữ an toàn:</p>
            <p>• Lý do lựa chọn: <span className="font-medium text-slate-800">
              {declineReason === 'salary' && 'Mức thu nhập / Đãi ngộ chưa đạt kỳ vọng'}
              {declineReason === 'another_offer' && 'Đã nhận lời mời làm việc từ đơn vị khác'}
              {declineReason === 'location' && 'Địa điểm / Hình thức làm việc chưa thuận tiện'}
              {declineReason === 'career_direction' && 'Thay đổi định hướng sự nghiệp cá nhân'}
              {declineReason === 'other' && 'Lý do khác'}
            </span></p>
            {customDeclineNote && (
              <p>• Ghi chú thêm: <span className="italic text-slate-700">&ldquo;{customDeclineNote}&rdquo;</span></p>
            )}
            <p className="pt-2 text-xs text-slate-500">
              Hồ sơ của bạn vẫn sẽ được lưu trữ trong Mạng lưới Tài năng (Talent Pool) của chúng tôi và chúng tôi sẽ chủ động liên hệ nếu có cơ hội việc làm mới phù hợp hơn trong tương lai.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors text-sm"
            >
              Khám phá các vị trí khác
            </Link>
            <button
              onClick={() => {
                if (window.confirm('Bạn có muốn mở lại biểu mẫu để xem lại thư mời không?')) {
                  setActionState('pending');
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition-colors text-sm"
            >
              Xem lại chi tiết thư mời
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: PENDING (PRIMARY VIEW) */}
      {actionState === 'pending' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Offer Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 md:p-8 relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                THƯ MỜI NHẬN VIỆC CHÍNH THỨC (JOB OFFER LETTER)
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {offer.jobTitle}
              </h1>
              <p className="text-blue-100 text-sm md:text-base mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-200" />
                  {offer.department}
                </span>
                <span>•</span>
                <span>Mã Offer: <strong>{offer.id}</strong></span>
                <span>•</span>
                <span>Ứng viên: <strong>{offer.candidateName}</strong></span>
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Highlight Box: Mức Lương & Ngày Bắt Đầu (Action-oriented & Big typography) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Salary Card */}
                <div className="bg-emerald-50/70 border-2 border-emerald-200/80 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Mức Lương Đề Xuất
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded-md text-[11px] font-bold">
                      GROSS
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">
                    {offer.salaryGross}
                  </div>
                  <p className="text-xs text-emerald-800/80 mt-1.5 font-medium leading-relaxed">
                    Ước tính Net: {offer.salaryNetEstimated}
                  </p>
                </div>

                {/* Start Date Card */}
                <div className="bg-blue-50/70 border-2 border-blue-200/80 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Ngày Bắt Đầu Làm Việc
                    </span>
                    <span className="px-2 py-0.5 bg-blue-200/70 text-blue-900 rounded-md text-[11px] font-bold">
                      OFFICIAL
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-blue-700 tracking-tight">
                    {offer.startDate}
                  </div>
                  <p className="text-xs text-blue-800/80 mt-1.5 font-medium leading-relaxed">
                    Giờ đón tiếp ngày đầu: 08:30 sáng tại Văn phòng
                  </p>
                </div>
              </div>

              {/* Download PDF Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 border border-slate-200/90 rounded-2xl gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Thư mời nhận việc đầy đủ (Official_Offer_Letter.pdf)</h4>
                    <p className="text-xs text-slate-500">Bản ký điện tử đóng dấu pháp nhân công ty • Dung lượng 1.2 MB</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-700 font-bold rounded-xl text-xs md:text-sm shadow-sm transition-all shrink-0 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Đang chuẩn bị file...
                    </>
                  ) : downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Đã tải xuống thành công!
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-slate-500" />
                      Tải xuống chi tiết Thư mời (PDF)
                    </>
                  )}
                </button>
              </div>

              {/* Key Offer Provisions & Perks Grid */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Chi tiết điều khoản & Đãi ngộ chính
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Thời gian thử việc</span>
                    <p className="font-semibold text-slate-800">{offer.probationPeriod}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Thưởng & Tháng 13</span>
                    <p className="font-semibold text-slate-800">{offer.bonusPolicy}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Mô hình & Thời gian làm việc</span>
                    <p className="font-semibold text-slate-800">{offer.workModel}</p>
                    <p className="text-xs text-slate-600">{offer.workingHours}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Địa điểm làm việc</span>
                    <p className="font-semibold text-slate-800 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                      {offer.workLocation}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Bảo hiểm & Sức khỏe</span>
                    <p className="font-semibold text-slate-800">{offer.healthInsurance}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Trang thiết bị & Ngày phép</span>
                    <p className="font-semibold text-slate-800">{offer.devices}</p>
                    <p className="text-xs text-slate-600">{offer.annualLeave}</p>
                  </div>
                </div>
              </div>

              {/* Warning on Expiration */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs md:text-sm text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Hạn chót xác nhận lời mời nhận việc:</p>
                  <p>
                    Thư mời có hiệu lực đến <strong>{offer.expiresAt}</strong>. Sau thời gian này nếu chưa nhận được phản hồi, công ty có thể cân nhắc chuyển cơ hội cho ứng viên tiếp theo trong danh sách.
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS BAR:
                  - Horizontal on PC (Desktop)
                  - Vertical Full-Width on Mobile (stacked with touch-friendly sizing)
              */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3.5">
                  {/* Button 2: Decline Offer (Outline Red) */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeclineError('');
                      setShowDeclineModal(true);
                    }}
                    className="w-full sm:w-auto order-2 sm:order-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 font-bold rounded-xl transition-all shadow-sm text-sm md:text-base active:scale-[0.98]"
                  >
                    <XCircle className="w-5 h-5 text-rose-500" />
                    Từ chối Offer
                  </button>

                  {/* Button 1: Accept Offer (Primary Green) */}
                  <button
                    type="button"
                    onClick={() => setShowAcceptModal(true)}
                    className="w-full sm:w-auto order-1 sm:order-2 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all text-sm md:text-base active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Chấp nhận Offer
                  </button>
                </div>
                <p className="text-center sm:text-right text-[11px] text-slate-600 mt-2">
                  * Nhấp chuột vào nút trên để mở hộp thoại xác nhận chính thức
                </p>
              </div>
            </div>
          </div>

          {/* Need help or questions box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
              <span>
                Cần thêm thông tin hoặc đàm phán lại các điều khoản? Liên hệ trực tiếp Recruiter phụ trách:{' '}
                <strong className="text-slate-900">{offer.hrContact.name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={`mailto:${offer.hrContact.email}?subject=Trao đổi thêm về Offer ${offer.id} - ${offer.candidateName}`}
                className="font-bold text-blue-600 hover:underline"
              >
                Gửi Email
              </a>
              <span className="text-slate-300">|</span>
              <a href={`tel:${offer.hrContact.phone}`} className="font-bold text-blue-600 hover:underline">
                Gọi Hotline
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ACCEPT CONFIRMATION MODAL */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">
                  Xác nhận gia nhập công ty?
                </h3>
                <p className="text-xs md:text-sm text-slate-500">
                  Vui lòng kiểm tra kỹ trước khi đưa ra quyết định cuối cùng.
                </p>
              </div>
            </div>

            {/* Warning Text Requirement */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-sm text-amber-900 leading-relaxed space-y-2">
              <p className="font-bold">
                Bạn có chắc chắn muốn xác nhận gia nhập công ty?
              </p>
              <p className="text-xs text-amber-800">
                Sau khi bấm xác nhận, hệ thống sẽ chốt danh sách tuyển dụng, gửi hồ sơ của bạn sang Ban Nhân Sự để tiến hành chuẩn bị Hợp đồng thử việc và thủ tục đón tiếp vào ngày <strong>{offer.startDate}</strong>.
              </p>
            </div>

            {/* Summary Confirmation */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Vị trí:</span>
                <span className="font-bold text-slate-800">{offer.jobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mức lương Gross:</span>
                <span className="font-bold text-emerald-600">{offer.salaryGross}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày bắt đầu:</span>
                <span className="font-bold text-blue-600">{offer.startDate}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-sm transition-colors"
              >
                Xem lại điều khoản
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xác nhận...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Tôi chắc chắn đồng ý gia nhập
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DECLINE OFFER WITH MANDATORY REASON FORM */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-slate-900">
                  Từ Chối Lời Mời Nhận Việc
                </h3>
                <p className="text-xs md:text-sm text-slate-500">
                  Chúng tôi rất tiếc khi chưa thể đồng hành cùng bạn vào thời điểm này.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmDecline} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Lý do chính khiến bạn từ chối <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2 text-sm">
                  {[
                    { id: 'salary', label: 'Mức thu nhập / Đãi ngộ chưa đạt kỳ vọng của tôi' },
                    { id: 'another_offer', label: 'Tôi đã quyết định nhận lời mời từ một công ty khác' },
                    { id: 'location', label: 'Địa điểm làm việc hoặc thời gian di chuyển chưa thuận tiện' },
                    { id: 'career_direction', label: 'Thay đổi định hướng sự nghiệp / kế hoạch học tập cá nhân' },
                    { id: 'other', label: 'Lý do khác (Vui lòng điền chi tiết)' },
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        declineReason === option.id
                          ? 'border-rose-400 bg-rose-50/60 text-slate-900 font-semibold shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="declineReason"
                        value={option.id}
                        checked={declineReason === option.id}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500"
                      />
                      <span className="text-xs md:text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Textarea for details / feedback */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Chia sẻ thêm lý do hoặc lời nhắn cho Đội ngũ Tuyển dụng {declineReason === 'other' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={customDeclineNote}
                  onChange={(e) => setCustomDeclineNote(e.target.value)}
                  placeholder="Ý kiến đóng góp của bạn giúp chúng tôi cải thiện chính sách đãi ngộ tốt hơn..."
                  rows={3}
                  className="w-full text-base sm:text-sm p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {declineError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {declineError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-sm transition-colors"
                >
                  Hủy, giữ nguyên Offer
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang gửi phản hồi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Xác nhận từ chối Offer
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
