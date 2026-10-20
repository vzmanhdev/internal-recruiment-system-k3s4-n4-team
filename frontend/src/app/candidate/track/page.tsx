'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  ChevronRight,
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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  UserCheck,
  Gift,
} from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { useApiData } from '@/hooks/useApiData';

// Public lookup returns the general status only (S4-05); map it onto the 4-step timeline
const STATUS_STEP: Record<string, number> = { 'Đã nhận': 0, 'Đang xem xét': 1, 'Mời phỏng vấn': 2, 'Kết thúc': 3 };

interface MyApplicationItem {
  id: number;
  tracking_code?: string | null;
  job_title?: string | null;
  department?: string | null;
  status: string;
}

function CandidateTrackContent() {
  const searchParams = useSearchParams();
  const queryCode = searchParams?.get('code') || '';
  const queryEmail = searchParams?.get('email') || '';
  const { user } = useAuth();

  // Load applicant's real applications if logged in
  const { data: myApps } = useApiData(async () => {
    if (!user) return [];
    try {
      return await apiRequest<MyApplicationItem[]>('/applications?mine=true');
    } catch {
      return [];
    }
  }, [user]);

  // Form Inputs
  const [email, setEmail] = useState(queryEmail || user?.email || '');
  const [trackingCode, setTrackingCode] = useState(queryCode);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Auto prefill email if user logs in
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user]);

  // Result state
  const [searchResult, setSearchResult] = useState<{
    candidateName: string;
    email: string;
    trackingCode: string;
    position: string;
    department: string;
    appliedDate: string;
    currentStepIndex: number; // 0, 1, 2, 3 tương ứng 4 bước
    statusLabel: string;
  } | null>(null);

  const executeLookup = async (userEmail: string, userCode: string) => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const r = await apiRequest<{
        tracking_code: string;
        job_title: string | null;
        department?: string | null;
        candidate_name?: string | null;
        status: string;
        applied_date: string | null;
      }>('/public/applications/status', {
        method: 'POST',
        body: JSON.stringify({ tracking_code: userCode.trim().toUpperCase(), email: userEmail.trim().toLowerCase() }),
      });
      setSearchResult({
        candidateName: r.candidate_name || user?.full_name || userEmail.trim().toLowerCase(),
        email: userEmail.trim().toLowerCase(),
        trackingCode: r.tracking_code,
        position: r.job_title || 'Vị trí tuyển dụng',
        department: r.department || '',
        appliedDate: r.applied_date ? new Date(`${r.applied_date}T00:00:00`).toLocaleDateString('vi-VN') : '',
        currentStepIndex: STATUS_STEP[r.status] ?? 1,
        statusLabel: r.status,
      });
    } catch (err) {
      setSearchResult(null);
      setErrorMessage(err instanceof ApiError ? err.message : 'Không tìm thấy hồ sơ khớp với mã tra cứu và email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động tra cứu khi đường dẫn có đủ mã tra cứu và email
  useEffect(() => {
    if (queryCode && queryEmail) {
      void executeLookup(queryEmail, queryCode); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [queryCode, queryEmail]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Email bạn đã dùng khi ứng tuyển.');
      return;
    }

    if (!trackingCode.trim()) {
      setErrorMessage('Vui lòng nhập Mã tra cứu hồ sơ (Ví dụ: APP-00000001).');
      return;
    }

    executeLookup(email, trackingCode);
  };

  const handleResetSearch = () => {
    setSearchResult(null);
    setErrorMessage('');
  };

  const handleSelectMyApplication = (appCode: string) => {
    setTrackingCode(appCode);
    if (email) {
      executeLookup(email, appCode);
    }
  };

  // Danh sách 4 bước cố định theo yêu cầu
  const timelineSteps = [
    {
      step: 1,
      title: 'Đã tiếp nhận hồ sơ',
      subtitle: 'Hệ thống đã nhận đầy đủ thông tin và CV của bạn.',
      timeText: searchResult?.appliedDate || '',
    },
    {
      step: 2,
      title: 'Đang xét duyệt CV',
      subtitle: 'Hội đồng tuyển dụng và Trưởng bộ phận đang sàng lọc CV.',
      timeText: (searchResult?.currentStepIndex ?? 0) > 1 ? 'Đã hoàn tất' : (searchResult?.currentStepIndex ?? 0) === 1 ? 'Đang tiến hành' : 'Chưa diễn ra',
    },
    {
      step: 3,
      title: 'Phỏng vấn',
      subtitle: 'Lên lịch phỏng vấn chuyên môn & văn hóa công ty.',
      timeText: (searchResult?.currentStepIndex ?? 0) > 2 ? 'Đã hoàn tất' : (searchResult?.currentStepIndex ?? 0) === 2 ? 'Đang tiến hành' : 'Chưa diễn ra',
    },
    {
      step: 4,
      title: 'Kết quả Offer',
      subtitle: 'Thông báo kết quả phỏng vấn và gửi Thư mời nhận việc.',
      timeText: (searchResult?.currentStepIndex ?? 0) === 3 ? 'Quy trình đã kết thúc — kết quả được gửi qua email' : 'Chưa diễn ra',
    },
  ];

  return (
    <div className="w-full min-h-full p-6 sm:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white antialiased">
      <div className="w-full space-y-6 sm:space-y-8">
        
        {/* Header trang tổng quan */}
        <div className="w-full text-left space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Cổng Tra Cứu Trực Tuyến</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            Tra cứu trạng thái hồ sơ ứng tuyển
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Theo dõi tiến độ xét duyệt trực tiếp không cần đăng nhập. Nhập email và mã tra cứu được cấp khi nộp CV để xem chi tiết.
          </p>
        </div>

        {/* Lưới 2 cột bất đối xứng (CSS Grid) */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI (lg:col-span-5) - Khu vực Tương tác */}
          <div className="w-full lg:col-span-5 space-y-6 sm:space-y-8">
            
            {/* Form Tra Cứu hoặc Thẻ Kết Quả */}
            {!searchResult ? (
              <div className="w-full bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 sm:p-8 border border-blue-50 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Tra cứu hồ sơ
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Nhập thông tin bên dưới để kiểm tra tiến trình ứng tuyển của bạn.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-5">
                  {/* Input 1: Email ứng tuyển */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Email ứng tuyển <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ví dụ: an.nguyen@gmail.com"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Input 2: Mã tra cứu hồ sơ */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Mã tra cứu hồ sơ <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        placeholder="Ví dụ: APP-00000001"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono font-bold text-gray-900 outline-none transition-all uppercase placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:text-gray-400"
                      />
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Mã hồ sơ đã được cấp sau khi bạn hoàn tất nộp đơn hoặc gửi qua email.
                    </p>
                  </div>

                  {/* Nếu ứng viên có hồ sơ đã nộp trong tài khoản, hiển thị chip tra cứu nhanh */}
                  {myApps && myApps.length > 0 && (
                    <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100 space-y-2">
                      <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Hồ sơ đã nộp của bạn:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {myApps.map((a) => {
                          const code = a.tracking_code || `APP-${String(a.id).padStart(6, '0')}`;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => handleSelectMyApplication(code)}
                              className="px-2.5 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-gray-800 rounded-lg text-xs font-bold border border-blue-200 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer group"
                            >
                              <span className="font-mono text-blue-600 group-hover:text-white">{code}</span>
                              {a.job_title && (
                                <span className="text-[11px] opacity-75 max-w-[130px] truncate group-hover:text-white">
                                  • {a.job_title}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Nút Kiểm tra tiến độ */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Đang kiểm tra tiến độ...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>Kiểm tra tiến độ</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Gợi ý hỗ trợ */}
                <div className="pt-2 border-t border-gray-100 text-center">
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
              /* KẾT QUẢ HIỂN THỊ KHI TÌM THẤY HỒ SƠ */
              <div className="w-full bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 sm:p-8 border border-blue-50 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      Kết quả tra cứu
                    </span>
                    <h2 className="text-xl font-bold text-gray-900 mt-0.5">
                      Trạng thái hồ sơ
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                    {searchResult.trackingCode}
                  </span>
                </div>

                {/* Thông tin ứng viên & Vị trí */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Họ và tên:</div>
                      <div className="text-base font-bold text-gray-900 mt-0.5">
                        {searchResult.candidateName}
                      </div>
                    </div>
                    {searchResult.appliedDate && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 font-medium">Ngày nộp:</div>
                        <div className="text-xs font-semibold text-gray-700 mt-0.5">
                          {searchResult.appliedDate}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-blue-100">
                    <div className="text-xs text-gray-500 font-medium">Vị trí ứng tuyển:</div>
                    <div className="text-sm font-bold text-blue-900 mt-0.5">
                      {searchResult.position}
                    </div>
                    {searchResult.department && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        {searchResult.department}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trục thời gian tiến trình */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Tiến trình xét duyệt
                    </h3>
                    <span className="text-xs font-bold text-blue-600">
                      Giai đoạn {Math.min(searchResult.currentStepIndex + 1, 4)} / 4
                    </span>
                  </div>

                  <div className="relative pl-7 space-y-5 before:absolute before:left-3 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-gray-200">
                    {timelineSteps.map((stepItem, idx) => {
                      const isCompleted = idx < searchResult.currentStepIndex;
                      const isCurrent = idx === searchResult.currentStepIndex;
                      const isUpcoming = idx > searchResult.currentStepIndex;

                      return (
                        <div
                          key={stepItem.step}
                          className={`relative transition-all ${
                            isUpcoming ? 'opacity-40' : 'opacity-100'
                          }`}
                        >
                          <div
                            className={`absolute -left-7 top-0.5 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'w-6 h-6 bg-emerald-500 text-white shadow-xs'
                                : isCurrent
                                ? 'w-7 h-7 -left-[29px] -top-0.5 bg-blue-600 text-white ring-4 ring-blue-100 shadow-md animate-pulse'
                                : 'w-6 h-6 bg-gray-200 text-gray-500'
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

                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4
                                className={`text-sm ${
                                  isCurrent
                                    ? 'text-blue-600 font-bold'
                                    : isCompleted
                                    ? 'text-gray-900 font-semibold'
                                    : 'text-gray-500 font-medium'
                                }`}
                              >
                                {stepItem.step}. {stepItem.title}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isCurrent
                                    ? 'bg-blue-100 text-blue-700'
                                    : isCompleted
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {stepItem.timeText}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {stepItem.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ghi chú phản hồi */}
                <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
                  <HeartHandshake className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    Hồ sơ của bạn đang được Phòng Tuyển dụng xử lý theo quy trình chuẩn. Mọi thay đổi trạng thái sẽ được gửi qua email cho bạn!
                  </p>
                </div>

                {/* Các nút hành động */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tra cứu hồ sơ khác</span>
                  </button>
                  <Link
                    href="/candidate/jobs"
                    className="w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors text-center"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Khám phá thêm vị trí tuyển dụng</span>
                  </Link>
                </div>
              </div>
            )}

            {/* FAQ (Câu hỏi thường gặp) dạng Accordion ở cột trái */}
            <div className="w-full bg-white rounded-2xl shadow-xl shadow-blue-900/5 p-6 sm:p-8 border border-blue-50 space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Câu hỏi thường gặp (FAQ)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Giải đáp nhanh các thắc mắc về tra cứu hồ sơ
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {[
                  {
                    q: 'Lấy mã tra cứu ở đâu?',
                    a: 'Mã tra cứu hồ sơ (định dạng APP-XXXXXXXX) được hệ thống hiển thị ngay sau khi nộp CV thành công và gửi tự động vào email của bạn. Vui lòng kiểm tra cả thư mục Hộp thư đến và Quảng cáo/Spam.',
                  },
                  {
                    q: 'Thời gian xét duyệt hồ sơ thông thường là bao lâu?',
                    a: 'Hồ sơ được thẩm định sơ loại trong vòng 24h - 48h làm việc. Trạng thái của bạn trên trang này sẽ chuyển sang "Đang xem xét" hoặc "Mời phỏng vấn" theo thời gian thực.',
                  },
                  {
                    q: 'Tôi có thể đổi lịch nếu bị trùng lịch phỏng vấn không?',
                    a: 'Hoàn toàn có thể. Khi nhận được lời mời phỏng vấn qua email hoặc trong cổng ứng viên, bạn có thể bấm "Đề nghị đổi lịch" và nhập khung thời gian thuận tiện hơn để HR sắp xếp lại.',
                  },
                ].map((faq, fIdx) => {
                  const isOpen = openFaqIndex === fIdx;
                  return (
                    <div key={fIdx} className="border-b border-gray-100 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                        className="w-full py-4 text-left font-semibold text-xs sm:text-sm text-gray-800 flex items-center justify-between gap-3 hover:text-blue-600 transition-colors cursor-pointer group"
                      >
                        <span className="group-hover:text-blue-600 transition-colors">{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="pb-4 text-xs text-gray-500 leading-relaxed animate-in fade-in duration-200">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* CỘT PHẢI (lg:col-span-7) - Khu vực Thông tin & Tiến trình */}
          <div className="w-full lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* Banner / Tiêu đề giới thiệu quy trình */}
            <div className="w-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-blue-100 text-xs font-bold uppercase tracking-wider border border-white/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quy trình minh bạch
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Quy trình minh bạch - 4 Giai đoạn xử lý hồ sơ
                </h2>
                <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed w-full">
                  Mỗi hồ sơ ứng tuyển tại doanh nghiệp đều trải qua 4 giai đoạn chuẩn hoá và minh bạch. Ứng viên có thể chủ động theo dõi kết quả từng vòng.
                </p>
              </div>
            </div>

            {/* Lưới 4 Giai đoạn: grid grid-cols-1 sm:grid-cols-2 gap-6 */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Giai đoạn 1: Tiếp nhận hồ sơ (1 - Xanh dương nhạt) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 font-extrabold text-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      1
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      Tự động
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Tiếp nhận hồ sơ
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-2">
                      Hệ thống tự động cấp mã định danh duy nhất (APP-XXXXXXXX) và gửi email xác nhận ngay tức thì khi bạn hoàn tất nộp đơn.
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-50 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600">
                  <FileCheck className="w-4 h-4" />
                  <span>Xác nhận tức thì qua Email</span>
                </div>
              </div>

              {/* Giai đoạn 2: Xét duyệt CV (2 - Tím nhạt) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-600 font-extrabold text-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      2
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                      24h - 48h
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      Xét duyệt CV
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-2">
                      Hội đồng tuyển dụng và Trưởng bộ phận chuyên môn thẩm định năng lực, kinh nghiệm thực tế phù hợp với vị trí ứng tuyển.
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-50 flex items-center gap-1.5 text-[11px] font-semibold text-purple-600">
                  <UserCheck className="w-4 h-4" />
                  <span>Sàng lọc chuyên sâu</span>
                </div>
              </div>

              {/* Giai đoạn 3: Phỏng vấn (3 - Cam nhạt) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 font-extrabold text-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      3
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                      Vòng 1 - 2
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      Phỏng vấn
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-2">
                      Lên lịch phỏng vấn chuyên môn & văn hóa công ty. Bạn sẽ nhận lời mời kèm link họp trực tuyến hoặc thư mời tới văn phòng.
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-50 flex items-center gap-1.5 text-[11px] font-semibold text-amber-600">
                  <Calendar className="w-4 h-4" />
                  <span>Trực tuyến / Trực tiếp</span>
                </div>
              </div>

              {/* Giai đoạn 4: Kết quả (4 - Xanh lá nhạt) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 font-extrabold text-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      4
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Chính thức
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      Kết quả & Thư mời Offer
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mt-2">
                      Gửi thông báo kết quả phỏng vấn và Thư mời nhận việc (Job Offer) chi tiết về mức lương, chế độ đãi ngộ và thời gian nhận việc.
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-50 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                  <Gift className="w-4 h-4" />
                  <span>Minh bạch đãi ngộ</span>
                </div>
              </div>

            </div>

            {/* Thẻ cam kết bảo mật & Hỗ trợ ứng viên */}
            <div className="w-full bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Bảo mật tuyệt đối thông tin ứng viên
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mọi dữ liệu CV và tiến trình ứng tuyển của bạn chỉ dùng cho mục đích tuyển dụng nội bộ.
                  </p>
                </div>
              </div>
              <Link
                href="/candidate/jobs"
                className="shrink-0 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>Xem việc làm khác</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default function CandidateTrackPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full p-12 text-center text-xs text-slate-400">
          Đang chuẩn bị trang tra cứu...
        </div>
      }
    >
      <CandidateTrackContent />
    </Suspense>
  );
}
