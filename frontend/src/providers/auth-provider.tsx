"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService, type UserItem } from "@/features/auth/services/auth.service";

interface AuthContextType {
  currentUser: UserItem | null;
  isAuthenticated: boolean;
  isAuthInitialized: boolean;
  isRefreshing: boolean;
  login: (email: string, password: string) => Promise<UserItem>;
  logout: () => void;
  updateCurrentUser: (updatedUser: Partial<UserItem>) => void;
  refetchProfile: () => Promise<UserItem | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let globalAuthInitPromise: Promise<UserItem | null> | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserItem | null>(() => {
    return authService.getUserInfo();
  });
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const initAuth = useCallback(async () => {
    const token = authService.getToken();
    if (!token) {
      setCurrentUser(null);
      setIsAuthInitialized(true);
      return null;
    }

    if (globalAuthInitPromise) {
      return await globalAuthInitPromise;
    }

    globalAuthInitPromise = (async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        if (typeof window !== "undefined") {
          localStorage.setItem("user_info", JSON.stringify(user));
          if (user.avatar_url) {
            localStorage.setItem("user_avatar_url", user.avatar_url);
          }
        }
        return user;
      } catch (err: any) {
        // Token invalid or session revoked
        authService.logout();
        setCurrentUser(null);
        return null;
      } finally {
        setIsAuthInitialized(true);
        globalAuthInitPromise = null;
      }
    })();

    return await globalAuthInitPromise;
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password: string): Promise<UserItem> => {
    const res = await authService.login({ email, password });
    setCurrentUser(res.user);
    setIsAuthInitialized(true);
    return res.user;
  };

  const logout = useCallback(() => {
    authService.logout();
    setCurrentUser(null);
  }, []);

  const updateCurrentUser = useCallback((updatedFields: Partial<UserItem>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updatedFields };
      if (typeof window !== "undefined") {
        localStorage.setItem("user_info", JSON.stringify(next));
        if (next.avatar_url) {
          localStorage.setItem("user_avatar_url", next.avatar_url);
          window.dispatchEvent(new Event("avatar_updated"));
        }
      }
      return next;
    });
  }, []);

  const refetchProfile = useCallback(async (): Promise<UserItem | null> => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      if (typeof window !== "undefined") {
        localStorage.setItem("user_info", JSON.stringify(user));
      }
      return user;
    } catch {
      return null;
    }
  }, []);

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    isAuthInitialized,
    isRefreshing,
    login,
    logout,
    updateCurrentUser,
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
