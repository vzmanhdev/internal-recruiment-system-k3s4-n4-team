'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Video,
  Clock,
  User,
  Building,
  Briefcase,
  FileText,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  Lightbulb,
  Award,
  Send,
  Eye,
  Maximize2,
  Copy,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Tag,
  Check,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

// Interface Câu hỏi phỏng vấn thông minh
interface SmartQuestion {
  id: string;
  category: 'Kỹ Thuật Cốt Lõi' | 'Kiến Trúc & Tối Ưu' | 'Xử Lý Tình Huống STAR' | 'Live Coding';
  level: 'Middle' | 'Senior' | 'Lead';
  question: string;
  isAsked: boolean;
  scoringCriteria: string[]; // Các ý gạch đầu dòng ứng viên cần nói được
  bonusPoints?: string; // Điểm cộng đặc biệt
  pitfallWarning?: string; // Bẫy kiến thức cần tránh
}

export default function LiveInterviewModePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id || '1';

  // 1. Dữ liệu ứng viên tương ứng theo ID
  const candidate = useMemo(() => {
    if (id === '2') {
      return {
        id: 2,
        name: 'Nguyễn Văn A',
        position: 'Senior Backend Engineer (Python/FastAPI)',
        department: 'Ban Công Nghệ Thông Tin',
        round: 'Vòng 1 - Phỏng vấn Kiến trúc & Database',
        time: '09:00 - 10:00 (Sáng nay)',
        format: 'Online (Microsoft Teams)',
        meetingUrl: 'https://teams.microsoft.com/l/meetup-join/...',
        experience: '5 năm kinh nghiệm',
        education: 'Kỹ sư Phần mềm - Đại học FPT',
        skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Kubernetes'],
        currentCompany: 'E-Commerce Platform Vietnam',
      };
    }
    return {
      id: 1,
      name: 'Lê Hoàng Cường',
      position: 'Senior Frontend Engineer (React/Next.js)',
      department: 'Ban Công Nghệ Thông Tin',
      round: 'Vòng 2 - Đánh giá Kỹ thuật & Live Coding',
      time: '14:00 - 15:00 (Hôm nay)',
      format: 'Online (Google Meet)',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      experience: '6 năm kinh nghiệm',
      education: 'Cử nhân CNTT - Đại học Bách Khoa Hà Nội',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux', 'System Design'],
      currentCompany: 'Fintech Solutions JSC',
    };
  }, [id]);

  // 2. Bộ câu hỏi thông minh được map tự động theo chức danh
  const initialQuestions: SmartQuestion[] = useMemo(() => {
    if (id === '2') {
      // Bộ câu hỏi cho Backend Engineer
      return [
        {
          id: 'be_1',
          category: 'Kỹ Thuật Cốt Lõi',
          level: 'Senior',
          question:
            'Trong FastAPI / Python 3.11+, cơ chế Async/Await hoạt động dưới Event Loop như thế nào? Khi nào việc dùng Async lại gây phản tác dụng và làm nghẽn tiến trình?',
          isAsked: false,
          scoringCriteria: [
            'Nêu đúng bản chất Non-blocking I/O và cơ chế chuyển đổi context giữa các Coroutine qua Event Loop (asyncio).',
            'Chỉ ra được nhược điểm nghiêm trọng: Nếu chạy tác vụ tính toán CPU-bound nặng hoặc gọi thư viện đồng bộ (như time.sleep, sync db driver) sẽ chặn đứng toàn bộ Event Loop.',
            'Đưa ra giải pháp: Ủy quyền tác vụ nặng cho ThreadPoolExecutor / ProcessPoolExecutor hoặc Worker nền (Celery/RQ).',
          ],
          bonusPoints: 'Nêu được cách sử dụng uvloop để tối ưu thông lượng I/O cho Uvicorn.',
          pitfallWarning: 'Nếu ứng viên trả lời nhầm lẫn giữa đa luồng OS Threads và đa nhiệm bất đồng bộ Single-threaded Event Loop.',
        },
        {
          id: 'be_2',
          category: 'Kiến Trúc & Tối Ưu',
          level: 'Senior',
          question:
            'Thiết kế chiến lược Caching với Redis cho một Endpoint đọc dữ liệu thường xuyên. Bạn xử lý các bài toán Cache Penetration, Cache Breakdown và Cache Avalanche như thế nào?',
          isAsked: false,
          scoringCriteria: [
            'Cache Penetration: Dùng Bloom Filter kiểm tra khóa trước khi query, hoặc cache giá trị NULL có TTL ngắn.',
            'Cache Breakdown (Hot key hết hạn): Sử dụng Mutex Lock (Redis distributed lock) để chỉ cho 1 worker truy vấn DB và nạp cache, các worker khác chờ.',
            'Cache Avalanche (Hàng loạt key hết hạn cùng lúc): Thêm khoảng thời gian ngẫu nhiên (Random Jitter TTL) thay vì đặt cùng 1 mốc thời gian.',
          ],
          bonusPoints: 'Đề xuất giải pháp Dual Caching (Local memory cache + Redis cluster) để giảm tải network latency.',
        },
        {
          id: 'be_3',
          category: 'Kỹ Thuật Cốt Lõi',
          level: 'Senior',
          question:
            'Trong PostgreSQL, giải thích sự khác biệt giữa các mức cô lập giao dịch (Transaction Isolation Levels). Hiện tượng Phantom Read xảy ra ở cấp độ nào?',
          isAsked: false,
          scoringCriteria: [
            'Giải thích được 4 mức: Read Uncommitted, Read Committed, Repeatable Read, Serializable.',
            'Phân biệt rõ: Dirty Read, Non-repeatable Read và Phantom Read.',
            'Chỉ ra được trong PostgreSQL, Repeatable Read sử dụng Snapshot Isolation và đã ngăn chặn được hầu hết Phantom Read thông thường, chỉ cần Serializable khi có Write Skew.',
          ],
        },
        {
          id: 'be_4',
          category: 'Xử Lý Tình Huống STAR',
          level: 'Senior',
          question:
            'Hãy kể lại sự cố Database Connection Pool bị cạn kiệt (Database Outage) mà bạn từng trực tiếp điều tra và khắc phục trong quá khứ?',
          isAsked: false,
          scoringCriteria: [
            'Trình bày phương pháp STAR rõ ràng: Hoàn cảnh sự cố, triệu chứng nghẽn kết nối, công cụ profiling (pg_stat_activity).',
            'Nguyên nhân cốt lõi: Rò rỉ connection do không đóng transaction, hoặc slow query giữ kết nối quá lâu.',
            'Giải pháp dài hạn: Tinh chỉnh PgBouncer, đặt connection timeout, index bổ sung và thiết lập circuit breaker.',
          ],
        },
      ];
    }

    // Bộ câu hỏi cho Frontend Engineer
    return [
      {
        id: 'fe_1',
        category: 'Kỹ Thuật Cốt Lõi',
        level: 'Senior',
        question:
          'Trong React 18/19 và Next.js App Router, sự khác biệt bản chất giữa React Server Components (RSC) và Client Components là gì? Khi nào bắt buộc phải dùng "use client"?',
        isAsked: false,
        scoringCriteria: [
          'Giải thích đúng: RSC chạy và render hoàn toàn ở server, không gửi JS bundle về client giúp giảm kích thước gói tải.',
          'RSC có thể truy vấn trực tiếp cơ sở dữ liệu, file system hoặc secret keys an toàn.',
          'Bắt buộc dùng "use client" khi cần: Browser Event listeners (onClick, onChange), React Hooks (useState, useEffect, useRef), hoặc Browser APIs (localStorage, window).',
          'Nắm được quy tắc composition: RSC có thể bọc Client Component làm children.',
        ],
        bonusPoints: 'Giải thích được cấu trúc serialize dạng RSC Payload streaming qua HTTP.',
        pitfallWarning: 'Ứng viên nhầm lẫn "use client" là chạy hoàn toàn ở client mà không hề SSR ở lần tải trang đầu tiên.',
      },
      {
        id: 'fe_2',
        category: 'Kiến Trúc & Tối Ưu',
        level: 'Senior',
        question:
          'Một trang web thương mại điện tử có chỉ số LCP (Largest Contentful Paint) bị đỏ (> 4.5s) và INP (Interaction to Next Paint) kém. Bạn sẽ thực hiện quy trình chẩn đoán và khắc phục như thế nào?',
        isAsked: false,
        scoringCriteria: [
          'Chẩn đoán: Sử dụng Chrome DevTools Performance panel, Lighthouse, Web Vitals profiling để xác định đúng phần tử LCP.',
          'Tối ưu LCP: Dùng thẻ Priority Hints (fetchpriority="high"), chuyển đổi định dạng ảnh AVIF/WebP, preload hero image, loại bỏ render-blocking CSS/JS.',
          'Tối ưu INP: Chia nhỏ tác vụ chạy lâu (Long Tasks > 50ms) bằng requestIdleCallback / scheduler.yield(), tránh re-render layout không cần thiết.',
        ],
        bonusPoints: 'Đề cập đến Server-Timing header và tối ưu TTFB từ phía máy chủ / CDN edge caching.',
      },
      {
        id: 'fe_3',
        category: 'Kỹ Thuật Cốt Lõi',
        level: 'Senior',
        question:
          'Bạn hiểu thế nào về React Fiber Architecture và cơ chế Reconciliation? Khái niệm Virtual DOM Diffing vận hành với độ phức tạp thuật toán O(n) dựa trên những giả định gì?',
        isAsked: false,
        scoringCriteria: [
          'Fiber là cấu trúc dữ liệu mô phỏng Call Stack dưới dạng Linked List 2 chiều (child, sibling, return) cho phép ngắt quãng và xếp độ ưu tiên cho render.',
          'Hai giả định cốt lõi của Diffing O(n): Hai phần tử khác type sẽ sinh ra cây khác nhau hoàn toàn; và phần tử con có thể duy trì danh tính ổn định qua thuộc tính `key`.',
        ],
      },
      {
        id: 'fe_4',
        category: 'Xử Lý Tình Huống STAR',
        level: 'Senior',
        question:
          'Kể về một lần bạn phát hiện và xử lý sự cố rò rỉ bộ nhớ (Memory Leak) hoặc giật lag giao diện (Jank/Frame Drop) trong một Single Page Application phức tạp?',
        isAsked: false,
        scoringCriteria: [
          'Mô tả cách dùng Heap Snapshot và Allocation Timeline trong Chrome DevTools để bắt đối tượng không được giải phóng.',
          'Chỉ ra lỗi thường gặp: Quên xóa addEventListener, setInterval, subscription WebSocket hoặc closure giữ tham chiếu DOM cũ.',
          'Kết quả đo lường: Khôi phục tốc độ 60fps mượt mà và giảm tiêu hao RAM.',
        ],
      },
      {
        id: 'fe_5',
        category: 'Live Coding',
        level: 'Lead',
        question:
          'Thử thách nhanh: Hãy mô tả hoặc viết một Custom Hook `useDebounce` hoặc `useVirtualList` tự chế có khả năng hủy bỏ (cancel) và quản lý dependency sạch sẽ.',
        isAsked: false,
        scoringCriteria: [
          'Sử dụng setTimeout kết hợp cleanup function trong useEffect để clear timer khi input thay đổi.',
          'Hỗ trợ callback debounce hoặc giá trị value debounce mượt mà.',
        ],
      },
    ];
  }, [id]);

  const [questions, setQuestions] = useState<SmartQuestion[]>(initialQuestions);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Ghi chú & Đánh giá nhanh
  const [quickScore, setQuickScore] = useState<number>(4);
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [prosNotes, setProsNotes] = useState<string>('');
  const [consNotes, setConsNotes] = useState<string>('');
  const [autoSavedTime, setAutoSavedTime] = useState<string>('Vừa xong');

  // Đồng hồ bấm giờ phỏng vấn
  const [seconds, setSeconds] = useState<number>(1420); // Mặc định 23 phút 40 giây
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // CV Tab: Document View vs Summary
  const [cvViewMode, setCvViewMode] = useState<'preview' | 'summary'>('preview');

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Checkbox Đã hỏi
  const toggleQuestionAsked = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, isAsked: !q.isAsked } : q))
    );
  };

  // Toggle Accordion Tiêu chí câu trả lời tốt
  const toggleAccordion = (questionId: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Thống kê tiến độ hỏi
  const askedCount = useMemo(() => {
    return questions.filter((q) => q.isAsked).length;
  }, [questions]);

  // Bộ lọc câu hỏi
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filterCategory === 'all') return true;
      if (filterCategory === 'unasked') return !q.isAsked;
      if (filterCategory === 'asked') return q.isAsked;
      return q.category === filterCategory;
    });
  }, [questions, filterCategory]);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16">
      {/* 1. TOP CONTROL BAR (Thanh Điều Khiển Song Song Cố Định) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <Link
            href="/interviewer/schedule"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Quay lại Lịch phỏng vấn"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Chế Độ Phỏng Vấn Trực Tiếp (Live Interview Mode)</span>
                <span className="bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Live Session
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ứng viên: <strong className="text-slate-800">{candidate.name}</strong> • Vị trí:{' '}
              <strong className="text-blue-600">{candidate.position}</strong>
            </p>
          </div>
        </div>

        {/* Đồng hồ Timer & Nút Chuyển Sang Điền Phiếu Đánh Giá */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Live Stopwatch Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-sm tracking-wider">{formatTimer(seconds)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title={isTimerRunning ? 'Tạm dừng đếm giờ' : 'Tiếp tục đếm giờ'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* NÚT NỔI BẬT: CHUYỂN SANG ĐIỀN PHIẾU ĐÁNH GIÁ */}
          <Link
            href={`/interviewer/evaluations/${id}`}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer ring-2 ring-blue-500/20"
          >
            <Award className="w-4 h-4" />
            <span>Chuyển Sang Điền Phiếu Đánh Giá</span>
          </Link>
        </div>
      </div>

      {/* 2. SPLIT SCREEN (CHIA ĐÔI MÀN HÌNH CHUYÊN NGHIỆP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* CỘT TRÁI (6 CỘT): THÔNG TIN ỨNG VIÊN, RENDER CV & Ô GHI CHÚ NHANH */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-5">
          {/* A. THẺ TÓM TẮT THÔNG TIN ỨNG VIÊN */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  {candidate.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{candidate.name}</h2>
                  <p className="text-xs font-semibold text-blue-700">{candidate.position}</p>
                  <span className="text-[11px] text-slate-500">{candidate.department}</span>
                </div>
              </div>

              {/* Link họp trực tuyến */}
              {candidate.meetingUrl && (
                <a
                  href={candidate.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Mở Google Meet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Thông số nhanh */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Kinh nghiệm</span>
                <strong className="text-slate-800 text-[11px]">{candidate.experience}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Công ty gần nhất</span>
                <strong className="text-slate-800 text-[11px] truncate block">{candidate.currentCompany}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Vòng tuyển dụng</span>
                <strong className="text-slate-800 text-[11px] truncate block">{candidate.round.split(' - ')[0]}</strong>
              </div>
            </div>

            {/* Tags Kỹ Năng */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* B. KHU VỰC RENDER CV (CV DOCUMENT VIEWER) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {/* Header thanh công cụ CV Viewer */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Tài Liệu Hồ Sơ CV Ứng Viên</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-200/80 p-0.5 rounded-lg flex text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setCvViewMode('preview')}
                    className={clsx(
                      'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                      cvViewMode === 'preview' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600'
                    )}
                  >
                    Bản Xem Tài Liệu
                  </button>
                  <button
                    type="button"
                    onClick={() => setCvViewMode('summary')}
                    className={clsx(
                      'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                      cvViewMode === 'summary' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600'
                    )}
                  >
                    Tóm Tắt Quá Trình
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Đang mở file CV PDF gốc sang tab trình xem toàn màn hình...')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Phóng to toàn màn hình"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Nội dung CV Render Box (Iframe / Document Canvas) */}
            <div className="h-96 overflow-y-auto p-5 bg-white text-xs space-y-4 border-b border-slate-100 select-text">
              {cvViewMode === 'preview' ? (
                /* Mô phỏng Iframe Render CV chuyên nghiệp */
                <div className="space-y-4 text-slate-700 leading-relaxed max-w-xl mx-auto">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{candidate.name}</h3>
                    <p className="text-xs font-bold text-blue-600 uppercase">{candidate.position}</p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Email: candidate.cv@example.com • Điện thoại: 0912 345 678 • Hà Nội, Việt Nam
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Mục Tiêu Nghề Nghiệp & Tóm Tắt Năng Lực
                    </h4>
                    <p className="text-slate-600 text-[11px]">
                      Hơn 6 năm kinh nghiệm phát triển phần mềm kiến trúc Microservices và SPA/SSR quy mô lớn. Am hiểu
                      sâu về tối ưu hiệu năng web, thiết kế API RESTful, CI/CD và dẫn dắt đội ngũ kỹ thuật đạt mục tiêu tiến độ.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Kinh Nghiệm Làm Việc Chi Tiết
                    </h4>

                    <div className="border-l-2 border-blue-500 pl-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900">Senior Software Engineer — {candidate.currentCompany}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">2022 - Hiện tại</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        • Xây dựng hệ thống giao dịch thanh toán trực tuyến, xử lý hơn 15,000 yêu cầu/giây.<br />
                        • Tối ưu hóa thời gian phản hồi API giảm 35% qua chiến lược Caching Redis phân tầng.<br />
                        • Đào tạo và hướng dẫn kỹ thuật cho 5 kỹ sư cấp Middle & Junior.
                      </p>
                    </div>

                    <div className="border-l-2 border-slate-300 pl-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900">Software Engineer — Global Tech JSC</strong>
                        <span className="text-[10px] text-slate-400 font-mono">2019 - 2022</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        • Phát triển các tính năng cốt lõi cho nền tảng quản trị nhân sự SaaS trên nền tảng React & Node.js.<br />
                        • Tích hợp hệ thống CI/CD tự động trên GitLab CI và hạ tầng Docker container.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Học Vấn & Bằng Cấp
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      • {candidate.education} — Tốt nghiệp loại Giỏi (GPA 3.6/4.0)<br />
                      • Chứng chỉ Quốc Tế: AWS Certified Solutions Architect Associate (2024)
                    </p>
                  </div>
                </div>
              ) : (
                /* Tab Tóm tắt nhanh quá trình */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <strong className="text-slate-800 block text-xs">Điểm nổi bật trong hồ sơ:</strong>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 mt-1 space-y-1">
                      <li>Đã có kinh nghiệm dẫn dắt kỹ thuật và trực tiếp phỏng vấn ứng viên trước đây.</li>
                      <li>Có khả năng live coding tốt và tư duy thuật toán chặt chẽ.</li>
                      <li>Kỳ vọng mức lương trong dải ngân sách phê duyệt của REQ.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer CV: Nút tải file */}
            <div className="p-2.5 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">Định dạng file: PDF (2.4 MB)</span>
              <button
                type="button"
                onClick={() => alert(`Đang tải file CV bản gốc của ${candidate.name}...`)}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Bản Gốc (.PDF)</span>
              </button>
            </div>
          </div>

          {/* C. CÁC Ô INPUT NHANH ĐỂ NOTE Ý CHÍNH TRONG LÚC NGHE */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Ghi Chú Nhanh Trong Buổi Phỏng Vấn (Live Scratchpad)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Tự động lưu nháp: {autoSavedTime}</span>
            </div>

            {/* Điểm chấm nhanh sơ bộ */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-700">Điểm sơ bộ hiện tại:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setQuickScore(star);
                      setAutoSavedTime(new Date().toLocaleTimeString('vi-VN'));
                    }}
                    className="p-1 text-xs hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={clsx(
                        'w-5 h-5 transition-colors',
                        quickScore >= star ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                      )}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-700 ml-1">{quickScore}/5 ★</span>
              </div>
            </div>

            {/* 2 Ô Ghi chú: Điểm cộng vs Điểm cần lưu ý */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                  ✓ Điểm cộng / Ấn tượng nổi bật:
                </label>
                <textarea
                  rows={3}
                  value={prosNotes}
                  onChange={(e) => {
                    setProsNotes(e.target.value);
                    setAutoSavedTime(new Date().toLocaleTimeString('vi-VN'));
                  }}
                  placeholder="Ứng viên giải thích xuất sắc phần Event Loop, tư duy thuật toán nhanh..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-700 mb-1">
                  ⚠️ Điểm cần đào sâu / Còn nghi vấn:
                </label>
                <textarea
                  rows={3}
                  value={consNotes}
                  onChange={(e) => {
                    setConsNotes(e.target.value);
                    setAutoSavedTime(new Date().toLocaleTimeString('vi-VN'));
                  }}
                  placeholder="Kinh nghiệm Kubernetes còn ở mức cơ bản, cần hỏi thêm phần CI/CD..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
                />
              </div>
            </div>

            {/* Ô ghi chú tự do toàn văn */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Ghi chép diễn biến cuộc gọi (Scratchpad):
              </label>
              <textarea
                rows={3}
                value={quickNotes}
                onChange={(e) => {
                  setQuickNotes(e.target.value);
                  setAutoSavedTime(new Date().toLocaleTimeString('vi-VN'));
                }}
                placeholder="Ghi lại các đoạn mã, câu trả lời trực tiếp hoặc các số liệu ứng viên cung cấp..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI (6 CỘT): NGÂN HÀNG CÂU HỎI THÔNG MINH MAP THEO CHỨC DANH */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Header Ngân Hàng Câu Hỏi */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Ngân Hàng Câu Hỏi Gợi Ý Theo Chức Danh
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động ánh xạ cho vị trí: <strong className="text-blue-600">{candidate.position}</strong>
                </p>
              </div>

              {/* Tiến độ hỏi */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Đã hỏi: <strong className="text-blue-600">{askedCount}</strong>/{questions.length}
                </span>
                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${(askedCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Thanh Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  filterCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                Tất cả ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('unasked')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  filterCategory === 'unasked'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                Chưa hỏi ({questions.filter((q) => !q.isAsked).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('asked')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  filterCategory === 'asked' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                Đã hỏi ({askedCount})
              </button>
            </div>
          </div>

          {/* Danh Sách Các Thẻ Câu Hỏi */}
          <div className="space-y-3.5">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
                Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isOpen = !!openAccordions[q.id];

                return (
                  <div
                    key={q.id}
                    className={clsx(
                      'rounded-2xl border p-4.5 transition-all duration-200 space-y-3',
                      q.isAsked
                        ? 'opacity-50 bg-slate-50/80 border-dashed border-slate-200'
                        : 'bg-white border-slate-200/80 shadow-xs hover:border-blue-300'
                    )}
                  >
                    {/* Header Thẻ: Category, Level & Checkbox Đã Hỏi */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-100">
                          {q.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {q.level}
                        </span>
                      </div>

                      {/* CHECKBOX ĐÃ HỎI */}
                      <button
                        type="button"
                        onClick={() => toggleQuestionAsked(q.id)}
                        className={clsx(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                          q.isAsked
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        )}
                        title="Đánh dấu câu hỏi đã được hỏi để tránh trùng lặp"
                      >
                        {q.isAsked ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã hỏi</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                            <span>Chưa hỏi</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Nội dung câu hỏi chính */}
                    <div className="text-xs font-extrabold text-slate-900 leading-relaxed">
                      <span className="text-blue-600 mr-1.5">Q{idx + 1}:</span>
                      <span className={clsx(q.isAsked && 'line-through text-slate-600')}>{q.question}</span>
                    </div>

                    {/* ACCORDION (NÚT XỔ XUỐNG): 💡 TIÊU CHÍ CÂU TRẢ LỜI TỐT */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleAccordion(q.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>💡 Tiêu chí câu trả lời tốt (Xem gợi ý chấm điểm)</span>
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* Nội dung accordion mở ra */}
                      {isOpen && (
                        <div className="mt-2 p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/60 text-xs space-y-2 animate-in fade-in duration-150">
                          <span className="font-bold text-amber-950 block text-[11px] uppercase tracking-wider">
                            Các ý ứng viên cần nói được để đạt điểm cao:
                          </span>
                          <ul className="space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                            {q.scoringCriteria.map((criterion, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{criterion}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Điểm cộng nếu có */}
                          {q.bonusPoints && (
                            <div className="pt-1 border-t border-amber-200/60 text-[11px] text-emerald-800">
                              <strong className="text-emerald-900">⭐ Điểm cộng:</strong> {q.bonusPoints}
                            </div>
                          )}

                          {/* Cảnh báo bẫy kiến thức */}
                          {q.pitfallWarning && (
                            <div className="pt-1 text-[11px] text-rose-800">
                              <strong className="text-rose-900">⚠️ Bẫy kiến thức:</strong> {q.pitfallWarning}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Bottom Call to Action Card */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="text-xs">
              <strong className="text-blue-900 block font-bold">Đã hoàn thành buổi phỏng vấn?</strong>
              <span className="text-slate-600 text-[11px]">
                Chuyển ngay sang form Rubric chính thức để chốt điểm và nộp phiếu đánh giá.
              </span>
            </div>

            <Link
              href={`/interviewer/evaluations/${id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 shrink-0 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>Điền Phiếu Ngay</span>
              <Award className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
