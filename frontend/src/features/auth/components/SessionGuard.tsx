"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { expireSession } from "../lib/session";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

export function SessionGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      const token = window.localStorage.getItem("access_token");
      const expiresAt = Number(window.localStorage.getItem("auth_expires_at") ?? 0);
      if (token && expiresAt > 0 && Date.now() >= expiresAt) {
        expireSession();
        if (!PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) router.replace("/login?reason=session-expired");
      }
    };
    checkSession();
    const intervalId = window.setInterval(checkSession, 30_000);
    return () => window.clearInterval(intervalId);
  }, [pathname, router]);

  return null;
}
