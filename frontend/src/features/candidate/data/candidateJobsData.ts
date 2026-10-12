export interface CandidateJob {
  id: string;
  slug?: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  level: string;
  employmentType: string;
  headcount: number;
  deadline: string;
  postedDate: string;
  isHot?: boolean;
  isUrgent?: boolean;
  tags: string[];
  description: string[];
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  workplaceAddress: string;
  contactEmail: string;
}

export const CANDIDATE_JOBS: CandidateJob[] = [
  {
    id: 'JOB-2026-01',
    slug: 'senior-backend-engineer',
    title: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội',
    workplaceAddress: 'Tầng 18, Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    salary: '35 - 55 Triệu VNĐ',
    level: 'Senior',
    employmentType: 'Toàn thời gian (Hybrid 2 ngày WFH)',
    headcount: 3,
    deadline: '30/10/2026',
    postedDate: '01/10/2026',
    isHot: true,
    tags: ['Golang', 'Python', 'Microservices', 'PostgreSQL', 'Kafka'],
    contactEmail: 'talent@company.com',
    description: [
      'Phát triển và tối ưu hóa hệ thống microservices backend xử lý dữ liệu giao dịch và tuyển dụng nội bộ quy mô lớn.',
      'Thiết kế RESTful API và gRPC services với hiệu năng cao, độ trễ thấp và khả năng mở rộng hàng triệu requests/phút.',
      'Tham gia định hình kiến trúc phần mềm (Clean Architecture, DDD), tối ưu hóa cơ sở dữ liệu và xử lý caching phân tán.',
    ],
    responsibilities: [
      'Xây dựng các module cốt lõi cho hệ thống Enterprise ATS và cổng tuyển dụng ứng viên công khai.',
      'Tối ưu hóa các truy vấn SQL phức tạp, cấu hình hệ thống Message Queue (Kafka/RabbitMQ) cho các tác vụ nền.',
      'Viết Unit Test, Integration Test đảm bảo độ phủ mã nguồn > 80% trước khi triển khai staging/production.',
      'Phối hợp chặt chẽ với đội ngũ Frontend, Product Owner và QA trong quy trình Agile Scrum.',
    ],
    requirements: [
      'Tối thiểu 4+ năm kinh nghiệm làm việc chuyên sâu với Golang hoặc Python (FastAPI/Django).',
      'Thành thạo cơ sở dữ liệu quan hệ (PostgreSQL, MySQL) và NoSQL/Cache (Redis, MongoDB).',
      'Hiểu sâu về kiến trúc Microservices, Concurrency, Message Broker (Kafka hoặc RabbitMQ).',
      'Có kinh nghiệm thực hành với Docker, Kubernetes, CI/CD pipeline (GitHub Actions hoặc GitLab CI).',
      'Tư duy giải quyết vấn đề tốt, tinh thần trách nhiệm cao và khả năng làm việc nhóm hiệu quả.',
    ],
    benefits: [
      'Mức thu nhập hấp dẫn: 35 - 55 Triệu VNĐ cứng + Thưởng hiệu quả kinh doanh (lên đến 3-5 tháng lương/năm).',
      'Thưởng lương tháng 13 cam kết + Thưởng thâm niên và các dịp lễ, Tết.',
      'Bảo hiểm sức khỏe cao cấp PVI Care dành riêng cho nhân viên và gói ưu đãi cho người thân.',
      'Trang bị MacBook Pro M3 Max / M4 Pro thế hệ mới nhất ngay khi gia nhập.',
      'Chế độ làm việc linh hoạt: Hybrid 2 ngày Remote/tuần, thời gian làm việc từ thứ Hai đến thứ Sáu.',
      'Ngân sách đào tạo chứng chỉ quốc tế (AWS, CKA, Google Cloud) lên đến 25.000.000 VNĐ/năm.',
      'Teambuilding và du lịch nghỉ dưỡng 5 sao 2 lần/năm cùng toàn thể công ty.',
    ],
  },
  {
    id: 'JOB-2026-02',
    slug: 'frontend-react-lead',
    title: 'Frontend React Lead (Next.js & Design System)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hà Nội',
    workplaceAddress: 'Tầng 18, Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    salary: '40 - 60 Triệu VNĐ',
    level: 'Lead / Chuyên gia',
    employmentType: 'Toàn thời gian',
    headcount: 1,
    deadline: '31/10/2026',
    postedDate: '02/10/2026',
    isHot: true,
    tags: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Design System'],
    contactEmail: 'talent@company.com',
    description: [
      'Dẫn dắt kiến trúc Frontend cho toàn bộ hệ sinh thái sản phẩm Enterprise ATS, Employee Portal và Candidate Portal.',
      'Định hình chuẩn UI/UX, tối ưu hóa Core Web Vitals, xây dựng và quản trị Design System component thư viện dùng chung cho toàn tập đoàn.',
    ],
    responsibilities: [
      'Định hướng công nghệ Frontend, review code và đảm bảo chất lượng kỹ thuật của team gồm 6-8 kỹ sư Frontend.',
      'Phát triển các component React hiện đại, tuân thủ nghiêm ngặt tiêu chuẩn Accessibility (WCAG / a11y) và Responsive Design.',
      'Tối ưu hóa tốc độ tải trang (LCP, FID, CLS), cấu hình SSR/SSG/ISR với Next.js App Router.',
      'Hợp tác mật thiết với UI/UX Designers để hiện thực hóa các tương tác mượt mà, vi mô (micro-animations).',
    ],
    requirements: [
      '5+ năm kinh nghiệm lập trình Frontend, trong đó có ít nhất 2 năm vị trí Senior/Lead.',
      'Thành thạo React, Next.js (App Router), TypeScript, Tailwind CSS và State Management.',
      'Hiểu sâu về Web Performance, SSR, Hydration, Browser Rendering Pipeline và Web Vitals.',
      'Kỹ năng lãnh đạo, mentoring thành viên và giao tiếp kỹ thuật xuất sắc.',
    ],
    benefits: [
      'Thu nhập cạnh tranh: Lương cứng 40 - 60 Triệu VNĐ + Gói cổ phiếu thưởng ESOP đãi ngộ cho cấp Lead.',
      'Thưởng dự án hàng quý theo KPI và doanh thu sản phẩm.',
      'Bảo hiểm PVI Diamond toàn diện cho bản thân và gia đình.',
      'Cấp mới laptop Apple cao cấp tự chọn theo yêu cầu công việc.',
      '15 ngày phép năm + 3 ngày nghỉ ốm nguyên lương.',
    ],
  },
  {
    id: 'JOB-2026-03',
    slug: 'ai-ml-research-engineer',
    title: 'AI/ML Research Engineer (LLM & CV Matching)',
    department: 'Ban Công Nghệ AI & Dữ Liệu',
    location: 'Hà Nội',
    workplaceAddress: 'Tầng 25, Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội',
    salary: '45 - 70 Triệu VNĐ',
    level: 'Specialist / Senior',
    employmentType: 'Toàn thời gian (Linh hoạt)',
    headcount: 2,
    deadline: '15/11/2026',
    postedDate: '05/10/2026',
    isHot: true,
    tags: ['AI/ML', 'NLP', 'LLM', 'PyTorch', 'Vector Search'],
    contactEmail: 'ai-careers@company.com',
    description: [
      'Nghiên cứu và phát triển các mô hình xử lý ngôn ngữ tự nhiên (NLP) phục vụ việc phân tích hồ sơ CV ứng viên, trích xuất thực thể (NER), tự động tóm tắt và matching kỹ năng ứng viên với JD tuyển dụng.',
      'Xây dựng pipeline RAG (Retrieval-Augmented Generation) kết hợp Vector Database để tối ưu hóa tìm kiếm ứng viên thông minh.',
    ],
    responsibilities: [
      'Huấn luyện và tinh chỉnh (Fine-tuning) các mô hình ngôn ngữ lớn (LLM: Llama, Mistral, Qwen).',
      'Xây dựng các thuật toán tính điểm tương đồng (Semantic Matching, Cosine Similarity, Hybrid Search).',
      'Đóng gói model thành REST API/gRPC microservice với độ trễ phản hồi dưới 200ms.',
    ],
    requirements: [
      '3+ năm kinh nghiệm nghiên cứu hoặc phát triển giải pháp AI/ML ứng dụng thực tế.',
      'Thành thạo Python, PyTorch/TensorFlow, Hugging Face Transformers và Vector DB (Milvus, Qdrant, PGVector).',
      'Có tư duy toán học và xác suất thống kê vững chắc, hiểu sâu về kiến trúc Transformer.',
    ],
    benefits: [
      'Mức lương đột phá: 45 - 70 Triệu VNĐ + Thưởng công trình R&D.',
      'Hạ tầng GPU Cloud (NVIDIA H100 / A100) không giới hạn phục vụ huấn luyện mô hình.',
      'Môi trường nghiên cứu chuyên sâu, được tài trợ kinh phí tham gia hội nghị khoa học quốc tế.',
    ],
  },
  {
    id: 'JOB-2026-04',
    slug: 'product-manager-b2b',
    title: 'Product Manager (B2B SaaS / HR Tech)',
    department: 'Phòng Phát Triển Sản Phẩm',
    location: 'Hà Nội',
    workplaceAddress: 'Tầng 18, Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    salary: '35 - 50 Triệu VNĐ',
    level: 'Senior',
    employmentType: 'Toàn thời gian',
    headcount: 1,
    deadline: '20/11/2026',
    postedDate: '08/10/2026',
    isHot: false,
    tags: ['Product Management', 'B2B SaaS', 'HR Tech', 'Agile', 'User Research'],
    contactEmail: 'talent@company.com',
    description: [
      'Định hình Roadmap và chiến lược sản phẩm cho hệ sinh thái Tuyển Dụng Nội Bộ và Quản trị Nhân sự.',
      'Làm việc chặt chẽ với ban Giám đốc, các Hiring Manager và đội ngũ Kỹ thuật để biến Business Needs thành User Stories cụ thể.',
    ],
    responsibilities: [
      'Nghiên cứu thị trường HR Tech, phân tích đối thủ cạnh tranh và phỏng vấn người dùng thực tế.',
      'Quản lý Product Backlog, viết PRD chi tiết, lên wireframe và xác định tiêu chí nghiệm thu (Acceptance Criteria).',
      'Theo dõi các chỉ số đo lường hiệu quả sản phẩm (Adoption Rate, Time-to-Hire, NPS).',
    ],
    requirements: [
      '3+ năm kinh nghiệm làm Product Manager cho các giải pháp B2B SaaS hoặc HR/Enterprise Software.',
      'Kỹ năng phân tích dữ liệu, Data-driven decision making, thành thạo Jira, Figma, Mixpanel/GA4.',
      'Kỹ năng giao tiếp xuất sắc và khả năng điều phối liên phòng ban.',
    ],
    benefits: [
      'Lương 35 - 50 Triệu VNĐ + Thưởng KPI sản phẩm theo quý.',
      'Tham gia định hình định hướng sản phẩm cốt lõi của công ty.',
      'Đầy đủ chế độ bảo hiểm và phúc lợi cao cấp.',
    ],
  },
  {
    id: 'JOB-2026-05',
    slug: 'devops-sre-engineer',
    title: 'DevOps / Site Reliability Engineer (SRE)',
    department: 'Khối Vận Hành & Hạ Tầng',
    location: 'Hà Nội',
    workplaceAddress: 'Tầng 18, Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    salary: '30 - 48 Triệu VNĐ',
    level: 'Mid - Senior',
    employmentType: 'Toàn thời gian (Hybrid)',
    headcount: 2,
    deadline: '15/11/2026',
    postedDate: '10/10/2026',
    isHot: false,
    tags: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Prometheus'],
    contactEmail: 'talent@company.com',
    description: [
      'Vận hành và tối ưu hóa cụm Kubernetes trên AWS/GCP, đảm bảo độ sẵn sàng SLA 99.99% cho hệ thống.',
      'Xây dựng GitOps pipeline, tự động hóa hạ tầng bằng Terraform và giám sát toàn diện hệ thống.',
    ],
    responsibilities: [
      'Quản lý hệ thống container hóa với Docker và Kubernetes (EKS/GKE).',
      'Thiết lập hạ tầng mã nguồn (IaC) với Terraform, Ansible.',
      'Giám sát hệ thống với Prometheus, Grafana, ELK Stack và Datadog.',
    ],
    requirements: [
      '3+ năm kinh nghiệm làm việc với Cloud (AWS hoặc GCP) và cụm Kubernetes production.',
      'Thành thạo CI/CD pipelines (GitHub Actions, GitLab CI), scripting với Bash/Python.',
      'Có chứng chỉ AWS Solutions Architect hoặc CKA là một lợi thế lớn.',
    ],
    benefits: [
      'Thu nhập 30 - 48 Triệu VNĐ + Phụ cấp ca trực và thưởng on-call.',
      'Tài trợ 100% lệ phí thi chứng chỉ quốc tế Cloud & DevOps.',
      'Trang thiết bị làm việc hiện đại, môi trường trẻ trung.',
    ],
  },
  {
    id: 'JOB-2026-06',
    slug: 'ui-ux-product-designer',
    title: 'UI/UX Product Designer (Design System)',
    department: 'Phòng Thiết Kế Sản Phẩm',
    location: 'Hồ Chí Minh',
    workplaceAddress: 'Tầng 12, Tòa nhà Bitexco Financial Tower, Quận 1, TP. Hồ Chí Minh',
    salary: '25 - 40 Triệu VNĐ',
    level: 'Mid - Senior',
    employmentType: 'Toàn thời gian',
    headcount: 1,
    deadline: '10/11/2026',
    postedDate: '07/10/2026',
    isHot: false,
    tags: ['UI/UX', 'Figma', 'Design System', 'Prototyping', 'User Research'],
    contactEmail: 'talent@company.com',
    description: [
      'Thiết kế giao diện và trải nghiệm người dùng cho hệ sinh thái tuyển dụng nội bộ trên Web và Mobile.',
      'Xây dựng và chuẩn hóa thư viện Design System đồng bộ, nâng cao tính trực quan và khả năng sử dụng (Usability).',
    ],
    responsibilities: [
      'Thực hiện user research, phân tích hành vi người dùng và xây dựng wireframe, prototype tương tác cao trên Figma.',
      'Thiết kế giao diện đẹp mắt, hiện đại, tối ưu cho cả desktop và mobile thiết bị di động.',
      'Bàn giao specs chi tiết và phối hợp chặt chẽ với đội ngũ kỹ sư Frontend.',
    ],
    requirements: [
      '3+ năm kinh nghiệm thiết kế UI/UX cho ứng dụng Web / Mobile B2B SaaS.',
      'Thành thạo công cụ Figma, hiểu sâu về Design Tokens, Auto-layout và Component Architecture.',
      'Có portfolio dự án thực tế thể hiện tư duy thiết kế lấy người dùng làm trung tâm.',
    ],
    benefits: [
      'Thu nhập 25 - 40 Triệu VNĐ + Thưởng dự án.',
      'Cấp MacBook Pro M3 và màn hình đồ họa chuyên dụng.',
      'Làm việc tại văn phòng trung tâm Quận 1 năng động, view đẹp.',
    ],
  },
  {
    id: 'JOB-2026-07',
    slug: 'talent-acquisition-specialist',
    title: 'Talent Acquisition Specialist (Tech Recruiter)',
    department: 'Ban Nhân Sự Tập Đoàn',
    location: 'Hà Nội',
    workplaceAddress: 'Tầng 18, Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    salary: 'Thỏa thuận',
    level: 'Senior',
    employmentType: 'Toàn thời gian',
    headcount: 2,
    deadline: '25/11/2026',
    postedDate: '11/10/2026',
    isHot: false,
    tags: ['Recruitment', 'Tech Sourcing', 'Headhunting', 'Talent Pool'],
    contactEmail: 'hr@company.com',
    description: [
      'Tìm kiếm, kết nối và thu hút các nhân tài công nghệ cấp cao (Tech Lead, Senior Engineers, Data Scientists).',
      'Quản lý quy trình tuyển dụng từ vòng sàng lọc hồ sơ, phỏng vấn sơ bộ đến đàm phán Offer.',
    ],
    responsibilities: [
      'Chủ động sourcing ứng viên qua LinkedIn, GitHub, TopCV và mạng lưới nội bộ.',
      'Xây dựng Talent Pool bền vững và nâng cao trải nghiệm ứng viên (Candidate Experience).',
      'Phối hợp với Hiring Manager để nắm bắt chân dung ứng viên và tổ chức phỏng vấn chuyên nghiệp.',
    ],
    requirements: [
      '2+ năm kinh nghiệm tuyển dụng mảng IT/Software (in-house hoặc agency).',
      'Hiểu biết cơ bản về thuật ngữ công nghệ và thị trường lao động IT tại Việt Nam.',
      'Kỹ năng giao tiếp, thương lượng và xử lý tình huống khéo léo.',
    ],
    benefits: [
      'Lương cứng cạnh tranh (Thỏa thuận theo năng lực) + Thưởng hoa hồng tuyển dụng hấp dẫn không giới hạn.',
      'Bảo hiểm sức khỏe toàn diện và phụ cấp ăn trưa, gửi xe.',
      'Môi trường HR Tech tiên tiến, sử dụng các công cụ tuyển dụng AI hiện đại nhất.',
    ],
  },
  {
    id: 'JOB-2026-08',
    slug: 'data-analyst-bi',
    title: 'Data Analyst / Business Intelligence',
    department: 'Khối Phân Tích Dữ Liệu',
    location: 'Hồ Chí Minh',
    workplaceAddress: 'Tầng 12, Tòa nhà Bitexco Financial Tower, Quận 1, TP. Hồ Chí Minh',
    salary: '22 - 35 Triệu VNĐ',
    level: 'Mid',
    employmentType: 'Toàn thời gian',
    headcount: 1,
    deadline: '30/11/2026',
    postedDate: '12/10/2026',
    isHot: false,
    tags: ['SQL', 'Power BI', 'Tableau', 'Data Modeling', 'Business Insights'],
    contactEmail: 'talent@company.com',
    description: [
      'Phân tích số liệu vận hành tuyển dụng, hiệu suất nhân sự và cung cấp các báo cáo dữ liệu trực quan cho Ban Lãnh Đạo.',
      'Xây dựng các Dashboard tương tác thời gian thực trên Power BI / Tableau.',
    ],
    responsibilities: [
      'Viết các truy vấn SQL phân tích dữ liệu đa chiều từ Data Warehouse.',
      'Tạo và bảo trì hệ thống báo cáo BI phục vụ các phòng ban.',
      'Đưa ra các đề xuất cải tiến quy trình dựa trên bằng chứng dữ liệu (Data-driven).',
    ],
    requirements: [
      '2+ năm kinh nghiệm làm việc ở vị trí Data Analyst hoặc BI Developer.',
      'Thành thạo SQL và ít nhất một công cụ BI (Power BI, Tableau, Looker).',
      'Tư duy logic tốt, khả năng kể chuyện bằng dữ liệu (Data Storytelling).',
    ],
    benefits: [
      'Thu nhập 22 - 35 Triệu VNĐ + Thưởng hiệu quả kinh doanh.',
      'Cơ hội học tập và tiếp cận kho dữ liệu lớn của tập đoàn.',
      'Chế độ đãi ngộ đầy đủ, du lịch nghỉ dưỡng hàng năm.',
    ],
  },
];

export function getCandidateJobById(id: string): CandidateJob | undefined {
  const normalizedId = id.trim().toLowerCase();
  return CANDIDATE_JOBS.find(
    (job) =>
      job.id.toLowerCase() === normalizedId ||
      (job.slug && job.slug.toLowerCase() === normalizedId)
  );
}
