import { apiRequest } from "@/lib/api-client";

export interface JobPostingItem {
  id: number;
  code: string;
  requisition_id?: number;
  requisition_code?: string;
  title: string;
  department_id: number;
  department_name?: string;
  job_title_id?: number;
  job_title_name?: string;
  quantity: number;
  min_salary?: number;
  max_salary?: number;
  is_salary_negotiable: boolean;
  work_location: string;
  employment_type: string;
  experience_years: string;
  deadline?: string;
  is_featured: boolean;
  job_description?: string;
  requirements?: string;
  benefits?: string;
  status: "draft" | "published" | "paused" | "expired";
  views_count: number;
  created_by_id: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedJobPostings {
  items: JobPostingItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface CreateJobPostingPayload {
  requisition_id?: number;
  title: string;
  department_id: number;
  job_title_id?: number;
  quantity: number;
  min_salary?: number;
  max_salary?: number;
  is_salary_negotiable?: boolean;
  work_location?: string;
  employment_type?: string;
  experience_years?: string;
  deadline?: string;
  is_featured?: boolean;
  job_description?: string;
  requirements?: string;
  benefits?: string;
  status?: string;
}

export async function fetchPublicJobs(params?: {
  search?: string;
  department_id?: number;
  employment_type?: string;
  work_location?: string;
  is_featured?: boolean;
  page?: number;
  page_size?: number;
}): Promise<PaginatedJobPostings> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.department_id) query.append("department_id", String(params.department_id));
  if (params?.employment_type) query.append("employment_type", params.employment_type);
  if (params?.work_location) query.append("work_location", params.work_location);
  if (params?.is_featured !== undefined) query.append("is_featured", String(params.is_featured));
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedJobPostings>(`/jobs${queryString}`);
}

export async function fetchPublicJobDetail(id: number): Promise<JobPostingItem> {
  return apiRequest<JobPostingItem>(`/jobs/${id}`);
}

export async function fetchManageJobs(params?: {
  search?: string;
  status?: string;
  department_id?: number;
  page?: number;
  page_size?: number;
}): Promise<PaginatedJobPostings> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.department_id) query.append("department_id", String(params.department_id));
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedJobPostings>(`/jobs/manage/all${queryString}`);
}

export async function createJobPosting(payload: CreateJobPostingPayload): Promise<JobPostingItem> {
  return apiRequest<JobPostingItem>("/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateJobPosting(id: number, payload: Partial<Omit<CreateJobPostingPayload, "deadline">> & {deadline?: string | null}): Promise<JobPostingItem> {
  return apiRequest<JobPostingItem>(`/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function publishJobPosting(id: number): Promise<JobPostingItem> {
  return apiRequest<JobPostingItem>(`/jobs/${id}/publish`, {
    method: "POST",
  });
}

export async function pauseJobPosting(id: number): Promise<JobPostingItem> {
  return apiRequest<JobPostingItem>(`/jobs/${id}/pause`, {
    method: "POST",
  });
}

export async function deleteJobPosting(id: number): Promise<void> {
  return apiRequest<void>(`/jobs/${id}`, {
    method: "DELETE",
  });
}
