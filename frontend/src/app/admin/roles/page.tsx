import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ShieldCheck, Users } from "lucide-react";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Vai trò và phân quyền | Tuyển dụng nội bộ" };

const roles = [
  {
    key: "admin",
    name: "Quản trị viên",
    description: "Quản lý toàn hệ thống, tài khoản, phê duyệt và phân quyền.",
    permissions: ["Quản lý tài khoản", "Phê duyệt đăng ký", "Gán vai trò", "Khóa/mở khóa tài khoản"],
    tone: "bg-slate-900 text-white",
  },
  {
    key: "hr_manager",
    name: "Nhân sự",
    description: "Thiết lập cơ cấu tổ chức, chức danh và khung năng lực.",
    permissions: ["Quản lý phòng ban", "Quản lý vị trí tuyển dụng", "Thiết lập khung năng lực", "Quản lý danh mục HR"],
    tone: "bg-blue-600 text-white",
  },
  {
    key: "manager",
    name: "Quản lý",
    description: "Theo dõi và xử lý các yêu cầu tuyển dụng thuộc đơn vị.",
    permissions: ["Xem vị trí tuyển dụng", "Gửi yêu cầu tuyển dụng", "Theo dõi ứng viên nội bộ"],
    tone: "bg-indigo-50 text-indigo-900",
  },
  {
    key: "employee",
    name: "Nhân viên",
    description: "Khám phá cơ hội nội bộ và quản lý hồ sơ cá nhân.",
    permissions: ["Xem vị trí đang tuyển", "Ứng tuyển nội bộ", "Cập nhật hồ sơ cá nhân"],
    tone: "bg-emerald-50 text-emerald-900",
  },
];

export default function RolesPage() {
  return (
    <AdminShell>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <header>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600"><ShieldCheck className="h-4 w-4" />Quản lý quyền truy cập</div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">Vai trò và phân quyền</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Quyền được áp dụng theo vai trò. Bạn có thể gán nhiều vai trò cho một tài khoản trong phần quản lý tài khoản.</p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.key} className="overflow-hidden p-0">
              <div className={`p-5 ${role.tone}`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-extrabold">{role.name}</h2>
                  <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">{role.key}</span>
                </div>
                <p className="mt-2 text-sm opacity-80">{role.description}</p>
              </div>
              <div className="space-y-3 p-5">
                {role.permissions.map((permission) => <div key={permission} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-emerald-600" />{permission}</div>)}
              </div>
            </Card>
          ))}
        </div>

        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Users className="h-5 w-5" /></span><div><h2 className="font-extrabold text-slate-950">Gán vai trò cho tài khoản</h2><p className="mt-1 text-sm text-slate-500">Mở danh sách tài khoản để cập nhật quyền truy cập từng người dùng.</p></div></div>
          <Link href="/admin/users" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Quản lý tài khoản <ArrowRight className="h-4 w-4" /></Link>
        </Card>
      </div>
    </AdminShell>
  );
}
