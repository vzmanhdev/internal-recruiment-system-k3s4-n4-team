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
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  dashboardMetrics,
  recentAccounts,
  recentActivities,
  roleDistribution,
} from "../data/dashboard";

const metricTone = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
};

const activityTone = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const statusConfig = {
  active: { label: "Hoạt động", variant: "success" as const },
  pending: { label: "Chờ kích hoạt", variant: "warning" as const },
  locked: { label: "Đã khóa", variant: "danger" as const },
};

export function DashboardOverview() {
  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date("2026-09-30T08:00:00+07:00"));

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 xl:space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
            <Sparkles className="h-4 w-4" />
            Trung tâm quản trị hệ thống
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Xin chào, Nguyễn Văn A
          </h1>
          <p className="mt-1.5 capitalize text-sm text-slate-500">{today}</p>
        </div>
        <Button href="/admin/users/new" leftIcon={<UserPlus className="h-4 w-4" />}>
          Tạo tài khoản
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
                    {metric.value}
                  </p>
                </div>
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${metricTone[metric.tone]}`}>
                  <Icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {metric.change}
                </span>
                <span className="text-slate-400">{metric.changeLabel}</span>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Tài khoản mới nhất</h2>
              <p className="mt-1 text-sm text-slate-500">Các tài khoản vừa được thêm vào hệ thống</p>
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
                  <th className="px-4 py-3.5">Phòng ban</th>
                  <th className="px-4 py-3.5">Vai trò</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAccounts.map((account) => {
                  const status = statusConfig[account.status];
                  return (
                    <tr key={account.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-xs font-extrabold text-blue-700">
                            {account.name.split(" ").slice(-2).map((part) => part[0]).join("")}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{account.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{account.department}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {account.roles.map((role) => <Badge key={role}>{role}</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-4"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="px-6 py-4 text-right text-sm text-slate-500">{account.createdAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 md:hidden">
            {recentAccounts.map((account) => {
              const status = statusConfig[account.status];
              return (
                <article key={account.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-xs font-extrabold text-blue-700">
                      {account.name.split(" ").slice(-2).map((part) => part[0]).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{account.name}</p>
                      <p className="truncate text-xs text-slate-500">{account.email}</p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{account.department}</span>
                    <span>{account.createdAt}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Phân bổ vai trò</h2>
              <p className="mt-1 text-sm text-slate-500">Theo tài khoản hiện tại</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-7 space-y-5">
            {roleDistribution.map((role) => (
              <div key={role.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{role.label}</span>
                  <span className="font-bold text-slate-950">{role.value}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${role.color}`} style={{ width: `${role.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/roles"
            className="mt-7 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Quản lý phân quyền <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Hoạt động gần đây</h2>
              <p className="mt-1 text-sm text-slate-500">Thay đổi quan trọng trong hệ thống</p>
            </div>
            <Clock3 className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 space-y-5">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3.5">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-slate-100 ${activityTone[activity.tone]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6 text-slate-600">
                    <strong className="text-slate-900">{activity.actor}</strong>{" "}
                    {activity.action}{" "}
                    <strong className="text-slate-900">{activity.subject}</strong>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-0 text-white">
          <div className="relative p-6 sm:p-7">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[28px] border-white/10" />
            <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <h2 className="relative mt-5 text-xl font-extrabold text-white">Tình trạng tuyển dụng</h2>
            <p className="relative mt-2 max-w-sm text-sm leading-6 text-blue-100">
              12 vị trí đang mở và 86 hồ sơ đang trong quá trình đánh giá.
            </p>
            <div className="relative mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold">12</p>
                <p className="mt-1 text-xs text-blue-100">Vị trí đang tuyển</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-extrabold">86</p>
                <p className="mt-1 text-xs text-blue-100">Hồ sơ ứng tuyển</p>
              </div>
            </div>
            <Link href="/admin/jobs" className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-blue-100">
              Xem chi tiết tuyển dụng <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { icon: UserPlus, title: "Tạo tài khoản", text: "Thêm nhân viên mới vào hệ thống", href: "/admin/users/new" },
          { icon: ShieldCheck, title: "Gán vai trò", text: "Cập nhật quyền truy cập người dùng", href: "/admin/roles" },
          { icon: CheckCircle2, title: "Xem nhật ký", text: "Theo dõi hoạt động quản trị", href: "/admin/audit-logs" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} href={action.href} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-slate-900">{action.title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{action.text}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
