import { apiRequest } from "@/lib/api-client";

export interface ApplicationLogItem {
  id: number;
  application_id: number;
  user_id?: number;
  user_name?: string;
  from_status: string;
  to_status: string;
  note?: string;
  created_at: string;
}

export interface ApplicationItem {
  id: number;
  code: string;
  job_id: number;
  job_code?: string;
  job_title?: string;
  department_name?: string;
  candidate_id?: number;
  full_name: string;
  email: string;
  phone: string;
  cv_url: string;
  cv_filename?: string;
  cv_content_type?: string;
  cv_extracted_data: Record<string, unknown>;
  tags: string[];
  recruiter_notes?: string;
  current_company?: string;
  current_position?: string;
  years_of_experience?: number;
  cover_letter?: string;
  current_department?: string;
  referral_code?: string;
  status: "applied" | "screening" | "interviewing" | "offered" | "hired" | "rejected" | "withdrawn";
  created_at: string;
  updated_at: string;
  logs: ApplicationLogItem[];
}

export interface PaginatedApplications {
  items: ApplicationItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface SubmitApplicationPayload {
  job_id: number;
  full_name: string;
  email: string;
  phone: string;
  cv_url: string;
  cover_letter?: string;
  current_department?: string;
  referral_code?: string;
  cv_filename?: string;
  cv_content_type?: string;
  website?: string;
  started_at?: string;
}

export interface CvUploadResult {
  url: string;
  filename: string;
  content_type: string;
  size: number;
  extracted_data: Record<string, unknown>;
}

export interface TrackingResult {
  code: string;
  job_title?: string;
  department_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  history: Array<{ to_status: string; created_at: string }>;
}

export async function submitApplication(payload: SubmitApplicationPayload): Promise<ApplicationItem> {
  return apiRequest<ApplicationItem>("/applications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadCv(file: File): Promise<CvUploadResult> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${base}/applications/upload-cv`, { method: "POST", body: form });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Không thể tải CV lên hệ thống.");
  }
  return response.json();
}

export async function trackApplication(code: string): Promise<TrackingResult> {
  return apiRequest<TrackingResult>("/applications/track", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export async function fetchMyApplications(): Promise<PaginatedApplications> {
  return apiRequest<PaginatedApplications>("/applications/my");
}

export async function fetchManageApplications(params?: {
  search?: string;
  job_id?: number;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedApplications> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.job_id) query.append("job_id", String(params.job_id));
  if (params?.status) query.append("status", params.status);
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedApplications>(`/applications/manage/all${queryString}`);
}

export async function fetchApplicationDetail(id: number): Promise<ApplicationItem> {
  return apiRequest<ApplicationItem>(`/applications/${id}`);
}

export async function updateCandidateProfile(
  id: number,
  payload: Partial<Pick<ApplicationItem, "full_name" | "email" | "phone" | "current_company" | "current_position" | "years_of_experience" | "cv_extracted_data" | "tags" | "recruiter_notes">>,
): Promise<ApplicationItem> {
  return apiRequest<ApplicationItem>(`/applications/${id}/profile`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateApplicationStage(id: number, to_status: string, note?: string): Promise<ApplicationItem> {
  return apiRequest<ApplicationItem>(`/applications/${id}/stage`, {
    method: "POST",
    body: JSON.stringify({ to_status, note }),
  });
}

export async function withdrawApplication(id: number): Promise<ApplicationItem> {
  return apiRequest<ApplicationItem>(`/applications/${id}/withdraw`, { method: "POST" });
}
