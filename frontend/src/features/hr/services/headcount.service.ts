import { apiRequest } from "@/lib/api-client";
import type { RequisitionItem } from "./requisition.service";
import type { JobPostingItem } from "@/features/jobs/services/job-posting.service";

export interface HeadcountBudget {
  id: number; department_id: number; department_name: string;
  headcount_limit: number; monthly_salary_limit: number;
  reserved_headcount: number; reserved_monthly_salary: number;
  remaining_headcount: number; remaining_monthly_salary: number;
}
export interface BudgetCheck { blocked: boolean; reason: string | null; requested_headcount: number; requested_monthly_salary: number; reserved: boolean; budget: HeadcountBudget | null; }
export interface Recruiter { id: number; full_name: string; email: string; }
export const headcountService = {
  budgets: () => apiRequest<HeadcountBudget[]>("/headcount/budgets"),
  saveBudget: (department: number, payload: {headcount_limit: number; monthly_salary_limit: number}) => apiRequest<HeadcountBudget>(`/headcount/budgets/${department}`, {method:"PUT",body:JSON.stringify(payload)}),
  recruiters: () => apiRequest<Recruiter[]>("/headcount/recruiters"),
  check: (id: number) => apiRequest<BudgetCheck>(`/requisitions/${id}/budget-check`),
  assign: (id: number, recruiter_id: number) => apiRequest<RequisitionItem>(`/requisitions/${id}/assign`, {method:"PUT",body:JSON.stringify({recruiter_id})}),
  posting: (id: number) => apiRequest<JobPostingItem>(`/requisitions/${id}/posting`, {method:"POST"}),
};
