export const SESSION_NOTICE_KEY = "auth-session-notice";

interface JwtPayload { exp?: number; }

export function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as JwtPayload;
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch { return null; }
}

export function saveSessionExpiration(token: string): void {
  const expiresAt = getTokenExpiration(token);
  if (expiresAt) window.localStorage.setItem("auth_expires_at", String(expiresAt));
}

export function getDashboardPath(role: string, roles?: string[]): string {
  const allRoles = roles?.length ? roles : role.split(",").filter(Boolean);
  if (allRoles.includes("admin")) return "/admin/dashboard";
  if (allRoles.includes("hr_manager")) return "/hr/dashboard";
  return "/dashboard";
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("user_info");
  window.localStorage.removeItem("auth_expires_at");
}

export function expireSession(): void {
  if (typeof window === "undefined") return;
  clearStoredSession();
  window.sessionStorage.setItem(SESSION_NOTICE_KEY, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.");
}

export function consumeSessionNotice(): string {
  if (typeof window === "undefined") return "";
  const notice = window.sessionStorage.getItem(SESSION_NOTICE_KEY) ?? "";
  window.sessionStorage.removeItem(SESSION_NOTICE_KEY);
  return notice;
}
