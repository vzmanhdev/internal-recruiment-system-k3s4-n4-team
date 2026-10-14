'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Upload,
  CheckCircle2,
  Copy,
  ChevronLeft,
  ArrowRight,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  User,
  Mail,
  Phone,
  Link as LinkIcon,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  FileCheck,
  X,
} from 'lucide-react';
import { careerApi, type CandidateJob } from '@/features/candidate/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

export default function CandidateApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = (params?.id as string) || '';

  const { data: job, loading: jobLoading } = useApiData(() => careerApi.get(jobId), [jobId]);

  // Form states (Tối ưu cảm ứng điện thoại)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cvLink, setCvLink] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Validation & Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFormError('');
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyCode = () => {
    if (typeof window !== 'undefined' && trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      showToast('Đã sao chép mã tra cứu hồ sơ vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Kiểm tra các trường bắt buộc
    if (!fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!email.trim()) {
      setFormError('Vui lòng nhập địa chỉ email liên hệ.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Vui lòng nhập số điện thoại để nhà tuyển dụng liên hệ.');
      return;
    }
    if (!selectedFile) {
      setFormError('Vui lòng tải lên tệp CV (PDF/DOCX) — hồ sơ phải được lưu trên hệ thống tuyển dụng.');
      return;
    }
    if (!job) return;

    setIsSubmitting(true);
    try {
      const created = await careerApi.apply(job, {
        full_name: fullName.trim(), email: email.trim(), phone: phone.trim(), file: selectedFile,
        cover_letter: [coverNote.trim(), cvLink.trim() && `Liên kết hồ sơ bổ sung: ${cvLink.trim()}`].filter(Boolean).join('\n'),
      });
      setTrackingCode(created.tracking_code);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Không gửi được hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (jobLoading) return <LoadingState />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Điều hướng quay lại */}
      {!isSuccess && (
        <nav className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <Link
            href={job ? `/candidate/jobs/${job.id}` : '/candidate/jobs'}
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5 py-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại thông tin việc làm</span>
          </Link>
          <span className="text-slate-400">Bước 2 / 2: Nộp hồ sơ</span>
        </nav>
      )}

      {/* ========================================================================= */}
      {/* THẺ TÓM TẮT VỊ TRÍ ĐANG ỨNG TUYỂN                                          */}
      {/* ========================================================================= */}
      {job && !isSuccess && (
        <div className="bg-blue-50/70 border border-blue-100 rounded-3xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
              Vị trí ứng tuyển
            </span>
            <span className="text-xs font-bold text-blue-700">{job.department}</span>
          </div>

          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 pt-0.5">
            <div className="flex items-center gap-1 font-bold text-blue-600">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{job.salary}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Hạn nộp: {job.deadline}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MÀN HÌNH THÀNH CÔNG (SUCCESS STATE)                                       */}
      {/* ========================================================================= */}
      {isSuccess ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
          {/* Icon chúc mừng lớn */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              Nộp Hồ Sơ Thành Công
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Chúc mừng {fullName}!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Hồ sơ của bạn cho vị trí <strong className="text-slate-800">{job?.title || 'đã chọn'}</strong> đã được tiếp nhận và chuyển đến bộ phận Tuyển dụng.
            </p>
          </div>

          {/* KHỐI MÃ TRA CỨU HỒ SƠ LỚN */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50/70 to-blue-50 border-2 border-blue-200 rounded-3xl p-6 sm:p-8 text-center space-y-3.5 shadow-xs">
            <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block">
              MÃ TRA CỨU TIẾN ĐỘ HỒ SƠ
            </span>

            <div className="text-3xl sm:text-4xl font-mono font-black text-blue-700 tracking-wider select-all">
              {trackingCode}
            </div>

            <div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-6 py-2.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 font-extrabold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Đã sao chép mã!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép mã tra cứu</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs font-bold text-amber-700/90 pt-1">
              ⚠️ Vui lòng lưu lại mã này để tra cứu tiến độ hồ sơ của bạn.
            </p>
          </div>

          {/* Tóm tắt thông tin đã nộp */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 text-left text-xs space-y-2.5 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Họ và tên:</span>
              <span className="font-bold text-slate-800">{fullName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Email nhận thông báo:</span>
              <span className="font-bold text-slate-800">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Số điện thoại:</span>
              <span className="font-bold text-slate-800">{phone}</span>
            </div>
            {selectedFile && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Tệp CV đã đính kèm:</span>
                <span className="font-bold text-blue-700 truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Thời gian phản hồi dự kiến:</span>
              <span className="font-extrabold text-emerald-700">Trong 24h - 48h làm việc</span>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="pt-2 space-y-3">
            <Link
              href={`/candidate/track?code=${trackingCode}`}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 active:scale-98"
            >
              <span>Tra cứu ngay</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/candidate/jobs"
              className="w-full py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              <span>Khám phá thêm các cơ hội việc làm khác</span>
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* LAYOUT FORM: BỌC TRONG CARD NỀN TRẮNG, INPUT SIZE TO CHO MOBILE         */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Điền thông tin ứng tuyển
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Không cần tài khoản. Bạn chỉ mất chưa đầy 1 phút để hoàn thành việc nộp hồ sơ.
            </p>
          </div>

          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Họ và tên (*) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Họ và tên của bạn <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 2. Email (*) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Địa chỉ Email liên hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="an.nguyen@gmail.com"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Hệ thống sẽ gửi thông báo kết quả xét duyệt qua email này.
              </p>
            </div>

            {/* 3. Số điện thoại (*) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* =================================================================== */}
            {/* KHU VỰC TẢI CV (UPLOAD AREA: DROPZONE TO, NÉT ĐỨT, DỄ BẤM CẢM ỨNG) */}
            {/* =================================================================== */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Hồ sơ CV của bạn <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">PDF, DOC, DOCX (Tối đa 10MB)</span>
              </div>

              {/* Ẩn file input mặc định */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Vùng Dropzone nét đứt to */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-400 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all active:scale-[0.99] space-y-3"
              >
                {selectedFile ? (
                  /* Khi đã chọn file */
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                      <FileCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 truncate max-w-xs mx-auto">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Sẵn sàng nộp
                      </p>
                    </div>
                    <div className="pt-1 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        Đổi tệp khác
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Xóa tệp"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Trạng thái chưa chọn file */
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                      <Upload className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-extrabold text-slate-800">
                        Chạm để tải lên CV (PDF, DOCX)
                      </p>
                      <p className="text-xs text-slate-500">
                        hoặc chọn từ Google Drive/iCloud của thiết bị
                      </p>
                    </div>

                    {/* Nút Chọn file to, dễ ấn */}
                    <div className="pt-1">
                      <span className="px-6 py-3 rounded-xl bg-white border border-blue-200 text-blue-700 font-extrabold text-sm shadow-xs inline-flex items-center gap-2 hover:bg-blue-100 transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Chọn file từ thiết bị</span>
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Hoặc Dán liên kết CV trực tuyến */}
              <div className="pt-2 space-y-1.5">
                <div className="text-[11px] text-slate-400 font-medium text-center">
                  --- Liên kết hồ sơ trực tuyến bổ sung (không bắt buộc) ---
                </div>
                <div className="relative">
                  <LinkIcon className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                  <input
                    type="url"
                    value={cvLink}
                    onChange={(e) => setCvLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* 4. Lời nhắn gửi đến nhà tuyển dụng (Optional) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-800">
                Lời nhắn / Thư giới thiệu (Không bắt buộc)
              </label>
              <textarea
                rows={3}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Giới thiệu ngắn về kinh nghiệm nổi bật hoặc lý do bạn quan tâm đến vị trí này..."
                className="w-full p-4 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Cam kết bảo mật */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-500">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Hệ thống cam kết bảo mật 100% thông tin cá nhân và tệp CV của bạn. Dữ liệu chỉ phục vụ mục đích xét duyệt tuyển dụng nội bộ.
              </p>
            </div>

            {/* 5. Nút nộp hồ sơ to full-width */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-98"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang tải hồ sơ lên hệ thống...</span>
                  </span>
                ) : (
                  <span>Nộp hồ sơ ứng tuyển ngay</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
