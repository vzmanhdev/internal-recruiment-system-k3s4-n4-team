import { apiRequest } from "@/lib/api-client";
import type { LoginRequest, RegisterRequest } from "../types/auth.types";

export interface UserItem {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  employee_code?: string;
  avatar_url?: string;
  role: string;
  redirect_url?: string;
  is_active: boolean;
  account_status?: string;
  lock_reason?: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  redirect_url?: string;
  user: UserItem;
}

export interface PasswordResetInitResponse {
  message: string;
  reset_session_id: string;
  masked_email: string;
  expires_in_seconds: number;
  resend_cooldown_seconds: number;
}

export interface PasswordResetVerifyResponse {
  message: string;
  success: boolean;
  masked_email: string;
}

export interface PasswordResetResendResponse {
  message: string;
  reset_session_id: string;
  resend_cooldown_seconds: number;
}

export const authService = {
  async register(payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.access_token) {
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user_info", JSON.stringify(res.user));
    }
    return res;
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.access_token) {
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user_info", JSON.stringify(res.user));
    }
    return res;
  },

  async requestPasswordReset(email: string): Promise<PasswordResetInitResponse> {
    return await apiRequest<PasswordResetInitResponse>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyPasswordResetOtp(resetSessionId: string, otp: string): Promise<PasswordResetVerifyResponse> {
    return await apiRequest<PasswordResetVerifyResponse>("/auth/password-reset/verify", {
      method: "POST",
      body: JSON.stringify({ reset_session_id: resetSessionId, otp }),
    });
  },

  async resendPasswordResetOtp(resetSessionId: string): Promise<PasswordResetResendResponse> {
    return await apiRequest<PasswordResetResendResponse>("/auth/password-reset/resend", {
      method: "POST",
      body: JSON.stringify({ reset_session_id: resetSessionId }),
    });
  },

  async changePassword(payload: { current_password: string; new_password: string }): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async getCurrentUser(): Promise<UserItem> {
    return await apiRequest<UserItem>("/auth/me", {
      method: "GET",
    });
  },

  async updateProfile(payload: { full_name?: string; phone?: string; avatar_url?: string }): Promise<UserItem> {
    const res = await apiRequest<UserItem>("/auth/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (res) {
      const currentUser = this.getUserInfo() || ({} as any);
      const updatedUser = { ...currentUser, ...res };
      localStorage.setItem("user_info", JSON.stringify(updatedUser));
      if (res.avatar_url) {
        localStorage.setItem("user_avatar_url", res.avatar_url);
      }
    }
    return res;
  },

  async getAllUsers(): Promise<UserItem[]> {
    return await apiRequest<UserItem[]>("/auth/users", {
      method: "GET",
    });
  },

  async getPendingUsers(): Promise<UserItem[]> {
    return await apiRequest<UserItem[]>("/auth/pending-users", {
      method: "GET",
    });
  },

  async approveUser(userId: number): Promise<UserItem> {
    return await apiRequest<UserItem>(`/auth/users/${userId}/approve`, {
      method: "POST",
    });
  },

  async lockUser(userId: number, reason?: string): Promise<UserItem> {
    return await apiRequest<UserItem>(`/auth/users/${userId}/lock${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`, {
      method: "POST",
    });
  },

  async unlockUser(userId: number): Promise<UserItem> {
    return await apiRequest<UserItem>(`/auth/users/${userId}/unlock`, {
      method: "POST",
    });
  },

  getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  },

  getUserInfo(): UserItem | null {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("user_info");
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
    }
  }
};
