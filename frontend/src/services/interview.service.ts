import { apiRequest } from "@/lib/api-client";

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
  feedback_notes?: string;
  score?: number;
  passed?: boolean;
  interviewers?: any[];
  cv_url?: string | null;
  candidate_response?: string | null;
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

  async scheduleInterview(data: Partial<InterviewItem> & { interviewer_ids?: number[] }): Promise<InterviewItem> {
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
};
