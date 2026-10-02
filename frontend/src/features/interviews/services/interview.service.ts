import { apiRequest } from "@/lib/api-client";

export interface InterviewerInfo {
  id: number;
  full_name: string;
  email: string;
}

export interface InterviewItem {
  id: number;
  code: string;
  application_id: number;
  candidate_name?: string;
  job_title?: string;
  title: string;
  interview_type: "online" | "offline";
  location_or_link: string;
  start_time: string;
  end_time: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  interviewers: InterviewerInfo[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedInterviews {
  items: InterviewItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface CreateInterviewPayload {
  application_id: number;
  title: string;
  interview_type: string;
  location_or_link: string;
  start_time: string;
  end_time: string;
  notes?: string;
  interviewer_ids?: number[];
}

export interface UpdateInterviewPayload {
  title?: string;
  interview_type?: string;
  location_or_link?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  status?: string;
  interviewer_ids?: number[];
}

export async function createInterview(payload: CreateInterviewPayload): Promise<InterviewItem> {
  return apiRequest<InterviewItem>("/interviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMyInterviews(): Promise<PaginatedInterviews> {
  return apiRequest<PaginatedInterviews>("/interviews/my");
}

export async function fetchManageInterviews(params?: {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedInterviews> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedInterviews>(`/interviews/manage/all${queryString}`);
}

export async function updateInterview(
  id: number,
  payload: UpdateInterviewPayload
): Promise<InterviewItem> {
  return apiRequest<InterviewItem>(`/interviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchApplicationInterviews(application_id: number): Promise<InterviewItem[]> {
  return apiRequest<InterviewItem[]>(`/applications/${application_id}/interviews`);
}
