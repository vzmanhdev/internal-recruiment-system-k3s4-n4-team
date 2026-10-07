"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send, KeyRound, Lock, CheckCircle2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { authService } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  // Step 1: Request Email, Step 2: Verify OTP, Step 3: New Password, Step 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI & Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  // Resend Cooldown Timer (60s)
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Submit Email Request
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});
    setSuccessMsg("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFieldErrors({ email: "Vui lòng nhập email công ty của bạn." });
      setErrorMsg("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setFieldErrors({ email: "Email không đúng định dạng (Ví dụ: name@company.com)." });
      setErrorMsg("Email không hợp lệ.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.requestPasswordReset(cleanEmail);
      setSuccessMsg(res.message || "Nếu email tồn tại trong hệ thống, mã xác thực đã được gửi đến email của bạn.");
      setStep(2);
      setCooldown(60);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return;
    setErrorMsg("");
    setFieldErrors({});
    setIsLoading(true);

    try {
      const res = await authService.requestPasswordReset(email.trim());
      setSuccessMsg("Mã OTP mới đã được gửi đến email của bạn.");
      setCooldown(60);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setFieldErrors({ otp: "Vui lòng nhập mã OTP 6 chữ số." });
      setErrorMsg("Vui lòng nhập mã OTP.");
      return;
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setFieldErrors({ otp: "Mã OTP phải gồm đúng 6 chữ số." });
      setErrorMsg("Mã OTP không hợp lệ.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.verifyPasswordResetOtp(email.trim(), cleanOtp);
      setResetToken(res.reset_token);
      setSuccessMsg("Xác thực OTP thành công! Vui lòng nhập mật khẩu mới.");
      setStep(3);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setErrorMsg("Không thể xác thực mã OTP. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Submit New Password
  const handleConfirmPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    if (!newPassword) {
      setFieldErrors({ new_password: "Vui lòng nhập mật khẩu mới." });
      setErrorMsg("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newPassword.length < 8) {
      setFieldErrors({ new_password: "Mật khẩu tối thiểu 8 ký tự." });
      setErrorMsg("Mật khẩu mới quá ngắn.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirm_password: "Mật khẩu xác nhận không trùng khớp." });
      setErrorMsg("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.confirmPasswordReset({
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccessMsg("Mật khẩu của bạn đã được cập nhật thành công!");
      setStep(4);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
      } else {
        setErrorMsg("Không thể cập nhật mật khẩu. Vui lòng thử lại.");
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

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <>
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
                Quên mật khẩu?
              </h2>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Nhập email công ty đã đăng ký. Hệ thống sẽ gửi mã xác thực OTP 6 chữ số đến hộp thư của bạn.
              </p>
            </div>

            {errorMsg && (
              <Alert variant="error" title="Lỗi yêu cầu">
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleRequestOtp} className="space-y-5">
              <Input
                label="Email công ty"
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors({});
                  setErrorMsg("");
                }}
                leftIcon={<Mail className="w-4 h-4" />}
                error={fieldErrors.email}
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
                Gửi mã xác thực OTP
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
          </>
        )}

        {/* Step 2: Enter 6-digit OTP */}
        {step === 2 && (
          <>
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
                Nhập mã xác thực OTP
              </h2>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Mã xác thực OTP 6 chữ số đã được gửi đến <strong className="text-slate-800">{email}</strong>. Mã có hiệu lực trong 5 phút.
              </p>
            </div>

            {successMsg && (
              <Alert variant="success" title="Thông báo">
                {successMsg}
              </Alert>
            )}

            {errorMsg && (
              <Alert variant="error" title="Mã OTP không hợp lệ">
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <Input
                  label="Mã xác thực OTP (6 chữ số)"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setFieldErrors({});
                    setErrorMsg("");
                  }}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  className="tracking-[0.5em] text-center font-mono text-lg font-bold"
                  error={fieldErrors.otp}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full h-12 text-sm font-bold"
              >
                Xác nhận mã OTP
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setErrorMsg("");
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Đổi email khác
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="inline-flex items-center gap-1.5 font-bold text-[var(--color-primary)] hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : "Gửi lại mã OTP"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: Enter New Password */}
        {step === 3 && (
          <>
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
                Tạo mật khẩu mới
              </h2>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
              </p>
            </div>

            {errorMsg && (
              <Alert variant="error" title="Cập nhật mật khẩu thất bại">
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleConfirmPassword} className="space-y-4">
              <Input
                label="Mật khẩu mới"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFieldErrors({});
                  setErrorMsg("");
                }}
                leftIcon={<Lock className="w-4 h-4" />}
                error={fieldErrors.new_password}
                required
              />

              <Input
                label="Xác nhận mật khẩu mới"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors({});
                  setErrorMsg("");
                }}
                leftIcon={<Lock className="w-4 h-4" />}
                error={fieldErrors.confirm_password}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full h-12 text-sm font-bold"
              >
                Lưu mật khẩu mới
              </Button>
            </form>
          </>
        )}

        {/* Step 4: Success state */}
        {step === 4 && (
          <div className="space-y-6 text-center py-2">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-200 text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Đặt lại mật khẩu thành công!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mật khẩu tài khoản <strong className="text-slate-900">{email}</strong> của bạn đã được cập nhật thành công vào CSDL. Mật khẩu cũ đã bị loại bỏ hoàn toàn.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              href="/login"
              className="w-full h-12 text-sm font-bold"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Đăng nhập ngay
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
