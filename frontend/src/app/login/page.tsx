import React from "react";
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
        <LoginForm />
      </div>
    </div>
  );
}
