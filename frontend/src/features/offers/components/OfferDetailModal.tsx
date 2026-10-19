'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Copy,
  Check,
  Building,
  User,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Send,
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { formatCurrencyVND } from '@/utils/dateUtils';

interface OfferApprovalLogItem {
  id: number;
  actor_id?: number;
  actor_name?: string;
  action: string;
  level?: string;
  comment?: string;
  created_at: string;
}

interface OnboardingItem {
  id?: number;
  task_name: string;
  assigned_role: string;
  days_before_start?: number;
  is_completed?: boolean;
}

interface ApiOfferDetail {
  id: number;
  code?: string;
  application_id: number;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  department?: string;
  requisition_code?: string;
  created_by_name?: string;
  offered_salary: number;
  allowance?: number;
  currency: string;
  probation_salary_percentage: number;
  start_date: string;
  probation_duration_months: number;
  work_location: string;
  notes?: string;
  status: string;
  salary_justification?: string;
  requires_escalation: boolean;
  approval_level?: string;
  response_deadline?: string;
  revision: number;
  sent_at?: string;
  responded_at?: string;
  band_min?: number | null;
  band_max?: number | null;
  onboarding?: OnboardingItem[];
  onboarding_progress?: number;
  approval_logs?: OfferApprovalLogItem[];
  created_at?: string;
}

interface OfferPreviewResponse {
  subject: string;
  body_html: string;
  offer: ApiOfferDetail;
}

