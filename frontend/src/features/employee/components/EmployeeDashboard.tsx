"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, BriefcaseBusiness, KeyRound, UserRound, UsersRound } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";
import { fetchMyReferrals, ReferralItem } from "@/features/referrals/services/referral.service";
import { ApiError } from "@/lib/api-client";

const statusLabel: Record<string, string> = {
  pending: "Chờ HR liên hệ", contacted: "Đã liên hệ", interviewed: "Đã phỏng vấn",
  hired: "Đã trúng tuyển", bonus_paid: "Đã trả thưởng", rejected: "Chưa phù hợp",
};

export function EmployeeDashboard() {
  const session = useAuthSession();
  const router = useRouter();
  const roles = getSessionRoles(session);
  const isInternal = roles.some((role) => ["employee", "manager", "hr_manager", "admin"].includes(role));
  const sessionId = session?.id;
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetchMyReferrals();
      setReferrals(response.items);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải dữ liệu cá nhân.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId && !isInternal) router.replace("/candidate/dashboard");
    else if (sessionId) queueMicrotask(() => void load());
  }, [isInternal, load, router, sessionId]);

  if (!session) return <Alert variant="warning">Vui lòng đăng nhập để sử dụng cổng nhân sự nội bộ.</Alert>;
  if (!isInternal) return <Alert variant="warning">Đang chuyển tới cổng ứng viên...</Alert>;

  const quickLinks = [
    { href: "/profile", label: "Hồ sơ cá nhân", detail: "Ảnh đại diện và số điện thoại", icon: UserRound },
    { href: "/change-password", label: "Đổi mật khẩu", detail: "Cập nhật bảo mật tài khoản", icon: KeyRound },
    { href: "/referrals", label: "Giới thiệu ứng viên", detail: "Nộp hồ sơ người quen cho HR", icon: UsersRound },
    { href: "/jobs", label: "Vị trí tuyển dụng", detail: "Xem các vị trí đang mở", icon: BriefcaseBusiness },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-7">
        <p className="text-sm font-semibold text-blue-600">Cổng nhân sự nội bộ</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Xin chào, {session.full_name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">Quản lý thông tin cá nhân, giới thiệu nhân tài và theo dõi kết quả ngay tại một nơi.</p>
      </section>

      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map(({ href, label, detail, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card variant="interactive" className="h-full p-5">
              <Icon className="h-7 w-7 text-blue-600" />
              <h2 className="mt-4 font-bold text-slate-900">{label}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">Hồ sơ đã giới thiệu</h2>
            <Link href="/referrals" className="text-sm font-semibold text-blue-600">Xem tất cả</Link>
          </div>
          {loading ? <p className="p-6 text-sm text-slate-500">Đang tải dữ liệu...</p> : referrals.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Bạn chưa giới thiệu ứng viên nào.</p>
          ) : referrals.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-0">
              <div><p className="font-semibold text-slate-900">{item.candidate_name}</p><p className="text-xs text-slate-500">{item.job_title}</p></div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{statusLabel[item.status] ?? item.status}</span>
            </div>
          ))}
        </Card>

        <Card>
          <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-amber-500"/><h2 className="font-bold text-slate-900">Thông báo</h2></div>
          <div className="mt-4 space-y-3">
            {referrals.length === 0 ? <p className="text-sm text-slate-500">Chưa có thông báo mới.</p> : referrals.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">{item.candidate_name}: {statusLabel[item.status] ?? item.status}</p>
                <p className="mt-1 text-xs text-slate-500">Cập nhật {new Date(item.updated_at).toLocaleString("vi-VN")}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
