export type PipelineStage = 
  | "new_applied"       // Hồ sơ mới
  | "screening"         // Sàng lọc
  | "interviewing"      // Phỏng vấn
  | "offer_proposed"    // Đề xuất offer
  | "hired"             // Nhận việc
  | "rejected";         // Đã loại

export interface TimelineEvent {
  id: string;
  type: "applied" | "stage_changed" | "note_added" | "interview_scheduled" | "offer_sent" | "email_sent" | "rejected";
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface InternalNote {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface CandidateApplicationHistory {
  id: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  finalStage: string;
  outcome: "hired" | "rejected" | "withdrawn" | "active";
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  jobId: string;
  jobTitle: string;
  department: string;
  stage: PipelineStage;
  source: "Nội bộ" | "LinkedIn" | "TopCV" | "Giới thiệu" | "Website" | "Khác";
  appliedDate: string;
  experienceYears: number;
  currentCompany?: string;
  education: string;
  matchScore: number; // Điểm sàng lọc (0-100%)
  rating: number; // 1-5 sao
  slaDaysInCurrentStage: number;
  slaOverdue: boolean; // Quá hạn SLA (ví dụ > 3 ngày chưa đọc)
  tags: string[];
  skills: string[];
  cvFileName: string;
  cvFileSize: string;
  cvSummary: string;
  rejectReason?: string;
  rejectNote?: string;
  notes: InternalNote[];
  timeline: TimelineEvent[];
  pastApplications: CandidateApplicationHistory[];
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  round: "Vòng 1 - Chuyên môn" | "Vòng 2 - Phù hợp văn hóa" | "Vòng 3 - Phỏng vấn BGĐ";
  scheduledAt: string; // ISO string e.g. "2026-10-05T09:00:00"
  durationMinutes: number; // 30, 45, 60, 90
  format: "online" | "in_person";
  locationOrLink: string; // Phòng họp 402 hoặc link MS Teams / Google Meet
  interviewers: string[]; // Danh sách phỏng vấn viên
  status: "scheduled" | "completed" | "rescheduled" | "cancelled";
  cancelReason?: string;
  notes?: string;
  feedbackSubmitted?: boolean;
}

export interface OfferProposal {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  department: string;
  level: string; // Junior, Middle, Senior, Lead
  baseSalary: number; // Lương cơ bản đề xuất (VND)
  standardMinSalary: number; // Chuẩn tối thiểu
  standardMaxSalary: number; // Chuẩn tối đa
  allowances: number; // Phụ cấp (VND)
  startDate: string; // Ngày dự kiến nhận việc
  deadline: string; // Hạn chót phản hồi
  status: "draft" | "pending_approval" | "approved" | "sent_to_candidate" | "accepted" | "rejected" | "renegotiating";
  isSalaryExceeded: boolean;
  justification?: string; // Giải trình nếu vượt dải chuẩn
  rejectReason?: string; // Lý do ứng viên từ chối
  createdAt: string;
  updatedAt: string;
}

export interface JobRequisitionInherited {
  id: string;
  title: string;
  department: string;
  minSalary: number;
  maxSalary: number;
  openings: number;
  needBy: string;
  status: "approved";
  description: string;
}

export interface RecruiterJobPosting {
  id: string;
  requisitionId?: string;
  title: string;
  department: string;
  location: string;
  employmentType: "Toàn thời gian" | "Bán thời gian" | "Thực tập";
  openings: string;
  minSalary: number;
  maxSalary: number;
  showSalary: boolean;
  deadline: string;
  status: "draft" | "published" | "closing_soon" | "closed";
  skills: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  totalApplicants: number;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  stageTrigger: PipelineStage;
  subject: string;
  content: string; // Chứa biến: {{candidate_name}}, {{job_title}}, {{interview_time}}, v.v.
}

export interface EmailLog {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  templateName: string;
  subject: string;
  sentAt: string;
  status: "success" | "failed";
  errorMessage?: string;
}

export interface RecruiterMetricSummary {
  activeJobsCount: number;
  totalCandidatesCount: number;
  newAppliedCount: number;
  interviewsTodayCount: number;
  offersPendingCount: number;
  slaOverdueCount: number;
}
