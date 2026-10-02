import { apiRequest } from "@/lib/api-client";

export interface OfferItem {
  id: number;
  code: string;
  application_id: number;
  candidate_name?: string;
  candidate_email?: string;
  position_title: string;
  offered_salary: number;
  start_date: string;
  probation_period_months: number;
  work_location: string;
  expiration_date: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedOffers {
  items: OfferItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface CreateOfferPayload {
  application_id: number;
  position_title: string;
  offered_salary: number;
  start_date: string;
  probation_period_months?: number;
  work_location: string;
  expiration_date: string;
  notes?: string;
}

export interface OnboardingItem {
  id: number;
  application_id: number;
  candidate_name?: string;
  job_title?: string;
  department_name?: string;
  welcome_email_sent: boolean;
  equipment_prepared: boolean;
  account_created: boolean;
  documents_submitted: boolean;
  orientation_scheduled: boolean;
  status: "pending" | "in_progress" | "completed";
  created_at: string;
  updated_at: string;
}

export interface PaginatedOnboarding {
  items: OnboardingItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export async function createOffer(payload: CreateOfferPayload): Promise<OfferItem> {
  return apiRequest<OfferItem>("/offers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchManageOffers(params?: {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedOffers> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status) query.append("status", params.status);
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedOffers>(`/offers/manage/all${queryString}`);
}

export async function updateOfferStatus(
  id: number,
  status: string,
  notes?: string
): Promise<OfferItem> {
  return apiRequest<OfferItem>(`/offers/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status, notes }),
  });
}

export async function fetchApplicationOffer(application_id: number): Promise<OfferItem | null> {
  return apiRequest<OfferItem | null>(`/applications/${application_id}/offer`);
}

export async function fetchManageOnboarding(params?: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedOnboarding> {
  const query = new URLSearchParams();
  if (params?.status) query.append("status", params.status);
  if (params?.page) query.append("page", String(params.page));
  if (params?.page_size) query.append("page_size", String(params.page_size));

  const queryString = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<PaginatedOnboarding>(`/onboarding/manage/all${queryString}`);
}

export async function updateOnboarding(
  id: number,
  payload: Partial<OnboardingItem>
): Promise<OnboardingItem> {
  return apiRequest<OnboardingItem>(`/onboarding/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
