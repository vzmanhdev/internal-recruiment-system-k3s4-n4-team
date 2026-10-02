"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  UserRoundCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { userService, ManagedUser } from "../services/user.service";
import { fetchAnalyticsOverview, AnalyticsOverview } from "@/features/analytics/services/analytics.service";
import { useAuthSession } from "@/features/auth/lib/auth-session";

const statusConfig = {
  active: { label: "Hoạt động", variant: "success" as const },
  pending: { label: "Chờ kích hoạt", variant: "warning" as const },
  locked: { label: "Đã khóa", variant: "danger" as const },
};

export function DashboardOverview() {
  const session = useAuthSession();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [uRes, ovRes] = await Promise.all([
          userService.list({ pageSize: 100 }),
          fetchAnalyticsOverview().catch(() => null),
        ]);
        setUsers(uRes.items || []);
        setTotalUsers(uRes.total || uRes.items?.length || 0);
        setOverview(ovRes);
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCount = users.filter((u) => u.account_status === "active" || u.is_active).length;
  const pendingCount = users.filter((u) => u.account_status === "pending").length;
  const lockedCount = users.filter((u) => u.account_status === "locked" || (!u.is_active && u.account_status !== "pending")).length;

  // Role distribution calculation
  const roleCounts: Record<string, number> = {
    admin: 0,
    hr_manager: 0,
    dept_head: 0,
    employee: 0,
  };

  users.forEach((u) => {
    const rolesList = u.roles || (u.role ? u.role.split(",") : ["employee"]);
    rolesList.forEach((r) => {
      const cleanRole = r.trim();
      if (roleCounts[cleanRole] !== undefined) {
        roleCounts[cleanRole]++;
      } else {
        roleCounts["employee"]++;
      }
    });
  });

  const roleDistribution = [
    { label: "Quản trị viên (Admin)", value: roleCounts.admin, color: "bg-slate-800" },
    { label: "Quản lý HR (HR Manager)", value: roleCounts.hr_manager, color: "bg-blue-600" },
    { label: "Trưởng phòng (Dept Head)", value: roleCounts.dept_head, color: "bg-indigo-600" },
    { label: "Nhân viên (Employee)", value: roleCounts.employee, color: "bg-emerald-500" },
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 xl:space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Sparkles className="h-4 w-4" />
            Trung tâm quản trị hệ thống
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Xin chào, {session?.full_name || "Quản trị viên"}
          </h1>
          <p className="mt-1.5 capitalize text-sm text-slate-500">{today}</p>
        </div>
        <Button href="/admin/users/new" leftIcon={<UserPlus className="h-4 w-4" />}>
          Tạo tài khoản
        </Button>
      </section>

      {/* Database Metrics Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tổng tài khoản DB</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                {loading ? "..." : totalUsers}
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Users className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-blue-600">
              Cơ sở dữ liệu
            </span>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Đang hoạt động</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-600">
                {loading ? "..." : activeCount}
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Trạng thái Active</span>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Chờ kích hoạt</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-amber-600">
                {loading ? "..." : pendingCount}
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600">
              <UserRoundCheck className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Tài khoản chờ duyệt</span>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Tài khoản bị khóa</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-rose-600">
                {loading ? "..." : lockedCount}
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
              <UserX className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs">
            <span className="text-slate-400">Trạng thái Locked</span>
          </div>
        </Card>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
        {/* Recent Database Accounts Table */}
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Tài khoản trong Cơ sở Dữ liệu</h2>
              <p className="mt-1 text-sm text-slate-500">Các tài khoản người dùng thực tế từ hệ thống Backend</p>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              Xem tất cả <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3.5">Người dùng</th>
                  <th className="px-4 py-3.5">Vai trò (Role)</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.slice(0, 6).map((account) => {
                  const statusKey = account.account_status || (account.is_active ? "active" : "locked");
                  const status = statusConfig[statusKey] || statusConfig.active;
                  const displayRoles = account.roles || (account.role ? account.role.split(",") : ["employee"]);

                  return (
                    <tr key={account.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-xs font-extrabold text-blue-700">
                            {account.full_name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{account.full_name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {displayRoles.map((r) => (
                            <Badge key={r}>{r}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-500">
                        {account.created_at ? new Date(account.created_at).toLocaleDateString("vi-VN") : "Hệ thống"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Role Distribution from Database */}
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Phân bổ Vai trò (Roles)</h2>
              <p className="mt-1 text-sm text-slate-500">Theo tài khoản thực tế trong DB</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-7 space-y-5">
            {roleDistribution.map((role) => {
              const pct = totalUsers > 0 ? Math.round((role.value / totalUsers) * 100) : 0;
              return (
                <div key={role.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{role.label}</span>
                    <span className="font-bold text-slate-950">{role.value} tài khoản</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${role.color}`} style={{ width: `${Math.max(pct, role.value > 0 ? 5 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/admin/users"
            className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Quản lý tài khoản & phân quyền <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </section>

      {/* Recruitment Status Card connected to DB */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
          <div className="relative">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl font-extrabold text-white">Tình trạng Tuyển dụng Thực tế</h2>
            <p className="mt-2 text-sm leading-6 text-blue-100">
              Dữ liệu được cập nhật thời gian thực từ cơ sở dữ liệu hệ thống.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-extrabold">{overview?.active_jobs || 0}</p>
                <p className="mt-1 text-xs text-blue-100">Vị trí đang đăng (Published)</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-3xl font-extrabold">{overview?.total_applications || 0}</p>
                <p className="mt-1 text-xs text-blue-100">Hồ sơ đã nộp trong DB</p>
              </div>
            </div>
            <Link href="/hr/analytics" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-blue-100">
              Xem báo cáo thống kê tuyển dụng <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
