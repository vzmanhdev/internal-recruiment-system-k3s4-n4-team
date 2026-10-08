import React from "react";
import { LoginVisualColumn } from "@/features/auth/components/LoginVisualColumn";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-blue-50 via-white to-sky-50">
      {/* Left Column: Visual & Branding (Desktop) */}
      <LoginVisualColumn />

      {/* Right Column: Interactive Login Form */}
      <div
        className="auth-form-stage relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-5 sm:p-10 lg:p-16"
      >
        <LoginForm />
      </div>
    </div>
  );
}
