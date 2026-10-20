import { apiRequest } from "@/lib/api-client";

export interface SlaRuleItem {
  id: number;
  stage: string;
  max_days: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SlaCheckResult {
  success: boolean;
  flagged: number;
  reminded: number;
  overdue_application_ids: number[];
  message: string;
}

export const slaService = {
  getRules: () => apiRequest<SlaRuleItem[]>("/hr/sla-rules"),

  updateRule: (stage: string, max_days: number, is_active: boolean = true) =>
    apiRequest<SlaRuleItem>("/hr/sla-rules", {
      method: "POST",
      body: JSON.stringify({ stage, max_days, is_active }),
    }),

  triggerCheck: () =>
    apiRequest<SlaCheckResult>("/hr/sla-check", {
      method: "POST",
    }),
};
