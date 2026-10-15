import { apiRequest } from "@/lib/api-client";

export interface ReferralItem {
  id: number;
  referrer_id: number;
  referrer_name?: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  job_posting_id: number;
  job_title?: string;
  cv_url?: string;
  relationship_note?: string;
  bonus_amount: number;
  status: string;
  payout_status: string;
  candidate_status?: string | null;
  created_at?: string;
}

export interface EvaluationItem {
  id: number;
  application_id: number;
  interview_id?: number | null;
  evaluator_id: number;
  evaluator_name?: string | null;
  overall_score: number;
  weighted_score?: number | null;
  recommendation: "hire" | "hold" | "reject";
  comments?: string | null;
  strengths?: string | null;
  created_at?: string;
}

export const referralService = {
  async getReferrals(): Promise<ReferralItem[]> {
    return apiRequest<ReferralItem[]>("/referrals");
  },

  async createReferral(data: Partial<ReferralItem>): Promise<ReferralItem> {
    return apiRequest<ReferralItem>("/referrals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async listEvaluations(applicationId: number): Promise<EvaluationItem[]> {
    return apiRequest<EvaluationItem[]>(`/referrals/evaluations?application_id=${applicationId}`);
  },

  async submitEvaluation(data: {
    application_id: number;
    interview_id?: number;
    overall_score?: number;
    technical_score?: number;
    culture_fit_score?: number;
    communication_score?: number;
    strengths?: string;
    recommendation: "hire" | "hold" | "reject";
    comments?: string;
    ratings?: Array<{ criterion_id: string; score: number; comment?: string }>;
  }): Promise<EvaluationItem> {
    return apiRequest<EvaluationItem>("/referrals/evaluations", { method: "POST", body: JSON.stringify(data) });
  },
};
