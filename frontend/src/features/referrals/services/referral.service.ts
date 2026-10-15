import { apiRequest } from "@/lib/api-client";

export interface ReferralItem {
  id: number;
  code: string;
  referrer_id: number;
  referrer_name?: string;
  job_id: number;
  job_title?: string;
  department_name?: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  cv_url: string;
  relationship_note?: string;
  status:
    | "pending"
    | "contacted"
    | "interviewed"
    | "hired"
    | "bonus_paid"
    | "rejected";
  bonus_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedReferrals {
  items: ReferralItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface CreateReferralPayload {
  job_id: number;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  cv_url: string;
  relationship_note?: string;
}

export interface EvaluationItem {
  interview_id?: number;
  framework_name?: string;
  criteria_scores: Array<{id: number; name: string; score: number; weight: number; comment: string}>;
  id: number;
  application_id: number;
  evaluator_id: number;
  evaluator_name?: string;
  overall_score: number;
  competency_score: number;
  culture_fit_score: number;
  recommendation: "strong_hire" | "hire" | "hold" | "reject";
  feedback: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEvaluationPayload {
  overall_score: number;
  competency_score: number;
  culture_fit_score: number;
  recommendation: string;
  feedback: string;
}

export async function createReferral(
  payload: CreateReferralPayload,
): Promise<ReferralItem> {
  return apiRequest<ReferralItem>("/referrals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMyReferrals(): Promise<PaginatedReferrals> {
  return apiRequest<PaginatedReferrals>("/referrals/my");
}

export async function fetchManageReferrals(params?: {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedReferrals> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedReferrals>(`/referrals/manage/all${queryString}`);
}

export async function updateReferralStatus(
  id: number,
  status: string,
  bonus_amount?: number,
): Promise<ReferralItem> {
  return apiRequest<ReferralItem>(`/referrals/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status, bonus_amount }),
  });
}

export async function createEvaluation(
  application_id: number,
  payload: CreateEvaluationPayload,
): Promise<EvaluationItem> {
  return apiRequest<EvaluationItem>(
    `/applications/${application_id}/evaluations`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchEvaluations(
  application_id: number,
): Promise<EvaluationItem[]> {
  return apiRequest<EvaluationItem[]>(
    `/applications/${application_id}/evaluations`,
  );
}

export interface CandidateScoreComparison {
  criteria_scores: Array<{
    id: number;
    name: string;
    weight: number;
    score: number;
  }>;
  total_points: number;
  application_id: number;
  candidate_name: string;
  job_title?: string;
  fit_score: number;
  overall_score: number;
  competency_score: number;
  culture_fit_score: number;
  evaluation_count: number;
  recommendations: string[];
  evaluators: EvaluationItem[];
}

export async function fetchEvaluationComparison(
  applicationIds: number[] = [],
  finalOnly = false,
): Promise<CandidateScoreComparison[]> {
  const params = new URLSearchParams({ final_only: String(finalOnly) });
  if (applicationIds.length)
    params.set("application_ids", applicationIds.join(","));
  const query = `?${params.toString()}`;
  return apiRequest<CandidateScoreComparison[]>(
    `/evaluations/comparison${query}`,
  );
}
