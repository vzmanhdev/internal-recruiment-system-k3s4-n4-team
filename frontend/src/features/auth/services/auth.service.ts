import { apiRequest } from "@/lib/api-client";
import { clearStoredSession, saveSessionExpiration } from "../lib/session";

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

export interface RegistrationResponse {
  message: string;
  user: AuthResponse["user"];
}

export const authService = {
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
  }): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.access_token) {
      localStorage.setItem("access_token", res.access_token);
      localStorage.setItem("user_info", JSON.stringify(res.user));
      saveSessionExpiration(res.access_token);
    }
    return res;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return await apiRequest<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  async getCurrentUser() {
    return await apiRequest("/auth/me", {
      method: "GET",
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
    }
  }
};
