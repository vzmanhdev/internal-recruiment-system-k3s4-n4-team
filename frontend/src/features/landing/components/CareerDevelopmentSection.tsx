import React from "react";
import { Compass, Target, GraduationCap, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";

export function CareerDevelopmentSection() {
  const cards = [
    {
      icon: Compass,
      title: "Cơ hội nghề nghiệp phong phú",
      description: "Chủ động lựa chọn hướng đi chuyên môn chuyên sâu hoặc quản lý theo nguyện vọng và thế mạnh cá nhân.",
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      icon: Target,
      title: "Quy trình minh bạch & Công bằng",
      description: "Mọi vị trí được công khai nội bộ với tiêu chuẩn đánh giá nhất quán, công bằng cho tất cả ứng viên.",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      icon: GraduationCap,
      title: "Đào tạo & Nâng cao năng lực",
      description: "Hệ thống khóa học, coaching 1:1 và ngân sách đào tạo liên tục đồng hành cùng sự bứt phá của bạn.",
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
  ];

  return (
    <section id="development" className="py-20 bg-white">
      <Container>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-[var(--color-primary)] tracking-wider uppercase">
            PHÁT TRIỂN TỪ NỘI LỰC
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight">
            Nơi tài năng của bạn được tôn vinh và chắp cánh
          </h2>
          <p className="text-base text-[var(--color-muted)]">
            Chúng tôi tin rằng nguồn tài năng xuất sắc nhất luôn bắt đầu từ những đồng đội hiện tại.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <Card
                key={idx}
                variant="interactive"
                className="flex flex-col justify-between p-8 border-slate-200/80 hover:border-blue-300 transition-all duration-300 group"
              >
                <div className="space-y-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${card.color}`}>
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[var(--color-body)] leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-bold text-[var(--color-primary)] group-hover:gap-2 transition-all">
                  <span>Tìm hiểu chi tiết</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </div>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
