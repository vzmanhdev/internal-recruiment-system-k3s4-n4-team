import { apiRequest } from "@/lib/api-client";

export interface RequisitionApprovalLog {
  id: number;
  requisition_id: number;
  approver_id?: number | null;
  approver_name?: string | null;
  approver_email?: string | null;
  approver_role?: string | null;
  approver_department?: string | null;
  step_code?: string | null;
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
  current_approver_info?: {
    step_code: string;
    step_label: string;
    target_roles?: string[];
    approvers: Array<{
      id: number;
      full_name: string;
      email: string;
      role: string;
      department?: string;
    }>;
    waited_hours?: number;
    is_overdue?: boolean;
    reject_reason?: string;
  };
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

export interface RequisitionFilterParams {
  search?: string;
  status_filter?: string;
  department_id?: number;
  recruiter_id?: number;
  date_from?: string;
  date_to?: string;
  overdue_only?: boolean;
  needs_handover_only?: boolean;
}

export const requisitionService = {
  async getRequisitions(params?: RequisitionFilterParams | string): Promise<RequisitionItem[]> {
    if (typeof params === "string") {
      const query = params ? `?status_filter=${encodeURIComponent(params)}` : "";
      return apiRequest<RequisitionItem[]>(`/requisitions${query}`);
    }
    if (!params) {
      return apiRequest<RequisitionItem[]>("/requisitions");
    }
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.status_filter && params.status_filter !== "all") searchParams.set("status_filter", params.status_filter);
    if (params.department_id) searchParams.set("department_id", String(params.department_id));
    if (params.recruiter_id) searchParams.set("recruiter_id", String(params.recruiter_id));
    if (params.date_from) searchParams.set("date_from", params.date_from);
    if (params.date_to) searchParams.set("date_to", params.date_to);
    if (params.overdue_only) searchParams.set("overdue_only", "true");
    if (params.needs_handover_only) searchParams.set("needs_handover_only", "true");
    const qs = searchParams.toString();
    return apiRequest<RequisitionItem[]>(`/requisitions${qs ? `?${qs}` : ""}`);
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
  async remind(id: number): Promise<{
    sent: number;
    code?: string;
    title?: string;
    recipients?: Array<{ id: number; name: string; email: string; role: string }>;
    message?: string;
  }> {
    return apiRequest(`/requisitions/${id}/remind`, { method: "POST" });
  },

  async deleteDraft(id: number): Promise<{ success: boolean }> {
    return apiRequest(`/requisitions/${id}`, { method: "DELETE" });
  },

  async checkSalaryBand(job_title_id: number, min_salary?: number, max_salary?: number): Promise<{ outside: boolean; requires_justification: boolean }> {
    const p = new URLSearchParams({ job_title_id: String(job_title_id) });
    if (min_salary !== undefined && min_salary !== null) p.append("min_salary", String(min_salary));
    if (max_salary !== undefined && max_salary !== null) p.append("max_salary", String(max_salary));
    return apiRequest<{ outside: boolean; requires_justification: boolean }>(`/requisitions/check-salary-band?${p.toString()}`);
  },
};
