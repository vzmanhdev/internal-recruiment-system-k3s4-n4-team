"use client";

import React from "react";
import { Check, Circle, ShieldCheck } from "lucide-react";
import { checkPasswordRules, type PasswordRulesState } from "@/lib/validation/password";

interface PasswordStrengthCardProps {
  password: string;
  className?: string;
}

export function PasswordStrengthCard({ password, className = "" }: PasswordStrengthCardProps) {
  const rules = checkPasswordRules(password);

  const criteria = [
    { label: "Tối thiểu 8 ký tự", met: rules.minLength },
    { label: "Ít nhất 1 chữ thường (a-z)", met: rules.hasLowercase },
    { label: "Ít nhất 1 chữ in hoa (A-Z)", met: rules.hasUppercase },
    { label: "Ít nhất 1 chữ số (0-9)", met: rules.hasNumber },
    { label: "Ít nhất 1 ký tự đặc biệt (!@#$%...)", met: rules.hasSpecialChar },
  ];

  return (
    <div className={`p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
          <ShieldCheck className={`w-3.5 h-3.5 ${rules.isValid ? "text-emerald-600" : "text-slate-400"}`} />
          Tiêu chuẩn mật khẩu an toàn:
        </span>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
          rules.isValid ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
        }`}>
          {rules.isValid ? "ĐẠT CHUẨN" : `${criteria.filter(c => c.met).length}/5 TIÊU CHÍ`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {criteria.map((c, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors duration-150 ${
              c.met ? "text-emerald-700 font-semibold" : "text-slate-400 font-normal"
            }`}
          >
            {c.met ? (
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
              </span>
            ) : (
              <Circle className="w-3 h-3 text-slate-300 shrink-0" />
            )}
            <span className="text-[11px] leading-tight">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
