import React from "react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 bg-[var(--color-background-start)]">
      <RegisterForm />
    </div>
  );
}
