import {
  Candidate,
  Interview,
  OfferProposal,
  JobRequisitionInherited,
  RecruiterJobPosting,
  EmailTemplate,
  EmailLog,
} from "../types/recruiter.types";

export const initialRequisitions: JobRequisitionInherited[] = [
  {
    id: "REQ-2026-001",
    title: "Senior Frontend Engineer",
    department: "Khối Công nghệ",
    minSalary: 28000000,
    maxSalary: 45000000,
    openings: 2,
    needBy: "2026-11-15",
    status: "approved",
    description: "Chịu trách nhiệm thiết kế kiến trúc UI/UX và phát triển các module cốt lõi trên Next.js 15, TypeScript, Tailwind CSS theo chuẩn Enterprise SaaS."
  },
  {
    id: "REQ-2026-002",
    title: "Data Analyst",
    department: "Khối Công nghệ",
    minSalary: 18000000,
    maxSalary: 30000000,
    openings: 1,
    needBy: "2026-11-30",
    status: "approved",
    description: "Xây dựng dashboard BI, phân tích dữ liệu ứng viên và tuyển dụng nội bộ, tối ưu hóa các chỉ số chuyển đổi phễu."
  },
  {
    id: "REQ-2026-003",
    title: "Product Specialist",
    department: "Khối Sản phẩm",
    minSalary: 20000000,
    maxSalary: 35000000,
    openings: 2,
    needBy: "2026-10-25",
    status: "approved",
    description: "Nghiên cứu nhu cầu nghiệp vụ, chuyển hóa yêu cầu thành PRD và phối hợp chặt chẽ với đội ngũ phát triển sản phẩm."
  },
  {
    id: "REQ-2026-004",
    title: "Chuyên viên Truyền thông Nội bộ",
    department: "Khối Nhân sự",
    minSalary: 15000000,
    maxSalary: 25000000,
    openings: 1,
    needBy: "2026-11-20",
    status: "approved",
    description: "Xây dựng chiến dịch Employer Branding, gắn kết nhân viên và quảng bá văn hóa doanh nghiệp VinaTech."
  }
];

export const initialJobPostings: RecruiterJobPosting[] = [
  {
    id: "JOB-FE-01",
    requisitionId: "REQ-2026-001",
    title: "Senior Frontend Engineer",
    department: "Khối Công nghệ",
    location: "Hà Nội (Hybrid)",
    employmentType: "Toàn thời gian",
    openings: "2 người",
    minSalary: 28000000,
    maxSalary: 45000000,
    showSalary: true,
    deadline: "2026-11-15",
    status: "published",
    skills: ["React 19", "Next.js 16", "TypeScript", "Tailwind CSS", "Architecture"],
    description: "Chúng tôi tìm kiếm Senior Frontend Engineer dẫn dắt phát triển hệ thống Tuyển dụng Nội bộ VinaTech với trải nghiệm người dùng vượt trội.",
    responsibilities: [
      "Xây dựng và phát triển giao diện hiện đại trên Next.js App Router.",
      "Tối ưu hiệu năng, đảm bảo tính tiếp cận (a11y) và responsive hoàn hảo.",
      "Review code, hướng dẫn các thành viên và tham gia thiết kế UI component library."
    ],
    requirements: [
      "Có ít nhất 4 năm kinh nghiệm làm việc với React/TypeScript.",
      "Thành thạo Tailwind CSS và hệ thống Design Tokens doanh nghiệp.",
      "Tư duy giải quyết vấn đề tốt, chủ động trong công việc."
    ],
    totalApplicants: 12,
    updatedAt: "02/10/2026"
  },
  {
    id: "JOB-DA-02",
    requisitionId: "REQ-2026-002",
    title: "Data Analyst",
    department: "Khối Công nghệ",
    location: "Hà Nội",
    employmentType: "Toàn thời gian",
    openings: "1 người",
    minSalary: 18000000,
    maxSalary: 30000000,
    showSalary: true,
    deadline: "2026-11-30",
    status: "published",
    skills: ["SQL", "Power BI", "Python", "Data Modeling"],
    description: "Phân tích số liệu tuyển dụng, xây dựng các báo cáo thời gian thực giúp ban giám đốc ra quyết định nhân sự chính xác.",
    responsibilities: [
      "Xây dựng ETL pipeline và quản trị kho dữ liệu báo cáo.",
      "Thiết kế dashboard trực quan trên Power BI.",
      "Đưa ra các phân tích chuyên sâu về hiệu quả nguồn tuyển dụng."
    ],
    requirements: [
      "2+ năm kinh nghiệm phân tích dữ liệu với SQL và Power BI/Tableau.",
      "Khả năng đọc hiểu business và trình bày báo cáo mạch lạc."
    ],
    totalApplicants: 8,
    updatedAt: "01/10/2026"
  },
  {
    id: "JOB-PS-03",
    requisitionId: "REQ-2026-003",
    title: "Product Specialist",
    department: "Khối Sản phẩm",
    location: "Hà Nội",
    employmentType: "Toàn thời gian",
    openings: "2 người",
    minSalary: 20000000,
    maxSalary: 35000000,
    showSalary: true,
    deadline: "2026-10-10",
    status: "closing_soon",
    skills: ["Product Analysis", "Agile/Scrum", "Wireframing", "User Research"],
    description: "Đóng vai trò cầu nối giữa nghiệp vụ nhân sự và nhóm kỹ thuật để hoàn thiện các tính năng cốt lõi.",
    responsibilities: [
      "Phỏng vấn người dùng nội bộ để thu thập yêu cầu tính năng.",
      "Lập kế hoạch sprint và phối hợp kiểm thử tính năng mới."
    ],
    requirements: [
      "Tối thiểu 2 năm kinh nghiệm BA/Product Specialist.",
      "Ưu tiên ứng viên có kinh nghiệm với hệ thống HRM/ATS."
    ],
    totalApplicants: 15,
    updatedAt: "28/09/2026"
  }
];

