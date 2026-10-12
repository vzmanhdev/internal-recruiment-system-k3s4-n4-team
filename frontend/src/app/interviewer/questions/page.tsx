'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Filter,
  Tag,
  Lightbulb,
  Flag,
  Copy,
  Check,
  Briefcase,
  Code2,
  Database,
  Layers,
  LineChart,
  Compass,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Video,
} from 'lucide-react';
import clsx from 'clsx';

// Interface kiểu dữ liệu Ngân Hàng Câu Hỏi
export interface QuestionItem {
  id: string;
  criterion: string;
  criterionBadgeClass: string;
  level: 'Middle' | 'Senior' | 'Lead' | 'Principal';
  question: string;
  hints: string[];
  redFlags: string[];
}

export interface JobRoleQuestionBank {
  id: string;
  roleTitle: string;
  department: string;
  category: 'Kỹ Thuật' | 'Dữ Liệu' | 'Sản Phẩm';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  questions: QuestionItem[];
}

// 1. DỮ LIỆU MOCK DATA CỰC KỲ CHI TIẾT THEO YÊU CẦU NGHIỆP VỤ
const questionBankData: JobRoleQuestionBank[] = [
  // =========================================================================
  // CHỨC DANH 1: Senior Backend Engineer (Python/FastAPI)
  // =========================================================================
  {
    id: 'backend_senior',
    roleTitle: 'Senior Backend Engineer (Python/FastAPI)',
    department: 'Ban Công Nghệ Thông Tin',
    category: 'Kỹ Thuật',
    icon: Code2,
    description:
      'Đánh giá năng lực thiết kế hệ thống phân tán, xử lý tải cao (High Concurrency), tối ưu hóa ORM/Database và kiến trúc Microservices.',
    questions: [
      {
        id: 'be_q1',
        criterion: 'System Design & High Load',
        criterionBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        level: 'Senior',
        question:
          'Hãy thiết kế một hệ thống bán vé sự kiện có khả năng chịu tải 100.000 request/giây khi mở bán. Bạn giải quyết bài toán chống bán quá số lượng (Overselling / Race Condition) như thế nào?',
        hints: [
          'Sử dụng Message Queue (RabbitMQ / Apache Kafka) để buffer các yêu cầu đặt vé, tránh quá tải trực tiếp vào Database.',
          'Ứng dụng Caching Redis với Distributed Lock (Redlock) hoặc Redis Lua Script để kiểm tra và trừ tồn kho (DECR) mang tính nguyên tử (Atomic Operation).',
          'Database Sharding & Read/Write Replicas: Ghi vào Master theo phân mảnh, chỉ đọc từ Slave.',
          'Áp dụng cơ chế Rate Limiting tại API Gateway (Token Bucket / Leaky Bucket) và hàng đợi ảo (Virtual Waiting Room).',
        ],
        redFlags: [
          'Chỉ sử dụng mô hình CRUD cơ bản trực tiếp xuống Database mà không có tầng Caching hay Message Queue.',
          'Không nhận thức được hiện tượng Race Condition khi hàng nghìn tiến trình cùng đọc `inventory > 0` và trừ tồn kho đồng thời.',
          'Đề xuất dùng Table Lock hoặc Row Lock mức Database truyền thống cho 100k req/s (sẽ gây tắc nghẽn Connection Pool và crash DB ngay lập tức).',
        ],
      },
      {
        id: 'be_q2',
        criterion: 'Tối Ưu Hiệu Năng ORM',
        criterionBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        level: 'Senior',
        question:
          'Làm sao để giải quyết triệt để tình trạng N+1 Query trong ORM (như SQLAlchemy / Tortoise ORM)? Bạn đã từng áp dụng kỹ thuật nào trong môi trường production?',
        hints: [
          'Sử dụng Eager Loading: Trong SQLAlchemy dùng `joinedload` (khi quan hệ 1-1, Many-to-1) hoặc `selectinload` (khi quan hệ 1-Many để tránh Cartesian Product lớn).',
          'Batch Loading / Subquery Loading để gom nhóm các khóa ngoại cần query thay vì phát sinh lệnh SELECT lặp trong vòng lặp.',
          'Sử dụng công cụ Profiling / Logging SQL: Tích hợp SQLTap, Silk, hoặc ghi log câu lệnh SQL chạy trong môi trường test/staging.',
          'Chuyển đổi sang Raw SQL với Index tối ưu hoặc Database View khi truy vấn báo cáo quá phức tạp mà ORM sinh query không tối ưu.',
        ],
        redFlags: [
          'Không định nghĩa được vấn đề N+1 Query là gì (chỉ biết query lấy dữ liệu theo vòng for thông thường).',
          'Khuyên dùng vòng lặp `for item in items: query_detail(item.id)` rồi gom mảng ở tầng ứng dụng.',
          'Nghĩ rằng việc bật Caching ở tầng controller là giải pháp thay thế cho việc tối ưu câu lệnh N+1.',
        ],
      },
      {
        id: 'be_q3',
        criterion: 'Concurrency & Core Python',
        criterionBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        level: 'Senior',
        question:
          'Phân biệt Multi-threading, Multi-processing và Asyncio trong Python 3. Khi nào việc sử dụng Async/Await trong FastAPI lại gây phản tác dụng và nghẽn toàn bộ luồng xử lý?',
        hints: [
          'Asyncio là Single-threaded Cooperative Multitasking dựa trên Event Loop, lý tưởng cho I/O-bound tasks (gọi API ngoài, đọc ghi network DB không đồng bộ).',
          'Multi-threading trong CPython bị khóa bởi GIL (Global Interpreter Lock), không thực sự chạy song song đa nhân cho CPU-bound.',
          'Multi-processing tạo ra các tiến trình OS độc lập với memory riêng biệt, phù hợp nhất cho tính toán nặng (CPU-bound, xử lý ảnh/ML).',
          'Phản tác dụng của Async: Nếu chạy code CPU-bound tính toán lâu hoặc vô tình gọi thư viện đồng bộ (như `time.sleep()`, `requests.get()`, `psycopg2` đồng bộ) trong async route, nó sẽ block hoàn toàn Event Loop, khiến tất cả người dùng khác bị treo.',
        ],
        redFlags: [
          'Nhầm lẫn Asyncio là chạy đa luồng phần cứng song song tận dụng hết tất cả CPU cores.',
          'Không hiểu cơ chế GIL ảnh hưởng thế nào đến Python Threads.',
          'Không biết cách giải quyết khi có CPU-bound trong FastAPI (phải đẩy sang `ThreadPoolExecutor`, `ProcessPoolExecutor` hoặc Celery background worker).',
        ],
      },
      {
        id: 'be_q4',
        criterion: 'Cơ Sở Dữ Liệu & ACID',
        criterionBadgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        level: 'Principal',
        question:
          'Trong PostgreSQL, giải thích sự khác biệt giữa các cấp độ cô lập giao dịch (Transaction Isolation Levels). Mức độ nào ngăn chặn được hiện tượng Write Skew trong hệ thống tài chính?',
        hints: [
          '4 cấp độ: Read Uncommitted, Read Committed (mặc định của Postgres), Repeatable Read, và Serializable.',
          'Write Skew xảy ra khi hai giao dịch đọc cùng một tập dữ liệu thỏa mãn điều kiện ràng buộc, sau đó ghi các dữ liệu khác nhau làm vi phạm ràng buộc chung (Repeatable Read không thể ngăn chặn Write Skew).',
          'Serializable sử dụng SSI (Serializable Snapshot Isolation) để phát hiện chu kỳ phụ thuộc và tự động rollback một trong hai giao dịch với lỗi serialization failure, bảo vệ toàn vẹn tài chính.',
          'Giải pháp thực tế: Sử dụng `SELECT FOR UPDATE` để áp đặt khóa bi quan (Pessimistic Lock) hoặc nâng cấp lên giao dịch Serializable kèm cơ chế Retry tự động.',
        ],
        redFlags: [
          'Nghĩ rằng Repeatable Read đã ngăn ngừa được mọi lỗi giao dịch đồng thời bao gồm cả Write Skew.',
          'Không biết cơ chế Retry khi transaction gặp lỗi Serialization Failure trong mức Serializable.',
        ],
      },
    ],
  },

  // =========================================================================
  // CHỨC DANH 2: Frontend Lead (React/Next.js)
  // =========================================================================
  {
    id: 'frontend_lead',
    roleTitle: 'Frontend Lead (React/Next.js)',
    department: 'Ban Công Nghệ Thông Tin',
    category: 'Kỹ Thuật',
    icon: Layers,
    description:
      'Đánh giá tư duy kiến trúc Next.js App Router, quản trị State quy mô lớn, tối ưu hóa chỉ số Core Web Vitals và kỹ năng lãnh đạo đội ngũ kỹ thuật giao diện.',
    questions: [
      {
        id: 'fe_q1',
        criterion: 'Architecture & Rendering Strategies',
        criterionBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        level: 'Lead',
        question:
          'Khi nào nên dùng Server-Side Rendering (SSR), Static Site Generation (SSG), Incremental Static Regeneration (ISR) và Client-Side Rendering (CSR) trong Next.js App Router?',
        hints: [
          'SSG: Dùng cho các trang tĩnh, dữ liệu ít thay đổi, yêu cầu SEO tối đa và tốc độ CDN tức thì (Trang chủ, Giới thiệu, Blog, FAQ).',
          'ISR: Dùng cho các trang có hàng ngàn sản phẩm / bài viết, cho phép tạo trang tĩnh theo yêu cầu và revalidate ngầm theo thời gian (`revalidate: 60`).',
          'SSR / Dynamic RSC: Dùng cho các trang thay đổi liên tục theo thời gian thực hoặc phụ thuộc vào thông tin nhạy cảm của người dùng (Cookie/Auth) mà vẫn cần SEO hoặc OpenGraph dynamic.',
          'CSR: Dùng cho các bảng điều khiển Admin nội bộ (Back-office, Dashboard), trang tương tác canvas phức tạp mà không có nhu cầu SEO.',
        ],
        redFlags: [
          'Lạm dụng CSR cho toàn bộ trang web công cộng, bỏ qua hoàn toàn lợi ích SEO và chỉ số First Contentful Paint.',
          'Bật SSR cho mọi màn hình mà không xem xét tải máy chủ (Server Load) và chỉ số TTFB (Time to First Byte).',
          'Không hiểu sự khác biệt cơ bản giữa React Server Components (RSC) và SSR truyền thống trong Next.js.',
        ],
      },
      {
        id: 'fe_q2',
        criterion: 'State Management & Scalability',
        criterionBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        level: 'Lead',
        question:
          'Cách bạn quản lý State toàn cục cho một ứng dụng SaaS lớn với hàng trăm màn hình mà không làm suy giảm hiệu năng render của React?',
        hints: [
          'Áp dụng nguyên tắc Phân tầng State (State Separation): Tách biệt rõ ràng Server State (dùng TanStack Query / SWR / RSC cache) và Client UI State.',
          'Sử dụng Atomic State hoặc Lightweight Store như Zustand / Jotai thay cho Redux monolithic nếu không cần quá nhiều boilerplate.',
          'Áp dụng State Co-location: Giữ state gần component sử dụng nhất có thể, tránh nhấc bổng state (Lifting state up) vô tội vạ lên Root Provider.',
          'Ngăn ngừa re-render không mong muốn: Sử dụng Selector granular (`useStore(state => state.specificField)`), `React.memo`, và Context splitting.',
        ],
        redFlags: [
          'Đưa toàn bộ dữ liệu gọi API vào một Global Redux/Context duy nhất, làm mỗi lần có cập nhật nhỏ là re-render toàn bộ cây component con.',
          'Không phân biệt được Client State và Server Cache State, tự viết boilerplate lưu trữ danh sách API vào redux reducers cồng kềnh.',
        ],
      },
      {
        id: 'fe_q3',
        criterion: 'Core Web Vitals & Performance',
        criterionBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        level: 'Senior',
        question:
          'Các kỹ thuật cụ thể bạn đã sử dụng để tối ưu hóa bộ chỉ số Core Web Vitals (LCP, CLS, INP)? Bạn chẩn đoán lỗi hiệu năng bằng công cụ nào?',
        hints: [
          'LCP (Largest Contentful Paint < 2.5s): Sử dụng Priority Hints (`fetchpriority="high"`), tối ưu định dạng ảnh AVIF/WebP, preload hero resources, loại bỏ render-blocking CSS/JS.',
          'CLS (Cumulative Layout Shift < 0.1): Đặt kích thước chiều rộng/cao (`width`, `height`, `aspect-ratio`) cố định cho ảnh/video/banner quảng cáo; dùng font-display optional để tránh FOIT/FOUT.',
          'INP (Interaction to Next Paint < 200ms): Chia nhỏ các tác vụ nặng (Long Tasks > 50ms) bằng `scheduler.yield()` hoặc `requestIdleCallback()`; tối ưu hóa event handler và debounce/throttle input.',
          'Công cụ chẩn đoán: Chrome DevTools Performance Panel, Lighthouse, Web Vitals Extension, CrUX Dashboard.',
        ],
        redFlags: [
          'Trả lời chung chung "tôi minify code và nén ảnh" mà không chỉ rõ chỉ số nào giải quyết cho LCP, CLS hay INP.',
          'Không biết đến sự thay đổi thay thế FID bằng chỉ số INP từ tháng 3/2024.',
          'Không biết cách dùng Performance Profiler để trace call stack của Long Tasks.',
        ],
      },
      {
        id: 'fe_q4',
        criterion: 'Leadership & Design System',
        criterionBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        level: 'Lead',
        question:
          'Làm thế nào để xây dựng và duy trì một Design System đồng nhất khi quy mô đội ngũ frontend tăng từ 3 lên 15 kỹ sư phân bổ ở nhiều tính năng khác nhau?',
        hints: [
          'Xây dựng Component Library độc lập (dùng Storybook, Tailwind/Radix UI hoặc headless primitives).',
          'Thiết lập Design Tokens (màu sắc, typography, spacing, border-radius) đồng bộ trực tiếp từ file Figma qua Token Studio.',
          'Quy trình CI/CD tự động: Chạy Visual Regression Testing (Chromatic / Playwright), Linting (ESLint, Prettier), kiểm tra Accessibility (a11y).',
          'Cơ chế Governance: Bổ sung RFC (Request for Comments) cho các component dùng chung mới và luân phiên Core UI Reviewer.',
        ],
        redFlags: [
          'Cho phép mỗi lập trình viên tự viết CSS riêng lẻ hoặc copy-paste code giữa các module mà không tái sử dụng component.',
          'Không có cơ chế tự động hóa kiểm thử giao diện dẫn đến vỡ UI diện rộng khi nâng cấp component chung.',
        ],
      },
    ],
  },

  // =========================================================================
  // CHỨC DANH 3: Data Analyst (Senior)
  // =========================================================================
  {
    id: 'data_analyst',
    roleTitle: 'Data Analyst (Senior)',
    department: 'Khối Phân Tích Dữ Liệu',
    category: 'Dữ Liệu',
    icon: LineChart,
    description:
      'Đánh giá kỹ năng viết truy vấn SQL phức tạp, trực quan hóa dữ liệu, tư duy phản biện kinh doanh (Business Acumen) và kể chuyện qua số liệu (Data Storytelling).',
    questions: [
      {
        id: 'da_q1',
        criterion: 'SQL Nâng Cao & Window Functions',
        criterionBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        level: 'Senior',
        question:
          'Giải thích cách hoạt động của Window Functions (ROW_NUMBER, RANK, DENSE_RANK). Bạn hãy viết câu lệnh SQL để tìm Top 3 sản phẩm có doanh thu cao nhất của mỗi tháng trong năm 2026?',
        hints: [
          'Phân biệt: `ROW_NUMBER()` luôn đánh số thứ tự liên tục 1, 2, 3... dù giá trị bằng nhau; `RANK()` nhảy cóc số thứ tự nếu có giá trị hòa (1, 2, 2, 4); `DENSE_RANK()` không nhảy cóc số thứ tự (1, 2, 2, 3).',
          'Cú pháp: Dùng CTE (Common Table Expression) kết hợp `OVER (PARTITION BY month ORDER BY revenue DESC)` tạo cột thứ hạng `rn`.',
          'Sau đó truy vấn từ CTE với điều kiện lọc `WHERE rn <= 3`.',
        ],
        redFlags: [
          'Không phân biệt được sự khác nhau giữa `RANK()` và `DENSE_RANK()`.',
          'Cố gắng dùng mệnh đề `WHERE` trực tiếp trên cùng câu lệnh SELECT chứa Window Function (vi phạm thứ tự thực thi câu lệnh SQL do Window Function tính toán sau mệnh đề WHERE/HAVING).',
          'Đề xuất dùng subquery GROUP BY lồng nhiều lớp phức tạp không cần thiết.',
        ],
      },
      {
        id: 'da_q2',
        criterion: 'Data Storytelling & Root Cause Analysis',
        criterionBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        level: 'Senior',
        question:
          'Khi dashboard báo cáo doanh thu tuần vừa qua đột ngột giảm 15% so với cùng kỳ, bạn sẽ tiến hành điều tra dữ liệu theo các bước nào để báo cáo nguyên nhân cho Ban Giám Đốc?',
        hints: [
          'Bước 1 - Data Integrity Check: Kiểm tra đường ống dữ liệu (ETL pipeline), đảm bảo số liệu không bị mất mát do lỗi tracking hay sync chậm.',
          'Bước 2 - Deconstruction (Phân rã chỉ số): Doanh thu = Lượng truy cập (Traffic) × Tỷ lệ chuyển đổi (CR) × Giá trị đơn trung bình (AOV). Xem chỉ số thành phần nào sụt giảm chính.',
          'Bước 3 - Phân khúc sâu (Drill-down Segmentation): Cắt lát theo kênh marketing (Organic vs Paid), nhóm sản phẩm, khu vực địa lý, nền tảng thiết bị (iOS vs Android/Web).',
          'Bước 4 - Bối cảnh ngoại cảnh (External Factors): Khuyến mãi đối thủ, kỳ nghỉ lễ, thay đổi thuật toán Google/Facebook hoặc sự cố cổng thanh toán.',
          'Bước 5 - Hành động cụ thể: Đưa ra kết luận ngắn gọn (1 slide Executive Summary) kèm phương án hành động khuyến nghị, không chỉ trình bày số thô.',
        ],
        redFlags: [
          'Chỉ xuất ra một bảng dữ liệu Excel gồm nhiều cột số liệu mà không có câu trả lời "Tại sao" (Why) và "Làm gì tiếp theo" (So What).',
          'Vội vàng kết luận do một nguyên nhân duy nhất theo cảm tính mà không đối chiếu chéo nhiều chiều dữ liệu.',
          'Không kiểm tra tính toàn vẹn của dữ liệu trước khi báo cáo lên cấp lãnh đạo.',
        ],
      },
      {
        id: 'da_q3',
        criterion: 'Data Modeling & Warehousing',
        criterionBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        level: 'Senior',
        question:
          'Phân biệt Star Schema và Snowflake Schema trong Data Warehouse. Trong trường hợp xây dựng Data Mart phục vụ phân tích bán hàng đa chiều, bạn ưu tiên chọn mô hình nào?',
        hints: [
          'Star Schema: Bảng Fact ở trung tâm nối trực tiếp với các bảng Dimension chuẩn hóa bậc 1 (Denormalized). Ưu điểm: Tối ưu tốc độ query BI, ít lệnh JOIN, dễ hiểu cho người dùng kinh doanh.',
          'Snowflake Schema: Các bảng Dimension tiếp tục được chuẩn hóa bậc 3 (Normalized) thành nhiều bảng con. Ưu điểm: Tiết kiệm dung lượng lưu trữ, tránh dư thừa dữ liệu; nhược điểm: Nhiều JOIN, query chậm hơn.',
          'Trong phân tích hiện đại (với BigQuery, Snowflake, ClickHouse), ưu tiên Star Schema vì dung lượng lưu trữ rẻ hơn chi phí compute khi thực hiện nhiều phép JOIN phức tạp.',
        ],
        redFlags: [
          'Không phân biệt được khái niệm Bảng Fact (chứa độ đo Metric) và Bảng Dimension (chứa thuộc tính phân loại Context).',
          'Nghĩ rằng chuẩn hóa 3NF là tối ưu cho việc truy vấn phân tích (Analytical Queries).',
        ],
      },
      {
        id: 'da_q4',
        criterion: 'A/B Testing & Thống Kê',
        criterionBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        level: 'Lead',
        question:
          'Làm thế nào để xác định cỡ mẫu (Sample Size) và độ tin cậy thống kê cho một thử nghiệm A/B Testing? Bạn tránh hiện tượng P-Hacking hoặc Peeking Problem như thế nào?',
        hints: [
          'Xác định dựa trên: Mức ý nghĩa thống kê (Statistical Significance α thông thường 5%), Độ mạnh kiểm định (Statistical Power 1 - β thông thường 80%), Tỷ lệ chuyển đổi gốc (Baseline Conversion Rate) và MDE (Minimum Detectable Effect).',
          'Tránh Peeking Problem: Không được liên tục kiểm tra p-value hàng ngày rồi dừng thử nghiệm ngay khi đạt p < 0.05 (sẽ làm tăng tỷ lệ False Positive vọt lên > 30%).',
          'Giải pháp: Chạy đủ thời gian tính toán trước (Fixed horizon) hoặc dùng kiểm định Sequential Testing (như phương pháp Always Valid P-values).',
        ],
        redFlags: [
          'Dừng thử nghiệm sớm ngay khi thấy kết quả có vẻ khả quan mà không chạy đủ chu kỳ tuần (bỏ qua tính chu kỳ ngày trong tuần Day-of-week effect).',
          'Không giải thích được ý nghĩa thực sự của p-value (nghĩ rằng p < 0.05 có nghĩa là tính năng chắc chắn thành công 95%).',
        ],
      },
    ],
  },

  // =========================================================================
  // CHỨC DANH 4: Product Owner / Product Manager
  // =========================================================================
  {
    id: 'product_owner',
    roleTitle: 'Product Owner / Product Manager',
    department: 'Khối Sản Phẩm & Dự Án',
    category: 'Sản Phẩm',
    icon: Compass,
    description:
      'Đánh giá khả năng ưu tiên hóa tính năng (Prioritization), phương pháp Agile/Scrum, tư duy hướng dữ liệu (Data-driven) và kỹ năng quản lý kỳ vọng các bên liên quan (Stakeholder Management).',
    questions: [
      {
        id: 'po_q1',
        criterion: 'Ưu Tiên Tính Năng (Prioritization)',
        criterionBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        level: 'Senior',
        question:
          'Khi cả Giám đốc Kinh doanh (yêu cầu tính năng bán hàng mới) và Giám đốc Kỹ thuật (yêu cầu tái cấu trúc hệ thống và trả nợ kỹ thuật) đều ép bạn ưu tiên trước, bạn sẽ giải quyết xung đột này như thế nào?',
        hints: [
          'Sử dụng các khung đánh giá lượng hóa khách quan: RICE Framework (Reach, Impact, Confidence, Effort) hoặc WSJF (Weighted Shortest Job First).',
          'Gắn kết với Mục tiêu chiến lược cốt lõi (OKRs) của công ty trong quý hiện tại.',
          'Phân bổ ngân sách Sprint theo tỷ lệ cân bằng (VD: 60% Tính năng kinh doanh mới, 25% Tech Debt & Tối ưu hạ tầng, 15% Bugs & Hỗ trợ vận hành).',
          'Tổ chức buổi làm việc minh bạch (Alignment Meeting) đưa số liệu chứng minh: Nếu không giải quyết Tech Debt thì tính năng kinh doanh mới sẽ đối mặt nguy cơ downtime và sụt giảm chuyển đổi.',
        ],
        redFlags: [
          'Làm theo cảm tính hoặc luôn nghiêng về người có chức vụ quyền lực cao hơn (HiPPO effect - Highest Paid Person\'s Opinion).',
          'Hứa hẹn thực hiện cả hai việc cùng lúc bằng cách ép đội ngũ kỹ sư OT quá tải không bền vững.',
          'Không có số liệu chứng minh, biến cuộc thảo luận thành mâu thuẫn đối đầu cá nhân giữa các phòng ban.',
        ],
      },
      {
        id: 'po_q2',
        criterion: 'Đo Lường Hiệu Quả Agile/Scrum',
        criterionBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        level: 'Senior',
        question:
          'Làm thế nào để đo lường thành công của một Sprint? Bạn có coi Velocity (Story Points hoàn thành) là thước đo năng suất của đội ngũ không?',
        hints: [
          'Thước đo hàng đầu là Tỷ lệ đạt được Mục tiêu Sprint (Sprint Goal Achievement) và Giá trị bàn giao thực tế cho người dùng (Delivered Value).',
          'Theo dõi các chỉ số chất lượng: Tỷ lệ lỗi phát sinh sau release (Defect Leakage), Cycle Time và Lead Time.',
          'Velocity chỉ là công cụ lập kế hoạch nội bộ (Capacity Planning Tool) để team ước lượng khối lượng công việc, KHÔNG PHẢI là KPI năng suất hay thước đo để so sánh giữa các team.',
          'Nếu dùng Story Points làm KPI, đội ngũ sẽ tự động "thổi phồng" điểm (Story Point Inflation) mà không gia tăng giá trị kinh doanh thực tế.',
        ],
        redFlags: [
          'Coi Story Points là KPI cá nhân và so sánh ai làm được nhiều điểm hơn để đánh giá thưởng phạt.',
          'Chỉ quan tâm hoàn thành task trên Jira mà không cần biết Sprint Goal có mang lại giá trị cho người dùng cuối hay không.',
        ],
      },
      {
        id: 'po_q3',
        criterion: 'Product Discovery & Validation',
        criterionBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        level: 'Senior',
        question:
          'Quy trình bạn kiểm chứng một giả định tính năng mới (Product Assumption) trước khi đưa vào phát triển để tránh lãng phí nguồn lực kỹ thuật là gì?',
        hints: [
          'Xác định rõ ràng Giả định rủi ro nhất (Riskiest Assumption): Rủi ro về Giá trị (Value), Khả năng sử dụng (Usability), Tính khả thi kỹ thuật (Feasibility) và Khả năng vận hành kinh doanh (Viability).',
          'Ứng dụng phương pháp Lean Validation: Phỏng vấn người dùng mục tiêu (User Interviews), khảo sát định lượng, hoặc thử nghiệm Smoke Test / Fake Door Test (nút bấm giả có đo lường tỷ lệ quan tâm).',
          'Tạo Prototype tương tác nhanh trên Figma để kiểm tra Usability Testing trước khi viết dòng code đầu tiên.',
        ],
        redFlags: [
          'Viết ngay tài liệu SRS/User Stories chi tiết và yêu cầu Dev làm ngay chỉ dựa trên một ý tưởng chợt nảy sinh của bản thân hoặc sếp.',
          'Cho rằng việc hỏi bạn bè, đồng nghiệp trong công ty là đủ để kiểm chứng nhu cầu thị trường bên ngoài.',
        ],
      },
      {
        id: 'po_q4',
        criterion: 'Quản Lý Kỳ Vọng (Stakeholder Management)',
        criterionBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        level: 'Lead',
        question:
          'Khi phát hiện một tính năng quan trọng phục vụ chiến dịch Marketing lớn sẽ bị trễ hạn 2 tuần so với cam kết ban đầu, bạn sẽ truyền thông và xử lý thế nào?',
        hints: [
          'Nguyên tắc "No Surprises": Thông báo sớm nhất có thể ngay khi phát hiện nguy cơ, không bao giờ chờ đến ngày deadline mới thông báo.',
          'Trình bày rõ ràng: Nguyên nhân gốc rễ (Root Cause), Tác động dự kiến, và quan trọng nhất là các phương án lựa chọn (Options):',
          'Phương án A: Cắt giảm phạm vi (Descope), chỉ phát hành MVP phần cốt lõi đúng hạn để Marketing không bị gián đoạn chiến dịch.',
          'Phương án B: Dời ngày phát hành toàn bộ nhưng có lộ trình bù đắp tài nguyên cụ thể.',
          'Tổ chức họp thảo luận giải pháp trên tinh thần hợp tác cùng giải quyết, không đổ lỗi cho đội ngũ kỹ thuật.',
        ],
        redFlags: [
          'Giấu giếm thông tin với hy vọng đội ngũ sẽ cố "chạy nước rút" kịp, rồi sát giờ mới thông báo vỡ trận.',
          'Đổ lỗi hoàn toàn cho sự yếu kém của Developer hoặc QA trước mặt Ban Giám Đốc và Marketing.',
        ],
      },
    ],
  },
];

