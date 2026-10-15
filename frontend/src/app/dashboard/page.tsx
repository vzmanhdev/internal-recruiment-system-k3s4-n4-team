"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { useAuthSession } from "@/features/auth/lib/auth-session";
import { getDashboardPath } from "@/features/auth/lib/session";

export default function DashboardPage() {
  const router = useRouter();
  const session = useAuthSession();
  useEffect(() => {
    if (!session) router.replace("/login");
    else router.replace(getDashboardPath(session.role, session.roles));
  }, [router, session]);
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><Card>Đang mở dashboard phù hợp với tài khoản...</Card></main>;
}
