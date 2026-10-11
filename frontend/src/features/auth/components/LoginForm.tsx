"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { authService } from "../services/auth.service";
import { saveAuthSession } from "../lib/auth-session";
import { ApiError } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";

export function LoginForm() {
  const router = useRouter();
  const { showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setErrorMsg("Tài Khoản hoặc Mật khẩu không chính xác. Vui lòng thử lại.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.login({
        email: cleanEmail,
        password: password,
      });

      // Lưu thông tin phiên đăng nhập
      saveAuthSession({ displayName: res.user?.full_name || "User" });

      // Đường dẫn chuyển hướng hoàn toàn do Backend xác định dựa trên Database Role
      const targetUrl = res.redirect_url || res.user?.redirect_url || "/jobs";

      // Kích hoạt Toast ở góc trên bên phải
      showSuccess("Đăng nhập thành công!", "Thành công");

      setTimeout(() => {
        router.push(targetUrl);
      }, 500);
    } catch (err: any) {
      if (err instanceof ApiError && err.status !== 503) {
        // Show the server's message: it is already generic for wrong credentials (no enumeration),
        // and it carries the browser-session lock (429, minutes remaining) and admin-lock / pending notices.
        setErrorMsg(err.message || "Tài Khoản hoặc Mật khẩu không chính xác. Vui lòng thử lại.");
      } else {
        setErrorMsg(err.message || "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại dịch vụ Backend.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-white rounded-[20px] border border-[#E2E8F0] shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-7 sm:p-[36px] sm:py-[40px] space-y-0">
      {/* Mobile Compact Brand Header */}
      <div className="lg:hidden flex justify-center mb-6">
        <BrandLogo size="md" href="/" />
      </div>

      {/* Card Header: Title & Subtitle */}
      <div className="text-center mb-6">
        <h2 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          Chào mừng trở lại
        </h2>
        <p className="text-[14px] text-[#64748B] max-w-[320px] mx-auto mt-2 leading-relaxed">
          Đăng nhập để tiếp tục sử dụng hệ thống tuyển dụng nội bộ
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5">
          <Alert variant="error" title="Đăng nhập không thành công">
            {errorMsg}
          </Alert>
        </div>
      )}

      {/* Direct Email + Password Form */}
      <form onSubmit={handleSubmit} className="space-y-[20px]">
        {/* Email Field */}
        <Input
          label="Email"
          type="email"
          placeholder="Nhập email công việc"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-[18px] h-[18px] text-slate-400" />}
          autoComplete="email"
          required
        />

        {/* Password Field */}
        <PasswordInput
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-[18px] h-[18px] text-slate-400" />}
          autoComplete="current-password"
          required
        />


        {/* Options Row: Remember Me + Forgot Password */}
        <div className="flex items-center justify-between text-[14px] pt-1 pb-1">
          <Checkbox
            label="Ghi nhớ đăng nhập"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link
            href="/forgot-password"
            className="font-medium text-[#3B82F6] hover:text-[#2563EB] transition-colors hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Primary Login Button */}
        <div className="pt-[4px]">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-[18px] h-[18px]" />}
            className="w-full h-[48px] bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-[16px] font-semibold text-white rounded-[12px] shadow-md shadow-blue-500/10 disabled:opacity-60 flex-row whitespace-nowrap"
          >
            Đăng nhập
          </Button>
        </div>

        {/* Divider: Line - HOẶC ĐĂNG NHẬP VỚI - Line */}
        <div className="relative pt-[4px] pb-[4px]">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#E2E8F0]" />
          </div>
          <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wider">
            <span className="bg-white px-3 text-[#94A3B8]">
              HOẶC ĐĂNG NHẬP VỚI
            </span>
          </div>
        </div>

        {/* Google SSO Button */}
        <div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1000);
            }}
            className="w-full h-[48px] border border-[#E2E8F0] rounded-[12px] bg-white hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-[10px] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng nhập với Google</span>
          </button>
        </div>
      </form>

      {/* Footer Register Link */}
      <div className="text-center pt-5 mt-[24px] border-t border-[#F1F5F9]">
        <p className="text-[13px] sm:text-[14px] text-[#64748B]">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
