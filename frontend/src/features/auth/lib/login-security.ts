const ATTEMPT_KEY_PREFIX = "auth-login-attempts:";
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;

interface LoginAttemptState {
  failedAttempts: number;
  lockedUntil: number | null;
}

export interface LoginLockState extends LoginAttemptState {
  remainingAttempts: number;
  remainingSeconds: number;
  isLocked: boolean;
}

function storageKey(email: string): string {
  return `${ATTEMPT_KEY_PREFIX}${email.trim().toLowerCase() || "unknown"}`;
}

function readState(email: string): LoginAttemptState {
  if (typeof window === "undefined") return { failedAttempts: 0, lockedUntil: null };
  const raw = window.localStorage.getItem(storageKey(email));
  if (!raw) return { failedAttempts: 0, lockedUntil: null };
  try { return JSON.parse(raw) as LoginAttemptState; } catch { return { failedAttempts: 0, lockedUntil: null }; }
}

function writeState(email: string, state: LoginAttemptState): void {
  window.localStorage.setItem(storageKey(email), JSON.stringify(state));
}

export function getLoginLockState(email: string): LoginLockState {
  const state = readState(email);
  const now = Date.now();
  if (state.lockedUntil && state.lockedUntil <= now) {
    resetLoginAttempts(email);
    return { failedAttempts: 0, lockedUntil: null, remainingAttempts: MAX_LOGIN_ATTEMPTS, remainingSeconds: 0, isLocked: false };
  }
  const remainingSeconds = state.lockedUntil ? Math.max(0, Math.ceil((state.lockedUntil - now) / 1000)) : 0;
  return { ...state, remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - state.failedAttempts), remainingSeconds, isLocked: remainingSeconds > 0 };
}

export function recordFailedLogin(email: string): LoginLockState {
  const current = getLoginLockState(email);
  if (current.isLocked) return current;
  const failedAttempts = current.failedAttempts + 1;
  const lockedUntil = failedAttempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : null;
  writeState(email, { failedAttempts, lockedUntil });
  return getLoginLockState(email);
}

export function resetLoginAttempts(email: string): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(storageKey(email));
}

export function formatLockDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
