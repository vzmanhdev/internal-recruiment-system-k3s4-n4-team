import { apiRequest } from "@/lib/api-client";
import { EvaluationItem } from "@/features/referrals/services/referral.service";
export interface HiringApplication {
  id: number;
  code: string;
  full_name: string;
  email: string;
  job_title?: string;
  status: string;
  evaluation_count: number;
  average_score: number | null;
  hiring_decision: {
    decision: "selected" | "rejected";
    note: string;
    decided_by: string;
    updated_at: string;
  } | null;
}
export interface HiringDetail extends HiringApplication {
  rounds: Array<{
    id: number;
    title: string;
    round_name: string;
    round_number: number;
    start_time: string;
    status: string;
    evaluations: EvaluationItem[];
  }>;
  general_evaluations: EvaluationItem[];
}
export const fetchHiringApplications = (
  search: string,
  decision: string,
  page: number,
) =>
  apiRequest<{
    items: HiringApplication[];
    page: number;
    pages: number;
    total: number;
  }>(
    `/hiring/applications?${new URLSearchParams({ search, decision, page: String(page) })}`,
  );
export const fetchHiringDetail = (id: number) =>
  apiRequest<HiringDetail>(`/hiring/applications/${id}`);
export const saveHiringDecision = (
  id: number,
  decision: "selected" | "rejected",
  note: string,
) =>
  apiRequest<HiringDetail>(`/hiring/applications/${id}/decision`, {
    method: "PUT",
    body: JSON.stringify({ decision, note }),
  });
