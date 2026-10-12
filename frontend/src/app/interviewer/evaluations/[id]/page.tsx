'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Star,
  User,
  Building,
  Briefcase,
  Calendar,
  Clock,
  ShieldCheck,
  Send,
  FileText,
  RotateCcw,
  Check,
  Sparkles,
  Info,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import clsx from 'clsx';

// Định nghĩa cấu trúc tiêu chí Rubric
interface RubricCriterion {
  id: string;
  name: string;
  category: string;
  description: string;
  score: number; // 1-5 sao
  comment: string;
  weight: number; // Tỷ trọng (%)
}

export default function InterviewerEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params?.id || '1';

  // Trạng thái đã nộp / khóa phiếu (Read-only State)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Thông tin ứng viên mock theo ID
  const candidateInfo = useMemo(() => {
    if (evaluationId === '2') {
      return {
        id: 2,
        name: 'Nguyễn Văn A',
        position: 'Senior Backend Engineer (Python/FastAPI)',
        department: 'Ban Công Nghệ Thông Tin',
        round: 'Vòng 1 - Phỏng vấn Kiến trúc & Database',
        interviewDate: '12/10/2026',
        interviewTime: '09:00 - 10:00 (Sáng nay)',
        interviewer: 'Nguyễn Minh Trí (Lead Interviewer)',
        experience: '5 năm kinh nghiệm',
        education: 'Kỹ sư Phần mềm - Đại học FPT',
      };
    }
    return {
      id: 1,
      name: 'Lê Hoàng Cường',
      position: 'Senior Frontend Engineer (React/Next.js)',
      department: 'Ban Công Nghệ Thông Tin',
      round: 'Vòng 2 - Đánh giá Kỹ thuật & Live Coding',
      interviewDate: '12/10/2026',
      interviewTime: '14:00 - 15:00 (Hôm nay)',
      interviewer: 'Nguyễn Minh Trí (Lead Tech Interviewer)',
      experience: '6 năm kinh nghiệm',
      education: 'Cử nhân CNTT - Đại học Bách Khoa Hà Nội',
    };
  }, [evaluationId]);

  // Danh sách các tiêu chí Rubric chấm điểm theo chuẩn
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriterion[]>([
    {
      id: 'tech_core',
      name: '1. Kiến thức Kỹ thuật & Chuyên môn Cốt lõi',
      category: 'Chuyên Môn',
      description:
        'Nắm vững cấu trúc dữ liệu, giải thuật, framework trọng tâm (React/Next.js/Python), tư duy clean code và tối ưu hóa hiệu năng render/truy vấn.',
      score: 4,
      comment: 'Ứng viên nắm rất chắc vòng đời React, Server Components và tối ưu hóa re-render. Giải quyết bài toán thuật toán nhanh gọn.',
      weight: 30,
    },
    {
      id: 'architecture',
      name: '2. Tư duy Kiến trúc & Thiết kế Hệ thống',
      category: 'Kiến Trúc',
      description:
        'Khả năng thiết kế hệ thống mở rộng, hiểu biết về Micro-Frontend/Microservices, state management, cache và giải quyết bài toán chịu tải cao.',
      score: 4,
      comment: 'Đã từng thiết kế hệ thống phục vụ hơn 50,000 CCU, nắm rõ caching layer (Redis) và chiến lược tách module linh hoạt.',
      weight: 25,
    },
    {
      id: 'problem_solving',
      name: '3. Tư duy Giải quyết Vấn đề & Live Coding',
      category: 'Thực Chiến',
      description:
        'Khả năng debug, suy luận logic khi gặp tình huống phát sinh và tốc độ chuyển hóa giải pháp thành mã nguồn chạy được trong buổi phỏng vấn.',
      score: 4,
      comment: 'Thao tác live coding tự tin, viết unit test đầy đủ, bình tĩnh khi được người phỏng vấn đặt câu hỏi bẻ khóa tình huống.',
      weight: 20,
    },
    {
      id: 'communication',
      name: '4. Kỹ năng Giao tiếp & Phối hợp Nhóm',
      category: 'Giao Tiếp',
      description:
        'Trình bày ý tưởng mạch lạc, lắng nghe phản hồi tích cực, phong thái tự tin và minh bạch trong tranh luận kỹ thuật chuyên sâu.',
      score: 5,
      comment: 'Giao tiếp rất lưu loát, mạch lạc. Tiếng Anh chuyên ngành tốt, có tố chất chia sẻ kiến thức và mentor cho đồng đội.',
      weight: 15,
    },
    {
      id: 'culture_fit',
      name: '5. Độ phù hợp Văn hóa & Tinh thần Trách nhiệm',
      category: 'Văn Hóa',
      description:
        'Tinh thần chủ động (can-do attitude), cam kết chất lượng sản phẩm, sự cầu thị học hỏi và gắn kết với các giá trị cốt lõi của công ty.',
      score: 4,
      comment: 'Có tinh thần ownership cao, sẵn sàng nhận bài toán khó và tôn trọng văn hóa hợp tác đa chức năng.',
      weight: 10,
    },
  ]);

  // Kết luận bắt buộc (Hire / Consider / Strong No)
  const [recommendation, setRecommendation] = useState<'hire' | 'consider' | 'strong_no' | null>('hire');
  const [generalNotes, setGeneralNotes] = useState<string>(
    'Khuyến nghị tuyển dụng ứng viên cho vị trí Senior. Đề xuất cân nhắc mức lương thuộc dải trên của khung chuẩn (P75-P90) do năng lực thực chiến xuất sắc.'
  );

  // Điểm trung bình tổng thể tính theo thang 5 sao
  const averageScore = useMemo(() => {
    if (rubricCriteria.length === 0) return 0;
    const total = rubricCriteria.reduce((sum, item) => sum + item.score, 0);
    return Number((total / rubricCriteria.length).toFixed(1));
  }, [rubricCriteria]);

  // Xử lý thay đổi điểm số của từng tiêu chí
  const handleScoreChange = (id: string, newScore: number) => {
    if (isSubmitted) return;
    setRubricCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, score: newScore } : c))
    );
  };

  // Xử lý thay đổi nhận xét của từng tiêu chí
  const handleCommentChange = (id: string, newComment: string) => {
    if (isSubmitted) return;
    setRubricCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, comment: newComment } : c))
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Xử lý Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitted) return;

    if (!recommendation) {
      alert('Vui lòng chọn Kết luận bắt buộc (Nên tuyển / Cân nhắc / Không nên tuyển) trước khi nộp phiếu!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      showToast('Đã nộp phiếu đánh giá thành công! Phiếu đã được khóa an toàn.');
    }, 700);
  };

  const scoreLabels: Record<number, string> = {
    1: '1 - Kém (Chưa đạt)',
    2: '2 - Cần cải thiện',
    3: '3 - Đạt yêu cầu chuẩn',
    4: '4 - Tốt (Vượt kỳ vọng)',
    5: '5 - Xuất sắc (Chuyên gia)',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link
          href="/interviewer/schedule"
          className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lịch phỏng vấn</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link
          href="/interviewer/evaluations/pending"
          className="hover:text-blue-600 transition-colors font-medium"
        >
          Phiếu đánh giá chờ nộp
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-bold">Chấm điểm ứng viên: {candidateInfo.name}</span>
      </div>

      {/* 1. THÔNG BÁO BẢO MẬT (BLIND EVALUATION BANNER) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-amber-500/10 border border-amber-300/80 rounded-2xl p-4.5 flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-amber-500/25">
          <Lock className="w-4.5 h-4.5" />
        </div>
        <div className="text-xs space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-amber-950 text-sm">
              🔒 Đánh giá độc lập (Blind Evaluation):
            </span>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
              Chính sách bảo mật ATS
            </span>
          </div>
          <p className="text-amber-900 leading-relaxed font-medium">
            Bạn không thể xem nhận xét của thành viên khác cho đến khi hoàn tất và nộp phiếu đánh giá của chính mình.
            Cơ chế này nhằm đảm bảo tính khách quan, trung thực và độc lập tuyệt đối giữa các giám khảo trong Hội đồng.
          </p>
        </div>
      </div>

      {/* 2. Candidate Header Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            {candidateInfo.name.charAt(0)}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Phiếu Đánh Giá: {candidateInfo.name}
              </h1>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-blue-100">
                {candidateInfo.round}
              </span>
              {isSubmitted ? (
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Đã Khóa Phiếu</span>
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Đang Chấm Điểm</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{candidateInfo.position}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{candidateInfo.department}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{candidateInfo.interviewDate} ({candidateInfo.interviewTime})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Điểm trung bình Overall */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 shrink-0 justify-between lg:justify-start">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Điểm Trung Bình Rubric
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{averageScore}</span>
              <span className="text-sm font-bold text-slate-400">/ 5.0</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
        </div>
      </div>

      {/* 3. FORM ĐÁNH GIÁ CHÍNH */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section: Bảng Tiêu Chí Rubric Theo Vị Trí */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                1. Khung Tiêu Chí Năng Lực (Rubric Chuyên Môn)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chấm điểm từ 1 đến 5 sao và nhập căn cứ nhận xét cho từng tiêu chuẩn nghề nghiệp.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Số lượng tiêu chí: <strong className="text-slate-800">{rubricCriteria.length}</strong>
            </div>
          </div>

          {/* Danh sách tiêu chí */}
          <div className="space-y-6">
            {rubricCriteria.map((criterion, idx) => (
              <div
                key={criterion.id}
                className={clsx(
                  'p-5 rounded-2xl border transition-all duration-200 space-y-4',
                  isSubmitted
                    ? 'bg-slate-50/50 border-slate-200/60'
                    : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
                )}
              >
                {/* Header Tiêu chí & Selector Sao */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{criterion.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                        {criterion.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">{criterion.description}</p>
                  </div>

                  {/* Star Rating Widget (1-5 Sao) */}
                  <div className="flex flex-col sm:items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isActive = criterion.score >= starVal;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            disabled={isSubmitted}
                            onClick={() => handleScoreChange(criterion.id, starVal)}
                            className={clsx(
                              'p-1.5 rounded-lg transition-transform focus:outline-none',
                              isSubmitted
                                ? 'cursor-not-allowed opacity-80'
                                : 'hover:scale-110 active:scale-95 cursor-pointer'
                            )}
                            title={scoreLabels[starVal]}
                          >
                            <Star
                              className={clsx(
                                'w-5 h-5 transition-colors',
                                isActive
                                  ? 'text-amber-500 fill-amber-400'
                                  : 'text-slate-200 hover:text-amber-300'
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 font-sans">
                      {scoreLabels[criterion.score]}
                    </span>
                  </div>
                </div>

                {/* Ô Nhập Text Nhận Xét Của Tiêu Chí */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nhận xét chi tiết & Minh chứng trong buổi phỏng vấn:
                  </label>
                  <textarea
                    rows={2}
                    disabled={isSubmitted}
                    value={criterion.comment}
                    onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                    placeholder="Ghi nhận điểm mạnh, hạn chế, câu trả lời tiêu biểu..."
                    className={clsx(
                      'w-full p-3 rounded-xl text-xs transition-all leading-relaxed',
                      isSubmitted
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800'
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. KẾT LUẬN BẮT BUỘC (MANDATORY CONCLUSION SELECTOR) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>2. Kết Luận Khuyến Nghị Bắt Buộc</span>
                <span className="text-rose-500 text-sm">*</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bạn bắt buộc phải đưa ra quyết định dứt khoát 1 trong 3 mức dưới đây trước khi hoàn tất nộp phiếu.
              </p>
            </div>
            {!recommendation && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse">
                Chưa chọn kết luận
              </span>
            )}
          </div>

          {/* Khối Radio Button Lớn (3 Tùy Chọn 🟢 🟡 🔴) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lựa chọn 1: 🟢 Nên tuyển (Hire) */}
            <button
              type="button"
              disabled={isSubmitted}
              onClick={() => !isSubmitted && setRecommendation('hire')}
              className={clsx(
                'p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3',
                isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer',
                recommendation === 'hire'
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <strong className="text-sm font-extrabold text-emerald-950">🟢 Nên Tuyển (Hire)</strong>
                </div>
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    recommendation === 'hire'
                      ? 'border-emerald-600 bg-emerald-600'
                      : 'border-slate-300 bg-white'
                  )}
                >
                  {recommendation === 'hire' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Ứng viên đáp ứng đầy đủ hoặc vượt chuẩn yêu cầu năng lực. Khuyến nghị mạnh mẽ chuyển sang vòng Đề xuất Offer.
              </p>
            </button>

            {/* Lựa chọn 2: 🟡 Cân nhắc (Consider) */}
            <button
              type="button"
              disabled={isSubmitted}
              onClick={() => !isSubmitted && setRecommendation('consider')}
              className={clsx(
                'p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3',
                isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer',
                recommendation === 'consider'
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                  <strong className="text-sm font-extrabold text-amber-950">🟡 Cân Nhắc (Consider)</strong>
                </div>
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    recommendation === 'consider'
                      ? 'border-amber-600 bg-amber-600'
                      : 'border-slate-300 bg-white'
                  )}
                >
                  {recommendation === 'consider' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Ứng viên có tiềm năng nhưng còn một số điểm băn khoăn. Cần so sánh với ứng viên khác hoặc phỏng vấn thêm.
              </p>
            </button>

            {/* Lựa chọn 3: 🔴 Không nên tuyển (Strong No) */}
            <button
              type="button"
              disabled={isSubmitted}
              onClick={() => !isSubmitted && setRecommendation('strong_no')}
              className={clsx(
                'p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3',
                isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer',
                recommendation === 'strong_no'
                  ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    <XCircle className="w-5 h-5" />
                  </span>
                  <strong className="text-sm font-extrabold text-rose-950">🔴 Không Tuyển (Strong No)</strong>
                </div>
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    recommendation === 'strong_no'
                      ? 'border-rose-600 bg-rose-600'
                      : 'border-slate-300 bg-white'
                  )}
                >
                  {recommendation === 'strong_no' && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Ứng viên chưa đáp ứng yêu cầu tối thiểu về kỹ thuật hoặc không phù hợp với văn hóa. Đề xuất gửi thư từ chối.
              </p>
            </button>
          </div>

          {/* Ghi chú tổng kết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ghi chú tổng kết & Đề xuất cấp bậc (Seniority / Level) cho HR:
            </label>
            <textarea
              rows={3}
              disabled={isSubmitted}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Nhập đề xuất mức lương, cấp bậc chuyên môn, thời gian thử việc hoặc các lưu ý đặc biệt..."
              className={clsx(
                'w-full p-3 rounded-xl text-xs transition-all leading-relaxed',
                isSubmitted
                  ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800'
              )}
            />
          </div>
        </div>

        {/* 5. TRẠNG THÁI KHÓA & NÚT SUBMIT */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {isSubmitted ? (
              <div className="flex items-start sm:items-center gap-2.5 text-xs text-slate-700">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  <Lock className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-extrabold text-slate-900 block">
                    Phiếu đã được khóa an toàn (Read-only).
                  </span>
                  <p className="text-slate-500 mt-0.5">
                    Để chỉnh sửa, vui lòng liên hệ <strong className="text-blue-600">HR Manager</strong> mở lại trong vòng 24h.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info className="w-4 h-4 text-slate-400" />
                <span>
                  Sau khi nộp, phiếu sẽ được khóa tự động và chuyển vào kết quả tổng hợp của Hội đồng.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Demo Toggle: Mở khóa phiếu cho môi trường test */}
            {isSubmitted && (
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  showToast('Đã mở khóa phiếu để bạn tiếp tục chỉnh sửa!');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Mở khóa phiếu (Demo)
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitted || isSubmitting || !recommendation}
              className={clsx(
                'px-7 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md',
                isSubmitted
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none border border-slate-300'
                  : !recommendation || isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95 cursor-pointer'
              )}
            >
              {isSubmitted ? (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Đã Nộp Phiếu</span>
                </>
              ) : isSubmitting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Đang nộp...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Nộp Phiếu Đánh Giá</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
