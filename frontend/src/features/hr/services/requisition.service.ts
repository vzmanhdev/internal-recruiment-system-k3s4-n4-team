import { apiRequest } from "@/lib/api-client";

export interface RequisitionApprovalLog {
  id: number;
  requisition_id: number;
  approver_id: number;
  approver_name?: string;
  approver_role?: string;
  action: string;
  comment?: string;
  created_at: string;
}

export interface RequisitionItem {
  id: number;
  code: string;
  title: string;
  department_id: number;
  department_name?: string;
  job_title_id?: number;
  job_title_name?: string;
  quantity: number;
  reason: string;
  replacement_for?: string;
  min_salary?: number;
  max_salary?: number;
  work_location: string;
  employment_type: string;
  experience_years: string;
  deadline?: string;
  job_description?: string;
  requirements?: string;
  benefits?: string;
  status: "draft" | "pending_dept" | "pending_hr" | "approved" | "rejected" | "closed";
  created_by_id: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
  approval_logs: RequisitionApprovalLog[];
}

export interface PaginatedRequisitions {
  items: RequisitionItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface CreateRequisitionPayload {
  title: string;
  department_id: number;
  job_title_id?: number;
  quantity: number;
  reason: string;
  replacement_for?: string;
  min_salary?: number;
  max_salary?: number;
  work_location?: string;
  employment_type?: string;
  experience_years?: string;
  deadline?: string;
  job_description?: string;
  requirements?: string;
  benefits?: string;
  submit_immediately?: boolean;
}

export interface UpdateRequisitionPayload {
  title?: string;
  department_id?: number;
  job_title_id?: number;
  quantity?: number;
  reason?: string;
  replacement_for?: string;
  min_salary?: number;
  max_salary?: number;
  work_location?: string;
  employment_type?: string;
  experience_years?: string;
  deadline?: string;
  job_description?: string;
  requirements?: string;
  benefits?: string;
}

export async function fetchRequisitions(params?: {
  search?: string;
  status?: string;
  department_id?: number;
  page?: number;
  page_size?: number;
}): Promise<PaginatedRequisitions> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.department_id) query.append("department_id", String(params.department_id));
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedRequisitions>(`/requisitions${queryString}`);
}

export async function createRequisition(payload: CreateRequisitionPayload): Promise<RequisitionItem> {
  return apiRequest<RequisitionItem>("/requisitions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRequisitionById(id: number): Promise<RequisitionItem> {
  return apiRequest<RequisitionItem>(`/requisitions/${id}`);
}

export async function updateRequisition(id: number, payload: UpdateRequisitionPayload): Promise<RequisitionItem> {
  return apiRequest<RequisitionItem>(`/requisitions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRequisition(id: number): Promise<void> {
  return apiRequest<void>(`/requisitions/${id}`, {
    method: "DELETE",
  });
}

export async function submitRequisition(id: number): Promise<RequisitionItem> {
  return apiRequest<RequisitionItem>(`/requisitions/${id}/submit`, {
    method: "POST",
  });
}

export async function approveRequisition(id: number, comment?: string): Promise<RequisitionItem> {
  return apiRequest<RequisitionItem>(`/requisitions/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export async function rejectRequisition(id: number, comment: string): Promise<RequisitionItem> {
  return apiRequest<RequisitionItem>(`/requisitions/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}