export const initialCandidates: Candidate[] = [
  {
    id: "CAN-101",
    fullName: "Nguyễn Văn Hải",
    email: "hai.nguyenvan@gmail.com",
    phone: "0912345678",
    avatarUrl: "",
    jobId: "JOB-FE-01",
    jobTitle: "Senior Frontend Engineer",
    department: "Khối Công nghệ",
    stage: "new_applied",
    source: "Nội bộ",
    appliedDate: "02/10/2026",
    experienceYears: 5,
    currentCompany: "VinaTech - TT Công nghệ",
    education: "Đại học Bách Khoa Hà Nội - CNTT",
    matchScore: 92,
    rating: 4,
    slaDaysInCurrentStage: 1,
    slaOverdue: false,
    tags: ["Ưu tiên phỏng vấn", "Nội bộ luân chuyển", "React Senior"],
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux"],
    cvFileName: "CV_NguyenVanHai_Frontend.pdf",
    cvFileSize: "1.4 MB",
    cvSummary: "5 năm kinh nghiệm lập trình Frontend, từng chủ trì chuyển đổi hệ thống sang Next.js App Router, nắm vững Clean Code và tối ưu trải nghiệm.",
    notes: [
      {
        id: "NOTE-1",
        authorName: "Phong (Recruiter)",
        authorRole: "Nhân viên tuyển dụng",
        content: "Ứng viên nội bộ tiềm năng từ TT Công nghệ, quản lý trực tiếp đã ký thư giới thiệu đồng ý luân chuyển.",
        createdAt: "02/10/2026 10:15"
      }
    ],
    timeline: [
      {
        id: "TL-1",
        type: "applied",
        title: "Ứng tuyển vị trí Senior Frontend Engineer",
        description: "Hồ sơ được nộp qua Cổng tuyển dụng nội bộ VinaTech.",
        actor: "Hệ thống",
        timestamp: "02/10/2026 09:30"
      }
    ],
    pastApplications: []
  },
  {
    id: "CAN-102",
    fullName: "Trần Minh Quang",
    email: "quang.tm@techcorp.vn",
    phone: "0987654321",
    jobId: "JOB-FE-01",
    jobTitle: "Senior Frontend Engineer",
    department: "Khối Công nghệ",
    stage: "screening",
    source: "LinkedIn",
    appliedDate: "28/09/2026",
    experienceYears: 6,
    currentCompany: "FPT Software",
    education: "Đại học Công nghệ - ĐHQGHN",
    matchScore: 88,
    rating: 5,
    slaDaysInCurrentStage: 4,
    slaOverdue: true, // Cảnh báo quá hạn SLA (> 3 ngày)
    tags: ["SLA Quá hạn", "Kinh nghiệm phong phú", "Kiến trúc hệ thống"],
    skills: ["React", "TypeScript", "Micro-frontends", "Node.js"],
    cvFileName: "TranMinhQuang_Resume_2026.pdf",
    cvFileSize: "2.1 MB",
    cvSummary: "6 năm kinh nghiệm, Tech Lead Frontend tại dự án ngân hàng số, thành thạo kiến trúc Micro-frontend và quản trị hiệu năng ứng dụng quy mô lớn.",
    notes: [
      {
        id: "NOTE-2",
        authorName: "Phong (Recruiter)",
        authorRole: "Nhân viên tuyển dụng",
        content: "Đã gọi điện trao đổi sơ bộ, ứng viên mong muốn mức lương ~38M net, sẵn sàng phỏng vấn tuần này.",
        createdAt: "29/09/2026 14:00"
      }
    ],
    timeline: [
      {
        id: "TL-2A",
        type: "applied",
        title: "Nộp hồ sơ ứng tuyển",
        description: "Ứng viên nộp CV qua kênh tuyển dụng ngoài LinkedIn.",
        actor: "Trần Minh Quang",
        timestamp: "28/09/2026 11:20"
      },
      {
        id: "TL-2B",
        type: "stage_changed",
        title: "Chuyển giai đoạn: Sàng lọc",
        description: "Recruiter đã duyệt CV đạt tiêu chí chuyên môn ban đầu.",
        actor: "Phong (Recruiter)",
        timestamp: "29/09/2026 09:10"
      }
    ],
    pastApplications: [
      {
        id: "PA-1",
        jobTitle: "Frontend Lead",
        department: "Khối Công nghệ",
        appliedDate: "15/03/2025",
        finalStage: "Phỏng vấn Vòng 2",
        outcome: "rejected"
      }
    ]
  },
  {
    id: "CAN-103",
    fullName: "Lê Hoàng Yến",
    email: "yen.lehoang@gmail.com",
    phone: "0903112233",
    jobId: "JOB-DA-02",
    jobTitle: "Data Analyst",
    department: "Khối Công nghệ",
    stage: "interviewing",
    source: "TopCV",
    appliedDate: "25/09/2026",
    experienceYears: 3,
    currentCompany: "Shopee Vietnam",
    education: "Đại học Kinh tế Quốc dân",
    matchScore: 95,
    rating: 5,
    slaDaysInCurrentStage: 2,
    slaOverdue: false,
    tags: ["Ứng viên nổi bật", "Power BI xuất sắc", "Chờ Vòng 2"],
    skills: ["SQL", "Power BI", "Python", "Tableau", "DAX"],
    cvFileName: "LeHoangYen_DA_CV.pdf",
    cvFileSize: "980 KB",
    cvSummary: "3 năm làm việc tại bộ phận Growth & Analytics, am hiểu bài toán tối ưu tỷ lệ chuyển đổi và tự động hóa báo cáo ban điều hành.",
    notes: [
      {
        id: "NOTE-3",
        authorName: "Đặng Tuấn Anh (Interviewer)",
        authorRole: "Trưởng nhóm Dữ liệu",
        content: "Đánh giá Vòng 1: Rất tốt về tư duy SQL và trực quan hóa dữ liệu. Đề xuất chuyển tiếp phỏng vấn Vòng 2 với Trưởng bộ phận.",
        createdAt: "30/09/2026 16:30"
      }
    ],
    timeline: [
      {
        id: "TL-3A",
        type: "applied",
        title: "Ứng tuyển Data Analyst",
        description: "Nộp hồ sơ từ nguồn TopCV.",
        actor: "Lê Hoàng Yến",
        timestamp: "25/09/2026 15:45"
      },
      {
        id: "TL-3B",
        type: "interview_scheduled",
        title: "Xếp lịch Phỏng vấn Vòng 1",
        description: "Phỏng vấn trực tiếp tại Phòng họp 402 với Đặng Tuấn Anh.",
        actor: "Phong (Recruiter)",
        timestamp: "27/09/2026 10:00"
      }
    ],
    pastApplications: []
  },
  {
    id: "CAN-104",
    fullName: "Vũ Đức Thắng",
    email: "thang.vuduc@outlook.com",
    phone: "0971239876",
    jobId: "JOB-FE-01",
    jobTitle: "Senior Frontend Engineer",
    department: "Khối Công nghệ",
    stage: "offer_proposed",
    source: "Giới thiệu",
    appliedDate: "20/09/2026",
    experienceYears: 7,
    currentCompany: "One Mount Group",
    education: "Đại học Bách Khoa Hà Nội",
    matchScore: 98,
    rating: 5,
    slaDaysInCurrentStage: 1,
    slaOverdue: false,
    tags: ["Top Talent", "Đã duyệt Offer", "Chuẩn bị Onboarding"],
    skills: ["React", "TypeScript", "Performance", "Next.js", "GraphQL"],
    cvFileName: "VuDucThang_LeadFrontend.pdf",
    cvFileSize: "1.8 MB",
    cvSummary: "Kinh nghiệm 7 năm xây dựng ứng dụng tài chính ngân hàng, năng lực lãnh đạo đội ngũ 8 kỹ sư, tác phong chuyên nghiệp.",
    notes: [
      {
        id: "NOTE-4",
        authorName: "Phong (Recruiter)",
        authorRole: "Nhân viên tuyển dụng",
        content: "Đã hoàn tất soạn thảo Offer 42.000.000 VNĐ, Trưởng phòng Nhân sự đã phê duyệt trong hạn mức.",
        createdAt: "01/10/2026 11:00"
      }
    ],
    timeline: [
      {
        id: "TL-4A",
        type: "offer_sent",
        title: "Gửi đề xuất Offer chính thức",
        description: "Đề xuất mức lương 42.000.000 VNĐ / tháng kèm phụ cấp ăn trưa & thiết bị làm việc.",
        actor: "Phong (Recruiter)",
        timestamp: "01/10/2026 15:00"
      }
    ],
    pastApplications: []
  },
  {
    id: "CAN-105",
    fullName: "Phạm Thùy Linh",
    email: "thuylinh.pham@gmail.com",
    phone: "0934567890",
    jobId: "JOB-PS-03",
    jobTitle: "Product Specialist",
    department: "Khối Sản phẩm",
    stage: "hired",
    source: "LinkedIn",
    appliedDate: "10/09/2026",
    experienceYears: 4,
    currentCompany: "VNPay",
    education: "Đại học Ngoại Thương",
    matchScore: 94,
    rating: 5,
    slaDaysInCurrentStage: 0,
    slaOverdue: false,
    tags: ["Đã đồng ý Offer", "Onboarding 15/10"],
    skills: ["Product Management", "Data Driven", "Scrum", "UX Research"],
    cvFileName: "PhamThuyLinh_CV.pdf",
    cvFileSize: "1.1 MB",
    cvSummary: "4 năm làm Product Specialist cho giải pháp thanh toán điện tử, đã nhận Offer và chuẩn bị gia nhập đội ngũ VinaTech.",
    notes: [
      {
        id: "NOTE-5",
        authorName: "Phong (Recruiter)",
        authorRole: "Nhân viên tuyển dụng",
        content: "Ứng viên đã ký chấp thuận thư mời nhận việc vào ngày 02/10/2026. Đã chuyển giao thông tin sang bộ phận Onboarding.",
        createdAt: "02/10/2026 09:00"
      }
    ],
    timeline: [
      {
        id: "TL-5",
        type: "stage_changed",
        title: "Gia nhập VinaTech (Hired)",
        description: "Ứng viên chính thức hoàn tất quy trình tuyển dụng và chuẩn bị nhận việc ngày 15/10/2026.",
        actor: "Hệ thống",
        timestamp: "02/10/2026 09:00"
      }
    ],
    pastApplications: []
  },
  {
    id: "CAN-106",
    fullName: "Đỗ Quốc Cường",
    email: "cuong.doquoc@yahoo.com",
    phone: "0945678123",
    jobId: "JOB-FE-01",
    jobTitle: "Senior Frontend Engineer",
    department: "Khối Công nghệ",
    stage: "rejected",
    source: "Website",
    appliedDate: "18/09/2026",
    experienceYears: 2,
    currentCompany: "Công ty Khởi nghiệp ABC",
    education: "Cao đẳng FPT Polytechnic",
    matchScore: 48,
    rating: 2,
    slaDaysInCurrentStage: 0,
    slaOverdue: false,
    tags: ["Không đạt số năm KN", "Lưu kho tiềm năng"],
    skills: ["HTML", "CSS", "JavaScript", "Vue.js"],
    cvFileName: "DoQuocCuong_CV.pdf",
    cvFileSize: "750 KB",
    cvSummary: "2 năm kinh nghiệm Frontend căn bản, chưa đáp ứng yêu cầu Senior Frontend Engineer của dự án.",
    rejectReason: "Không đáp ứng số năm kinh nghiệm tối thiểu (yêu cầu >= 4 năm)",
    rejectNote: "Kỹ năng chuyên môn hiện tại ở mức Junior/Middle, hẹn mời lại khi có vị trí phù hợp hơn.",
    notes: [
      {
        id: "NOTE-6",
        authorName: "Phong (Recruiter)",
        authorRole: "Nhân viên tuyển dụng",
        content: "Đã gửi email từ chối và cảm ơn ứng viên, thông tin được lưu lại vào kho nhân tài cho các đợt tuyển Junior.",
        createdAt: "22/09/2026 14:20"
      }
    ],
    timeline: [
      {
        id: "TL-6",
        type: "rejected",
        title: "Từ chối hồ sơ",
        description: "Lý do: Không đáp ứng số năm kinh nghiệm tối thiểu.",
        actor: "Phong (Recruiter)",
        timestamp: "22/09/2026 14:15"
      }
    ],
    pastApplications: []
  }
];

