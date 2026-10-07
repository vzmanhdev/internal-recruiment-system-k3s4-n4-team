import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { SearchFilterBar } from "@/features/landing/components/SearchFilterBar";
import { BusinessMetricsSection } from "@/features/landing/components/BusinessMetricsSection";
import { JobOpportunitiesSection } from "@/features/landing/components/JobOpportunitiesSection";
import { CareerDevelopmentSection } from "@/features/landing/components/CareerDevelopmentSection";
import { ReferralBanner } from "@/features/landing/components/ReferralBanner";
import { DevelopmentProcessSection } from "@/features/landing/components/DevelopmentProcessSection";
import { WhyJoinSection } from "@/features/landing/components/WhyJoinSection";
import { TestimonialsSection } from "@/features/landing/components/TestimonialsSection";
import { FinalCTASection } from "@/features/landing/components/FinalCTASection";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Thanh điều hướng trên cùng (Header - Top Navbar) */}
      <Header />

      <main className="flex-1">
        {/* 2. Khu vực Hero Banner (Phần nội dung chính) */}
        <HeroSection />

        {/* 3. Thanh công cụ tìm kiếm (Search Bar) nằm ngay dưới khu vực Hero Banner */}
        <Container id="search-bar" className="relative -mt-10 lg:-mt-14 z-20 mb-16 max-w-[1760px]">
          <SearchFilterBar />
        </Container>

        {/* Các khối thông tin & việc làm của Landing Page */}
        <BusinessMetricsSection />
        <JobOpportunitiesSection />
        <CareerDevelopmentSection />
        <ReferralBanner />
        <DevelopmentProcessSection />
        <WhyJoinSection />
        
        {/* Tin tức & Câu chuyện nội bộ */}
        <div id="news">
          <TestimonialsSection />
        </div>

        <FinalCTASection />
      </main>

      <Footer />
    </div>
  );
}
