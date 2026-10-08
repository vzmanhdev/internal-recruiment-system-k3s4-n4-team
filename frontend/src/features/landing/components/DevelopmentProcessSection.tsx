import React from "react";
import { Container } from "@/components/layout/Container";

export function DevelopmentProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Khám phá cơ hội",
      description: "Tìm kiếm các vị trí tuyển dụng nội bộ phù hợp với năng lực và định hướng cá nhân.",
    },
    {
      number: "02",
      title: "Ứng tuyển & Xác nhận",
      description: "Gửi hồ sơ đơn giản qua hệ thống. Quản lý trực tiếp và HR nhận thông báo tự động.",
    },
    {
      number: "03",
      title: "Đánh giá phù hợp",
      description: "HR và đại diện bộ phận chuyên môn xem xét hồ sơ và lịch sử đóng góp nội bộ.",
    },
    {
      number: "04",
      title: "Phỏng vấn nội bộ",
      description: "Trao đổi thẳng thắn, cởi mở về kỳ vọng công việc và định hướng phát triển.",
    },
    {
      number: "05",
      title: "Nhận kết quả & Chuyển giao",
      description: "Nhận thư mời nhận việc và bắt đầu lộ trình chuyển giao vị trí minh bạch.",
    },
  ];

  return (
    <section id="process" className="py-20 bg-slate-50 border-b border-slate-200/60">
      <Container>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-[var(--color-primary)] tracking-wider uppercase">
            QUY TRÌNH PHÁT TRIỂN NỘI BỘ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight">
            5 bước minh bạch cho hành trình mới
          </h2>
          <p className="text-base text-[var(--color-muted)]">
            Quy trình tuyển dụng nội bộ được thiết kế tối giản, chuyên nghiệp và bảo mật thông tin tối đa.
          </p>
        </div>

        {/* Timeline Desktop Horizontal & Mobile Vertical */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-10 left-12 right-12 h-0.5 bg-blue-200 -z-0" />

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative z-10 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-extrabold text-lg border border-blue-100 shadow-sm">
                  {step.number}
                </div>
                <h3 className="text-base font-bold text-[var(--color-heading)]">
                  {step.title}
                </h3>
                <p className="text-xs text-[var(--color-body)] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
