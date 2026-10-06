export type JobStatus = "open" | "closingSoon" | "closed";
export type JobApprovalStatus = "pending" | "approved" | "rejected";

export interface RecruiterJob {
  id: number;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  openings: number;
  salary_range: string;
  experience_level: string;
  deadline: string;
  status: JobStatus;
  approval_status: JobApprovalStatus;
  description: string;
  requirements: string[];
  benefits: string[];
  created_at: string;
  created_by?: string;
  applicant_count?: number;
  requisition_id?: number;
}

export type CandidateStage = "new" | "screening" | "interview" | "offer" | "hired" | "rejected";

export interface CandidateApplication {
  id: number;
  job_id: number;
  job_title?: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  current_department?: string | null;
  is_internal: boolean;
  referral_by?: string | null;
  resume_filename: string;
  stage: CandidateStage;
  rating: number;
  hr_notes: string;
  created_at: string;
  updated_at?: string;
}

export type InterviewFormat = "Online" | "Trực tiếp";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";
export type InterviewResult = "pending" | "passed" | "failed";

export interface InterviewItem {
  id: number;
  application_id: number;
  candidate_name: string;
  job_title: string;
  interview_date: string;
  interview_time: string;
  format: InterviewFormat;
  location_or_link: string;
  interviewer_names: string;
  round_name: string;
  status: InterviewStatus;
  feedback?: string;
  result: InterviewResult;
}

export interface ReferralItem {
  id: number;
  referrer_name: string;
  referrer_email: string;
  referrer_department: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  job_title: string;
  relationship: string;
  status: "processing" | "interviewed" | "hired" | "rejected";
  bonus_amount: string;
  bonus_status: "pending" | "eligible" | "paid";
  notes?: string;
  created_at: string;
}

export interface RecruiterOverviewData {
  metrics: {
    active_jobs: number;
    total_jobs: number;
    new_applications: number;
    interviewing: number;
    hired_count: number;
    total_referrals: number;
    successful_referrals: number;
  };
  stages: Record<CandidateStage, number>;
  upcoming_interviews: InterviewItem[];
  recent_candidates: CandidateApplication[];
}

export interface ApprovalStep {
  step: number;
  role: string;
  approver: string;
  status: "approved" | "pending" | "rejected" | "draft";
  comment?: string;
  updated_at?: string | null;
}

export interface JobRequisition {
  id: number;
  title: string;
  department: string;
  salary_range: string;
  openings: number;
  experience_level: string;
  reason: string;
  status: "approved" | "pending_approval" | "draft" | "rejected";
  approval_chain: ApprovalStep[];
  description: string;
  requirements: string[];
  benefits: string[];
  created_by?: string;
  is_converted: boolean;
  created_at?: string;
}

export interface JobDraftFromRequisitionPayload {
  title?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  location: string;
  employment_type: string;
  deadline: string;
  show_salary: boolean;
  status: string;
}
