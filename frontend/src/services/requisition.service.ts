import { apiRequest } from "@/lib/api-client";

export interface RequisitionApprovalLog {
  id: number;
  requisition_id: number;
  approver_id?: number | null;
  approver_name?: string | null;
  step_name?: string | null;
  action: string;
  comment?: string | null;
  created_at?: string;
}

export interface RequisitionItem {
  id: number;
  code: string;
  title: string;
  department_id: number;
  department_name?: string;
  quantity: number;
  reason: string;
  reason_detail?: string;
  priority: string;
  employment_type: string;
  work_location: string;
  min_salary?: number;
  max_salary?: number;
  is_salary_negotiable?: boolean;
  target_onboard_date?: string;
  job_description?: string;
  requirements?: string;
  benefits?: string;
  status: string;
  current_approval_step: string;
  reject_reason?: string;
  created_by_id: number;
  creator_name?: string;
  created_at?: string;
  updated_at?: string;
  approval_logs?: RequisitionApprovalLog[];
  approval_chain?: string[];
  approval_step_index?: number;
  days_open?: number | null;
  days_remaining?: number | null;
  is_overdue?: boolean;
  job_title_name?: string | null;
  job_title_id?: number | null;
  salary_justification?: string | null;
  recruiters?: Array<{ recruiter_id: number; full_name: string; assignment_type: string; account_status?: string; is_active?: boolean }>;
  needs_handover?: boolean;
  handover_reason_flag?: string | null;
}

export interface HandoverHistoryItem {
  id: number;
  requisition_id: number;
  requisition_code: string;
  requisition_title: string;
  approver_name: string;
  action: string;
  step_name: string;
  comment: string;
  created_at: string;
}

export const requisitionService = {
  async getRequisitions(status_filter?: string): Promise<RequisitionItem[]> {
    const query = status_filter ? `?status_filter=${status_filter}` : "";
    return apiRequest<RequisitionItem[]>(`/requisitions${query}`);
  },

  async getRequisitionById(id: number): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>(`/requisitions/${id}`);
  },

  async createRequisition(data: Partial<RequisitionItem>): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>("/requisitions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async approveRequisition(id: number, action: "approved" | "rejected" | "changes_requested", comment?: string): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>(`/requisitions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action, comment }),
    });
  },

  async updateRequisition(id: number, data: Partial<RequisitionItem>): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>(`/requisitions/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },

  async submitRequisition(id: number): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>(`/requisitions/${id}/submit`, { method: "POST" });
  },

  async closeRequisition(id: number, status: "filled" | "paused" | "cancelled", reason: string, confirm_active_candidates = false): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>(`/requisitions/${id}/close`, {
      method: "POST",
      body: JSON.stringify({ status, reason, confirm_active_candidates }),
    });
  },

  async assignRecruiter(
    id: number,
    recruiter_id: number,
    assignment_type: "primary" | "secondary" = "primary",
    handover_reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/requisitions/${id}/assign-recruiters`, {
      method: "POST",
      body: JSON.stringify({ recruiter_id, assignment_type, handover_reason }),
    });
  },

  async getHandoverHistory(requisition_id?: number): Promise<HandoverHistoryItem[]> {
    const q = requisition_id ? `?requisition_id=${requisition_id}` : "";
    return apiRequest<HandoverHistoryItem[]>(`/requisitions/handover-history${q}`);
  },

  async resumeRequisition(id: number, reason: string): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>(`/requisitions/${id}/resume`, { method: "POST", body: JSON.stringify({ reason }) });
  },

  async copyRequisition(id: number): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>(`/requisitions/${id}/copy`, { method: "POST" });
  },

  /** Nudge the approvers of the current step (creator only, once per day). */
  async remind(id: number): Promise<{ sent: number }> {
    return apiRequest(`/requisitions/${id}/remind`, { method: "POST" });
  },

  async deleteDraft(id: number): Promise<{ success: boolean }> {
    return apiRequest(`/requisitions/${id}`, { method: "DELETE" });
  },
};
