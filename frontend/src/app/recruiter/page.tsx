"use client";
import { CalendarDays, ClipboardCheck, Gift, Users } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
const items = [
  { href: "/hr/applications", label: "Hồ sơ & pipeline", icon: Users },
  { href: "/hr/interviews", label: "Đặt lịch phỏng vấn", icon: CalendarDays },
  {
    href: "/manager/hiring-decisions",
    label: "Kết quả & quyết định tuyển",
    icon: ClipboardCheck,
  },
  { href: "/hr/offers", label: "Soạn đề xuất offer", icon: Gift },
  { href: "/hr/onboarding", label: "Theo dõi nhận việc", icon: ClipboardCheck },
];
export default function RecruiterWorkspacePage() {
  return (
    <WorkspaceShell
      title="Nhân viên tuyển dụng"
      description="Kết nối kết quả phỏng vấn với đề xuất offer và nhận việc"
      icon={Users}
      items={items}
      allowedRoles={["recruiter", "hr_manager", "admin"]}
    >
      <div className="space-y-6">
        <section className="workspace-hero">
          <p className="text-sm font-bold text-blue-600">
            Recruiter · Sprint 7
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Điều phối quyết định & thư mời
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Xem kết quả nhiều vòng, soạn đề xuất lương, trình duyệt và theo dõi
            ứng viên nhận việc.
          </p>
        </section>
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map(({ href, label, icon: Icon }) => (
            <Card key={href}>
              <Icon className="h-7 w-7 text-blue-600" />
              <h2 className="mt-4 text-lg font-black">{label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {href === "/hr/offers"
                  ? "Kế thừa hồ sơ ứng viên, xem dải lương, giải trình mức ngoài dải và xem trước nội dung trước khi trình duyệt."
                  : href === "/manager/hiring-decisions"
                    ? "Đối chiếu phiếu đánh giá từng vòng và quyết định tuyển/loại của Trưởng bộ phận."
                    : href === "/hr/onboarding"
                      ? "Theo dõi phản hồi offer và phối hợp hoàn thành checklist nhận việc cùng ứng viên."
                      : href === "/hr/interviews"
                        ? "Chọn người phỏng vấn, phòng họp và kiểm tra trùng lịch trước khi gửi lời mời."
                        : "Quản lý tiến trình sàng lọc, đánh giá và lịch sử tương tác với ứng viên."}
              </p>
              <Button className="mt-4" href={href}>
                Mở {label.toLowerCase()}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </WorkspaceShell>
  );
}
