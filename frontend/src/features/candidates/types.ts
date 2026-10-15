/** Candidate (person-level) view types used by the recruiter screens. Data comes from features/candidates/api.ts. */

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
  recommendationLevel: string;
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
  templateType: string;
  sentAt: string;
  sender: string;
  recipientEmail: string;
  status: string;
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
  latestStatus: string;
  source: string;
  expectedSalary: string;
  currentSalary?: string;
  salaryRange: string;
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
