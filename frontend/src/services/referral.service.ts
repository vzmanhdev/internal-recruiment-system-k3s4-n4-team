import { apiRequest } from "@/lib/legacy-api-client";

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
  }
};
