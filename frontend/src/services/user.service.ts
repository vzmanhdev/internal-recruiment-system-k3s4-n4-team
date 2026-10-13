import { apiRequest, API_BASE_URL } from "@/lib/api-client";
import { UserItem } from "@/app/admin/users/components/types";

export interface PaginatedUsersResponse {
  items: UserItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface CreateUserData {
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  roles: string[];
  department?: string;
}

export interface ImportRowPreview {
  row_num?: number;
  row_number?: number;
  full_name: string;
  email: string;
  role?: string;
  roles?: string[];
  phone?: string;
  department?: string;
  employee_code?: string;
  status: "VALID" | "ERROR" | "DUPLICATE";
  error_reason?: string;
}

export interface ImportPreviewResponse {
  job_id: string;
  total: number;
  valid_count: number;
  error_count: number;
  duplicate_count: number;
  items: ImportRowPreview[];
  page: number;
  page_size: number;
  pages: number;
}

export interface ImportCommitResponse {
  job_id: string;
  status: string;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row_number: number; email: string; reason: string }>;
  message: string;
}

export const userService = {
  async getUsers(params: GetUsersParams = {}): Promise<PaginatedUsersResponse> {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.pageSize) q.set("pageSize", String(params.pageSize));
    if (params.search?.trim()) q.set("search", params.search.trim());
    if (params.role && params.role !== "all") q.set("role", params.role);
    if (params.status && params.status !== "all") q.set("status", params.status);
    if (params.department && params.department !== "all") q.set("department", params.department);
    if (params.sortBy) q.set("sortBy", params.sortBy);
    if (params.sortOrder) q.set("sortOrder", params.sortOrder);

    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return apiRequest<PaginatedUsersResponse>(`/admin/users${queryStr}`);
  },

  async createUser(data: CreateUserData): Promise<UserItem> {
    return apiRequest<UserItem>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateRoles(userId: number, roles: string[]): Promise<UserItem> {
    return apiRequest<UserItem>(`/admin/users/${userId}/roles`, {
      method: "PUT",
      body: JSON.stringify({ roles }),
    });
  },

  async lockUser(userId: number, reason: string): Promise<UserItem> {
    return apiRequest<UserItem>(`/admin/users/${userId}/lock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  async unlockUser(userId: number): Promise<UserItem> {
    return apiRequest<UserItem>(`/admin/users/${userId}/unlock`, {
      method: "POST",
    });
  },

  async previewImport(file: FormData): Promise<ImportPreviewResponse> {
    return apiRequest<ImportPreviewResponse>("/admin/users/import/preview", {
      method: "POST",
      body: file,
    });
  },

  async getImportPreview(
    jobId: string,
    params: { page?: number; pageSize?: number; statusFilter?: string } = {}
  ): Promise<ImportPreviewResponse> {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.pageSize) q.set("pageSize", String(params.pageSize));
    if (params.statusFilter && params.statusFilter !== "all") {
      q.set("status_filter", params.statusFilter);
    }
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return apiRequest<ImportPreviewResponse>(`/admin/users/import/preview/${jobId}${queryStr}`);
  },

  async commitImport(jobId: string, skipErrors: boolean = true): Promise<ImportCommitResponse> {
    return apiRequest<ImportCommitResponse>("/admin/users/import/commit", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId, skip_errors: skipErrors }),
    });
  },

  async downloadTemplate(): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${API_BASE_URL}/admin/users/import/template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error("Không thể tải file mẫu hoặc phiên đăng nhập đã hết hạn.");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mau_import_nguoi_dung.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};
