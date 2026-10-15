import { apiRequest } from "@/lib/api-client";

export interface AnalyticsOverview {
  total_requisitions: number;
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  hired_applications: number;
  conversion_rate_pct: number;
  total_referrals: number;
  total_bonus_paid_vnd: number;
}

export interface FunnelStageCount {
  stage: string;
  stage_label: string;
  count: number;
  percentage: number;
}

export interface DepartmentStat {
  department_id: number;
  department_name: string;
  job_count: number;
  application_count: number;
  hired_count: number;
}

export interface TopReferrer {
  user_id: number;
  full_name: string;
  email: string;
  total_referrals: number;
  hired_referrals: number;
  total_bonus_vnd: number;
}

export interface ReferralAnalytics {
  total_referrals: number;
  pending_referrals: number;
  hired_referrals: number;
  total_bonus_paid_vnd: number;
  top_referrers: TopReferrer[];
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  return apiRequest<AnalyticsOverview>("/analytics/overview");
}

export async function fetchFunnelAnalytics(): Promise<FunnelStageCount[]> {
  return apiRequest<FunnelStageCount[]>("/analytics/funnel");
}

export async function fetchDepartmentAnalytics(): Promise<DepartmentStat[]> {
  return apiRequest<DepartmentStat[]>("/analytics/by-department");
}

export async function fetchReferralAnalytics(): Promise<ReferralAnalytics> {
  return apiRequest<ReferralAnalytics>("/analytics/referrals");
}
