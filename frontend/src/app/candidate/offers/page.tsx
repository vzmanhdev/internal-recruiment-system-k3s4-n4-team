'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  DollarSign,
  Calendar,
  Clock,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
  Building2,
  Gift,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Briefcase,
  HelpCircle,
  Eye,
  Send,
  Zap,
  PartyPopper,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

// ========================================================
// 1. DATA TYPES
// ========================================================

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATING';

export interface CandidateOffer {
  id: string; // OFF-2026-001
  jobTitle: string;
  department: string;
  jobLevel: string;
  baseSalary: string;
  baseSalaryNumber: number;
  probationSalary: string;
  allowances: { title: string; amount: string; desc: string }[];
  bonusPolicy: string;
  startDate: string;
  responseDeadline: string;
  daysRemaining: number;
  officialOfferFile: {
    name: string;
    size: string;
    url: string;
    signedBy: string;
    signedDate: string;
  };
  status: OfferStatus;
  rejectReason?: string;
  negotiationNote?: string;
  negotiationExpectedSalary?: string;
}

// ========================================================
// 2. MOCK DATA
// ========================================================

const INITIAL_OFFER: CandidateOffer = {
  id: 'OFF-2026-001',
  jobTitle: 'Senior Backend Engineer (Go/Python)',
  department: 'Khối Công Nghệ & Phần Mềm (Keangnam Landmark 72)',
  jobLevel: 'Senior Engineer / Band L5',
  baseSalary: '52.000.000 VNĐ / tháng',
  baseSalaryNumber: 52000000,
  probationSalary: '100% lương chính thức ngay trong thời gian thử việc',
  allowances: [
    {
      title: 'Phụ cấp ăn trưa & thiết bị',
      amount: '1.500.000 VNĐ / tháng',
      desc: 'Chi trả trực tiếp vào kỳ lương định kỳ hàng tháng',
    },
    {
      title: 'Gói Sign-on Bonus Chào Mừng',
      amount: '20.000.000 VNĐ',
      desc: 'Chi trả một lần vào tháng lương đầu tiên sau khi nhận việc',
    },
    {
      title: 'Bảo hiểm sức khỏe VIP PVI Care',
      amount: 'Toàn diện cá nhân + 50% người thân',
      desc: 'Hạn mức ngoại trú & nội trú cao cấp lên tới 100 Triệu VNĐ/năm',
    },
    {
      title: 'Trang thiết bị làm việc',
      amount: 'MacBook Pro M3 Max 36GB RAM',
      desc: 'Cấp mới 100% nguyên seal + Màn hình Dell Ultrasharp 27 inch 4K',
    },
  ],
  bonusPolicy: 'Lương tháng 13 cam kết + Thưởng hiệu suất KPI từ 1 đến 3 tháng lương vào dịp cuối năm.',
  startDate: '01/11/2026 (Thứ Hai)',
  responseDeadline: '23:59, Thứ Năm ngày 15/10/2026',
  daysRemaining: 4,
  officialOfferFile: {
    name: 'THU_MOI_NHAN_VIEC_NGUYEN_VAN_AN_L5.pdf',
    size: '3.2 MB',
    url: '#',
    signedBy: 'Lê Hoàng Nam (Phó Tổng Giám Đốc Công Nghệ)',
    signedDate: '10/10/2026',
  },
  status: 'PENDING',
};

