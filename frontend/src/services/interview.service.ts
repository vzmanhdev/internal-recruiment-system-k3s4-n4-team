import { apiRequest } from "@/lib/legacy-api-client";

export interface InterviewItem {
  id: number;
  application_id: number;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
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
  }
};