export const initialInterviews: Interview[] = [
  {
    id: "INT-001",
    candidateId: "CAN-103",
    candidateName: "Lê Hoàng Yến",
    jobTitle: "Data Analyst",
    round: "Vòng 2 - Phù hợp văn hóa",
    scheduledAt: "2026-10-05T14:30:00",
    durationMinutes: 45,
    format: "online",
    locationOrLink: "https://meet.google.com/xyz-vina-tech",
    interviewers: ["Trần Hoàng Nam (HR Manager)", "Nguyễn Minh Anh (Trưởng phòng Công nghệ)"],
    status: "scheduled",
    notes: "Tập trung đánh giá khả năng phối hợp liên phòng ban và định hướng gắn bó lâu dài."
  },
  {
    id: "INT-002",
    candidateId: "CAN-102",
    candidateName: "Trần Minh Quang",
    jobTitle: "Senior Frontend Engineer",
    round: "Vòng 1 - Chuyên môn",
    scheduledAt: "2026-10-06T10:00:00",
    durationMinutes: 60,
    format: "in_person",
    locationOrLink: "Phòng họp 402 (Tầng 4, Tòa nhà VinaTech)",
    interviewers: ["Nguyễn Minh Anh (Tech Lead)", "Hoàng Đức Duy (Senior Architect)"],
    status: "scheduled",
    notes: "Kiểm tra kiến trúc Micro-frontend và kỹ năng giải quyết bài toán hiệu năng."
  }
];

