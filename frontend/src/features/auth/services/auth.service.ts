import { apiRequest } from "@/lib/api-client";
import type { LoginRequest, RegisterRequest } from "../types/auth.types";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    phone?: string;
    role: string;
    is_active: boolean;
    created_at?: string;
  };
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async verifyPasswordResetOtp(email: string, otp: string): Promise<{ message: string; reset_token: string }> {
    return await apiRequest<{ message: string; reset_token: string }>("/auth/password-reset/verify", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  async confirmPasswordReset(payload: { reset_token: string; new_password: string; confirm_password?: string }): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getCurrentUser() {
    const res = await apiRequest("/auth/me", {
      method: "GET",
    });
    if (res && typeof window !== "undefined") {
      localStorage.setItem("user_info", JSON.stringify(res));
    }
    return res;
  },

  async updateProfile(payload: {
    full_name?: string;
    phone?: string;
    position_title?: string;
    bio?: string;
    avatar_base64?: string;
  }) {
    const res = await apiRequest("/auth/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (res && typeof window !== "undefined") {
      localStorage.setItem("user_info", JSON.stringify(res));
    }
    return res;
  },

  async changePassword(payload: {
    current_password: string;
    new_password: string;
    confirm_password?: string;
  }) {
    return await apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
    }
  }
};
