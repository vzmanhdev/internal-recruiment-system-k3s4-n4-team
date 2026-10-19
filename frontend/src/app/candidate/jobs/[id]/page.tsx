'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Share2,
  Send,
  Upload,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  User,
  HeartHandshake,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { careerApi, type CandidateJob, type CareerPageSettingsData } from '@/features/candidate/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';

export default function CandidateJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || '';
  const { user } = useAuth();

  const { data, loading: jobLoading } = useApiData(
    () => Promise.all([careerApi.get(jobId), careerApi.getCareerPageSettings().catch(() => null)]),
    [jobId]
  );
  const job: CandidateJob | null = data?.[0] || null;
  const settings: CareerPageSettingsData | null = data?.[1] || null;

  // Modal State: Ứng tuyển nhanh (Không cần tài khoản)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [appliedAppId, setAppliedAppId] = useState('');

  // Form State (Auto-prefilled from user if logged in)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cvLink, setCvLink] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-prefill authenticated user info
  React.useEffect(() => {
    if (user) {
      if (!fullName && user.full_name) setFullName(user.full_name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      showToast('Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCvFileName(file.name);
      setCvFile(file);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setFormError('Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại.');
      return;
    }

    if (!cvFile) {
      setFormError('Vui lòng tải lên tệp CV (.pdf, .docx) — hồ sơ phải được lưu trên hệ thống tuyển dụng.');
      return;
    }
    if (!job) return;

    setIsSubmitting(true);
    try {
      const created = await careerApi.apply(job, {
        full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), file: cvFile,
        cover_letter: [coverNote.trim(), cvLink.trim() && `Liên kết hồ sơ bổ sung: ${cvLink.trim()}`].filter(Boolean).join('\n'),
      });
      setAppliedAppId(created.tracking_code);
      setIsSubmitSuccess(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Không gửi được hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsApplyModalOpen(false);
    if (isSubmitSuccess) {
      setIsSubmitSuccess(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setCvLink('');
      setCvFileName('');
      setCvFile(null);
      setCoverNote('');
    }
  };

  if (jobLoading) return <LoadingState />;

  // Trường hợp không tìm thấy Job
  if (!job) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <Briefcase className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">
            Không tìm thấy thông tin vị trí tuyển dụng
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Vị trí này có thể đã hết hạn nhận hồ sơ hoặc đường dẫn không còn khả dụng.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/candidate/jobs"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center gap-2 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại danh sách việc làm</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link href="/candidate/jobs" className="hover:text-blue-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Danh sách việc làm</span>
        </Link>
        <span>&rsaquo;</span>
        <span className="text-slate-400">{job.department}</span>
        <span>&rsaquo;</span>
        <span className="text-slate-800 font-bold truncate max-w-xs">{job.title}</span>
      </nav>

      {/* 2. Top Job Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{job.department}</span>
              </span>

              {job.isHot && (
                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                  Tuyển Gấp
                </span>
              )}

              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                {job.employmentType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {job.title}
            </h1>

            {/* Quick Meta Items */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-600">
                <DollarSign className="w-4 h-4 text-blue-500" />
                <span>{job.salary}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Hạn nộp: <strong className="text-slate-700">{job.deadline}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Đăng ngày: {job.postedDate}</span>
              </div>
            </div>
          </div>

          {/* Desktop Quick Action Button */}
          <div className="hidden lg:flex flex-col items-end gap-3 shrink-0">
            <Link
              href={`/candidate/apply/${job.id}`}
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Ứng tuyển ngay</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ vị trí</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Cấu trúc chia 2 cột trên PC (JD 70% - Tóm tắt 30%), gộp 1 cột trên Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI: Nội dung chi tiết JD (~70% - col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Mô tả công việc */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span>Mô tả công việc</span>
            </h2>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {job.description.map((desc, idx) => (
                <p key={idx}>{desc}</p>
              ))}

              <div className="pt-2">
                <h3 className="font-bold text-slate-800 text-sm mb-2">Trách nhiệm chính:</h3>
                <ul className="space-y-2 list-disc list-inside text-slate-600 pl-1">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {resp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: Yêu cầu ứng viên */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Yêu cầu ứng viên</span>
            </h2>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {job.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>

            {/* Tags Kỹ năng mong đợi */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Kỹ năng chuyên môn liên quan:</span>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Quyền lợi & Chế độ đãi ngộ */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Quyền lợi & Chế độ đãi ngộ</span>
            </h2>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {job.benefits.map((ben, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{ben}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 4: Địa điểm làm việc & Cam kết bảo mật */}
          <div className="bg-blue-50/50 rounded-3xl p-6 sm:p-7 border border-blue-100 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Địa điểm làm việc</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {job.workplaceAddress}
            </p>
            <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-2 border-t border-blue-100/80">
              <HeartHandshake className="w-4 h-4 text-blue-500" />
              <span>Hệ thống cam kết bảo mật 100% thông tin cá nhân và lịch sử ứng tuyển của ứng viên.</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Tóm tắt thông tin (~30% - col-span-4) - Dính trên màn hình PC */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Card Tóm tắt cơ hội */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
              Thông tin tóm tắt
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Mức lương đề xuất</span>
                <span className="text-lg font-black text-blue-600 mt-0.5 block">
                  {job.salary}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Cấp bậc</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{job.level}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Số lượng tuyển</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{job.headcount} nhân sự</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div>
                  <span className="text-slate-400 block font-medium">Hình thức làm việc</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{job.employmentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Hạn chót nhận hồ sơ</span>
                  <span className="font-bold text-rose-600 mt-0.5 block">{job.deadline}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/candidate/apply/${job.id}`}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Nộp hồ sơ ứng tuyển</span>
              </Link>
            </div>
          </div>

          {/* Card Hỗ trợ ứng viên */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-900">Cần hỗ trợ về vị trí này?</h4>
            <p className="text-slate-500 leading-relaxed">
              Bộ phận Tuyển dụng luôn sẵn sàng giải đáp thắc mắc về chế độ làm việc và văn hóa công ty.
            </p>
            <div className="space-y-1.5 pt-1 font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>{job.contactEmail || settings?.contact_email || 'tuyendung@enterprise.com'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>{settings?.contact_phone || '1900 6868'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TRẢI NGHIỆM MOBILE: ACTION BAR DÍNH CHẶT Ở ĐÁY MÀN HÌNH (STICKY BOTTOM BAR) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3.5 lg:hidden shadow-2xl">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyShareLink}
            className="p-3.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shrink-0 cursor-pointer shadow-xs"
            title="Chia sẻ tin tuyển dụng"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <Link
            href={`/candidate/apply/${job.id}`}
            className="bg-blue-600 w-full rounded-full py-3.5 text-base sm:text-lg font-bold shadow-lg shadow-blue-500/25 text-white hover:bg-blue-700 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span>Ứng tuyển ngay</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL ỨNG TUYỂN NHANH (QUICK APPLY MODAL - KHÔNG CẦN TÀI KHOẢN)        */}
      {/* ========================================================================= */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                  Ứng Tuyển Không Cần Đăng Nhập
                </span>
                <h3 className="font-black text-base sm:text-lg text-slate-900 mt-0.5 line-clamp-1">
                  {job.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isSubmitSuccess ? (
                /* Màn hình gửi thành công */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-slate-900">Nộp Hồ Sơ Thành Công!</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Cảm ơn <strong>{fullName}</strong> đã quan tâm đến cơ hội nghề nghiệp tại công ty.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Mã hồ sơ tra cứu:</span>
                      <span className="font-mono font-black text-blue-700">{appliedAppId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Email xác nhận:</span>
                      <span className="font-bold text-slate-800">{email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Thời gian dự kiến phản hồi:</span>
                      <span className="font-bold text-emerald-700">Trong 24h - 48h làm việc</span>
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <Link
                      href={`/candidate/track?code=${encodeURIComponent(appliedAppId)}&email=${encodeURIComponent(email)}`}
                      onClick={handleCloseModal}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>Tra cứu tiến độ hồ sơ</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Đóng cửa sổ
                    </button>
                  </div>
                </div>
              ) : (
                /* Form nhập thông tin ứng tuyển */
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                      {formError}
                    </div>
                  )}

                  {/* Họ và tên */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Họ và tên của bạn <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Email & Số điện thoại (2 cột) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Email liên hệ <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="an.nguyen@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0912 345 678"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CV Upload hoặc CV Link */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Hồ sơ CV của bạn <span className="text-rose-500">*</span>
                    </label>

                    {/* Tải tệp CV lên */}
                    <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1.5" />
                      {cvFileName ? (
                        <div className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="truncate max-w-xs">{cvFileName}</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">
                            Bấm để tải lên CV (.pdf, .docx)
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Dung lượng tối đa 10MB</p>
                        </div>
                      )}
                    </div>

                    {/* Hoặc Dán link CV Google Drive */}
                    <div className="text-[11px] text-slate-400 text-center">Liên kết hồ sơ trực tuyến bổ sung (không bắt buộc):</div>
                    <input
                      type="url"
                      value={cvLink}
                      onChange={(e) => setCvLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Lời nhắn gửi đến Nhà tuyển dụng */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Lời nhắn / Thư giới thiệu (Không bắt buộc)
                    </label>
                    <textarea
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Chia sẻ ngắn gọn về lý do bạn phù hợp với vị trí này..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <span>Đang gửi hồ sơ ứng tuyển...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Gửi hồ sơ ứng tuyển ngay</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      Bằng việc gửi hồ sơ, bạn đồng ý để nhà tuyển dụng liên hệ theo thông tin đã cung cấp.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
