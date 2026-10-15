import React from "react";
import Image from "next/image";
import { Quote } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import type { TestimonialItem } from "../types/landing.types";

const testimonials: TestimonialItem[] = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    role: "Trưởng nhóm Phát triển Phần mềm",
    department: "Khối Công nghệ Thông tin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop",
    quote: "Ứng tuyển nội bộ giúp tôi tự tin chuyển giao từ Senior Engineer lên vị trí Management. Quy trình minh bạch, quản lý ủng hộ và lộ trình đào tạo rõ ràng.",
  },
  {
    id: "2",
    name: "Trần Thị Minh",
    role: "Senior Product Designer",
    department: "Phát triển Sản phẩm",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop",
    quote: "Tôi chuyển đổi vị trí từ Marketing sang UI/UX nhờ chương trình luân chuyển nội bộ. Môi trường công ty thực sự tạo điều kiện tối đa cho sự học hỏi.",
  },
  {
    id: "3",
    name: "Lê Hoàng Nam",
    role: "Quản lý Dự án Công nghệ",
    department: "Tài chính - Kế toán",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
    quote: "Cổng tuyển dụng nội bộ rất tiện lợi. Mọi thông tin mô tả công việc và tiêu chuẩn đều công khai, phản hồi từ HR cực kỳ nhanh chóng và chuyên nghiệp.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-slate-50/50 border-t border-slate-200/60">
      <Container>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-bold text-[var(--color-primary)] tracking-wider uppercase">
            CÂU CHUYỆN THÀNH CÔNG
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight">
            Đồng đội nói gì về lộ trình phát triển nội bộ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <Card
              key={item.id}
              variant="default"
              className="p-8 flex flex-col justify-between relative border-slate-200/80 bg-white"
            >
              <Quote className="w-10 h-10 text-blue-200 absolute top-6 right-6 pointer-events-none" />
              <p className="text-sm text-slate-600 leading-relaxed italic mb-8 relative z-10">
                &quot;{item.quote}&quot;
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-blue-100">
                  <Image src={item.avatar} alt={item.name} fill sizes="48px" className="object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-heading)]">{item.name}</h4>
                  <p className="text-xs text-[var(--color-primary)] font-semibold">{item.role}</p>
                  <p className="text-[11px] text-slate-400">{item.department}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