export default function InterviewerQuestionsBankPage() {
  // State: Chức danh đang được chọn
  const [selectedRoleId, setSelectedRoleId] = useState<string>('backend_senior');

  // State: Ô tìm kiếm câu hỏi
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State: Bộ lọc tiêu chí trong chức danh
  const [selectedCriterion, setSelectedCriterion] = useState<string>('all');

  // State: Thông báo copy
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chức danh hiện tại
  const currentRole = useMemo(() => {
    return (
      questionBankData.find((role) => role.id === selectedRoleId) ||
      questionBankData[0]
    );
  }, [selectedRoleId]);

  // Danh sách các tiêu chí của chức danh hiện tại
  const roleCriteriaList = useMemo(() => {
    const list = Array.from(new Set(currentRole.questions.map((q) => q.criterion)));
    return ['all', ...list];
  }, [currentRole]);

  // Bộ câu hỏi sau khi lọc qua Search và Criterion
  const filteredQuestions = useMemo(() => {
    let result = currentRole.questions;

    // Lọc theo tiêu chí
    if (selectedCriterion !== 'all') {
      result = result.filter((q) => q.criterion === selectedCriterion);
    }

    // Lọc theo Search Query
    if (searchQuery.trim() !== '') {
      const qLower = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.question.toLowerCase().includes(qLower) ||
          q.criterion.toLowerCase().includes(qLower) ||
          q.hints.some((h) => h.toLowerCase().includes(qLower)) ||
          q.redFlags.some((rf) => rf.toLowerCase().includes(qLower))
      );
    }

    return result;
  }, [currentRole, selectedCriterion, searchQuery]);

  // Tổng số câu hỏi trong toàn bộ ngân hàng
  const totalQuestionsAllRoles = useMemo(() => {
    return questionBankData.reduce((acc, r) => acc + r.questions.length, 0);
  }, []);

  // Xử lý sao chép câu hỏi
  const handleCopyQuestion = (q: QuestionItem) => {
    const textToCopy = `[CÂU HỎI PHỎNG VẤN - ${q.criterion}]\n${q.question}\n\n💡 Gợi ý trả lời:\n${q.hints
      .map((h) => `- ${h}`)
      .join('\n')}\n\n🚩 Dấu hiệu đánh trượt (Red flags):\n${q.redFlags
      .map((rf) => `- ${rf}`)
      .join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(q.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HEADER TRANG: TIÊU ĐỀ & Ô TÌM KIẾM CÂU HỎI THÔNG MINH */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Ngân Hàng Câu Hỏi Gợi Ý
              </h1>
              <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {totalQuestionsAllRoles} Câu Hỏi Chuẩn Hóa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống câu hỏi phỏng vấn phân loại theo chức danh, kèm tiêu chí đánh giá xuất sắc và dấu hiệu đánh trượt (Red Flags)
            </p>
          </div>
        </div>

        {/* Ô Tìm Kiếm Nhanh (Search Input) */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ khóa câu hỏi, gợi ý, red flags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BỐ CỤC CHÍNH (SPLIT SCREEN: CỘT TRÁI 3 PHẦN - CỘT PHẢI 9 PHẦN) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* CỘT TRÁI (MENU CHỨC DANH - lg:col-span-4 hoặc 3): DANH SÁCH VỊ TRÍ */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Chọn Chức Danh Chuyên Môn
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">
                {questionBankData.length} vị trí
              </span>
            </div>

            {/* Danh sách các chức danh */}
            <div className="space-y-2">
              {questionBankData.map((role) => {
                const isSelected = role.id === selectedRoleId;
                const IconComponent = role.icon;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoleId(role.id);
                      setSelectedCriterion('all');
                    }}
                    className={clsx(
                      'w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group',
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 text-blue-900 shadow-sm ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      )}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={clsx(
                            'text-xs font-extrabold truncate block',
                            isSelected ? 'text-blue-900' : 'text-slate-800'
                          )}
                        >
                          {role.roleTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {role.department}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md',
                            isSelected
                              ? 'bg-blue-200/80 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {role.questions.length} câu hỏi
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {role.category}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mẹo ôn tập nhanh trước giờ G */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs mt-4">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Mẹo Phỏng Vấn Nhanh</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Nhấn nút <strong>"Sao chép"</strong> trên từng câu hỏi để dán nhanh vào khung chat hoặc mở đồng thời tab <strong>Chế Độ Phỏng Vấn Trực Tiếp</strong> khi đang call.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CỘT PHẢI (DANH SÁCH CÂU HỎI - lg:col-span-8): CARD CÂU HỎI CHI TIẾT */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-5">
          {/* Header Thông tin chức danh được chọn */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-extrabold border border-blue-200/60">
                    {currentRole.category}
                  </span>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    {currentRole.roleTitle}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {currentRole.description}
                </p>
              </div>

              {/* Nút link nhanh vào Live Call */}
              <Link
                href="/interviewer/schedule"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Video className="w-3.5 h-3.5 text-blue-600" />
                <span>Lịch Phỏng Vấn</span>
              </Link>
            </div>

            {/* Thanh Filter Pills theo Tiêu chí năng lực */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Lọc tiêu chí:
              </span>
              {roleCriteriaList.map((crit) => (
                <button
                  key={crit}
                  type="button"
                  onClick={() => setSelectedCriterion(crit)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    selectedCriterion === crit
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  )}
                >
                  {crit === 'all' ? 'Tất cả tiêu chí' : crit}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách các Cards câu hỏi */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">
                  Không tìm thấy câu hỏi phù hợp
                </h3>
                <p className="text-xs text-slate-400">
                  Vui lòng thử tìm với từ khóa khác hoặc bỏ chọn bộ lọc tiêu chí.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 space-y-4 hover:border-blue-300 transition-all duration-200"
                >
                  {/* Hàng Header Card: Tiêu chí, Cấp bậc, Nút Copy */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={clsx(
                          'px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border',
                          q.criterionBadgeClass
                        )}
                      >
                        {q.criterion}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        Cấp độ: {q.level}
                      </span>
                    </div>

                    {/* Nút Sao Chép Câu Hỏi */}
                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(q)}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                        copiedId === q.id
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                      )}
                      title="Sao chép câu hỏi và gợi ý"
                    >
                      {copiedId === q.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nội dung câu hỏi (Chữ to, in đậm) */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-relaxed">
                      <span className="text-blue-600 mr-1.5">Q{index + 1}.</span>
                      {q.question}
                    </h3>
                  </div>

                  {/* Hai Khối Màu: Gợi Ý Trả Lời Tốt (Xanh) vs Dấu Hiệu Đánh Trượt (Đỏ) */}
                  <div className="space-y-3 pt-1">
                    {/* KHỐI 1: 💡 GỢI Ý TRẢ LỜI TỐT (NỀN XANH NHẠT, CHỮ XANH LỤC) */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[11px] uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>💡 Gợi ý câu trả lời tốt (Tiêu chuẩn đạt điểm cao)</span>
                      </div>
                      <ul className="space-y-1.5 text-emerald-950 text-xs leading-relaxed pl-1">
                        {q.hints.map((hint, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold mt-0.5">•</span>
                            <span>{hint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* KHỐI 2: 🚩 DẤU HIỆU ĐÁNH TRƯỢT (RED FLAGS) (NỀN ĐỎ NHẠT, CHỮ ĐỎ) */}
                    <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-900 font-extrabold text-[11px] uppercase tracking-wider">
                        <Flag className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>🚩 Dấu hiệu đánh trượt (Red Flags cần cảnh giác)</span>
                      </div>
                      <ul className="space-y-1.5 text-rose-950 text-xs leading-relaxed pl-1">
                        {q.redFlags.map((rf, rfIdx) => (
                          <li key={rfIdx} className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold mt-0.5">✕</span>
                            <span>{rf}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
