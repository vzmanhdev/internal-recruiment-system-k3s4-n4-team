"use client";

import { useSyncExternalStore } from "react";

const SESSION_KEY = "internal-recruitment-session";
const SESSION_EVENT = "internal-recruitment-auth-change";

export interface AuthSession {
  displayName: string;
}

function readSession(): string {
  return window.localStorage.getItem(SESSION_KEY) ?? "";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(SESSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SESSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
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
  window.dispatchEvent(new Event(SESSION_EVENT));
}
