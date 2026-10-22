import { apiRequest } from "@/lib/api-client";

export interface ConflictSessionDetail {
  interview_id: number;
  type: 'interviewer' | 'room';
  who?: string[];
  who_details?: Array<{ id: number; name: string; email?: string }>;
  conflicting_interviewer_ids?: number[];
  room?: string;
  at?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  candidate?: string;
  candidate_id?: number;
  job_title?: string;
  round_name?: string;
  location?: string;
  meeting_link?: string | null;
}

export interface SuggestedSlot {
  start_time: string;
  end_time: string;
  formatted_range: string;
  formatted_date?: string;
}

export interface ConflictCheckResponse {
  has_conflict: boolean;
  conflicts: ConflictSessionDetail[];
  suggested_slot?: SuggestedSlot | null;
}

export interface InterviewItem {
  id: number;
  application_id: number;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  department?: string;
  round_number: number;
  round_name: string;
  scheduled_time: string;
  duration_minutes: number;
  location: string;
  meeting_link?: string;
  status: string;
  override_reason?: string | null;
  cancel_reason?: string | null;
  feedback_notes?: string;
  score?: number;
  passed?: boolean;
  interviewers?: any[];
  cv_url?: string | null;
  candidate_response?: string | null;
  candidate_response_note?: string | null;
  candidate_responded_at?: string | null;
  preparation_notes?: string | null;
  my_evaluation_submitted?: boolean;
  is_my_interview?: boolean;
  is_own_application?: boolean;
}

export const interviewService = {
  async getInterviews(params?: {
    application_id?: number;
    status_filter?: string;
  }): Promise<InterviewItem[]> {
    const query = new URLSearchParams();
    if (params?.application_id) query.append("application_id", params.application_id.toString());
    if (params?.status_filter) query.append("status_filter", params.status_filter);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<InterviewItem[]>(`/interviews${queryString}`);
  },

  async scheduleInterview(data: Partial<InterviewItem> & { interviewer_ids?: number[]; override_conflict_reason?: string }): Promise<InterviewItem> {
    return apiRequest<InterviewItem>("/interviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateFeedback(
    id: number,
    data: {
      status?: string;
      feedback_notes?: string;
      score?: number;
      passed?: boolean;
    }
  ): Promise<InterviewItem> {
    return apiRequest<InterviewItem>(`/interviews/${id}/feedback`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getMine(): Promise<InterviewItem[]> {
    return apiRequest<InterviewItem[]>("/interviews?mine=true");
  },

  async scorecardTemplate(id: number): Promise<{ framework: { id: string; name: string } | null; criteria: Array<{ id: string; code: string; name: string; description?: string; weight: number }> }> {
    return apiRequest(`/interviews/${id}/scorecard-template`);
  },

  async questionSuggestions(id: number): Promise<Array<{ id: string; code: string; content: string; criteria_name?: string; difficulty?: string; suggested_answer?: string; already_asked: boolean }>> {
    return apiRequest(`/interviews/${id}/question-suggestions`);
  },

  async markAsked(id: number, question_id: string): Promise<{ success: boolean }> {
    return apiRequest(`/interviews/${id}/asked-questions`, { method: "POST", body: JSON.stringify({ question_id }) });
  },

  async cancel(id: number, reason: string): Promise<InterviewItem> {
    return apiRequest(`/interviews/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) });
  },

  async reschedule(
    id: number,
    data: {
      scheduled_time: string;
      duration_minutes: number;
      location: string;
      meeting_link?: string | null;
      interviewer_ids: number[];
      override_conflict_reason?: string;
      reason?: string;
    }
  ): Promise<InterviewItem> {
    return apiRequest<InterviewItem>(`/interviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteInterview(id: number): Promise<void> {
    await apiRequest(`/interviews/${id}`, { method: "DELETE" });
  },

  async checkConflicts(data: {
    scheduled_time: string;
    duration_minutes: number;
    location: string;
    meeting_link?: string | null;
    interviewer_ids: number[];
  }): Promise<ConflictCheckResponse> {
    return apiRequest<ConflictCheckResponse>("/interviews/conflicts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getEvaluationSummary(applicationId: number): Promise<{
    application_id: number;
    candidate: string;
    evaluation_count: number;
    criteria_averages: Record<string, number>;
    average_weighted_score: number | null;
    recommendations: Record<string, number>;
    evaluations: any[];
  }> {
    return apiRequest(`/referrals/evaluations/summary?application_id=${applicationId}`);
  },

  async compareCandidates(jobId: number): Promise<Array<{
    application_id: number;
    candidate: string;
    status: string;
    criteria: Record<string, number>;
    total_score: number | null;
    evaluations: number;
  }>> {
    return apiRequest(`/referrals/evaluations/compare?job_id=${jobId}`);
  },

  async reopenEvaluation(id: number): Promise<any> {
    return apiRequest(`/referrals/evaluations/${id}/reopen`, { method: "POST" });
  },
};
