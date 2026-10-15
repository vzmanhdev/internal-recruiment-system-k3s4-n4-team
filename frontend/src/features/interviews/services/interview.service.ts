import { apiRequest } from "@/lib/api-client";

export interface InterviewerInfo {
  id: number;
  full_name: string;
  email: string;
}

export interface AvailableInterviewer extends InterviewerInfo {
  roles: string[];
}

export interface InterviewItem {
  competency_category?: string;
  is_final_round: boolean;
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
  candidate_response?:
    "pending" | "confirmed" | "declined" | "reschedule_requested";
  candidate_response_at?: string;
  candidate_response_note?: string;
  candidate_proposed_start_time?: string;
  response_token?: string;
  candidate_email?: string;
  accepts_response?: boolean;
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
  competency_category?: string;
  is_final_round?: boolean;
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
  competency_category?: string;
  is_final_round?: boolean;
  title?: string;
  interview_type?: string;
  location_or_link?: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  status?: string;
  interviewer_ids?: number[];
}

export interface InterviewConflict {
  interview_id: number;
  code: string;
  title: string;
  start_time: string;
  end_time: string;
  reason: string;
}

export interface InterviewConflictResult {
  has_conflict: boolean;
  conflicts: InterviewConflict[];
}

export interface CandidateInterviewReply {
  response: "confirmed" | "declined" | "reschedule_requested";
  note?: string;
  proposed_start_time?: string;
}

export async function createInterview(
  payload: CreateInterviewPayload,
): Promise<InterviewItem> {
  return apiRequest<InterviewItem>("/interviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createInterviewBatch(
  interviews: CreateInterviewPayload[],
): Promise<InterviewItem[]> {
  return apiRequest<InterviewItem[]>("/interviews/batch", {
    method: "POST",
    body: JSON.stringify({ interviews }),
  });
}

export async function sendInterviewInvitation(
  id: number,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/interviews/${id}/send-invitation`, {
    method: "POST",
  });
}

export async function fetchMyInterviews(): Promise<PaginatedInterviews> {
  const first = await apiRequest<PaginatedInterviews>(
    "/interviews/my?page_size=100",
  );
  const rest = await Promise.all(
    Array.from({ length: first.pages - 1 }, (_, index) =>
      apiRequest<PaginatedInterviews>(
        `/interviews/my?page_size=100&page=${index + 2}`,
      ),
    ),
  );
  return {
    ...first,
    items: [...first.items, ...rest.flatMap((page) => page.items)],
  };
}

export async function fetchCandidateInterviews(): Promise<PaginatedInterviews> {
  return apiRequest<PaginatedInterviews>("/interviews/candidate/my");
}

export async function respondToInterview(
  id: number,
  response: "confirmed" | "declined" | "reschedule_requested",
  note?: string,
  proposed_start_time?: string,
): Promise<InterviewItem> {
  return apiRequest<InterviewItem>(`/interviews/${id}/respond`, {
    method: "POST",
    body: JSON.stringify({ response, note, proposed_start_time }),
  });
}

export async function checkInterviewConflicts(payload: {
  start_time: string;
  end_time: string;
  interviewer_ids: number[];
  interview_type: string;
  location_or_link: string;
  exclude_interview_id?: number;
}): Promise<InterviewConflictResult> {
  return apiRequest<InterviewConflictResult>("/interviews/check-conflicts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchAvailableInterviewers(): Promise<
  AvailableInterviewer[]
> {
  return apiRequest<AvailableInterviewer[]>("/interviews/interviewers");
}

export function fetchInterviewFrameworks(): Promise<string[]> {
  return apiRequest("/interviews/competency-frameworks");
}

export async function fetchPublicInterview(
  token: string,
): Promise<InterviewItem> {
  return apiRequest<InterviewItem>(
    `/interviews/public/${encodeURIComponent(token)}`,
  );
}

export async function respondToPublicInterview(
  token: string,
  payload: CandidateInterviewReply,
): Promise<InterviewItem> {
  return apiRequest<InterviewItem>(
    `/interviews/public/${encodeURIComponent(token)}/respond`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
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
  return apiRequest<PaginatedInterviews>(
    `/interviews/manage/all${queryString}`,
  );
}

export async function updateInterview(
  id: number,
  payload: UpdateInterviewPayload,
): Promise<InterviewItem> {
  return apiRequest<InterviewItem>(`/interviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchApplicationInterviews(
  application_id: number,
): Promise<InterviewItem[]> {
  return apiRequest<InterviewItem[]>(
    `/applications/${application_id}/interviews`,
  );
}
