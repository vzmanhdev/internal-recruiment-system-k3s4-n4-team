import { headers } from "next/headers";
import { AccessDenied } from "@/components/auth/AccessDenied";

export const metadata = { title: "Không có quyền truy cập", robots: { index: false, follow: false } };

const decode = (v: string | null) => {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return null;
  }
};

/**
 * Rendered by src/proxy.ts with a real HTTP 403 (or 503) status when the backend refuses a route.
 * Visiting /forbidden directly shows the generic message.
 */
export default async function ForbiddenPage() {
  const h = await headers();
  const status = h.get("x-denied-status") === "503" ? 503 : 403;
  return (
    <AccessDenied
      status={status}
      code={h.get("x-denied-code") || "ROUTE_ACCESS_DENIED"}
      message={decode(h.get("x-denied-message")) || "Bạn không có quyền truy cập trang này. Vui lòng liên hệ Quản trị hệ thống nếu bạn cần được cấp quyền."}
      requestId={h.get("x-request-id")}
      path={decode(h.get("x-denied-path"))}
    />
  );
}
