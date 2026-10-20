import { apiRequest } from "@/lib/api-client";

export interface JobPostingItem {
  id: number;
  slug: string;
  title: string;
  requisition_id?: number;
  department_id: number;
  department: string;
  department_name?: string;
  location: string;
  type: string;
  level: string;
  salary_range: string;
  salaryRange?: string;
  experience_level?: string;
  deadline?: string;
  description: string;
  requirements?: string;
  benefits?: string;
  status: string;
  views_count?: number;
  applications_count?: number;
  created_by_id?: number | null;
  creator_name?: string | null;
  creator_email?: string | null;
  published_by_id?: number | null;
  published_by_name?: string | null;
  published_by_email?: string | null;
  published_at?: string | null;
  created_at?: string;
  review_note?: string | null;
  is_expired?: boolean;
}

export const jobService = {
  async getJobs(params?: {
    department?: string;
    location?: string;
    type?: string;
    search?: string;
    status_filter?: string;
  }): Promise<JobPostingItem[]> {
    const query = new URLSearchParams();
    if (params?.department) query.append("department", params.department);
    if (params?.location) query.append("location", params.location);
    if (params?.type) query.append("type", params.type);
    if (params?.search) query.append("search", params.search);
    if (params?.status_filter) query.append("status_filter", params.status_filter);
    
    const queryString = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<JobPostingItem[]>(`/jobs${queryString}`);
  },

  async getJobByIdOrSlug(idOrSlug: string): Promise<JobPostingItem> {
    return apiRequest<JobPostingItem>(`/jobs/${idOrSlug}`);
  },

  async createJob(data: Partial<JobPostingItem>): Promise<JobPostingItem> {
    return apiRequest<JobPostingItem>("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateJob(id: number, data: Partial<JobPostingItem>): Promise<JobPostingItem> {
    return apiRequest<JobPostingItem>(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async getAdminJobs(status_filter?: string): Promise<JobPostingItem[]> {
    const query = status_filter ? `?status_filter=${encodeURIComponent(status_filter)}` : "";
    return apiRequest<JobPostingItem[]>(`/jobs/admin-list${query}`);
  },

  async publishJob(id: number): Promise<JobPostingItem> {
    return apiRequest<JobPostingItem>(`/jobs/${id}/publish`, { method: "POST" });
  },

  async requestChanges(id: number, reason: string): Promise<JobPostingItem> {
    return apiRequest<JobPostingItem>(`/jobs/${id}/request-changes`, { method: "POST", body: JSON.stringify({ reason }) });
  },

  async closeJob(id: number): Promise<JobPostingItem> {
    return apiRequest<JobPostingItem>(`/jobs/${id}/close`, { method: "POST" });
  },
};
