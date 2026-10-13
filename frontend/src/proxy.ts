import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedPath, normalizePath, policyFor } from "@/lib/auth/route-registry";

/**
 * Server-side route protection (runs before any protected page renders).
 *
 * - No session cookie / backend says 401  → redirect to /login?next=…   (authentication)
 * - Backend says 403                      → render /forbidden with a REAL HTTP 403 (authorization)
 * - Route under a protected prefix without a registered policy → 403 (default deny)
 * - Backend unreachable                   → 503 (fail closed, never render protected content)
 *
 * The decision is made by the backend (`GET /auth/route-access`) from database permissions; this file
 * only forwards the HttpOnly `ats_access` cookie and the route's declared requirements.
 */
const API_BASE = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const ACCESS_COOKIE = "ats_access";

function requestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function toLogin(request: NextRequest, path: string): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", path + request.nextUrl.search);
  const res = NextResponse.redirect(url);
  res.cookies.delete(ACCESS_COOKIE);
  return res;
}

function deny(request: NextRequest, status: 403 | 503, code: string, message: string, rid: string): NextResponse {
  const headers = new Headers(request.headers);
  headers.set("x-denied-status", String(status));
  headers.set("x-denied-code", code);
  headers.set("x-denied-message", encodeURIComponent(message));
  headers.set("x-request-id", rid);
  headers.set("x-denied-path", encodeURIComponent(normalizePath(request.nextUrl.pathname)));
  return NextResponse.rewrite(new URL("/forbidden", request.url), { status, request: { headers } });
}

export async function proxy(request: NextRequest) {
  const path = normalizePath(request.nextUrl.pathname);
  if (!isProtectedPath(path)) return NextResponse.next();

  const policy = policyFor(path);
  if (policy?.public) return NextResponse.next();

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return toLogin(request, path);

  const rid = requestId();
  const params = new URLSearchParams();
  if (policy?.all?.length) params.set("all", policy.all.join(","));
  if (policy?.any?.length) params.set("any", policy.any.join(","));
  if (policy?.workspace) params.set("workspace", policy.workspace);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/route-access?${params.toString()}`, {
      headers: { Cookie: `${ACCESS_COOKIE}=${token}`, "X-Request-ID": rid },
      cache: "no-store",
    });
  } catch {
    return deny(request, 503, "AUTH_SERVICE_UNAVAILABLE",
      "Không thể xác thực quyền truy cập vì máy chủ tạm thời không phản hồi. Vui lòng thử lại sau.", rid);
  }

  if (res.status === 401) return toLogin(request, path);
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    return deny(request, 403, body?.error?.code || "ROUTE_ACCESS_DENIED",
      body?.error?.message || "Bạn không có quyền truy cập trang này.", res.headers.get("x-request-id") || rid);
  }
  if (!res.ok) {
    return deny(request, 503, "AUTH_SERVICE_ERROR",
      "Không thể xác thực quyền truy cập. Vui lòng thử lại sau.", res.headers.get("x-request-id") || rid);
  }

  // Authenticated and authorised — but a protected path with no declared policy is still denied.
  if (!policy) {
    return deny(request, 403, "ROUTE_POLICY_MISSING",
      "Trang này chưa được cấu hình quyền truy cập nên tạm thời bị chặn. Vui lòng liên hệ Quản trị hệ thống.", rid);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*", "/hr/:path*", "/recruiter/:path*", "/manager/:path*", "/interviewer/:path*",
    "/approver/:path*", "/employee/:path*", "/candidate/:path*", "/workspace/:path*",
  ],
};
