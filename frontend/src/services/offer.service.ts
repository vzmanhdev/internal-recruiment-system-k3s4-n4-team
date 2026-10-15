import { apiRequest } from "@/lib/api-client";

export interface OnboardingItem {
  id: number;
  offer_id: number;
  task_name: string;
  assigned_role: string;
  responsible_user_id?: number | null;
  responsible_user_name?: string | null;
  due_date?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
}

export interface OfferApprovalLogItem {
  id: number;
  actor_id?: number | null;
  action: string;
  level?: string | null;
  comment?: string | null;
  actor_name?: string | null;
  created_at?: string;
}

export interface OfferItem {
  id: number;
  application_id: number;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  offered_salary: number;
  currency: string;
  probation_salary_percentage: number;
  start_date: string;
  probation_duration_months: number;
  work_location: string;
  notes?: string;
  status: string;
  decline_reason?: string;
  salary_justification?: string | null;
  requires_escalation?: boolean;
  approval_level?: string | null;
  response_deadline?: string | null;
  revision?: number;
  onboarding?: OnboardingItem[];
  onboarding_progress?: number;
  approval_logs?: OfferApprovalLogItem[];
  created_at?: string;
  allowance?: number;
  /** Review context added by the API (band only for offer approvers / salary viewers). */
  department?: string | null;
  requisition_code?: string | null;
  created_by_name?: string | null;
  band_min?: number | null;
  band_max?: number | null;
}

export type OfferDecisionAction = "approved" | "rejected" | "changes_requested";

export const offerService = {
  async getOffers(status_filter?: string): Promise<OfferItem[]> {
    const query = status_filter ? `?status_filter=${encodeURIComponent(status_filter)}` : "";
    return apiRequest<OfferItem[]>(`/offers${query}`);
  },

  async getOfferById(id: number): Promise<OfferItem> {
    return apiRequest<OfferItem>(`/offers/${id}`);
  },

  async createOffer(data: Partial<OfferItem> & { save_as_draft?: boolean }): Promise<OfferItem> {
    return apiRequest<OfferItem>("/offers", { method: "POST", body: JSON.stringify(data) });
  },

  async submitOffer(id: number): Promise<OfferItem> {
    return apiRequest<OfferItem>(`/offers/${id}/submit`, { method: "POST" });
  },

  async decide(id: number, action: OfferDecisionAction, comment?: string): Promise<OfferItem> {
    return apiRequest<OfferItem>(`/offers/${id}/decision`, { method: "POST", body: JSON.stringify({ action, comment }) });
  },

  async sendOffer(id: number): Promise<OfferItem> {
    return apiRequest<OfferItem>(`/offers/${id}/send`, { method: "POST" });
  },

  async respond(id: number, decision: "accepted" | "declined", reason_category?: string, comment?: string): Promise<OfferItem> {
    return apiRequest<OfferItem>(`/offers/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ decision, reason_category, comment }),
    });
  },

  async updateOnboardingItem(
    offerId: number,
    itemId: number,
    data: { is_completed?: boolean; responsible_user_id?: number; due_date?: string }
  ): Promise<OfferItem> {
    return apiRequest<OfferItem>(`/offers/${offerId}/onboarding/${itemId}`, { method: "PUT", body: JSON.stringify(data) });
  },
};
