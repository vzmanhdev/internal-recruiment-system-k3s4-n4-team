import { apiRequest, API_BASE_URL } from "@/lib/api-client";
import type { LoginRequest, RegisterRequest } from "../types/auth.types";

export interface UserItem {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  employee_code?: string;
  avatar_url?: string;
  job_title?: string | null;
  role: string;
  /** /auth/me returns role objects; legacy payloads may contain plain codes. Display only — never an authority. */
  roles?: Array<string | { code: string; name: string }>;
  /** Effective permissions computed by the backend (UNION of all roles; admin = all). */
  permissions?: string[];
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

/** Server-side state of a candidate-registration OTP challenge (never contains the code). */
export interface RegistrationChallenge {
  message?: string;
  challenge_id: string;
  challenge_status: "pending" | "blocked" | "expired" | "consumed" | "superseded" | "cancelled";
  masked_email: string;
  max_attempts: number;
  remaining_attempts: number;
  expires_in_seconds: number;
  resend_available_in_seconds: number;
  can_resend: boolean;
}

export interface RegistrationCompleted {
  message: string;
  challenge_status: "consumed";
  redirect_url: string;
  user: { id: number; email: string; full_name: string; roles: string[]; account_status: string; email_verified: boolean };
}

export const authService = {
  /** Public candidate registration, step 1: the backend e-mails a code. The role is always decided by the backend. */
  async registerStart(payload: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    phone?: string;
  }): Promise<RegistrationChallenge> {
    return await apiRequest<RegistrationChallenge>("/auth/register/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** Step 2: on success the candidate account exists and is active; the user then signs in normally. */
  async registerVerify(challengeId: string, otp: string): Promise<RegistrationCompleted> {
    return await apiRequest<RegistrationCompleted>("/auth/register/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_id: challengeId, otp }),
    });
  },

  /** Issues a brand-new challenge (new id, new code); the previous one is invalidated. */
  async registerResendOtp(challengeId: string): Promise<RegistrationChallenge> {
    return await apiRequest<RegistrationChallenge>("/auth/register/resend-otp", {
      method: "POST",
      body: JSON.stringify({ challenge_id: challengeId }),
    });
  },

  async registerChallengeStatus(challengeId: string): Promise<RegistrationChallenge> {
    return await apiRequest<RegistrationChallenge>(
      `/auth/register/challenge-status?challenge_id=${encodeURIComponent(challengeId)}`,
      { method: "GET" },
    );
  },

  /** @deprecated kept for older callers: starts the same OTP registration (no account is created here). */
  async register(payload: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    phone?: string;
  }): Promise<RegistrationChallenge> {
    return this.registerStart(payload);
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

  async updateProfile(payload: { full_name?: string; phone?: string; avatar_url?: string; job_title?: string; date_of_birth?: string; gender?: string; bio?: string }): Promise<UserItem> {
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

  /** Revokes the server-side session (and the HttpOnly cookies), then clears local state. */
  async logout(): Promise<void> {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
        keepalive: true,
      });
    } catch {
      // network failure: the local session is gone anyway; the server session expires on its own
    }
  }
};
