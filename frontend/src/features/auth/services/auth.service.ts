import { apiRequest } from "@/lib/api-client";
import { clearStoredSession, saveSessionExpiration } from "../lib/session";
import { saveAuthSession } from "../lib/auth-session";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  redirect_url?: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
    avatar_url?: string;
    redirect_url?: string;
    employee_code?: string;
    roles?: string[];
    account_status?: string;
    created_at?: string;
  };
}

export interface RegistrationResponse {
  message: string;
  user: AuthResponse["user"];
}

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
  getToken(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem("access_token");
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

  async register(payload: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }): Promise<RegistrationResponse> {
    return await apiRequest<RegistrationResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async login(payload: {
    email: string;
    password: string;
  }, rememberMe = false): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.access_token) {
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("auth_remember_me", String(rememberMe));
      if (rememberMe) localStorage.setItem("remembered_login_email", payload.email);
      else localStorage.removeItem("remembered_login_email");
      saveAuthSession(res.user);
      saveSessionExpiration(res.access_token);
    }
    return res;
  },

  async forgotPassword(email: string): Promise<{ message: string; reset_url?: string }> {
    return await apiRequest<{ message: string; reset_url?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async getCurrentUser(): Promise<UserItem> {
    return await apiRequest<UserItem>("/auth/me", {
      method: "GET",
    });
  },

  async updateProfile(payload: {full_name?:string; phone?:string; avatar_url?:string}) {
    const user = await apiRequest<AuthResponse["user"]>("/auth/me", {method:"PUT", body:JSON.stringify(payload)});
    saveAuthSession(user);
    localStorage.setItem("user_info", JSON.stringify(user));
    return user;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  },

  async changePassword(payload: {
    current_password: string;
    new_password: string;
  }): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  logout() {
    if (typeof window !== "undefined") {
      clearStoredSession();
      localStorage.removeItem("auth_remember_me");
    }
  }
};
