import { apiRequest } from "@/lib/api-client";
import type {
  CandidateApplication,
  InterviewItem,
  RecruiterJob,
  RecruiterOverviewData,
  ReferralItem,
  JobRequisition,
  JobDraftFromRequisitionPayload,
} from "../types/recruiter.types";

export const recruiterService = {
  async getOverview(): Promise<RecruiterOverviewData> {
    return apiRequest<RecruiterOverviewData>("/recruiter/overview");
  },

  async getJobs(params?: { search?: string; department?: string; status?: string }): Promise<{ items: RecruiterJob[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.department && params.department !== "all") searchParams.append("department", params.department);
    if (params?.status && params.status !== "all") searchParams.append("status", params.status);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest<{ items: RecruiterJob[]; total: number }>(`/recruiter/jobs${queryString}`);
  },

  async createJob(payload: {
    title: string;
    department: string;
    location: string;
    employment_type: string;
    openings: number;
    salary_range: string;
    experience_level: string;
    deadline: string;
    status: string;
    approval_status?: string;
    description: string;
    requirements: string | string[];
    benefits?: string | string[];
    requisition_id?: number;
  }): Promise<RecruiterJob> {
    return apiRequest<RecruiterJob>("/recruiter/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getPublicJobs(params?: { search?: string; department?: string; location?: string }): Promise<{ items: RecruiterJob[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.department) searchParams.append("department", params.department);
    if (params?.location) searchParams.append("location", params.location);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest<{ items: RecruiterJob[]; total: number }>(`/jobs${qs}`);
  },

  async getPublicJobById(id: number | string): Promise<RecruiterJob> {
    return apiRequest<RecruiterJob>(`/jobs/${id}`);
  },

  async updateJob(
    jobId: number,
    payload: Partial<Omit<RecruiterJob, "requirements" | "benefits">> & {
      requirements?: string | string[];
      benefits?: string | string[];
    }
  ): Promise<RecruiterJob> {
    return apiRequest<RecruiterJob>(`/recruiter/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async approveJob(jobId: number): Promise<RecruiterJob> {
    return apiRequest<RecruiterJob>(`/recruiter/jobs/${jobId}/approve`, {
      method: "PATCH",
    });
  },

  async publishJob(jobId: number): Promise<RecruiterJob> {
    return apiRequest<RecruiterJob>(`/recruiter/jobs/${jobId}/publish`, {
      method: "PATCH",
    });
  },

  async rejectJob(jobId: number): Promise<RecruiterJob> {
    return apiRequest<RecruiterJob>(`/recruiter/jobs/${jobId}/reject`, {
      method: "PATCH",
    });
  },

  async setJobPending(jobId: number): Promise<RecruiterJob> {
    return apiRequest<RecruiterJob>(`/recruiter/jobs/${jobId}/pending`, {
      method: "PATCH",
    });
  },

  async deleteJob(jobId: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/recruiter/jobs/${jobId}`, {
      method: "DELETE",
    });
  },

  async getCandidates(params?: { job_id?: number; stage?: string; search?: string }): Promise<{ items: CandidateApplication[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.job_id) searchParams.append("job_id", String(params.job_id));
    if (params?.stage && params.stage !== "all") searchParams.append("stage", params.stage);
    if (params?.search) searchParams.append("search", params.search);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest<{ items: CandidateApplication[]; total: number }>(`/recruiter/candidates${queryString}`);
  },

  async updateCandidateStage(
    candidateId: number,
    payload: { stage: string; rating?: number; hr_notes?: string }
  ): Promise<CandidateApplication> {
    return apiRequest<CandidateApplication>(`/recruiter/candidates/${candidateId}/stage`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async getInterviews(status?: string): Promise<{ items: InterviewItem[]; total: number }> {
    const queryString = status && status !== "all" ? `?status=${status}` : "";
    return apiRequest<{ items: InterviewItem[]; total: number }>(`/recruiter/interviews${queryString}`);
  },

  async scheduleInterview(payload: {
    application_id: number;
    candidate_name: string;
    job_title: string;
    interview_date: string;
    interview_time: string;
    format: string;
    location_or_link: string;
    interviewer_names: string;
    round_name: string;
  }): Promise<InterviewItem> {
    return apiRequest<InterviewItem>("/recruiter/interviews", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getReferrals(status?: string): Promise<{ items: ReferralItem[]; total: number }> {
    const queryString = status && status !== "all" ? `?status=${status}` : "";
    return apiRequest<{ items: ReferralItem[]; total: number }>(`/recruiter/referrals${queryString}`);
  },

  async updateReferral(
    referralId: number,
    payload: { status: string; bonus_status?: string; notes?: string }
  ): Promise<ReferralItem> {
    return apiRequest<ReferralItem>(`/recruiter/referrals/${referralId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // ----------------- REQUISITIONS (STORY S3-09) -----------------
  async getRequisitions(params?: { status?: string; department?: string; search?: string }): Promise<{ items: JobRequisition[]; total: number }> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== "all") searchParams.append("status", params.status);
    if (params?.department && params.department !== "all") searchParams.append("department", params.department);
    if (params?.search) searchParams.append("search", params.search);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiRequest<{ items: JobRequisition[]; total: number }>(`/recruiter/requisitions${queryString}`);
  },

  async getRequisitionById(id: number): Promise<JobRequisition> {
    return apiRequest<JobRequisition>(`/recruiter/requisitions/${id}`);
  },

  async createJobFromRequisition(requisitionId: number, payload: JobDraftFromRequisitionPayload): Promise<RecruiterJob> {
    return apiRequest<RecruiterJob>(`/recruiter/jobs/from-requisition/${requisitionId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