export const initialOffers: OfferProposal[] = [
  {
    id: "OFF-001",
    candidateId: "CAN-104",
    candidateName: "Vũ Đức Thắng",
    jobTitle: "Senior Frontend Engineer",
    department: "Khối Công nghệ",
    level: "Senior L3",
    baseSalary: 42000000,
    standardMinSalary: 28000000,
    standardMaxSalary: 45000000,
    allowances: 2500000,
    startDate: "2026-11-01",
    deadline: "2026-10-10",
    status: "sent_to_candidate",
    isSalaryExceeded: false,
    createdAt: "01/10/2026",
    updatedAt: "01/10/2026"
  },
  {
    id: "OFF-002",
    candidateId: "CAN-105",
    candidateName: "Phạm Thùy Linh",
    jobTitle: "Product Specialist",
    department: "Khối Sản phẩm",
    level: "Middle L2",
    baseSalary: 28000000,
    standardMinSalary: 20000000,
    standardMaxSalary: 35000000,
    allowances: 1500000,
    startDate: "2026-10-15",
    deadline: "2026-10-05",
    status: "accepted",
    isSalaryExceeded: false,
    createdAt: "28/09/2026",
    updatedAt: "02/10/2026"
  }
];

export const initialEmailTemplates: EmailTemplate[] = [
  {
    id: "TMPL-1",
    name: "Xác nhận nhận hồ sơ",
    stageTrigger: "new_applied",
    subject: "[VinaTech] Xác nhận tiếp nhận hồ sơ ứng tuyển vị trí {{job_title}}",
    content: "Kính gửi {{candidate_name}},\n\nCảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển vị trí {{job_title}} tại VinaTech. Bộ phận Tuyển dụng đã nhận được CV của bạn và sẽ phản hồi kết quả trong vòng 3 ngày làm việc.\n\nTrân trọng,\nĐội ngũ Tuyển dụng VinaTech."
  },
  {
    id: "TMPL-2",
    name: "Thư mời phỏng vấn",
    stageTrigger: "interviewing",
    subject: "[VinaTech] Thư mời tham gia phỏng vấn vị trí {{job_title}}",
    content: "Chào {{candidate_name}},\n\nBộ phận Tuyển dụng VinaTech trân trọng kính mời bạn tham gia buổi phỏng vấn {{interview_round}} cho vị trí {{job_title}}.\n\n- Thời gian: {{interview_time}}\n- Hình thức: {{interview_format}}\n- Địa điểm/Liên kết: {{interview_location}}\n\nVui lòng xác nhận khả năng tham dự qua email này trước 24 giờ.\n\nTrân trọng,\nPhong - Chuyên viên Tuyển dụng VinaTech."
  },
  {
    id: "TMPL-3",
    name: "Thư cảm ơn và từ chối",
    stageTrigger: "rejected",
    subject: "[VinaTech] Thư cảm ơn và phản hồi hồ sơ vị trí {{job_title}}",
    content: "Chào {{candidate_name}},\n\nCảm ơn bạn đã dành thời gian quan tâm và tham gia quy trình tuyển dụng vị trí {{job_title}} tại VinaTech.\n\nSau khi cân nhắc kỹ lưỡng, chúng tôi rất tiếc chưa thể đồng hành cùng bạn ở thời điểm hiện tại. Hồ sơ của bạn đã được lưu trữ trong kho nhân tài và chúng tôi sẽ chủ động liên hệ khi có cơ hội phù hợp hơn.\n\nChúc bạn luôn thành công trên con đường sự nghiệp!\n\nTrân trọng,\nĐội ngũ Tuyển dụng VinaTech."
  }
];

