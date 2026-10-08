"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send, CheckCircle2, Clock, ShieldAlert, KeyRound, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { authService } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api-client";

type ResetStep = 1 | 2 | 3 | 4;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>(1);
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resetSessionId, setResetSessionId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldError, setFieldError] = useState("");

  // OTP 6-digit state
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Cooldown Timer
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // Timer Countdown Effect
  useEffect(() => {
    if (step === 3 && cooldownSeconds > 0) {
      const timer = setInterval(() => {
        setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, cooldownSeconds]);

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ==========================================
  // STEP 1: Submit Email Request
  // ==========================================
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldError("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFieldError("Vui lòng nhập email của bạn.");
      setErrorMsg("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setFieldError("Email không đúng định dạng (Ví dụ: name@company.com).");
      setErrorMsg("Email không hợp lệ.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestPasswordReset(cleanEmail);
      setResetSessionId(res.reset_session_id);
      setMaskedEmail(res.masked_email || cleanEmail);
      setCooldownSeconds(res.resend_cooldown_seconds || 60);
      setStep(3); // Jump directly to Step 3: OTP Input Form
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Không thể khởi tạo yêu cầu. Vui lòng thử lại.");
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

  // ==========================================
  // STEP 3: OTP Digits Handling & Verification
  // ==========================================
  const handleOtpChange = (index: number, value: string) => {
    // Only accept numeric digits
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // Only take last typed character
    setOtpDigits(newDigits);
    setErrorMsg("");

    // Auto-focus next input box if typed
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    const completeOtp = newDigits.join("");
    if (completeOtp.length === 6) {
      verifyOtpCode(completeOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
      verifyOtpCode(pastedData);
    }
  };

  const verifyOtpCode = async (otpCode: string) => {
    if (!resetSessionId || otpCode.length !== 6) return;
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await authService.verifyPasswordResetOtp(resetSessionId, otpCode);
      if (res.success) {
        setStep(4); // Go to Step 4: Success Screen
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Mã OTP không chính xác.");
      } else {
        setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
      setOtpDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || isResending || !resetSessionId) return;
    setErrorMsg("");
    setIsResending(true);

    try {
      const res = await authService.resendPasswordResetOtp(resetSessionId);
      setCooldownSeconds(res.resend_cooldown_seconds || 60);
      setOtpDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Không thể gửi lại mã. Vui lòng thử lại sau.");
      } else {
        setErrorMsg("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-8 bg-[#F8FAFC]">
      <Card className="w-full max-w-[460px] p-6 sm:p-10 bg-white border border-slate-200/80 shadow-[0_20px_50px_rgba(8,112,184,0.07)] space-y-6 rounded-3xl">
        
        {/* ========================================================================= */}
        {/* STEP 1: NHẬP EMAIL */}
        {/* ========================================================================= */}
        {step === 1 && (
          <>
            <div className="flex justify-center mb-1">
              <BrandLogo size="md" href="/" />
            </div>

            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
                Quên mật khẩu?
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                Nhập email đã đăng ký để nhận mã OTP và đặt lại mật khẩu.
              </p>
            </div>

            {errorMsg && (
              <Alert variant="error" title="Thông báo">
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleRequestSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldError("");
                  setErrorMsg("");
                }}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                error={fieldError}
                required
                className="h-12 text-sm"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full h-12 text-sm font-bold bg-[#0284C7] hover:bg-[#0369A1] shadow-md shadow-sky-500/20 rounded-xl"
              >
                Gửi mã OTP
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0284C7] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: THÔNG BÁO ĐÃ GỬI OTP */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center mx-auto text-[#0284C7] shadow-inner">
              <Mail className="w-8 h-8 text-[#0284C7]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
                Đã gửi mã OTP!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Chúng tôi đã gửi mã OTP đến email <span className="font-bold text-slate-800">{maskedEmail}</span>
              </p>
            </div>

            <div className="bg-sky-50/80 border border-sky-100 p-3.5 rounded-2xl text-left flex items-start gap-3 text-xs text-sky-800">
              <Clock className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Vui lòng kiểm tra hộp thư. Mã OTP có hiệu lực trong <strong>10 phút</strong>.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setStep(3)}
                className="w-full h-12 text-sm font-bold bg-[#0284C7] hover:bg-[#0369A1] shadow-md shadow-sky-500/20 rounded-xl"
              >
                Nhập mã OTP
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                className="w-full h-11 text-xs font-semibold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                Quay lại
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: NHẬP MÃ OTP */}
        {/* ========================================================================= */}
        {step === 3 && (
          <>
            <div className="flex justify-center mb-1">
              <BrandLogo size="md" href="/" />
            </div>

            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
                Nhập mã OTP
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vui lòng nhập mã OTP 6 số đã được gửi đến <span className="font-bold text-slate-700">{maskedEmail}</span>
              </p>
            </div>

            {errorMsg && (
              <Alert variant="error" title="Lỗi xác thực">
                {errorMsg}
              </Alert>
            )}

            {/* 6 OTP Boxes */}
            <div className="flex justify-center items-center gap-2 sm:gap-2.5 py-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl focus:border-[#0284C7] focus:bg-white focus:ring-4 focus:ring-sky-100 outline-none transition-all"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <div className="text-center space-y-1 text-xs">
              <p className="text-slate-500">Mã OTP có hiệu lực trong 10 phút.</p>
              
              {cooldownSeconds > 0 ? (
                <p className="text-slate-400 font-medium">
                  Gửi lại mã sau <span className="text-[#0284C7] font-bold">{formatTimer(cooldownSeconds)}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="inline-flex items-center gap-1 font-semibold text-[#0284C7] hover:underline disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
                  Gửi lại mã
                </button>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                isLoading={isLoading}
                onClick={() => verifyOtpCode(otpDigits.join(""))}
                className="w-full h-12 text-sm font-bold bg-[#0284C7] hover:bg-[#0369A1] shadow-md shadow-sky-500/20 rounded-xl"
              >
                Xác nhận
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: THÔNG BÁO GỬI MẬT KHẨU MỚI */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-6 text-center py-2">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
                Đặt lại mật khẩu thành công!
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed px-2">
                Chúng tôi đã gửi mật khẩu mới đến email <span className="font-bold text-slate-800">{maskedEmail}</span>. Vui lòng kiểm tra hộp thư (kể cả Spam) và đăng nhập với mật khẩu mới.
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                href="/login"
                className="w-full h-12 text-sm font-bold bg-[#0284C7] hover:bg-[#0369A1] shadow-md shadow-sky-500/20 rounded-xl"
              >
                Quay lại trang đăng nhập
              </Button>
            </div>
          </div>
        )}

      </Card>
    </div>
  );
}
