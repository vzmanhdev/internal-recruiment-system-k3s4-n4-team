"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authService, type UserItem } from "@/features/auth/services/auth.service";
import { AUTH_FORBIDDEN_EVENT } from "@/lib/api-client";
import { canSee, policyFor } from "@/lib/auth/route-registry";

/** Fired after an admin changes roles or the permission matrix in this browser, so menus re-sync at once. */
export const PERMISSIONS_CHANGED_EVENT = "auth:permissions-changed";

type Status = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: Status;
  user: UserItem | null;
  /** Backend effective permissions (UI hint only — the server re-checks every request). */
  permissions: ReadonlySet<string>;
  isAdmin: boolean;
  roleCodes: string[];
  /** Whether a link to `href` should be shown (same declarations the server proxy enforces). */
  canAccess: (href: string) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const roleCodesOf = (u: UserItem | null): string[] =>
  (u?.roles || []).map((r) => (typeof r === "string" ? r : r.code)).filter(Boolean);

const FOCUS_RESYNC_MS = 60_000;
const FORBIDDEN_RESYNC_MS = 5_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserItem | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const lastSync = useRef(0);
  const inflight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (inflight.current) return inflight.current;
    const run = (async () => {
      if (!authService.getToken()) {
        setUser(null);
        setStatus("anonymous");
        return;
      }
      try {
        const me = await authService.getCurrentUser();
        localStorage.setItem("user_info", JSON.stringify(me));
        setUser(me);
        setStatus("authenticated");
      } catch {
        // 401 handling (refresh / redirect) happens in apiRequest; keep the last known UI state otherwise
        if (!authService.getToken()) {
          setUser(null);
          setStatus("anonymous");
        }
      } finally {
        lastSync.current = Date.now();
      }
    })();
    // Clear the in-flight marker only after this run settles. (Clearing it inside the async body can run
    // synchronously — before the assignment below — and would leave a settled promise cached forever.)
    inflight.current = run.finally(() => {
      if (inflight.current === guarded) inflight.current = null;
    });
    const guarded = inflight.current;
    return guarded;
  }, []);

  // Bootstrap once: show the cached profile immediately, then confirm with the server.
  useEffect(() => {
    let cancelled = false;
    const cached = authService.getUserInfo();
    queueMicrotask(() => {
      if (cancelled) return;
      if (cached && authService.getToken()) {
        setUser(cached);
        setStatus("authenticated");
      }
      void refresh();
    });
    return () => { cancelled = true; };
  }, [refresh]);

  // Controlled re-synchronisation (never on every navigation).
  useEffect(() => {
    const onForbidden = () => {
      if (Date.now() - lastSync.current > FORBIDDEN_RESYNC_MS) void refresh();
    };
    const onChanged = () => void refresh();
    const onFocus = () => {
      if (document.visibilityState === "visible" && Date.now() - lastSync.current > FOCUS_RESYNC_MS) void refresh();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "access_token") void refresh();
    };
    window.addEventListener(AUTH_FORBIDDEN_EVENT, onForbidden);
    window.addEventListener(PERMISSIONS_CHANGED_EVENT, onChanged);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(AUTH_FORBIDDEN_EVENT, onForbidden);
      window.removeEventListener(PERMISSIONS_CHANGED_EVENT, onChanged);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const roleCodes = roleCodesOf(user);
    const isAdmin = roleCodes.includes("admin");
    const permissions = new Set(user?.permissions || []);
    return {
      status,
      user,
      permissions,
      isAdmin,
      roleCodes,
      canAccess: (href: string) => status === "authenticated" && canSee(policyFor(href), permissions, isAdmin),
      refresh,
      logout,
    };
  }, [status, user, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Call after changing roles / the permission matrix so this browser's menus update immediately. */
export function notifyPermissionsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PERMISSIONS_CHANGED_EVENT));
}
