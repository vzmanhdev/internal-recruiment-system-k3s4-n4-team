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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <Container className="relative -mt-10 lg:-mt-14 z-20 mb-12">
          <SearchFilterBar />
        </Container>
        <BusinessMetricsSection />
        <JobOpportunitiesSection />
        <CareerDevelopmentSection />
        <ReferralBanner />
        <DevelopmentProcessSection />
        <WhyJoinSection />
        <TestimonialsSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