export const initialEmailLogs: EmailLog[] = [
  {
    id: "LOG-001",
    candidateId: "CAN-104",
    candidateName: "Vũ Đức Thắng",
    candidateEmail: "thang.vuduc@outlook.com",
    templateName: "Thư mời nhận việc (Offer Letter)",
    subject: "[VinaTech] Thư đề nghị nhận việc - Senior Frontend Engineer",
    sentAt: "01/10/2026 15:02",
    status: "success"
  },
  {
    id: "LOG-002",
    candidateId: "CAN-106",
    candidateName: "Đỗ Quốc Cường",
    candidateEmail: "cuong.doquoc@yahoo.com",
    templateName: "Thư cảm ơn và từ chối",
    subject: "[VinaTech] Thư cảm ơn và phản hồi hồ sơ vị trí Senior Frontend Engineer",
    sentAt: "22/09/2026 14:18",
    status: "success"
  }
];

export const initialRejectReasons = [
  "Không đáp ứng số năm kinh nghiệm tối thiểu",
  "Kỹ năng chuyên môn chưa phù hợp với yêu cầu vị trí",
  "Mức lương kỳ vọng vượt trần khung ngân sách",
  "Chưa phù hợp với văn hóa làm việc và giá trị cốt lõi",
  "Ứng viên chủ động từ chối hoặc nhận lời mời nơi khác",
  "Không phản hồi liên hệ sau 3 lần thông báo",
  "Lý do khác"
];
