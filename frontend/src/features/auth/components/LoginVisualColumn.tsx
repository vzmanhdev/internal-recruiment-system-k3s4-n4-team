import React from "react";
import Image from "next/image";
import { Search, Building, UserCheck, Globe } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function LoginVisualColumn() {
  const valueBullets = [
    { icon: Search, label: "Cơ hội phát triển rõ ràng" },
    { icon: Building, label: "Môi trường làm việc chuyên nghiệp" },
    { icon: UserCheck, label: "Đồng đội xuất sắc" },
    { icon: Globe, label: "Lan tỏa giá trị tích cực" },
  ];

  return (
    <div className="relative hidden lg:flex flex-col justify-between p-12 lg:p-16 bg-[#0369A1] text-white overflow-hidden min-h-screen">
      {/* Background Architectural Image */}
      <Image
        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop"
        alt="Tòa nhà kiến trúc doanh nghiệp"
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
        className="object-cover opacity-45 mix-blend-overlay"
      />

      {/* Pure Azure Sky Blue Gradient Overlay (Zero Navy/Purple Tones) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(3, 105, 161, 0.92) 0%, rgba(2, 132, 199, 0.88) 50%, rgba(37, 99, 235, 0.85) 100%)",
        }}
      />

      {/* Bright Sky Blue Glow Decorative Circles */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-sky-200/25 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Header Logo - Pure White Logo Contrast */}
      <div className="relative z-10 pt-2 [&_span]:!text-white [&_svg]:!text-[#0284C7] [&_div.border]:!border-white/30 [&_div.border]:!bg-white">
        <BrandLogo size="lg" href="/" />
      </div>

      {/* Main Content (max-width 540px) */}
      <div className="relative z-10 max-w-[540px] my-auto py-6">
        <h1
          style={{
            fontSize: "clamp(40px, 3.8vw, 54px)",
            lineHeight: 1.1,
            fontWeight: 800,
            color: "#FFFFFF",
          }}
          className="tracking-tight !text-white drop-shadow-sm"
        >
          Con người từ nội bộ<br />
          tạo nên những điều<br />
          lớn lao
        </h1>

        <p
          style={{ color: "rgba(255, 255, 255, 0.95)" }}
          className="text-[16px] leading-[1.7] mt-5 font-normal max-w-lg !text-white/95 drop-shadow-sm"
        >
          Phát triển sự nghiệp trong môi trường mà bạn hiểu, bạn thuộc về, bạn thật sự tạo ra giá trị.
        </p>

        {/* 4 Benefit Glass Cards */}
        <div className="space-y-[14px] mt-8">
          {valueBullets.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 hover:border-white/40 transition-all p-3.5 rounded-2xl shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-white text-[#0284C7] flex items-center justify-center shrink-0 font-bold shadow-md shadow-black/5">
                  <IconComp className="w-5 h-5 text-[#0284C7]" />
                </div>
                <span
                  style={{ color: "#FFFFFF" }}
                  className="text-[15px] font-semibold !text-white tracking-wide drop-shadow-sm"
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Section: Divider & Slogan */}
      <div className="relative z-10 pb-2">
        {/* Full-width thin white divider */}
        <div
          style={{ opacity: 0.25 }}
          className="w-full border-t border-white mb-5"
        />

        {/* Slogan: Better People, Brighter Tomorrow */}
        <p
          style={{ color: "rgba(255, 255, 255, 0.95)" }}
          className="font-handwriting text-[25px] font-bold tracking-wide !text-white/95 drop-shadow-sm"
        >
          Better People, Brighter Tomorrow
        </p>
      </div>
    </div>
  );
}
