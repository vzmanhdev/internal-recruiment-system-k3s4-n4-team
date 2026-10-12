'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Building2,
  Mail,
  Hash,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  ChevronLeft,
  RotateCcw,
  Check,
  Loader2,
  HeartHandshake,
} from 'lucide-react';

function CandidateTrackContent() {
  const searchParams = useSearchParams();
  const queryCode = searchParams?.get('code') || '';
  const queryEmail = searchParams?.get('email') || '';

  // Form Inputs
  const [email, setEmail] = useState(queryEmail);
  const [trackingCode, setTrackingCode] = useState(queryCode);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Result state
  const [searchResult, setSearchResult] = useState<{
    candidateName: string;
    email: string;
    trackingCode: string;
    position: string;
    department: string;
    appliedDate: string;
    currentStepIndex: number; // 0, 1, 2, 3 tương ứng 4 bước
  } | null>(null);

  // Tự động điền và kích hoạt tra cứu nếu có tham số URL
  useEffect(() => {
    if (queryCode) {
      setTrackingCode(queryCode);
      if (!email) {
        setEmail(queryEmail || 'an.nguyen@gmail.com');
      }
      executeLookup(queryEmail || 'an.nguyen@gmail.com', queryCode);
    }
  }, [queryCode, queryEmail]);

  const executeLookup = (userEmail: string, userCode: string) => {
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      const trimmedCode = userCode.trim().toUpperCase();
      const trimmedEmail = userEmail.trim().toLowerCase();

      // Giả lập dữ liệu tra cứu
      setSearchResult({
        candidateName: 'Nguyễn Văn An',
        email: trimmedEmail,
        trackingCode: trimmedCode,
        position: 'Senior Backend Engineer (Go/Python)',
        department: 'Khối Công Nghệ & Phần Mềm',
        appliedDate: '12/10/2026 - 14:30',
        currentStepIndex: 1, // Bước 2: Đang xét duyệt CV
      });
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Email bạn đã dùng khi ứng tuyển.');
      return;
    }

    if (!trackingCode.trim()) {
      setErrorMessage('Vui lòng nhập Mã tra cứu hồ sơ (Ví dụ: APP-2026-998).');
      return;
    }

    executeLookup(email, trackingCode);
  };

  const handleResetSearch = () => {
    setSearchResult(null);
    setErrorMessage('');
  };

  // Danh sách 4 bước cố định theo yêu cầu
  const timelineSteps = [
    {
      step: 1,
      title: 'Đã tiếp nhận hồ sơ',
      subtitle: 'Hệ thống đã nhận đầy đủ thông tin và CV của bạn.',
      timeText: '12/10/2026 14:30',
    },
    {
      step: 2,
      title: 'Đang xét duyệt CV',
      subtitle: 'Hội đồng tuyển dụng và Trưởng bộ phận đang sàng lọc CV.',
      timeText: 'Đang tiến hành',
    },
    {
      step: 3,
      title: 'Phỏng vấn',
      subtitle: 'Lên lịch phỏng vấn chuyên môn & văn hóa công ty.',
      timeText: 'Đang chờ xếp lịch',
    },
    {
      step: 4,
      title: 'Kết quả Offer',
      subtitle: 'Thông báo kết quả phỏng vấn và gửi Thư mời nhận việc.',
      timeText: 'Chưa diễn ra',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto mt-6 sm:mt-10 space-y-6 pb-12 antialiased">
      {/* 1. Header Trang */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-100">
          <Clock className="w-3.5 h-3.5" />
          <span>Tra Cứu Nhanh</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Tra cứu trạng thái hồ sơ
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Tra cứu tiến độ xét duyệt trực tiếp không cần đăng nhập tài khoản
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. FORM TRA CỨU: NẰM GIỮA MÀN HÌNH (max-w-md mx-auto)                    */}
      {/* ========================================================================= */}
      {!searchResult ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Input 1: Email ứng tuyển */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Email ứng tuyển <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: an.nguyen@gmail.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Input 2: Mã tra cứu hồ sơ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Mã tra cứu hồ sơ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ví dụ: APP-2026-998"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all uppercase placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:text-slate-400"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Mã hồ sơ đã được cấp sau khi bạn hoàn thành biểu mẫu nộp CV.
              </p>
            </div>

            {/* Nút Kiểm tra tiến độ (Blue Primary Button) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang kiểm tra dữ liệu...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Kiểm tra tiến độ</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Gợi ý hỗ trợ */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href="/candidate/jobs"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
            >
              <span>Xem danh sách việc làm đang tuyển</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 3. KẾT QUẢ HIỂN THỊ: TÓM TẮT THÔNG TIN & TRỤC THỜI GIAN (TIMELINE)        */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Thông tin tóm tắt ứng viên & Vị trí */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200/80 shadow-2xs">
                {searchResult.trackingCode}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {searchResult.appliedDate}
              </span>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500">Ứng viên:</div>
              <div className="text-base font-black text-slate-900">
                {searchResult.candidateName}
              </div>
            </div>

            <div className="pt-1 border-t border-blue-100/80">
              <div className="text-xs font-medium text-slate-500">Vị trí ứng tuyển:</div>
              <div className="text-sm font-extrabold text-blue-900 mt-0.5">
                {searchResult.position}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {searchResult.department}
              </div>
            </div>
          </div>

          {/* TRỤC THỜI GIAN DỌC (TIMELINE 4 BƯỚC) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Tiến trình xử lý hồ sơ
              </h3>
              <span className="text-xs font-bold text-blue-600">Bước 2 / 4</span>
            </div>

            {/* Danh sách 4 bước */}
            <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {timelineSteps.map((stepItem, idx) => {
                const isCompleted = idx < searchResult.currentStepIndex;
                const isCurrent = idx === searchResult.currentStepIndex;
                const isUpcoming = idx > searchResult.currentStepIndex;

                return (
                  <div
                    key={stepItem.step}
                    className={`relative transition-all ${
                      isUpcoming ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    {/* Icon trạng thái trên trục */}
                    <div
                      className={`absolute -left-7 top-0.5 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'w-6 h-6 bg-emerald-500 text-white shadow-xs'
                          : isCurrent
                          ? 'w-7 h-7 -left-[29px] -top-0.5 bg-blue-600 text-white ring-4 ring-blue-100 shadow-md animate-pulse'
                          : 'w-6 h-6 bg-slate-200 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span className="text-[10px] font-bold">{stepItem.step}</span>
                      )}
                    </div>

                    {/* Nội dung bước */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm tracking-tight ${
                            isCurrent
                              ? 'text-blue-600 font-black text-base'
                              : isCompleted
                              ? 'text-slate-900 font-bold'
                              : 'text-slate-600 font-semibold'
                          }`}
                        >
                          {stepItem.step}. {stepItem.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isCurrent
                              ? 'bg-blue-100 text-blue-700 font-extrabold'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {stepItem.timeText}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-relaxed ${
                          isCurrent ? 'text-slate-700 font-medium' : 'text-slate-500'
                        }`}
                      >
                        {stepItem.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CÂU TEXT THÂN THIỆN THEO YÊU CẦU */}
          <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 text-xs sm:text-sm text-blue-900 flex items-start gap-3 shadow-2xs">
            <HeartHandshake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              Hồ sơ của bạn đang được Phòng Nhân sự xem xét. Chúng tôi sẽ phản hồi sớm nhất!
            </p>
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleResetSearch}
              className="w-full py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tra cứu hồ sơ khác</span>
            </button>

            <Link
              href="/candidate/jobs"
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors text-center"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Khám phá thêm vị trí tuyển dụng</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateTrackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto mt-12 p-12 text-center text-xs text-slate-400">
          Đang chuẩn bị trang tra cứu...
        </div>
      }
    >
      <CandidateTrackContent />
    </Suspense>
  );
}
