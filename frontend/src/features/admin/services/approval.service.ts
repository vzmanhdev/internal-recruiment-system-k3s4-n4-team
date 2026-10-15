import { apiRequest } from "@/lib/api-client";

export interface PendingUser {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export const approvalService = {
  listPending(): Promise<PendingUser[]> {
    return apiRequest<PendingUser[]>("/auth/pending-users");
  },
  approve(userId: number): Promise<PendingUser> {
    return apiRequest<PendingUser>(`/auth/users/${userId}/approve`, { method: "POST" });
  },
};
