import React, { Suspense } from "react";
import { LoginVisualColumn } from "@/features/auth/components/LoginVisualColumn";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Column: Visual & Branding (Desktop) */}
      <LoginVisualColumn />

      {/* Right Column: Interactive Login Form */}
      <div
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        }}
        className="flex flex-col justify-center items-center p-5 sm:p-10 lg:p-16 min-h-screen"
      >
        <Suspense fallback={<div className="h-[520px] w-full max-w-[440px] animate-pulse rounded-[20px] bg-slate-100" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
