import React from "react";
import { Users, Briefcase, Building2, Award } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";

export function BusinessMetricsSection() {
  const metrics = [
    {
      id: "staff",
      value: "500+",
      label: "Nhân sự nội bộ",
      description: "Đồng hành và phát triển bền vững",
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      id: "positions",
      value: "120+",
      label: "Vị trí phát triển",
      description: "Mở ra cơ hội thăng tiến mới",
      icon: Briefcase,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      id: "departments",
      value: "12",
      label: "Phòng ban / Khối",
      description: "Môi trường kết nối linh hoạt",
      icon: Building2,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      id: "satisfaction",
      value: "95%",
      label: "Hài lòng phát triển",
      description: "Tỉ lệ hài lòng về lộ trình nghề nghiệp",
      icon: Award,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
  ];

  return (
    <section className="py-12 bg-transparent">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((item) => {
            const IconComponent = item.icon;
            return (
              <Card
                key={item.id}
                variant="default"
                className="flex items-start gap-4 p-6 hover:shadow-lg transition-all duration-300 border-slate-200/80"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${item.color}`}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-[var(--color-heading)] tracking-tight">
                    {item.value}
                  </h3>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
