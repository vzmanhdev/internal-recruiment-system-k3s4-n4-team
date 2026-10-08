import { apiRequest } from "@/lib/api-client";

export type AccountStatus = "active" | "pending" | "locked";

export interface ManagedUser {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  roles: string[];
  is_active: boolean;
  account_status: AccountStatus;
  lock_reason?: string;
  created_at?: string;
}

export interface UsersPage {
  items: ManagedUser[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const userService = {
  list(params: {search?:string; status?:string; role?:string; page?:number; pageSize?:number}): Promise<UsersPage> {
    const query = new URLSearchParams({
      search: params.search ?? "",
      status: params.status ?? "all",
      role: params.role ?? "all",
      page: String(params.page ?? 1),
      page_size: String(params.pageSize ?? 20),
    });
    return apiRequest<UsersPage>(`/admin/users?${query.toString()}`);
  },
  create(payload: {full_name:string; email:string; password:string; phone?:string; roles:string[]}): Promise<ManagedUser> {
    return apiRequest<ManagedUser>("/admin/users", {method:"POST", body:JSON.stringify(payload)});
  },
  updateRoles(userId:number, roles:string[]): Promise<ManagedUser> {
    return apiRequest<ManagedUser>(`/admin/users/${userId}/roles`, {method:"PUT", body:JSON.stringify({roles})});
  },
  lock(userId:number, reason:string): Promise<ManagedUser> {
    return apiRequest<ManagedUser>(`/admin/users/${userId}/lock`, {method:"POST", body:JSON.stringify({reason})});
  },
  unlock(userId:number): Promise<ManagedUser> {
    return apiRequest<ManagedUser>(`/admin/users/${userId}/unlock`, {method:"POST"});
  },
};
