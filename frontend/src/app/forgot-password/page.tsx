"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { authService } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldError("");
    setSuccessMsg("");

    if (!email.trim()) {
      setFieldError("Vui lòng nhập email công ty của bạn.");
      setErrorMsg("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!email.includes("@")) {
      setFieldError("Email không đúng định dạng (Ví dụ: name@company.com).");
      setErrorMsg("Email không hợp lệ.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessMsg(res.message || `Hướng dẫn khôi phục mật khẩu đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư đến.`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        if (err.fieldErrors?.email) {
          setFieldError(err.fieldErrors.email);
        }
      } else {
        setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 bg-[#F8FAFC]">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-white border border-slate-200 shadow-[var(--shadow-card)] space-y-6">
        <div className="flex justify-center mb-2">
          <BrandLogo size="md" href="/" />
        </div>

        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
            Quên mật khẩu?
          </h2>
          <p className="text-xs text-[var(--color-muted)] leading-relaxed">
            Nhập email công ty đã đăng ký. Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu đến hộp thư của bạn.
          </p>
        </div>

        {errorMsg && (
          <Alert variant="error" title="Lỗi yêu cầu">
            {errorMsg}
          </Alert>
        )}

        {successMsg ? (
          <div className="space-y-6 text-center">
            <Alert variant="success" title="Đã gửi email thành công">
              {successMsg}
            </Alert>
            <Button variant="outline" href="/login" className="w-full h-11" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Quay lại trang Đăng nhập
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email công ty"
              type="email"
              placeholder="user@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError("");
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              error={fieldError}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full h-12 text-sm font-bold"
              leftIcon={<Send className="w-4 h-4" />}
            >
              Gửi hướng dẫn đặt lại mật khẩu
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Quay lại trang Đăng nhập
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