interface OfferDetailModalProps {
  isOpen: boolean;
  offerId: number | string | null;
  onClose: () => void;
  onActionSuccess?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: { label: 'Bản nháp', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', icon: Clock },
  pending_approval: { label: 'Chờ phê duyệt', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', icon: Clock },
  approved: { label: 'Đã phê duyệt', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', icon: CheckCircle2 },
  sent: { label: 'Đã gửi ứng viên', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', icon: Send },
  accepted: { label: 'Ứng viên đồng ý', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', icon: CheckCircle2 },
  declined: { label: 'Ứng viên từ chối', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', icon: AlertCircle },
  rejected: { label: 'Từ chối duyệt', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', icon: AlertCircle },
  expired: { label: 'Đã quá hạn', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', icon: Clock },
};

export function OfferDetailModal({ isOpen, offerId, onClose }: OfferDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'letter' | 'terms' | 'timeline' | 'onboarding'>('letter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<OfferPreviewResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !offerId) {
      setDetail(null);
      setError(null);
      return;
    }

    const cleanId = typeof offerId === 'string' && offerId.startsWith('OFF-') ? offerId.replace('OFF-', '') : offerId;

    let isMounted = true;
    setLoading(true);
    setError(null);

    apiRequest<OfferPreviewResponse>(`/offers/${cleanId}/letter-preview`)
      .then((res) => {
        if (isMounted) {
          setDetail(res);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Không tải được chi tiết thư mời nhận việc.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, offerId]);

  if (!isOpen) return null;

  const offer = detail?.offer;
  const statusCfg = offer ? STATUS_CONFIG[offer.status] || STATUS_CONFIG['draft'] : STATUS_CONFIG['draft'];
  const StatusIcon = statusCfg.icon;

  const candidatePortalUrl = offer
    ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/candidate/offer/${offer.id}`
    : '';

  const handleCopyPortalLink = () => {
    if (!candidatePortalUrl) return;
    navigator.clipboard.writeText(candidatePortalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isOverBand = offer && offer.band_max && offer.offered_salary > offer.band_max;
  const overPercentage = isOverBand && offer.band_max ? Math.round(((offer.offered_salary - offer.band_max) / offer.band_max) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-xl font-black text-blue-300">₫</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-black bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md border border-blue-400/30">
                  OFF-{offer?.id || offerId}
                </span>
                <span className="text-sm font-bold text-slate-100">{offer?.job_title || 'Thư Mời Nhận Việc'}</span>
                {offer && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusCfg.label}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Ứng viên: <strong className="text-white font-semibold">{offer?.candidate_name || 'Đang tải...'}</strong>
                {offer?.department ? ` · Khối: ${offer.department}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('letter')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'letter' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>1. Thư Mời Chuẩn (Letterhead)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'terms' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>2. Đãi Ngộ & Dải Lương VNĐ</span>
            {isOverBand && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>3. Lịch Sử & Quy Trình Duyệt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('onboarding')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'onboarding' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span>4. Thủ Tục Onboarding</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Đang tải dữ liệu thư mời nhận việc...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
              <h4 className="text-sm font-bold">Không thể tải thông tin Offer</h4>
              <p className="text-xs text-rose-600">{error}</p>
            </div>
          )}

          {!loading && !error && offer && (
            <>
              {/* TAB 1: THƯ MỜI NHẬN VIỆC (OFFICIAL LETTERHEAD) */}
              {activeTab === 'letter' && (
                <div className="space-y-4">
                  {/* Quick Notice Banner */}
                  <div className="p-3.5 bg-blue-50/90 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-blue-900 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Thư mời được tạo tự động theo dữ liệu phê duyệt của hệ thống Tuyển Dụng Nội Bộ.</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyPortalLink}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 font-bold rounded-xl border border-blue-300 shadow-2xs transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                        <span>{copied ? 'Đã sao chép link' : 'Sao chép link ứng viên'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Letterhead Simulated Paper Container */}
                  <div
                    ref={letterRef}
                    className="p-8 sm:p-12 bg-white rounded-2xl border border-slate-200/90 shadow-md text-slate-800 space-y-6 max-w-3xl mx-auto print:shadow-none print:border-none print:p-0"
                  >
                    {/* Top Branding Header */}
                    <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                            IR
                          </div>
                          <span className="font-black text-base tracking-tight text-slate-900 uppercase">
                            TUYỂN DỤNG NỘI BỘ
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">Hệ Thống Quản Trị Nhân Sự & Thu Hút Nhân Tài</p>
                      </div>

                      <div className="text-right text-[11px] text-slate-500 font-medium">
                        <div>Số: <strong className="font-mono text-slate-800">OFF-{offer.id}/2026/HR</strong></div>
                        <div>Hà Nội, ngày {new Date().toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>

                    {/* Letter Title */}
                    <div className="text-center space-y-1 pt-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                        THƯ MỜI NHẬN VIỆC (JOB OFFER LETTER)
                      </h2>
                      <p className="text-xs text-slate-500 font-medium italic">
                        V/v: Tiếp nhận nhân sự cho vị trí {offer.job_title}
                      </p>
                    </div>

                    {/* Salutation */}
                    <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <p>
                        Kính gửi: <strong>Ông/Bà {offer.candidate_name}</strong>,
                      </p>
                      <p>
                        Thay mặt Ban Giám Đốc và Hội đồng Tuyển dụng, chúng tôi rất vui mừng và trân trọng gửi tới bạn lời mời
                        gia nhập đội ngũ với thông tin bổ nhiệm chi tiết như sau:
                      </p>
                    </div>

                    {/* Terms Highlight Box */}
                    <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-500 block font-semibold">1. Vị trí chức danh bổ nhiệm:</span>
                          <strong className="text-slate-900 text-sm font-bold flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                            {offer.job_title}
                          </strong>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-500 block font-semibold">2. Phòng ban / Khối trực thuộc:</span>
                          <strong className="text-slate-900 text-sm font-bold flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-purple-600 shrink-0" />
                            {offer.department || 'Khối chuyên môn'}
                          </strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-500 block font-semibold">3. Mức lương chính thức (Gross):</span>
                          <div className="text-sm font-black text-emerald-700 font-mono flex items-center gap-1">
                            <span>₫</span>
                            <span>{offer.offered_salary.toLocaleString('vi-VN')} VNĐ / tháng</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({formatCurrencyVND(offer.offered_salary)})
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-500 block font-semibold">4. Phụ cấp & Đãi ngộ hàng tháng:</span>
                          <strong className="text-slate-800 text-xs font-bold block">
                            {offer.allowance ? `${offer.allowance.toLocaleString('vi-VN')} VNĐ` : 'Theo chính sách chung của công ty'}
                          </strong>
                          {offer.notes && <span className="text-[11px] text-slate-500 italic block">{offer.notes}</span>}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-500 block font-semibold">5. Ngày đi làm dự kiến:</span>
                          <strong className="text-slate-900 font-bold block mt-0.5">{offer.start_date}</strong>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 block font-semibold">6. Hạn chót phản hồi:</span>
                          <strong className="text-amber-800 font-bold block mt-0.5">{offer.response_deadline || 'Theo thông báo'}</strong>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-500 block font-semibold">7. Thời gian thử việc:</span>
                          <strong className="text-slate-900 font-bold block mt-0.5">
                            {offer.probation_duration_months} tháng ({offer.probation_salary_percentage}% lương)
                          </strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80">
                        <span className="text-[11px] text-slate-500 block font-semibold">8. Địa điểm làm việc chính thức:</span>
                        <span className="text-slate-800 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {offer.work_location || 'Hà Nội'}
                        </span>
                      </div>
                    </div>

                    {/* Portal Response Link Card */}
                    <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-2">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Phương thức phản hồi Thư mời nhận việc:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        Bạn vui lòng truy cập Cổng thông tin Ứng viên bảo mật để xem toàn bộ điều khoản và gửi quyết định
                        <strong> Đồng ý (Accept)</strong> hoặc <strong>Từ chối (Decline)</strong>:
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={candidatePortalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <span>Mở Cổng Phản Hồi Trực Tuyến</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={handleCopyPortalLink}
                          className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-100 rounded-xl font-semibold border border-emerald-300 transition-colors cursor-pointer"
                        >
                          {copied ? 'Đã copy' : 'Copy link'}
                        </button>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 pt-8 text-center text-xs text-slate-600">
                      <div>
                        <div className="font-bold text-slate-900 uppercase">ĐẠI DIỆN PHÒNG NHÂN SỰ</div>
                        <div className="text-[11px] text-slate-400 mt-1">Trưởng phòng Nhân sự & Tuyển dụng</div>
                        <div className="h-16 flex items-center justify-center font-serif italic text-blue-700 text-sm font-semibold">
                          [Đã ký điện tử]
                        </div>
                        <div className="font-semibold text-slate-800">{offer.created_by_name || 'HR Manager'}</div>
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 uppercase">ĐẠI DIỆN BAN GIÁM ĐỐC</div>
                        <div className="text-[11px] text-slate-400 mt-1">Giám đốc Khối / CEO</div>
                        <div className="h-16 flex items-center justify-center font-serif italic text-emerald-700 text-sm font-semibold">
                          {offer.status === 'approved' || offer.status === 'sent' || offer.status === 'accepted' ? '[Đã phê duyệt]' : '[Chờ phê duyệt]'}
                        </div>
                        <div className="font-semibold text-slate-800">Ban Lãnh Đạo Công Ty</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ĐÃI NGỘ & DẢI LƯƠNG CHUẨN */}
              {activeTab === 'terms' && (
                <div className="space-y-5 max-w-3xl mx-auto">
                  {/* Salary Band Evaluation Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Thẩm Định & So Sánh Dải Lương Chuẩn [S7-03]</h4>
                        <p className="text-xs text-slate-500 mt-0.5">So sánh mức lương đề xuất với khung lương tiêu chuẩn chức danh</p>
                      </div>

                      {isOverBand ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>VƯỢT DẢI LƯƠNG (+{overPercentage}%)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>NẰM TRONG DẢI CHUẨN</span>
                        </span>
                      )}
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500 block font-semibold">Dải tối thiểu (Min Band):</span>
                        <span className="text-sm font-extrabold text-slate-800 font-mono mt-1 block">
                          {offer.band_min ? `${(offer.band_min / 1000000).toFixed(1)} tr` : 'Chưa thiết lập'}
                        </span>
                      </div>

                      <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200">
                        <span className="text-[11px] text-blue-700 block font-bold">Lương đề xuất (Offer):</span>
                        <span className="text-base font-black text-blue-800 font-mono mt-0.5 block">
                          {(offer.offered_salary / 1000000).toFixed(1)} tr VNĐ
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold">{offer.offered_salary.toLocaleString('vi-VN')} đ</span>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] text-slate-500 block font-semibold">Dải tối đa (Max Band):</span>
                        <span className="text-sm font-extrabold text-slate-800 font-mono mt-1 block">
                          {offer.band_max ? `${(offer.band_max / 1000000).toFixed(1)} tr` : 'Chưa thiết lập'}
                        </span>
                      </div>
                    </div>

                    {/* Justification Box */}
                    {offer.salary_justification && (
                      <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1.5">
                        <div className="font-bold text-amber-900 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Giải trình đề xuất vượt dải lương của HR:</span>
                        </div>
                        <p className="text-amber-800 italic leading-relaxed">{offer.salary_justification}</p>
                      </div>
                    )}
                  </div>

                  {/* General Employment Policies */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                    <h4 className="text-sm font-bold text-slate-900">Chính Sách & Điều Khoản Đãi Ngộ Bổ Sung</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-slate-700">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <strong className="block text-slate-900 font-semibold">Chế độ Thử việc:</strong>
                        <span className="text-slate-600 mt-0.5 block">
                          {offer.probation_duration_months} tháng, hưởng {offer.probation_salary_percentage}% mức lương chính thức.
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <strong className="block text-slate-900 font-semibold">Bảo hiểm & Y tế:</strong>
                        <span className="text-slate-600 mt-0.5 block">Đóng BHXH, BHYT, BHTN theo mức lương thực tế và quy định hiện hành.</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <strong className="block text-slate-900 font-semibold">Trang thiết bị làm việc:</strong>
                        <span className="text-slate-600 mt-0.5 block">Cấp phát Laptop cấu hình cao và phụ kiện công nghệ theo chức danh.</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <strong className="block text-slate-900 font-semibold">Phép năm & Nghỉ lễ:</strong>
                        <span className="text-slate-600 mt-0.5 block">12 ngày phép năm + các ngày nghỉ lễ tết theo quy định Nhà Nước.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TIẾN TRÌNH & LỊCH SỬ DUYỆT */}
              {activeTab === 'timeline' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-3xl mx-auto">
                  <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                    <span>Nhật Ký & Lịch Sử Phê Duyệt Thư Mời</span>
                    <span className="text-[11px] text-slate-400 font-normal">Quy trình duyệt cấp bậc nhiều vòng</span>
                  </h4>

                  {(!offer.approval_logs || offer.approval_logs.length === 0) ? (
                    <div className="py-8 text-center text-xs text-slate-400">Chưa có nhật ký phê duyệt nào cho Offer này.</div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {offer.approval_logs.map((log, idx) => (
                        <div key={log.id || idx} className="flex items-start gap-3.5 relative">
                          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 z-10">
                            {idx + 1}
                          </div>
                          <div className="flex-1 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                {log.action === 'created' ? 'Khởi tạo bản nháp' : log.action === 'submitted' ? 'Trình duyệt cấp trên' : log.action === 'approved' ? 'Phê duyệt đồng ý' : log.action === 'rejected' ? 'Từ chối duyệt' : log.action}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(log.created_at).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <p className="text-slate-600">
                              Người xử lý: <strong>{log.actor_name || `User #${log.actor_id || 'System'}`}</strong>
                              {log.level && <span className="text-slate-400"> · Cấp: {log.level}</span>}
                            </p>
                            {log.comment && <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200 text-[11px] italic mt-1 font-medium">{log.comment}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: THỦ TỤC ONBOARDING */}
              {activeTab === 'onboarding' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-3xl mx-auto text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Danh Mục Thủ Tục Tiếp Nhận (Onboarding Checklist)</h4>
                      <p className="text-slate-500 mt-0.5">Tiến độ chuẩn bị tiếp nhận nhân sự mới trước và trong ngày đầu đi làm</p>
                    </div>
                    <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
                      Tiến độ: {offer.onboarding_progress ?? 0}%
                    </span>
                  </div>

                  {(!offer.onboarding || offer.onboarding.length === 0) ? (
                    <div className="py-8 text-center text-slate-400">Chưa khởi tạo checklist onboarding cho vị trí này.</div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {offer.onboarding.map((task, i) => (
                        <div
                          key={task.id || i}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={task.is_completed ? 'text-emerald-600' : 'text-slate-300'}>
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                            <span className={`font-semibold ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {task.task_name}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {task.assigned_role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>In Thư Mời / Xuất PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPortalLink}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-blue-600" />}
              <span>{copied ? 'Đã sao chép link' : 'Sao chép link cổng ứng viên'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
