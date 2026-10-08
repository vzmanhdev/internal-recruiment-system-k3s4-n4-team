import { apiRequest } from "@/lib/legacy-api-client";

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
  onboarding?: any[];
  created_at?: string;
}

export const offerService = {
  async getOffers(status_filter?: string): Promise<OfferItem[]> {
    const query = status_filter ? `?status_filter=${status_filter}` : "";
    return apiRequest<OfferItem[]>(`/offers${query}`);
  },

  async getOfferById(id: number): Promise<OfferItem> {
    return apiRequest<OfferItem>(`/offers/${id}`);
  },

  async createOffer(data: Partial<OfferItem>): Promise<OfferItem> {
    return apiRequest<OfferItem>("/offers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateStatus(id: number, status: string, decline_reason?: string): Promise<OfferItem> {
    return apiRequest<OfferItem>(`/offers/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, decline_reason }),
    });
  }
};
