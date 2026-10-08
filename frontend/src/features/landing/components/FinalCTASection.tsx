import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function FinalCTASection() {
  return (
    <section className="py-20 bg-[var(--color-primary-light)] border-t border-blue-100">
      <Container>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-[var(--color-primary)]">
            <Sparkles className="w-3.5 h-3.5" />
            SẴN SÀNG BẮT ĐẦU?
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--color-heading)] tracking-tight">
            Sẵn sàng cho bước tiến tiếp theo trong sự nghiệp?
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-body)] max-w-2xl mx-auto leading-relaxed">
            Khám phá hàng trăm cơ hội phát triển nghề nghiệp nội bộ hấp dẫn ngay hôm nay và nhận sự hỗ trợ tận tình từ đội ngũ Nhân sự.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" href="#jobs" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Xem vị trí đang tuyển
            </Button>
            <Button size="lg" variant="outline" href="/register">
              Tạo tài khoản ứng viên
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
