import { apiRequest } from "@/lib/api-client";

export interface Department { id: number; name: string; code: string; parent_id: number | null; head_user_id: number | null; sort_order: number; is_active: boolean }
export interface JobTitle { id: number; name: string; department_id: number | null; level: string; min_salary?: number; max_salary?: number; description?: string; is_active: boolean }
export interface Criterion { id?: string; code: string; name: string; description?: string; weight: number; category?: string | null; benchmark_low?: string | null; benchmark_mid?: string | null; benchmark_high?: string | null }
export interface Framework { id: string; code: string; name: string; department?: string; applied_job_titles: string[]; status: string; criteria: Criterion[]; total_weight: number }
export interface Question { id: string; code: string; content: string; criteria_id: string; criteria_name?: string; job_title?: string; difficulty: string; suggested_answer?: string; times_used?: number }
export interface Headcount { id: number; department_id: number; year: number; budget_quantity: number; committed_quantity: number; remaining_quantity: number | null }
export interface Category { id: number; category_type: string; name: string; sort_order: number; is_active: boolean }

export interface ApprovalFlowStep {
  step_num: number;
  role: string;
  description: string;
}

export interface ApprovalFlow {
  id: number;
  name: string;
  department_id: number | null;
  department_name?: string;
  approval_type: string;
  version: string;
  steps: string[];
  steps_detail?: ApprovalFlowStep[];
  max_levels?: number;
  min_salary_threshold: number;
  max_salary_threshold: number;
  status: 'active' | 'draft' | 'inactive';
  is_active?: boolean;
  description?: string;
  updated_by_id?: number | null;
  updated_by_name?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

export interface ApprovalTypeOption {
  code: string;
  name: string;
  description?: string;
}

export interface ApprovalRoleOption {
  code: string;
  role_key?: string;
  name: string;
  description?: string;
}

export interface ApprovalFlowVersionItem {
  id: number;
  flow_id: number;
  version: string;
  snapshot: any;
  created_by_name?: string | null;
  change_reason?: string | null;
  created_at: string;
}

export interface Person { id: number; full_name: string; email: string; role?: string }
export type { Framework as CompetencyFramework };
export interface OnboardingTemplateItem { task_name: string; assigned_role: string; days_before_start: number; phase?: string | null; is_mandatory?: boolean; description?: string | null; sla_note?: string | null }
export interface OnboardingTemplateRow { id: number; department_id: number | null; name: string; items: OnboardingTemplateItem[]; is_active: boolean }

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const masterDataService = {
  departments: (includeInactive = true) => apiRequest<Department[]>(`/hr/departments${includeInactive ? "?include_inactive=true" : ""}`),
  saveDepartment: (d: Partial<Department>, id?: number) =>
    apiRequest<Department>(id ? `/hr/departments/${id}` : "/hr/departments", json(id ? "PUT" : "POST", d)),
  setDepartmentActive: (id: number, active: boolean) =>
    apiRequest<Department>(`/hr/departments/${id}/${active ? "activate" : "deactivate"}`, { method: "POST" }),
  deleteDepartment: (id: number) => apiRequest(`/hr/departments/${id}`, { method: "DELETE" }),

  jobTitles: () => apiRequest<JobTitle[]>("/hr/job-titles"),
  saveJobTitle: (t: Partial<JobTitle>, id?: number) => apiRequest<JobTitle>(id ? `/hr/job-titles/${id}` : "/hr/job-titles", json(id ? "PUT" : "POST", t)),
  deactivateJobTitle: (id: number) => apiRequest<JobTitle>(`/hr/job-titles/${id}/deactivate`, { method: "POST" }),

  frameworks: () => apiRequest<Framework[]>("/hr/competency-frameworks"),
  saveFramework: (f: Omit<Framework, "id" | "status" | "total_weight">, id?: string) =>
    apiRequest<Framework>(id ? `/hr/competency-frameworks/${id}` : "/hr/competency-frameworks", json(id ? "PUT" : "POST", f)),
  questions: (params = "") => apiRequest<Question[]>(`/hr/interview-questions${params}`),
  saveQuestion: (q: Partial<Question>, id?: string) => apiRequest<Question>(id ? `/hr/interview-questions/${id}` : "/hr/interview-questions", json(id ? "PUT" : "POST", q)),
  deactivateQuestion: (id: string) => apiRequest<Question>(`/hr/interview-questions/${id}/deactivate`, { method: "POST" }),

  headcounts: () => apiRequest<Headcount[]>("/hr/headcounts"),
  saveHeadcount: (h: { department_id: number; year: number; budget_quantity: number; reason?: string }) => apiRequest<Headcount>("/hr/headcounts", json("POST", h)),

  categories: () => apiRequest<Category[]>("/hr/categories"),
  createCategory: (c: { category_type: string; name: string; sort_order: number }) => apiRequest<Category>("/hr/categories", json("POST", c)),
  updateCategory: (id: number, c: { name: string; is_active: boolean }) => apiRequest<Category>(`/hr/categories/${id}`, json("PUT", c)),
  deleteCategory: (id: number) => apiRequest(`/hr/categories/${id}`, { method: "DELETE" }),
  reorderCategories: (ids: number[]) => apiRequest<Category[]>("/hr/categories/reorder", json("PUT", { ids })),

  approvalTypes: () => apiRequest<ApprovalTypeOption[]>("/hr/approval-types"),
  approvalRoles: () => apiRequest<ApprovalRoleOption[]>("/hr/approval-roles"),
  approvalFlows: (params = "") => apiRequest<ApprovalFlow[]>(`/hr/approval-flows${params ? (params.startsWith('?') ? params : `?${params}`) : ""}`),
  saveApprovalFlow: (f: Partial<ApprovalFlow>, id?: number) =>
    apiRequest<ApprovalFlow>(id ? `/hr/approval-flows/${id}` : "/hr/approval-flows", json(id ? "PUT" : "POST", f)),
  activateApprovalFlow: (id: number) => apiRequest<ApprovalFlow>(`/hr/approval-flows/${id}/activate`, { method: "POST" }),
  deactivateApprovalFlow: (id: number) => apiRequest<ApprovalFlow>(`/hr/approval-flows/${id}/deactivate`, { method: "POST" }),
  deleteApprovalFlow: (id: number) => apiRequest<{ success: boolean; message: string; id: number }>(`/hr/approval-flows/${id}`, { method: "DELETE" }),
  approvalFlowVersions: (id: number) => apiRequest<ApprovalFlowVersionItem[]>(`/hr/approval-flows/${id}/versions`),

  people: (role: string) => apiRequest<Person[]>(`/hr/people?role=${role}`),

  onboardingTemplates: () => apiRequest<OnboardingTemplateRow[]>("/hr/onboarding-templates"),
  /** Saving creates a new active version for the department (older versions are kept, inactive). */
  saveOnboardingTemplate: (tpl: { name: string; department_id: number | null; items: OnboardingTemplateItem[] }) =>
    apiRequest<OnboardingTemplateRow>("/hr/onboarding-templates", json("POST", tpl)),
};
