import { apiRequest } from "@/lib/legacy-api-client";

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
  approval_logs?: any[];
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

  async approveRequisition(id: number, action: "approved" | "rejected", comment?: string): Promise<RequisitionItem> {
    return apiRequest<RequisitionItem>(`/requisitions/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action, comment }),
    });
  }
};
