import { apiRequest } from "@/lib/api-client";

export interface ApplicationItem {
  id: number;
  job_posting_id: number;
  job_title?: string;
  department?: string;
  candidate_id?: number;
  full_name: string;
  name?: string;
  email: string;
  phone: string;
  current_company?: string;
  current_position?: string;
  years_of_experience: number;
  cv_url?: string;
  cover_letter?: string;
  referral_code?: string;
  status: string;
  score: number;
  hr_notes?: string;
  rejection_reason?: string;
  applied_date?: string;
  created_at?: string;
  updated_at?: string;
  tracking_code?: string;
  source?: string;
  rating?: number | null;
  tags?: string[];
  match_score?: number | null;
  meets_requirements?: boolean | null;
  is_overdue?: boolean;
  public_status?: string;
}

export const applicationService = {
  async getApplications(params?: {
    job_id?: number;
    status_filter?: string;
    search?: string;
  }): Promise<ApplicationItem[]> {
    const query = new URLSearchParams();
    if (params?.job_id) query.append("job_id", params.job_id.toString());
    if (params?.status_filter) query.append("status_filter", params.status_filter);
    if (params?.search) query.append("search", params.search);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<ApplicationItem[]>(`/applications${queryString}`);
  },

  async getApplicationById(id: number): Promise<ApplicationItem> {
    return apiRequest<ApplicationItem>(`/applications/${id}`);
  },

  async submitApplication(data: Partial<ApplicationItem>): Promise<ApplicationItem> {
    return apiRequest<ApplicationItem>("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateStatus(
    id: number,
    data: {
      status: string;
      score?: number;
      hr_notes?: string;
      rejection_reason?: string;
    }
  ): Promise<ApplicationItem> {
    return apiRequest<ApplicationItem>(`/applications/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async hiringDecision(id: number, decision: "offer" | "reject", reason?: string): Promise<ApplicationItem> {
    return apiRequest<ApplicationItem>(`/applications/${id}/hiring-decision`, {
      method: "POST",
      body: JSON.stringify({ decision, reason }),
    });
  },
};
