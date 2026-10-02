import React from "react";
import { UserPlus, CheckCircle2, Gift, FilePlus2, ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export function ReferralBanner() {
  const steps = [
    {
      num: "01",
      icon: UserPlus,
      title: "Giới thiệu ứng viên",
      desc: "Gửi thông tin đồng nghiệp hoặc cựu đồng nghiệp phù hợp với vị trí tuyển dụng.",
    },
    {
      num: "02",
      icon: CheckCircle2,
      title: "HR tiếp nhận & Đánh giá",
      desc: "Bộ phận Nhân sự liên hệ, phỏng vấn và phản hồi tiến độ minh bạch.",
    },
    {
      num: "03",
      icon: Gift,
      title: "Nhận thưởng đồng đội",
      desc: "Nhận phần thưởng tài chính hấp dẫn khi ứng viên thử việc thành công.",
    },
  ];

  return (
    <section id="referral" className="py-16 bg-slate-50/50">
      <Container>
        <div className="relative rounded-3xl bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#3B82F6] text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl shadow-blue-500/15 border border-blue-400/30">
          {/* Subtle Light Decorative Glow Elements */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

          {/* Header Content */}
          <div className="relative z-10 max-w-3xl space-y-4 mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-white/15 text-white border border-white/30 backdrop-blur-md tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-200 animate-pulse" />
              CHƯƠNG TRÌNH GIỚI THIỆU ĐỒNG ĐỘI
            </span>
            <h2
              style={{ color: "#FFFFFF" }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black !text-white tracking-tight leading-[1.15]"
            >
              Cùng nhau giới thiệu những đồng đội phù hợp
            </h2>
            <p
              style={{ color: "rgba(255, 255, 255, 0.95)" }}
              className="text-base sm:text-lg !text-white/95 leading-relaxed font-normal"
            >
              Mỗi lời giới thiệu là một cơ hội phát triển, góp phần xây dựng đội ngũ vững mạnh hơn.
            </p>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mb-10">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-xl bg-white text-[#2563EB] flex items-center justify-center font-bold shadow-md shadow-black/5 group-hover:scale-105 transition-transform">
                        <IconComponent className="w-5 h-5 text-[#2563EB]" />
                      </div>
                      <span
                        style={{ color: "rgba(255, 255, 255, 0.4)" }}
                        className="text-2xl font-black !text-white/40 group-hover:!text-white/60 transition-colors"
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3
                      style={{ color: "#FFFFFF" }}
                      className="text-lg font-bold !text-white tracking-tight"
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{ color: "rgba(255, 255, 255, 0.9)" }}
                      className="text-xs sm:text-sm !text-white/90 leading-relaxed font-normal"
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Row */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto bg-white hover:bg-blue-50 text-[#1D4ED8] font-bold border-0 shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all px-7 h-12 rounded-xl flex items-center gap-2 text-base"
              leftIcon={<FilePlus2 className="w-5 h-5 text-[#1D4ED8]" />}
              rightIcon={<ArrowRight className="w-4 h-4 text-[#1D4ED8]" />}
            >
              Gửi ứng viên ngay
            </Button>
            <span className="text-xs text-blue-100/90 font-medium">
              *Áp dụng thưởng lên tới 20.000.000 VNĐ/vị trí thành công.
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
