import { apiRequest } from "@/lib/legacy-api-client";

export interface AnalyticsOverview {
  kpis: {
    total_jobs: number;
    active_jobs: number;
    total_applications: number;
    new_applications: number;
    hired_count: number;
    conversion_rate: number;
    pending_requisitions: number;
    approved_requisitions: number;
    total_interviews: number;
    completed_interviews: number;
    total_referrals: number;
    hired_referrals: number;
  };
  application_pipeline: {
    submitted: number;
    screening: number;
    interviewing: number;
    offered: number;
    hired: number;
    rejected: number;
  };
}

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    return apiRequest<AnalyticsOverview>("/analytics/overview");
  }
};
