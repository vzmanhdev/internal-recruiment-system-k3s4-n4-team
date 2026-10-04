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
  created_at?: string;
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
  }
};
