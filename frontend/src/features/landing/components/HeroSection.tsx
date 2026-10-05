"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, ShieldCheck, TrendingUp } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { fetchPublicCompanyContent } from "../services/content.service";

const DEFAULT_TITLE = "Cùng nhau tạo nên những điều lớn lao";
const DEFAULT_BODY = "Khám phá cơ hội phát triển sự nghiệp ngay trong nội bộ, đóng góp giá trị, lan tỏa tài năng và cùng phát triển tiến xa hơn mỗi ngày.";
const DEFAULT_IMAGE = "/images/home-team.png";

export function HeroSection() {
  const [content, setContent] = useState({ title: DEFAULT_TITLE, body: DEFAULT_BODY, image: DEFAULT_IMAGE });
  useEffect(() => {
    queueMicrotask(() => void fetchPublicCompanyContent().then((data) => setContent({ title: data.title, body: data.body, image: data.image || DEFAULT_IMAGE })).catch(() => undefined));
  }, []);
  return (
    <section className="relative overflow-hidden border-b border-blue-100/70 pb-20 pt-12 lg:pb-28 lg:pt-20">
      {/* Subtle Background Glow Decorative Elements */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#eaf4ff] via-[#f8fbff] to-[#eef7ff]" />
      <div className="absolute -left-40 top-8 -z-10 h-96 w-96 rounded-full bg-blue-300/25 blur-3xl pointer-events-none" />
      <div className="absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-cyan-200/25 blur-3xl pointer-events-none" />
      <div className="hero-grid absolute inset-0 -z-10 opacity-55 pointer-events-none" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Content (55% desktop width -> col-span-7) */}
          <div className="lg:col-span-7 space-y-6 rounded-[2rem] border border-white/80 bg-white/58 p-6 shadow-[0_24px_80px_rgba(37,99,235,.10)] backdrop-blur-sm sm:p-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[var(--color-primary)] border border-blue-200/80">
                <Sparkles className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
                CƠ HỘI NGHỀ NGHIỆP NỘI BỘ
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--color-heading)] tracking-tight leading-[1.12]">
              {content.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              {content.body}
            </p>

            {/* Micro Highlights */}
            <div className="pt-4 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Minh bạch 100%</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700">Lộ trình thăng tiến</span>
              </div>
            </div>
          </div>

          {/* Right Visual Image (45% desktop width -> col-span-5) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Handwriting script accent top right */}
              <div className="absolute -top-10 right-4 z-20 hidden sm:block text-right">
                <p className="font-handwriting text-3xl font-bold text-blue-600 rotate-[-4deg] drop-shadow-sm leading-tight">
                  Better<br />People<br />Brighter<br />Tomorrow
                </p>
              </div>

              <div className="relative rounded-[2rem] overflow-hidden shadow-[0_30px_80px_rgba(15,74,150,.25)] border-[6px] border-white bg-slate-100 aspect-[4/3] sm:aspect-[4/3]">
                <Image
                  src={content.image}
                  alt="Nhân sự công sở làm việc nhóm chuyên nghiệp"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 45vw"
                />
              </div>

              {/* Handwriting speech bubble on right */}
              <div className="absolute -bottom-4 right-2 bg-blue-50/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-blue-200/80 shadow-lg z-20">
                <p className="font-handwriting text-xl text-blue-700 font-bold leading-snug">
                  &quot;{content.title}&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