export default function CandidateOffersPage() {
  const [offer, setOffer] = useState<CandidateOffer>(INITIAL_OFFER);

  // Modal States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isNegotiateModalOpen, setIsNegotiateModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  // Form inputs for Reject & Negotiate
  const [selectedRejectReason, setSelectedRejectReason] = useState('Mức lương chưa đạt kỳ vọng');
  const [rejectNote, setRejectNote] = useState('');
  const [negotiateSalaryInput, setNegotiateSalaryInput] = useState('56.000.000 VNĐ');
  const [negotiateMessage, setNegotiateMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confetti trigger state
  const [showConfetti, setShowConfetti] = useState(false);

  // 1. HÀNH ĐỘNG: CHẤP NHẬN OFFER (NỔ PHÁO HOA & CHÚC MỪNG)
  const handleAcceptOffer = () => {
    setShowConfetti(true);
    setOffer((prev) => ({ ...prev, status: 'ACCEPTED' }));
    setIsAcceptModalOpen(true);

    setTimeout(() => {
      setShowConfetti(false);
    }, 6000);
  };

  // 2. HÀNH ĐỘNG: TỪ CHỐI OFFER
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const fullReason = `${selectedRejectReason}${rejectNote ? ` - Chi tiết: ${rejectNote}` : ''}`;
      setOffer((prev) => ({
        ...prev,
        status: 'REJECTED',
        rejectReason: fullReason,
      }));

      setIsSubmitting(false);
      setIsRejectModalOpen(false);
      setToastMessage('Bạn đã từ chối thư mời nhận việc. Hệ thống đã thông báo đến Ban tuyển dụng.');

      setTimeout(() => setToastMessage(null), 5000);
    }, 800);
  };

  // 3. HÀNH ĐỘNG: THƯƠNG LƯỢNG LẠI OFFER
  const handleConfirmNegotiate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setOffer((prev) => ({
        ...prev,
        status: 'NEGOTIATING',
        negotiationExpectedSalary: negotiateSalaryInput,
        negotiationNote: negotiateMessage,
      }));

      setIsSubmitting(false);
      setIsNegotiateModalOpen(false);
      setToastMessage('Đã gửi đề xuất thương lượng lại tới Ban Tuyển Dụng. HR sẽ liên hệ trao đổi trong 24 giờ.');

      setTimeout(() => setToastMessage(null), 5000);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto relative">
      {/* HIỆU ỨNG PHÁO HOA CONFETTI PARTICLES RƠI */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => {
            const left = Math.random() * 100;
            const animDuration = 2 + Math.random() * 3;
            const delay = Math.random() * 0.5;
            const bgColors = [
              'bg-amber-400',
              'bg-blue-500',
              'bg-rose-500',
              'bg-emerald-400',
              'bg-purple-500',
              'bg-indigo-400',
            ];
            const colorClass = bgColors[i % bgColors.length];
            const size = 8 + Math.floor(Math.random() * 8);

            return (
              <div
                key={i}
                className={clsx('absolute rounded-full animate-bounce shadow-md', colorClass)}
                style={{
                  left: `${left}%`,
                  top: '-20px',
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDuration: `${animDuration}s`,
                  animationDelay: `${delay}s`,
                  transform: `translateY(${Math.random() * 600}px) rotate(${Math.random() * 360}deg)`,
                  transition: 'all 3s ease-out',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-extrabold text-xs sm:text-sm">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
          <Link href="/candidate/jobs" className="hover:text-blue-600 transition-colors">
            Candidate Workspace
          </Link>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Đề xuất (Offer)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Award className="w-7 h-7 text-blue-600" />
          <span>Thư Mời Nhận Việc Chính Thức (Job Offer)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá. Vui lòng xem kỹ chế độ đãi ngộ và phản hồi trước hạn chót.
        </p>
      </div>

      {/* BANNER TRẠNG THÁI OFFER HIỆN TẠI */}
      {offer.status === 'ACCEPTED' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black shrink-0">
              <PartyPopper className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg">
                CHÚC MỪNG BẠN ĐÃ CHẤP NHẬN OFFER!
              </h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Bộ phận HR People Operations đang chuẩn bị hợp đồng lao động và hướng dẫn Onboarding cho bạn.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAcceptModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-extrabold text-xs shadow-md hover:bg-emerald-50 shrink-0 cursor-pointer"
          >
            Xem Hướng Dẫn
          </button>
        </div>
      )}

      {offer.status === 'NEGOTIATING' && (
        <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-black text-xs sm:text-sm block">
                Đang Thương Lượng Lại Mức Đãi Ngộ
              </span>
              <span className="text-[11px] text-amber-800">
                Đề xuất mức lương: <strong>{offer.negotiationExpectedSalary}</strong>. HR đang trao đổi cùng Ban Giám Đốc.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-800 text-[10px] font-black uppercase">
            Đang Xử Lý
          </span>
        </div>
      )}

      {offer.status === 'REJECTED' && (
        <div className="p-4 rounded-3xl bg-slate-100 border border-slate-300 text-slate-700 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-slate-500 shrink-0" />
            <div>
              <span className="font-black text-xs sm:text-sm block">
                Bạn đã từ chối thư mời nhận việc này
              </span>
              <span className="text-[11px] text-slate-500">
                Lý do: &ldquo;{offer.rejectReason}&rdquo;
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase">
            Đã Từ Chối
          </span>
        </div>
      )}

      {/* CHI TIẾT OFFER CHÍNH (EXECUTIVE DESIGN CARD) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Header thư mời trang trọng */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  OFFICIAL OFFER LETTER
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  Mã: {offer.id}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {offer.jobTitle}
              </h2>
              <div className="text-xs text-blue-100 font-medium flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{offer.department}</span>
                <span>&bull;</span>
                <span className="text-amber-300 font-bold">{offer.jobLevel}</span>
              </div>
            </div>

            {/* Hộp Countdown Hạn Chót */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-right self-start sm:self-auto shrink-0 space-y-0.5">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                Hạn chót phản hồi
              </span>
              <span className="text-sm font-black text-amber-300 block">
                {offer.responseDeadline}
              </span>
              <span className="text-[11px] text-blue-200 block">
                Còn lại: <strong>{offer.daysRemaining} ngày</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Nội dung chi tiết các đãi ngộ */}
        <div className="p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
          {/* LƯƠNG CƠ BẢN & CHẾ ĐỘ THỬ VIỆC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Mức Lương Cơ Bản Hàng Tháng
              </span>
              <div className="text-2xl sm:text-3xl font-black text-blue-700">
                {offer.baseSalary}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                (Áp dụng theo hình thức Gross, đóng bảo hiểm xã hội đầy đủ theo quy định pháp luật)
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1.5">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Chính Sách Thử Việc & Ngày Bắt Đầu
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-800">
                Hưởng 100% lương từ ngày đầu tiên
              </div>
              <p className="text-xs text-slate-600">
                Ngày bắt đầu đi làm chính thức: <strong className="text-slate-900">{offer.startDate}</strong>
              </p>
            </div>
          </div>

          {/* CÁC KHOẢN TRỢ CẤP & PHÚC LỢI CHI TIẾT */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-blue-600" />
              <span>Các Khoản Phụ Cấp & Đãi Ngộ Đi Kèm</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {offer.allowances.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-xs text-slate-900 block">
                      {item.title}
                    </span>
                    <span className="font-black text-blue-700 text-xs block">
                      {item.amount}
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CHÍNH SÁCH THƯỞNG CUỐI NĂM */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-extrabold block">
                Chính sách Thưởng & Đãi ngộ hiệu suất:
              </strong>
              {offer.bonusPolicy}
            </div>
          </div>

          {/* FILE PDF ĐÍNH KÈM (BẢN CỨNG OFFER LETTER) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm shrink-0 border border-rose-100 shadow-xs">
                PDF
              </div>
              <div>
                <span className="font-black text-xs sm:text-sm text-slate-900 block truncate max-w-xs sm:max-w-md">
                  {offer.officialOfferFile.name}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {offer.officialOfferFile.size} &bull; Ký duyệt bởi: <strong>{offer.officialOfferFile.signedBy}</strong> ({offer.officialOfferFile.signedDate})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPdfPreviewOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Xem Bản In</span>
              </button>

              <button
                type="button"
                onClick={() => alert(`Đang tải xuống file ${offer.officialOfferFile.name}...`)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Về PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3 NÚT HÀNH ĐỘNG PHẢN HỒI (CHẤP NHẬN / TỪ CHỐI / THƯƠNG LƯỢNG) */}
        {/* ======================================================== */}
        <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Mọi thắc mắc cần giải đáp vui lòng liên hệ HR trước ngày hết hạn.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* NÚT 1: TỪ CHỐI */}
            <button
              type="button"
              disabled={offer.status === 'ACCEPTED'}
              onClick={() => setIsRejectModalOpen(true)}
              className="px-4 py-3 rounded-2xl border-2 border-slate-300 hover:border-rose-400 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              Từ Chối Offer
            </button>

            {/* NÚT 2: THƯƠNG LƯỢNG LẠI */}
            <button
              type="button"
              disabled={offer.status === 'ACCEPTED'}
              onClick={() => setIsNegotiateModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Thương Lượng Lại</span>
            </button>

            {/* NÚT 3: CHẤP NHẬN OFFER (PRIMARY BIG GREEN) */}
            <button
              type="button"
              disabled={offer.status === 'ACCEPTED'}
              onClick={handleAcceptOffer}
              className={clsx(
                'px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all transform cursor-pointer',
                offer.status === 'ACCEPTED'
                  ? 'bg-emerald-600 text-white opacity-95 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-500/25'
              )}
            >
              <Sparkles className="w-4 h-4" />
              <span>{offer.status === 'ACCEPTED' ? 'Đã Chấp Nhận Thư Mời' : 'Chấp Nhận Offer Ngay'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. MODAL CHÚC MỪNG KHI CHẤP NHẬN OFFER */}
      {/* ======================================================== */}
      {isAcceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <PartyPopper className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Chúc Mừng Tân Thành Viên!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Bạn đã chính thức đồng ý gia nhập đội ngũ tại vị trí{' '}
                <strong className="text-blue-600 font-bold">{offer.jobTitle}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-left space-y-2">
              <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Các bước tiếp theo:</span>
              </div>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li>Bộ phận People Ops sẽ gửi email hướng dẫn chuẩn bị hồ sơ nhân sự trong 24 giờ.</li>
                <li>Ngày làm việc đầu tiên: <strong>{offer.startDate}</strong> lúc 08:30 tại Tầng 24 Keangnam.</li>
                <li>Thiết bị làm việc và tài khoản công ty sẽ được bàn giao ngay trong buổi sáng đầu tiên.</li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAcceptModalOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md cursor-pointer"
              >
                Tuyệt Vời, Tôi Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL TỪ CHỐI OFFER (CÓ CHỌN LÝ DO) */}
      {/* ======================================================== */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Từ Chối Thư Mời Nhận Việc
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {offer.jobTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-extrabold text-slate-800">
                  Lý do chính khiến bạn từ chối offer này *
                </label>
                {[
                  'Mức lương chưa đạt kỳ vọng',
                  'Đã nhận lời mời từ công ty khác',
                  'Địa điểm làm việc xa / Không phù hợp đi lại',
                  'Thay đổi kế hoạch cá nhân hoặc gia đình',
                  'Lý do khác',
                ].map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reason}
                      checked={selectedRejectReason === reason}
                      onChange={(e) => setSelectedRejectReason(e.target.value)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-slate-800">{reason}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-1">
                <label className="block font-extrabold text-slate-800">
                  Ghi chú thêm (Không bắt buộc):
                </label>
                <textarea
                  rows={2}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Chia sẻ thêm thông tin để giúp công ty cải thiện trải nghiệm tuyển dụng..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Giữ Lại Offer
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-500/20 cursor-pointer"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL THƯƠNG LƯỢNG LẠI (KHUNG CHAT / TEXTAREA) */}
      {/* ======================================================== */}
      {isNegotiateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Thương Lượng Lại Mức Đãi Ngộ
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Gửi đề xuất trực tiếp tới Hiring Manager & HR Director
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNegotiateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmNegotiate} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Gợi ý:</strong> Chúng tôi luôn lắng nghe nguyện vọng xứng đáng với năng lực của bạn. Hãy ghi rõ mức lương kỳ vọng và lý do để hai bên cùng đạt tiếng nói chung.
              </div>

              <div className="space-y-1">
                <label className="block font-extrabold text-slate-800">
                  Mức lương cơ bản đề xuất mới (VNĐ) *
                </label>
                <input
                  type="text"
                  required
                  value={negotiateSalaryInput}
                  onChange={(e) => setNegotiateSalaryInput(e.target.value)}
                  placeholder="Ví dụ: 56.000.000 VNĐ / tháng"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-400 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-extrabold text-slate-800">
                  Lời nhắn / Căn cứ đề xuất gửi tới Hội đồng tuyển dụng *
                </label>
                <textarea
                  required
                  rows={4}
                  value={negotiateMessage}
                  onChange={(e) => setNegotiateMessage(e.target.value)}
                  placeholder="Kính gửi Ban Giám Đốc, dựa trên kinh nghiệm 5 năm về Golang và hạ tầng chịu tải cao tôi tin rằng có thể đóng góp vượt trội ngay từ tháng đầu tiên..."
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNegotiateModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đề Xuất Thương Lượng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL XEM TRƯỚC BẢN IN PDF OFFER LETTER */}
      {/* ======================================================== */}
      {isPdfPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="font-black text-base text-slate-900">
                  Bản In Thư Mời Nhận Việc (Executive PDF Preview)
                </h3>
              </div>
              <button
                onClick={() => setIsPdfPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Văn bản mô phỏng trang trọng */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 text-xs font-serif leading-relaxed text-slate-800">
              <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                <span className="font-bold uppercase tracking-widest text-slate-500 text-[10px] block">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </span>
                <span className="font-bold text-[11px] block">Độc lập - Tự do - Hạnh phúc</span>
                <h4 className="font-black text-base pt-2 text-slate-900 uppercase">
                  THƯ MỜI NHẬN VIỆC (JOB OFFER LETTER)
                </h4>
                <p className="text-[10px] text-slate-400 font-sans">
                  Số: 2026/OFFER-ENG/L5 &bull; Hà Nội, ngày 10 tháng 10 năm 2026
                </p>
              </div>

              <p>
                Kính gửi Ông: <strong>NGUYỄN VĂN AN</strong>
              </p>
              <p>
                Ban Giám Đốc trân trọng gửi lời chúc mừng và đề xuất mời Ông gia nhập công ty tại chức danh: <strong>{offer.jobTitle}</strong>, trực thuộc <strong>{offer.department}</strong>.
              </p>

              <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-200 font-sans text-xs">
                <div>&bull; <strong>Mức lương cơ bản:</strong> {offer.baseSalary}</div>
                <div>&bull; <strong>Ngày nhận việc:</strong> {offer.startDate}</div>
                <div>&bull; <strong>Chế độ thử việc:</strong> {offer.probationSalary}</div>
                <div>&bull; <strong>Thời hạn phản hồi:</strong> Trước {offer.responseDeadline}</div>
              </div>

              <div className="pt-6 flex items-center justify-between font-sans text-xs">
                <div className="text-center">
                  <span className="font-bold text-slate-400 block text-[10px]">ĐẠI DIỆN ỨNG VIÊN</span>
                  <div className="h-12 flex items-center justify-center italic text-blue-600 font-bold">
                    Nguyễn Văn An
                  </div>
                </div>

                <div className="text-center">
                  <span className="font-bold text-slate-400 block text-[10px]">ĐẠI DIỆN BAN GIÁM ĐỐC</span>
                  <div className="h-12 flex items-center justify-center font-bold text-emerald-700">
                    [Đã ký số điện tử: Lê Hoàng Nam]
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsPdfPreviewOpen(false)}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Đóng
              </button>
              <button
                onClick={() => alert('Đang tải file PDF bản in...')}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-md"
              >
                Tải Xuống PDF Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
