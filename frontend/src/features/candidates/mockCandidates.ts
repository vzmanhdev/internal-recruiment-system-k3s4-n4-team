export interface CandidateApplication {
  id: string;
  jobTitle: string;
  jobCode: string;
  department: string;
  appliedDate: string;
  stage: string;
  status: 'active' | 'rejected' | 'hired' | 'withdrawn';
  matchScore: number;
  recruiter: string;
  salaryProposed?: string;
  salaryExpected?: string;
  interviewerFeedback?: string;
  roundNotes?: string[];
}

export interface CandidateEvaluation {
  technicalSkill: number; // 1 - 5 stars
  softSkill: number;
  cultureFit: number;
  recommendationLevel: 'Strong Hire' | 'Hire' | 'Consider' | 'No Hire';
  summary: string;
}

export interface CandidateNote {
  id: string;
  author: string;
  role: string;
  createdAt: string;
  content: string;
}

export interface CandidateEmailLog {
  id: string;
  subject: string;
  templateType: 'offer' | 'interview' | 'rejection' | 'reminder';
  sentAt: string;
  sender: string;
  recipientEmail: string;
  status: 'sent' | 'read' | 'replied';
  readAt?: string;
  contentSnippet: string;
}

export interface UnifiedCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedInUrl: string;
  address: string;
  dob: string;
  avatar: string;
  latestPosition: string;
  latestStatus:
    | 'Đang phỏng vấn'
    | 'Đề xuất Offer'
    | 'Đã nhận việc'
    | 'Đã từ chối'
    | 'Lưu trữ tiềm năng';
  source:
    | 'LinkedIn Sourcing'
    | 'TopCV'
    | 'VietnamWorks'
    | 'Referral Nội Bộ'
    | 'Headhunter Agency'
    | 'Website Công Ty';
  expectedSalary: string;
  currentSalary?: string;
  salaryRange: 'under_20' | '20_35' | '35_50' | 'above_50';
  skills: string[];
  tags: string[];
  university: string;
  experienceYears: string;
  updatedAt: string;
  cvFileName: string;
  applications: CandidateApplication[];
  evaluation: CandidateEvaluation;
  notes: CandidateNote[];
  emailLogs?: CandidateEmailLog[];
}

