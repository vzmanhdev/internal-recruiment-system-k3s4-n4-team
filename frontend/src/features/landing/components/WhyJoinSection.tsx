import React from "react";
import { Zap, ShieldCheck, Award, HeartHandshake } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";

export function WhyJoinSection() {
  const benefits = [
    {
      icon: Zap,
      title: "Phát triển sự nghiệp linh hoạt",
      desc: "Chuyển đổi vị trí giữa các phòng ban chuyên môn mà không mất đi thâm niên hay đãi ngộ hiện tại.",
    },
    {
      icon: ShieldCheck,
      title: "Môi trường chuyên nghiệp",
      desc: "Làm việc cùng những đồng nghiệp xuất sắc trong môi trường cởi mở, tôn trọng giá trị khác biệt.",
    },
    {
      icon: Award,
      title: "Minh bạch cơ hội & Tiêu chuẩn",
      desc: "Mọi tiêu chuẩn đánh giá và mô tả công việc được niêm yết công khai trên cổng tuyển dụng nội bộ.",
    },
    {
      icon: HeartHandshake,
      title: "Ghi nhận đóng góp xứng đáng",
      desc: "Chính sách đãi ngộ, thưởng nóng và điều chỉnh thu nhập tương xứng với năng lực thực tế.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <Container>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-[var(--color-primary)] tracking-wider uppercase">
            VÌ SAO NÊN ỨNG TUYỂN NỘI BỘ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight">
            Không chỉ là một vị trí mới. Đó là bước tiến mới.
          </h2>
          <p className="text-base text-[var(--color-muted)]">
            Tối ưu hóa hành trình phát triển sự nghiệp cá nhân ngay tại nơi bạn gắn bó.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Card
                key={idx}
                variant="default"
                className="p-6 border-slate-200/80 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[var(--color-primary)] flex items-center justify-center mb-5 border border-blue-100">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-heading)] mb-2">{item.title}</h3>
                <p className="text-xs text-[var(--color-body)] leading-relaxed">{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
