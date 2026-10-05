import React from "react";
import Image from "next/image";
import { Sparkles, ShieldCheck, TrendingUp } from "lucide-react";
import { Container } from "@/components/layout/Container";

export function HeroSection() {
  return (
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#f8faff] via-[#fcfeff] to-white">
      {/* Background Glow Decorative Elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-tr from-blue-100/50 to-indigo-100/40 blur-3xl -z-10 rounded-full pointer-events-none" />

      <Container className="max-w-[1440px]">
        {/* Bố cục chia 2 cột trên Desktop (grid grid-cols-1 lg:grid-cols-2 gap-8 items-center) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Cột trái (Nội dung) */}
          <div className="space-y-6 sm:space-y-8">
            {/* Badge trên cùng: "CƠ HỘI NGHỀ NGHIỆP NỘI BỘ" (nền xanh nhạt, chữ xanh đậm kèm icon) */}
            <div className="inline-flex items-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-[#4285F4] text-[#4285F4]" />
                CƠ HỘI NGHỀ NGHIỆP NỘI BỘ
              </span>
            </div>

            {/* Tiêu đề chính (Heading): text-5xl font-extrabold */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Cùng nhau tạo nên{" "}
              <span className="text-[#4285F4] relative inline-block">
                những điều lớn lao
              </span>
            </h1>

            {/* Mô tả phụ */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              Khám phá cơ hội phát triển sự nghiệp ngay trong nội bộ, đóng góp giá trị, lan tỏa tài năng và cùng phát triển tiến xa hơn mỗi ngày.
            </p>

            {/* Tiện ích nổi bật (Flex ngang): "Minh bạch 100%" (icon khiên xanh lá) và "Lộ trình thăng tiến" (icon biểu đồ xanh dương) */}
            <div className="pt-2 flex flex-wrap items-center gap-6 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Minh bạch 100%</span>
                  <span className="text-xs text-slate-500">Quy trình công khai, rõ ràng</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
                  <TrendingUp className="w-5 h-5 text-[#4285F4]" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">Lộ trình thăng tiến</span>
                  <span className="text-xs text-slate-500">Đồng hành cùng sự phát triển</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải (Hình ảnh) */}
          <div className="relative pt-6 sm:pt-8">
            <div className="relative mx-auto max-w-lg lg:max-w-none w-full">
              {/* Chi tiết trang trí: Dòng chữ cách điệu "Better People Brighter Tomorrow" (màu xanh dương) trôi nổi ở góc trên bên phải ảnh */}
              <div className="absolute -top-10 right-2 sm:right-6 z-20 text-right select-none pointer-events-none">
                <span className="font-handwriting text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4285F4] rotate-[-5deg] inline-block leading-tight drop-shadow-sm">
                  Better People<br />Brighter Tomorrow
                </span>
              </div>

              {/* Hình ảnh mô tả môi trường làm việc nhóm, bo góc lớn rounded-3xl */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100 aspect-[4/3] sm:aspect-[16/11]">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop"
                  alt="Môi trường làm việc nhóm nội bộ năng động và sáng tạo"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Thẻ nổi (Floating Card) đè lên góc dưới bức ảnh: Nền trắng, bóng đổ, chứa dòng chữ trích dẫn */}
              <div className="absolute -bottom-5 left-4 sm:left-8 bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-gray-100 shadow-xl z-20 max-w-xs sm:max-w-sm">
                <p className="font-handwriting text-lg sm:text-xl text-slate-800 font-bold leading-snug">
                  &quot;Cùng nhau tạo nên những điều lớn lao&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
