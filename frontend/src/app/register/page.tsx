import React from "react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="auth-form-stage relative min-h-screen flex flex-col justify-center items-center overflow-hidden p-4 sm:p-8">
      <RegisterForm />
    </div>
  );
}