export const MOCK_UNIFIED_CANDIDATES: UnifiedCandidate[] = [
  {
    id: 'CAN-085',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@gmail.com',
    phone: '0912 345 678',
    linkedInUrl: 'https://linkedin.com/in/an-nguyen-golang',
    address: 'Quận Cầu Giấy, Hà Nội',
    dob: '15/06/1996',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=160&auto=format&fit=crop',
    latestPosition: 'Senior Backend Engineer (Go/Python)',
    latestStatus: 'Đang phỏng vấn',
    source: 'LinkedIn Sourcing',
    expectedSalary: '45 - 55 Triệu VNĐ',
    currentSalary: '38 Triệu VNĐ',
    salaryRange: '35_50',
    skills: ['Golang', 'Python', 'PostgreSQL', 'Kafka', 'Kubernetes', 'Microservices'],
    tags: ['Senior Golang', 'Deal lương cao', 'Ưu tiên cao'],
    university: 'ĐH Bách Khoa TP.HCM (Kỹ sư Phần mềm)',
    experienceYears: '5 năm kinh nghiệm',
    updatedAt: '10/10/2026',
    cvFileName: 'CV_NguyenVanAn_Backend_Senior.pdf',
    applications: [
      {
        id: 'APP-2026-101',
        jobTitle: 'Senior Backend Engineer (Go/Python)',
        jobCode: 'JOB-2026-01',
        department: 'Khối Công Nghệ & Phần Mềm',
        appliedDate: '02/10/2026',
        stage: 'Phỏng vấn chuyên môn (Pass vòng 2)',
        status: 'active',
        matchScore: 96,
        recruiter: 'Trần Thị Recruiter',
        salaryProposed: '48.000.000 VNĐ',
        salaryExpected: '50.000.000 VNĐ',
        interviewerFeedback:
          'Kiến thức chuyên sâu về Golang concurency, channel và memory leak. Trả lời xuất sắc bài toán thiết kế hệ thống thanh toán phân tán chịu tải 50k RPS.',
        roundNotes: [
          'Vòng 1 (CV & Phone Screen): Đạt 9.0/10 điểm - Giao tiếp tiếng Anh tự tin.',
          'Vòng 2 (Technical System Design): Đạt 9.5/10 điểm - Thiết kế kiến trúc tối ưu.',
          'Dự kiến: Lên lịch phỏng vấn Văn hóa cùng Giám đốc Khối Công nghệ tuần tới.',
        ],
      },
      {
        id: 'APP-2025-045',
        jobTitle: 'Backend Engineer (Golang)',
        jobCode: 'JOB-2025-08',
        department: 'Khối Công Nghệ & Phần Mềm',
        appliedDate: '15/11/2025',
        stage: 'Đề xuất Offer (Ứng viên từ chối)',
        status: 'withdrawn',
        matchScore: 89,
        recruiter: 'Lê Minh Tuấn',
        salaryProposed: '32.000.000 VNĐ',
        salaryExpected: '38.000.000 VNĐ',
        interviewerFeedback:
          'Ứng viên đánh giá rất cao môi trường làm việc của công ty nhưng lúc đó chưa thống nhất được mức lương mong muốn (Công ty đề xuất 32M, ứng viên muốn 38M).',
        roundNotes: ['Giữ mối quan hệ tốt, hẹn liên hệ lại khi mở dải lương Senior cao hơn.'],
      },
      {
        id: 'APP-2024-012',
        jobTitle: 'Software Engineer (Java/Go)',
        jobCode: 'JOB-2024-03',
        department: 'Khối Sản Phẩm',
        appliedDate: '10/06/2024',
        stage: 'Sàng lọc hồ sơ (Pass)',
        status: 'withdrawn',
        matchScore: 82,
        recruiter: 'Nguyễn Thị Lan',
        interviewerFeedback: 'Ứng viên nhận được offer công ty khác trước khi tham gia phỏng vấn.',
      },
    ],
    evaluation: {
      technicalSkill: 5,
      softSkill: 4,
      cultureFit: 5,
      recommendationLevel: 'Strong Hire',
      summary:
        'Ứng viên tài năng, tư duy kiến trúc sạch, có tinh thần làm chủ công việc cao (Ownership). Rất phù hợp với văn hóa phát triển thần tốc của công ty.',
    },
    notes: [
      {
        id: 'note-1',
        author: 'Trần Thị Recruiter',
        role: 'Recruiter',
        createdAt: '10/10/2026 14:30',
        content: 'Đã gọi điện trao đổi lại mức lương mong muốn. Ứng viên sẵn sàng nhận việc vào đầu tháng 11 nếu mức Offer đạt 48M net.',
      },
      {
        id: 'note-2',
        author: 'Nguyễn Tiến Dũng',
        role: 'Hiring Manager',
        createdAt: '08/10/2026 16:45',
        content: 'Phỏng vấn kỹ thuật rất ưng ý. Kiến thức Kafka và Redis cluster cực kỳ vững. Đề xuất cấp gói thưởng chào mừng (Sign-on Bonus) 20M nếu cần.',
      },
    ],
    emailLogs: [
      {
        id: 'EML-2026-001',
        subject: '[Thư mời phỏng vấn] Lịch phỏng vấn Vòng 2 - Vị trí Senior Backend Engineer',
        templateType: 'interview',
        sentAt: '03/10/2026 09:30',
        sender: 'Trần Thị Recruiter (recruiter@company.com)',
        recipientEmail: 'an.nguyen@gmail.com',
        status: 'read',
        readAt: '03/10/2026 10:14',
        contentSnippet: 'Kính gửi anh An, Bộ phận Tuyển dụng trân trọng kính mời anh tham gia buổi phỏng vấn Vòng 2 trực tuyến cùng Engineering Director lúc 09:30 ngày 12/10/2026...',
      },
      {
        id: 'EML-2026-002',
        subject: '[Xác nhận hồ sơ] Cảm ơn bạn đã nộp hồ sơ ứng tuyển vị trí Senior Backend Engineer',
        templateType: 'reminder',
        sentAt: '02/10/2026 14:00',
        sender: 'Hệ thống Tuyển dụng Tự động (careers@company.com)',
        recipientEmail: 'an.nguyen@gmail.com',
        status: 'read',
        readAt: '02/10/2026 14:05',
        contentSnippet: 'Chào Nguyễn Văn An, Hệ thống đã tiếp nhận CV ứng tuyển của bạn cho vị trí Senior Backend Engineer (Go/Python). Bộ phận Tuyển dụng sẽ liên hệ trong vòng 3 ngày làm việc...',
      },
    ],
  },
  {
    id: 'CAN-077',
    name: 'Lê Hoàng Cường',
    email: 'cuong.lehoang@gmail.com',
    phone: '0908 765 432',
    linkedInUrl: 'https://linkedin.com/in/cuong-le-architect',
    address: 'Quận Nam Từ Liêm, Hà Nội',
    dob: '22/03/1995',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=160&auto=format&fit=crop',
    latestPosition: 'Senior Backend Engineer (Go/Python)',
    latestStatus: 'Đề xuất Offer',
    source: 'Headhunter Agency',
    expectedSalary: '52 - 60 Triệu VNĐ',
    currentSalary: '45 Triệu VNĐ',
    salaryRange: 'above_50',
    skills: ['Golang', 'Kubernetes', 'gRPC', 'Distributed Systems', 'AWS', 'Redis Cluster'],
    tags: ['Senior Golang', 'Ưu tiên cao', 'Tiếng Anh lưu loát'],
    university: 'Học Viện Công Nghệ Bưu Chính Viễn Thông (PTIT)',
    experienceYears: '6 năm kinh nghiệm',
    updatedAt: '11/10/2026',
    cvFileName: 'CV_LeHoangCuong_Principal_Arch.pdf',
    applications: [
      {
        id: 'APP-2026-092',
        jobTitle: 'Senior Backend Engineer (Go/Python)',
        jobCode: 'JOB-2026-01',
        department: 'Khối Công Nghệ & Phần Mềm',
        appliedDate: '25/09/2026',
        stage: 'Đề xuất Offer chính thức',
        status: 'active',
        matchScore: 98,
        recruiter: 'Trần Thị Recruiter',
        salaryProposed: '52.000.000 VNĐ',
        salaryExpected: '55.000.000 VNĐ',
        interviewerFeedback:
          'Kỹ sư kỳ cựu từng xây dựng core engine cho ứng dụng hàng triệu người dùng. Thể hiện năng lực lãnh đạo kỹ thuật và định hướng công nghệ xuất sắc.',
        roundNotes: [
          'Vòng Tech: 10/10 - Không có câu hỏi nào làm khó được.',
          'Vòng Ban Giám Đốc: Đã duyệt gói đãi ngộ đặc biệt bao gồm cổ phần ESOP.',
        ],
      },
      {
        id: 'APP-2025-018',
        jobTitle: 'Cloud Solutions Architect',
        jobCode: 'JOB-2025-14',
        department: 'Khối Vận Hành & Hạ Tầng',
        appliedDate: '12/08/2025',
        stage: 'Phỏng vấn vòng cuối (Pass)',
        status: 'withdrawn',
        matchScore: 93,
        recruiter: 'Trần Thị Recruiter',
        interviewerFeedback: 'Thời điểm đó dự án hạ tầng tạm hoãn, ứng viên chuyển sang làm Tech Lead tại đối tác.',
      },
    ],
    evaluation: {
      technicalSkill: 5,
      softSkill: 5,
      cultureFit: 5,
      recommendationLevel: 'Strong Hire',
      summary: 'Ứng viên cấp Principal/Lead cực hiếm trên thị trường. Cần bảo mật thông tin và chốt Offer nhanh chóng.',
    },
    notes: [
      {
        id: 'note-3',
        author: 'Trần Thị Recruiter',
        role: 'Recruiter',
        createdAt: '11/10/2026 09:15',
        content: 'Đã gửi dự thảo Thư mời nhận việc (Offer Letter). Ứng viên hẹn phản hồi chính thức trước 17:00 ngày mai.',
      },
    ],
    emailLogs: [
      {
        id: 'EML-2026-088',
        subject: '[Thư mời nhận việc chính thức] Chúc mừng bạn gia nhập Công ty với vị trí Senior Backend Engineer',
        templateType: 'offer',
        sentAt: '11/10/2026 09:15',
        sender: 'Trần Thị Recruiter (recruiter@company.com)',
        recipientEmail: 'cuong.lehoang@gmail.com',
        status: 'read',
        readAt: '11/10/2026 09:42',
        contentSnippet: 'Kính gửi anh Lê Hoàng Cường, Ban Giám đốc và Phòng Tuyển dụng trân trọng gửi Thư mời nhận việc chính thức (Offer Letter) cho vị trí Senior Backend Engineer...',
      },
      {
        id: 'EML-2026-074',
        subject: '[Thông báo kết quả phỏng vấn] Chúc mừng bạn đã hoàn thành xuất sắc vòng phỏng vấn Giám đốc',
        templateType: 'interview',
        sentAt: '08/10/2026 17:00',
        sender: 'Trần Thị Recruiter (recruiter@company.com)',
        recipientEmail: 'cuong.lehoang@gmail.com',
        status: 'replied',
        readAt: '08/10/2026 17:15',
        contentSnippet: 'Chào anh Cường, Hội đồng phỏng vấn đánh giá rất cao năng lực và tầm nhìn kỹ thuật của anh. Chúng tôi xin thông báo anh đã vượt qua vòng phỏng vấn Ban Giám Đốc...',
      },
    ],
  },
  {
    id: 'CAN-092',
    name: 'Trần Minh Quân',
    email: 'quan.tran@techcorp.vn',
    phone: '0987 111 222',
    linkedInUrl: 'https://linkedin.com/in/minhquan-fullstack',
    address: 'Quận Thanh Xuân, Hà Nội',
    dob: '18/09/1997',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=160&auto=format&fit=crop',
    latestPosition: 'Frontend React Lead',
    latestStatus: 'Đang phỏng vấn',
    source: 'Referral Nội Bộ',
    expectedSalary: '42 - 50 Triệu VNĐ',
    currentSalary: '35 Triệu VNĐ',
    salaryRange: '35_50',
    skills: ['React', 'Next.js', 'TypeScript', 'Design System', 'Web Vitals', 'Jest', 'Tailwind CSS'],
    tags: ['Giao tiếp tốt', 'Phù hợp văn hóa', 'Lead Frontend'],
    university: 'ĐH Khoa Học Tự Nhiên (ĐHQGHN)',
    experienceYears: '4 năm kinh nghiệm',
    updatedAt: '09/10/2026',
    cvFileName: 'CV_TranMinhQuan_FrontendLead.pdf',
    applications: [
      {
        id: 'APP-2026-105',
        jobTitle: 'Frontend React Lead',
        jobCode: 'JOB-2026-02',
        department: 'Khối Công Nghệ & Phần Mềm',
        appliedDate: '05/10/2026',
        stage: 'Phỏng vấn chuyên môn (Pass vòng 1)',
        status: 'active',
        matchScore: 89,
        recruiter: 'Trần Thị Recruiter',
        salaryProposed: '42.000.000 VNĐ',
        salaryExpected: '45.000.000 VNĐ',
        interviewerFeedback:
          'Hiểu rất sâu về React 19, Server Components, tối ưu LCP/INP và kiến trúc Atomic Design cho Design System.',
      },
      {
        id: 'APP-2024-033',
        jobTitle: 'Senior Frontend Developer',
        jobCode: 'JOB-2024-11',
        department: 'Khối Sản Phẩm',
        appliedDate: '15/04/2024',
        stage: 'Đã nhận việc (Hired)',
        status: 'hired',
        matchScore: 91,
        recruiter: 'Lê Minh Tuấn',
        interviewerFeedback: 'Từng làm việc tại công ty giai đoạn 2024 trước khi đi du học ngắn hạn. Hiệu suất làm việc luôn nằm trong top 5%.',
      },
    ],
    evaluation: {
      technicalSkill: 5,
      softSkill: 5,
      cultureFit: 5,
      recommendationLevel: 'Strong Hire',
      summary: 'Ứng viên cũ quay trở lại, hiểu sâu codebase và quy trình nội bộ. Sẽ hòa nhập ngay mà không mất thời gian onboarding.',
    },
    notes: [
      {
        id: 'note-4',
        author: 'Phạm Văn Tuấn',
        role: 'Tech Lead',
        createdAt: '08/10/2026 11:00',
        content: 'Quân từng làm việc cùng team mình năm ngoái. Kỹ năng và thái độ không có gì phải bàn, mong sớm hoàn tất thủ tục mời bạn về lại.',
      },
    ],
  },
  {
    id: 'CAN-088',
    name: 'Hoàng Kim Ngân',
    email: 'ngan.hoangkim@gmail.com',
    phone: '0933 888 999',
    linkedInUrl: 'https://linkedin.com/in/ngan-hoang-po',
    address: 'Quận Đống Đa, Hà Nội',
    dob: '05/11/1998',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=160&auto=format&fit=crop',
    latestPosition: 'Product Owner / BA Lead',
    latestStatus: 'Đang phỏng vấn',
    source: 'VietnamWorks',
    expectedSalary: '32 - 40 Triệu VNĐ',
    currentSalary: '28 Triệu VNĐ',
    salaryRange: '20_35',
    skills: ['Agile/Scrum', 'Product Roadmap', 'Jira', 'Data Analytics', 'Wireframing', 'User Stories'],
    tags: ['Giao tiếp tốt', 'Tiếng Anh lưu loát', 'Phù hợp văn hóa'],
    university: 'ĐH Ngoại Thương Hà Nội + Chứng chỉ CSPO',
    experienceYears: '4 năm kinh nghiệm',
    updatedAt: '07/10/2026',
    cvFileName: 'CV_HoangKimNgan_PO_Lead.pdf',
    applications: [
      {
        id: 'APP-2026-088',
        jobTitle: 'Product Owner / BA Lead',
        jobCode: 'JOB-2026-03',
        department: 'Phòng Phát Triển Sản Phẩm',
        appliedDate: '03/10/2026',
        stage: 'Phỏng vấn vòng 1 (Pass)',
        status: 'active',
        matchScore: 92,
        recruiter: 'Trần Thị Recruiter',
        salaryProposed: '35.000.000 VNĐ',
        salaryExpected: '36.000.000 VNĐ',
        interviewerFeedback: 'Khả năng phân tích yêu cầu nghiệp vụ logic, phong thái tự tin, thuyết trình tiếng Anh trôi chảy.',
      },
      {
        id: 'APP-2025-021',
        jobTitle: 'Business Analyst Senior',
        jobCode: 'JOB-2025-05',
        department: 'Phòng Phát Triển Sản Phẩm',
        appliedDate: '20/03/2025',
        stage: 'Đề xuất Offer',
        status: 'withdrawn',
        matchScore: 86,
        recruiter: 'Trần Thị Recruiter',
        interviewerFeedback: 'Lúc đó ứng viên bận việc gia đình nên xin hoãn thời điểm chuyển việc.',
      },
    ],
    evaluation: {
      technicalSkill: 4,
      softSkill: 5,
      cultureFit: 5,
      recommendationLevel: 'Hire',
      summary: 'PO trẻ trung, năng động, rất có tiềm năng phát triển thành Head of Product trong 2 năm tới.',
    },
    notes: [
      {
        id: 'note-5',
        author: 'Lê Thị Bích Ngọc',
        role: 'CPO',
        createdAt: '06/10/2026 15:30',
        content: 'Bài test giải quyết Product Case study của Ngân làm rất thuyết phục. Đề xuất làm vòng phỏng vấn chuyên sâu cuối tuần này.',
      },
    ],
  },
  {
    id: 'CAN-101',
    name: 'Vũ Đức Thịnh',
    email: 'thinh.vuduc@gmail.com',
    phone: '0988 123 456',
    linkedInUrl: 'https://linkedin.com/in/thinh-vuduc-backend',
    address: 'Quận Ba Đình, Hà Nội',
    dob: '12/12/1997',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=160&auto=format&fit=crop',
    latestPosition: 'Senior Backend Engineer (Go/Python)',
    latestStatus: 'Đang phỏng vấn',
    source: 'LinkedIn Sourcing',
    expectedSalary: '38 - 48 Triệu VNĐ',
    salaryRange: '35_50',
    skills: ['Golang', 'Python', 'Docker', 'Kafka', 'PostgreSQL', 'CI/CD'],
    tags: ['Senior Golang', 'Tiếng Anh lưu loát'],
    university: 'ĐH Bách Khoa Hà Nội',
    experienceYears: '4 năm kinh nghiệm',
    updatedAt: '11/10/2026',
    cvFileName: 'CV_VuDucThinh_Backend_Senior.pdf',
    applications: [
      {
        id: 'APP-2026-112',
        jobTitle: 'Senior Backend Engineer (Go/Python)',
        jobCode: 'JOB-2026-01',
        department: 'Khối Công Nghệ & Phần Mềm',
        appliedDate: '11/10/2026',
        stage: 'Tiếp nhận hồ sơ (CV Screening)',
        status: 'active',
        matchScore: 88,
        recruiter: 'Trần Thị Recruiter',
        interviewerFeedback: 'Hồ sơ LinkedIn rất đẹp, từng giải nhì Olympic Tin học.',
      },
    ],
    evaluation: {
      technicalSkill: 4,
      softSkill: 4,
      cultureFit: 4,
      recommendationLevel: 'Hire',
      summary: 'Kỹ sư trẻ có thực lực vững vàng, xuất thân Bách Khoa chuẩn chỉ.',
    },
    notes: [],
  },
  {
    id: 'CAN-061',
    name: 'Phạm Đức Dũng',
    email: 'dung.pham@gmail.com',
    phone: '0945 667 889',
    linkedInUrl: 'https://linkedin.com/in/dungpham-ops',
    address: 'Quận Hà Đông, Hà Nội',
    dob: '20/04/2000',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=160&auto=format&fit=crop',
    latestPosition: 'DevOps / Cloud Engineer',
    latestStatus: 'Đã từ chối',
    source: 'TopCV',
    expectedSalary: '18 - 22 Triệu VNĐ',
    salaryRange: 'under_20',
    skills: ['Linux', 'Docker', 'Bash script', 'Git', 'Nginx'],
    tags: ['Chưa đủ kinh nghiệm K8s', 'Lưu trữ tiềm năng'],
    university: 'ĐH Công Nghiệp Hà Nội',
    experienceYears: '1.5 năm kinh nghiệm',
    updatedAt: '25/09/2026',
    cvFileName: 'CV_PhamDucDung_JuniorDevOps.pdf',
    applications: [
      {
        id: 'APP-2026-061',
        jobTitle: 'DevOps / Cloud Engineer',
        jobCode: 'JOB-2026-04',
        department: 'Khối Vận Hành & Hạ Tầng',
        appliedDate: '20/09/2026',
        stage: 'Từ chối (Tech test chưa đạt)',
        status: 'rejected',
        matchScore: 68,
        recruiter: 'Trần Thị Recruiter',
        interviewerFeedback:
          'Ứng viên nắm tốt lệnh Linux và Docker cơ bản nhưng vị trí Senior này đòi hỏi vận hành Kubernetes production và Helm chart phức tạp. Ứng viên chưa đáp ứng được.',
      },
    ],
    evaluation: {
      technicalSkill: 3,
      softSkill: 4,
      cultureFit: 4,
      recommendationLevel: 'Consider',
      summary: 'Tiềm năng phát triển tốt. Nên lưu vào Talent Pool để liên hệ lại khi mở đợt tuyển dụng Junior DevOps.',
    },
    notes: [
      {
        id: 'note-6',
        author: 'Trần Thị Recruiter',
        role: 'Recruiter',
        createdAt: '25/09/2026 16:00',
        content: 'Đã gửi thư cảm ơn chuyên nghiệp kèm lời hẹn sẽ ưu tiên liên hệ lại khi có vị trí phù hợp hơn.',
      },
    ],
  },
  {
    id: 'CAN-065',
    name: 'Đặng Mai Linh',
    email: 'linh.dang@gmail.com',
    phone: '0911 223 344',
    linkedInUrl: 'https://linkedin.com/in/mailinh-devops',
    address: 'Quận Tây Hồ, Hà Nội',
    dob: '09/08/1997',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=160&auto=format&fit=crop',
    latestPosition: 'DevOps / Cloud Engineer',
    latestStatus: 'Đã nhận việc',
    source: 'LinkedIn Sourcing',
    expectedSalary: '38 - 45 Triệu VNĐ',
    salaryRange: '35_50',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'ArgoCD', 'Prometheus', 'Grafana', 'CI/CD'],
    tags: ['Tiếng Anh lưu loát', 'Đã onboard', 'Ưu tiên cao'],
    university: 'ĐH Bách Khoa Hà Nội (Kỹ sư Mạng)',
    experienceYears: '4 năm kinh nghiệm',
    updatedAt: '01/10/2026',
    cvFileName: 'CV_DangMaiLinh_DevOps_Specialist.pdf',
    applications: [
      {
        id: 'APP-2026-050',
        jobTitle: 'DevOps / Cloud Engineer',
        jobCode: 'JOB-2026-04',
        department: 'Khối Vận Hành & Hạ Tầng',
        appliedDate: '15/09/2026',
        stage: 'Đã nhận việc (Onboarding thành công)',
        status: 'hired',
        matchScore: 95,
        recruiter: 'Trần Thị Recruiter',
        salaryProposed: '40.000.000 VNĐ',
        salaryExpected: '40.000.000 VNĐ',
        interviewerFeedback: 'Kiến thức GitOps và hạ tầng AWS cực kỳ chuyên nghiệp. Đã ký hợp đồng thử việc ngày 01/10.',
      },
    ],
    evaluation: {
      technicalSkill: 5,
      softSkill: 5,
      cultureFit: 5,
      recommendationLevel: 'Strong Hire',
      summary: 'Tuyển dụng thành công hoàn hảo. Ứng viên bắt nhịp rất nhanh với đội ngũ hạ tầng.',
    },
    notes: [
      {
        id: 'note-7',
        author: 'Trần Quang Huy',
        role: 'Infra Director',
        createdAt: '02/10/2026 10:00',
        content: 'Linh đã nhận bàn giao cụm EKS staging và hoàn thành xuất sắc tài liệu kiến trúc ban đầu.',
      },
    ],
  },
  {
    id: 'CAN-054',
    name: 'Bùi Phương Thảo',
    email: 'thao.bui@design.vn',
    phone: '0976 543 210',
    linkedInUrl: 'https://linkedin.com/in/phuongthao-ux',
    address: 'Quận Hai Bà Trưng, Hà Nội',
    dob: '14/02/1999',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=160&auto=format&fit=crop',
    latestPosition: 'UI/UX Designer Senior',
    latestStatus: 'Lưu trữ tiềm năng',
    source: 'Website Công Ty',
    expectedSalary: '28 - 35 Triệu VNĐ',
    salaryRange: '20_35',
    skills: ['Figma', 'Design System', 'User Testing', 'Wireframing', 'Prototyping'],
    tags: ['Phù hợp văn hóa', 'Lưu trữ tiềm năng', 'Giao tiếp tốt'],
    university: 'ĐH Mỹ Thuật Công Nghiệp',
    experienceYears: '3.5 năm kinh nghiệm',
    updatedAt: '15/09/2026',
    cvFileName: 'Portfolio_BuiPhuongThao_UIUX.pdf',
    applications: [
      {
        id: 'APP-2026-035',
        jobTitle: 'UI/UX Designer Senior',
        jobCode: 'JOB-2026-05',
        department: 'Phòng Phát Triển Sản Phẩm',
        appliedDate: '20/07/2026',
        stage: 'Lưu hồ sơ tiềm năng (Hoãn mở rộng team)',
        status: 'active',
        matchScore: 87,
        recruiter: 'Trần Thị Recruiter',
        interviewerFeedback: 'Portfolio thẩm mỹ cao, màu sắc hiện đại. Đã lưu trữ để kích hoạt tuyển dụng lại khi mở rộng team Q4.',
      },
    ],
    evaluation: {
      technicalSkill: 4,
      softSkill: 4,
      cultureFit: 5,
      recommendationLevel: 'Hire',
      summary: 'Hồ sơ thiết kế đẹp, sẵn sàng liên hệ lại ngay khi có headcount mới.',
    },
    notes: [],
  },
];
