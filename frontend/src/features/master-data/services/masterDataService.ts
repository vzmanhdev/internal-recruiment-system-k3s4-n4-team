import { apiRequest } from "@/lib/api-client";
import type { DepartmentNode, JobTitleSalaryBand } from "@/components/MasterDataManagementView";

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  managerName?: string;
  managerTitle?: string;
  headcountCurrent?: number;
  headcountBudget?: number;
  active_jobs?: number;
  status?: "active" | "inactive";
  parentId?: string | null;
}

export interface UpdateDepartmentPayload {
  code?: string;
  name?: string;
  managerName?: string;
  managerTitle?: string;
  headcountCurrent?: number;
  headcountBudget?: number;
  active_jobs?: number;
  status?: "active" | "inactive";
  parentId?: string | null;
}

export interface CreateSalaryBandPayload {
  code: string;
  title: string;
  level: "Junior" | "Middle" | "Senior" | "Lead" | "Manager" | "Director";
  minSalary: number;
  maxSalary: number;
  department: string;
  status?: "active" | "inactive";
}

export interface UpdateSalaryBandPayload {
  code?: string;
  title?: string;
  level?: "Junior" | "Middle" | "Senior" | "Lead" | "Manager" | "Director";
  minSalary?: number;
  maxSalary?: number;
  department?: string;
  status?: "active" | "inactive";
}

export const masterDataService = {
  // 1. Departments API
  async getDepartments(): Promise<DepartmentNode[]> {
    return await apiRequest<DepartmentNode[]>("/master-data/departments", {
      method: "GET",
    });
  },

  async createDepartment(payload: CreateDepartmentPayload): Promise<DepartmentNode> {
    return await apiRequest<DepartmentNode>("/master-data/departments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateDepartment(id: string, payload: UpdateDepartmentPayload): Promise<DepartmentNode> {
    return await apiRequest<DepartmentNode>(`/master-data/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteDepartment(id: string): Promise<{ message: string; id: string }> {
    return await apiRequest<{ message: string; id: string }>(`/master-data/departments/${id}`, {
      method: "DELETE",
    });
  },

  // 2. Salary Bands API
  async getSalaryBands(): Promise<JobTitleSalaryBand[]> {
    return await apiRequest<JobTitleSalaryBand[]>("/master-data/salary-bands", {
      method: "GET",
    });
  },

  async createSalaryBand(payload: CreateSalaryBandPayload): Promise<JobTitleSalaryBand> {
    return await apiRequest<JobTitleSalaryBand>("/master-data/salary-bands", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateSalaryBand(id: string, payload: UpdateSalaryBandPayload): Promise<JobTitleSalaryBand> {
    return await apiRequest<JobTitleSalaryBand>(`/master-data/salary-bands/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteSalaryBand(id: string): Promise<{ message: string; id: string }> {
    return await apiRequest<{ message: string; id: string }>(`/master-data/salary-bands/${id}`, {
      method: "DELETE",
    });
  },
};
