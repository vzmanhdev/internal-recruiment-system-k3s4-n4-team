"use client";

import { useSyncExternalStore } from "react";

const SESSION_KEY = "user_info";
const SESSION_EVENT = "internal-recruitment-auth-change";

export interface AuthSession {
  id: number;
  email: string;
  full_name: string;
  role: string;
  roles?: string[];
  is_active: boolean;
}

function readSession(): string { return window.localStorage.getItem(SESSION_KEY) ?? ""; }
function subscribe(callback: () => void): () => void {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(SESSION_EVENT, callback); window.removeEventListener("storage", callback); };
}

export function useAuthSession(): AuthSession | null {
  const value = useSyncExternalStore(subscribe, readSession, () => "");
  if (!value) return null;
  try { return JSON.parse(value) as AuthSession; } catch { return null; }
}

export function saveAuthSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("auth_expires_at");
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getSessionRoles(session: AuthSession | null): string[] {
  if (!session) return [];
  return session.roles?.length ? session.roles : session.role.split(",").filter(Boolean);
}
