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
  Building2,
  Mail,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FileCheck,
  UserCheck,
  Gift,
} from 'lucide-react';

function CandidateTrackingContent() {
  const searchParams = useSearchParams();
  const queryCode = searchParams?.get('code') || '';
  const queryEmail = searchParams?.get('email') || '';

  // Form inputs
  const [email, setEmail] = useState(queryEmail);
  const [trackingCode, setTrackingCode] = useState(queryCode);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Accordion FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Search result state
  const [searchResult, setSearchResult] = useState<{
    candidateName: string;
    email: string;
    trackingCode: string;
    position: string;
    department: string;
    appliedDate: string;
    currentStepIndex: number; // 0: Tiếp nhận, 1: Xét duyệt, 2: Phỏng vấn, 3: Offer
    interviewDate?: string;
    interviewFormat?: string;
    offerSalary?: string;
  } | null>(null);

  // Auto-fill and lookup if URL params are present
  useEffect(() => {
    if (queryCode) {
      setTrackingCode(queryCode);
      const defaultEmail = queryEmail || 'an.nguyen@gmail.com';
      setEmail(defaultEmail);
      executeLookup(defaultEmail, queryCode);
    }
  }, [queryCode, queryEmail]);

  const executeLookup = (emailVal: string, codeVal: string) => {
    setIsLoading(true);
    setErrorMessage('');

    setTimeout(() => {
      setIsLoading(false);
      const normalizedCode = codeVal.trim().toUpperCase();

      if (normalizedCode === 'APP-2026-9012') {
        setSearchResult({
          candidateName: 'Nguyễn Văn A',
          email: emailVal.trim() || 'an.nguyen@gmail.com',
          trackingCode: 'APP-2026-9012',
          position: 'Senior Frontend Engineer (React/Next.js)',
          department: 'Khối Công Nghệ & Trải Nghiệm Số',
          appliedDate: '01/10/2026',
          currentStepIndex: 3,
          offerSalary: '42.000.000 VNĐ / tháng Gross',
        });
      } else {
        setSearchResult({
          candidateName: 'Nguyễn Văn A',
          email: emailVal.trim() || 'an.nguyen@gmail.com',
          trackingCode: normalizedCode || 'APP-2026-8899',
          position: 'Senior Backend Engineer (Go/Python)',
          department: 'Khối Công Nghệ & Phần Mềm',
          appliedDate: '08/10/2026',
          currentStepIndex: 2,
          interviewDate: 'Thứ Sáu, 16/10/2026 (14:30 - 15:30)',
          interviewFormat: 'Online Google Meet',
        });
      }
    }, 450);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập Email ứng tuyển của bạn.');
      return;
    }
    if (!trackingCode.trim()) {
      setErrorMessage('Vui lòng nhập Mã tra cứu hồ sơ (VD: APP-2026-8899).');
      return;
    }

    executeLookup(email, trackingCode);
  };

  const handleReset = () => {
    setSearchResult(null);
    setTrackingCode('');
    setEmail('');
    setErrorMessage('');
  };

  const handleFillSample = (sampleCode: string) => {
    const sampleEmail = 'an.nguyen@gmail.com';
    setEmail(sampleEmail);
    setTrackingCode(sampleCode);
    executeLookup(sampleEmail, sampleCode);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // 4 bước tiến trình thực tế khi có kết quả tra cứu
  const timelineSteps = [
    {
      step: 1,
      title: 'Đã Tiếp Nhận Hồ Sơ',
      subtitle: 'Hệ thống tự động ghi nhận CV & thông tin cá nhân',
      date: searchResult?.appliedDate || '08/10/2026',
      statusNote: 'Hồ sơ hợp lệ và đã được phân bổ cho Bộ phận Tuyển dụng.',
    },
    {
      step: 2,
      title: 'Đang Xét Duyệt CV',
      subtitle: 'HR & Hiring Manager thẩm định năng lực chuyên môn',
      date: '10/10/2026',
      statusNote: 'CV đã vượt qua vòng sơ loại chuyên môn, đáp ứng đầy đủ yêu cầu kỹ thuật.',
    },
    {
      step: 3,
      title: 'Phỏng Vấn Chuyên Môn',
      subtitle: 'Phỏng vấn kỹ thuật & văn hóa cùng Trưởng bộ phận',
      date: searchResult?.interviewDate || '16/10/2026',
      statusNote:
        searchResult?.currentStepIndex === 2
          ? 'Đã phát hành Lời mời phỏng vấn Vòng 2. Vui lòng xác nhận tham dự!'
          : searchResult && searchResult.currentStepIndex > 2
          ? 'Đã hoàn thành các vòng phỏng vấn với kết quả Đạt.'
          : 'Chờ hoàn tất duyệt CV để lên lịch.',
      actionLink: '/candidate/interviews',
      actionText: 'Xem lịch phỏng vấn',
    },
    {
      step: 4,
      title: 'Kết Quả & Thư Mời Nhận Việc',
      subtitle: 'Thông báo kết quả cuối cùng và gửi Job Offer Letter',
      date: searchResult?.currentStepIndex === 3 ? '12/10/2026' : 'Dự kiến sau phỏng vấn 3 ngày',
      statusNote:
        searchResult?.currentStepIndex === 3
          ? 'Chúc mừng! Thư mời nhận việc (Offer Letter) đã sẵn sàng để bạn phản hồi.'
          : 'Đang tổng hợp đánh giá từ Hội đồng phỏng vấn.',
      actionLink: '/candidate/offers',
      actionText: 'Xem thư mời nhận việc',
    },
  ];

  // 4 bước chuẩn hóa minh họa
  const standardWorkflowSteps = [
    {
      step: '01',
      title: 'Tiếp Nhận Hồ Sơ',
      description:
        'Hệ thống tự động ghi nhận CV và cấp mã định danh duy nhất (APP-YYYY-XXXX) gửi về email của bạn ngay tức thì.',
      icon: FileCheck,
      badge: 'Tự động',
      color: 'blue',
    },
    {
      step: '02',
      title: 'Xét Duyệt CV',
      description:
        'Hội đồng Tuyển dụng và Hiring Manager trực tiếp thẩm định kinh nghiệm chuyên môn trong 3 - 5 ngày làm việc.',
      icon: Clock,
      badge: '3 - 5 ngày',
      color: 'indigo',
    },
    {
      step: '03',
      title: 'Phỏng Vấn',
      description:
        'Tham gia trao đổi trực tiếp (Online hoặc Offline) về năng lực kỹ thuật, văn hóa doanh nghiệp và định hướng nghề nghiệp.',
      icon: UserCheck,
      badge: 'Chuyên sâu',
      color: 'purple',
    },
    {
      step: '04',
      title: 'Kết Quả Offer',
      description:
        'Thông báo kết quả minh bạch. Ứng viên phù hợp sẽ nhận Thư mời nhận việc (Job Offer Letter) với chế độ đãi ngộ chi tiết.',
      icon: Gift,
      badge: 'Quyết định',
      color: 'emerald',
    },
  ];

  // Danh sách FAQ
  const faqList = [
    {
      question: 'Lấy mã tra cứu ở đâu?',
      answer:
        'Mã tra cứu hồ sơ (định dạng APP-2026-XXXX) được hệ thống gửi tự động vào hòm thư điện tử của bạn ngay sau khi bạn nộp đơn ứng tuyển thành công. Vui lòng kiểm tra cả thư mục Hộp thư đến và Spam/Quảng cáo.',
    },
    {
      question: 'Thời gian xét duyệt hồ sơ thông thường là bao lâu?',
      answer:
        'Thông thường, hồ sơ sẽ được thẩm định sơ loại trong vòng 3 - 5 ngày làm việc. Tiến độ của bạn sẽ được cập nhật liên tục trên trang này ngay khi có phản hồi từ Trưởng bộ phận tuyển dụng.',
    },
    {
      question: 'Tôi có thể cập nhật CV sau khi đã nộp đơn không?',
      answer:
        'Hoàn toàn có thể. Bạn có thể phản hồi trực tiếp vào email xác nhận nộp hồ sơ kèm tệp CV cập nhật mới nhất, hoặc liên hệ trực tiếp với chuyên viên tuyển dụng phụ trách để được hỗ trợ thay thế tệp.',
    },
    {
      question: 'Làm thế nào để đổi lịch nếu bị trùng lịch phỏng vấn?',
      answer:
        'Khi hồ sơ của bạn đạt yêu cầu và được xếp lịch, bạn sẽ nhận được thông báo. Bạn có thể truy cập mục "Lịch phỏng vấn" trên Cổng ứng viên và nhấn nút "Yêu cầu đổi lịch" để đề xuất khung giờ mới thuận tiện hơn.',
    },
  ];

  return (
    <div className="w-full space-y-8 pb-12">
      {/* 1. Khối Banner Trực Quan (Top Hero Banner trải ngang toàn bộ chiều rộng) */}
      <div className="w-full rounded-2xl p-8 mb-8 text-white relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-md">
        {/* Hình khối trang trí làm background bớt đơn điệu */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-56 h-56 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff18_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-blue-100 mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>CỔNG TRA CỨU ỨNG VIÊN CHÍNH THỨC</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
            Tra Cứu Tiến Độ Ứng Tuyển
          </h1>

          <p className="text-blue-100 text-sm sm:text-base max-w-3xl leading-relaxed">
            Minh bạch - Tức thì - Liên tục cập nhật. Nhập mã hồ sơ của bạn để xem chi tiết các vòng đánh giá.
          </p>

          <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-blue-100 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Cập nhật kết quả tức thì</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>Thời gian thực 24/7</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Bảo mật dữ liệu cá nhân</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Khối Nội Dung Chính (Chia 2 cột Grid mở rộng tỷ lệ 4 - 8 trên màn hình lớn) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Cột Trái (Form Tra Cứu - lg:col-span-5 xl:col-span-4) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Tra Cứu Hồ Sơ Tuyển Dụng
              </h3>

              {searchResult && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tra cứu lại
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSearchSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email ứng tuyển <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ví dụ: nguyen.van.a@gmail.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Mã tra cứu hồ sơ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Ví dụ: APP-2026-8899"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-semibold uppercase tracking-wider text-slate-800 placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
                />
              </div>

              {/* Dữ liệu mẫu test nhanh */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                <div className="text-xs font-semibold text-slate-500 mb-2">Mã mẫu thử nghiệm nhanh:</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillSample('APP-2026-8899')}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
                  >
                    APP-2026-8899 (Phỏng vấn)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillSample('APP-2026-9012')}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
                  >
                    APP-2026-9012 (Nhận Offer)
                  </button>
                </div>
              </div>

              {/* Nút kiểm tra tiến độ ngay */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang kiểm tra tiến độ...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Kiểm tra tiến độ ngay</span>
                  </>
                )}
              </button>
            </form>

            {/* Khối Lưu ý: Nền vàng nhạt ở dưới nút bấm */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 mb-0.5">Lưu ý quan trọng:</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Vui lòng kiểm tra hòm thư <strong>Spam / Quảng cáo</strong> nếu không nhận được email hệ thống.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải (Thông tin bổ trợ lấp đầy không gian - lg:col-span-7 xl:col-span-8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Trạng thái 1: Khi CÓ kết quả tra cứu, hiển thị Live Timeline kết quả */}
          {searchResult && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Đang hoạt động (Active)
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    Mã hồ sơ: <strong className="text-blue-700 font-mono text-sm">{searchResult.trackingCode}</strong>
                  </span>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    {searchResult.position}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {searchResult.department}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Ứng viên: </span>
                    <strong className="text-slate-800">{searchResult.candidateName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Email: </span>
                    <span className="text-slate-800 font-medium">{searchResult.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Ngày nộp: </span>
                    <span className="text-slate-800 font-medium">{searchResult.appliedDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Trạng thái: </span>
                    <span className="text-emerald-700 font-bold">Vòng {searchResult.currentStepIndex + 1}</span>
                  </div>
                </div>
              </div>

              {/* Trục thời gian 4 bước */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Trục tiến trình tuyển dụng thời gian thực
                </h4>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {timelineSteps.map((stepItem, index) => {
                    const isDone = index < searchResult.currentStepIndex;
                    const isCurrent = index === searchResult.currentStepIndex;

                    return (
                      <div key={stepItem.step} className="relative">
                        <div
                          className={`absolute -left-6 sm:-left-8 top-0.5 w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : isCurrent ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>{stepItem.step}</span>
                          )}
                        </div>

                        <div
                          className={`rounded-xl p-4 transition-all ${
                            isCurrent
                              ? 'bg-blue-50/70 border border-blue-200 shadow-2xs'
                              : isDone
                              ? 'bg-white border border-slate-200/90'
                              : 'bg-slate-50/50 border border-slate-100 opacity-60'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h5
                              className={`text-sm font-bold ${
                                isCurrent
                                  ? 'text-blue-700'
                                  : isDone
                                  ? 'text-slate-900'
                                  : 'text-slate-500'
                              }`}
                            >
                              {stepItem.title}
                            </h5>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {stepItem.date}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mb-1.5">{stepItem.subtitle}</p>
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            {stepItem.statusNote}
                          </p>

                          {isCurrent && stepItem.actionLink && (
                            <div className="pt-2 mt-2 border-t border-blue-100 flex justify-end">
                              <Link
                                href={stepItem.actionLink}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                <span>{stepItem.actionText}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái 2: Card 1: "Quy trình chuẩn hóa 4 bước" (Timeline minh họa khi chưa tra cứu) */}
          {!searchResult && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Quy Trình Tuyển Dụng Chuẩn Hóa 4 Bước
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tiến trình xét duyệt minh bạch và nhất quán tại doanh nghiệp
                    </p>
                  </div>
                </div>
              </div>

              {/* Lưới 4 bước minh họa mở rộng xl:grid-cols-4 trên màn hình rộng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {standardWorkflowSteps.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all relative group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            BƯỚC {item.step}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                            {item.badge}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {item.title}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card 2: "Câu Hỏi Thường Gặp (FAQ)" */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Câu Hỏi Thường Gặp (FAQ)</h3>
                <p className="text-xs text-slate-500">
                  Những thắc mắc phổ biến của ứng viên trong quá trình tra cứu hồ sơ
                </p>
              </div>
            </div>

            {/* Accordion List */}
            <div className="divide-y divide-slate-100">
              {faqList.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="py-3.5 first:pt-1 last:pb-1">
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                    >
                      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {faq.question}
                      </span>
                      <span className="p-1 rounded-lg bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 transition-colors">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6 animate-in fade-in duration-200">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CandidateTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-16 text-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm font-semibold">Đang tải trang Tiến độ ứng tuyển...</p>
        </div>
      }
    >
      <CandidateTrackingContent />
    </Suspense>
  );
}
