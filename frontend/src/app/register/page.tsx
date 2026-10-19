"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService, type RegistrationChallenge } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api-client";

// Only the challenge id (an opaque server handle) is kept in the tab, so a reload can ask the server for the
// real state — lockout is decided by the backend, never restored from browser state. No code, no password.
const CHALLENGE_KEY = "candidate_registration_challenge";

function readStoredChallenge(): string | null {
  try {
    return sessionStorage.getItem(CHALLENGE_KEY);
  } catch {
    return null;
  }
}

function storeChallenge(id: string | null): void {
  try {
    if (id) sessionStorage.setItem(CHALLENGE_KEY, id);
    else sessionStorage.removeItem(CHALLENGE_KEY);
  } catch {
    // storage unavailable: the flow still works, only reload-resume is lost
  }
}

const formatTimer = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    companyEmail: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // OTP step (state always taken from the backend's challenge response)
  const [challenge, setChallenge] = useState<RegistrationChallenge | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isBlocked = !!challenge && challenge.challenge_status !== "pending";

  const applyChallenge = useCallback((next: RegistrationChallenge) => {
    setChallenge(next);
    setCooldownSeconds(next.resend_available_in_seconds || 0);
    storeChallenge(next.challenge_status === "consumed" ? null : next.challenge_id);
  }, []);

  /** Re-read the challenge from the server (after a reload or a rejected code). */
  const revalidate = useCallback(async (id: string) => {
    try {
      applyChallenge(await authService.registerChallengeStatus(id));
    } catch {
      storeChallenge(null);
      setChallenge(null);
    }
  }, [applyChallenge]);

  useEffect(() => {
    const stored = readStoredChallenge();
    if (!stored) return;
    authService.registerChallengeStatus(stored).then(applyChallenge).catch(() => storeChallenge(null));
  }, [applyChallenge]);

  useEffect(() => {
    if (!challenge || cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [challenge, cooldownSeconds]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // 1. Kiểm tra validation cơ bản
    if (!formData.fullName.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên của bạn.");
      return;
    }

    if (!formData.companyEmail.trim()) {
      setErrorMsg("Vui lòng nhập email công ty.");
      return;
    }

    if (!formData.companyEmail.includes("@")) {
      setErrorMsg("Email công ty không hợp lệ (Ví dụ: name@congty.com).");
      return;
    }

    if (!formData.password) {
      setErrorMsg("Vui lòng nhập mật khẩu.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg("Mật khẩu phải có độ dài tối thiểu từ 6 ký tự.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Xác nhận mật khẩu không trùng khớp với mật khẩu đã nhập.");
      return;
    }

    setIsLoading(true);

    try {
      const started = await authService.registerStart({
        full_name: formData.fullName.trim(),
        email: formData.companyEmail.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });
      setOtpDigits(Array(6).fill(""));
      applyChallenge(started);
      setSuccessMsg(started.message || "");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.");
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpCode = async (otpCode: string) => {
    if (!challenge || isBlocked || isLoading || otpCode.length !== 6) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);
    try {
      const done = await authService.registerVerify(challenge.challenge_id, otpCode);
      storeChallenge(null);
      setChallenge(null);
      setSuccessMsg(done.message);
      setTimeout(() => {
        router.push(done.redirect_url || "/login");
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof ApiError ? err.message : "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      setOtpDigits(Array(6).fill(""));
      // The server is the authority on attempts / lockout: always re-read its state.
      await revalidate(challenge.challenge_id);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isBlocked) return;
    if (value && !/^\d+$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    const completeOtp = newDigits.join("");
    if (completeOtp.length === 6) void verifyOtpCode(completeOtp);
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isBlocked) return;
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (isBlocked) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtpDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
      void verifyOtpCode(pasted);
    }
  };

  const handleResendOtp = async () => {
    if (!challenge || cooldownSeconds > 0 || isResending) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsResending(true);
    try {
      const next = await authService.registerResendOtp(challenge.challenge_id);
      setOtpDigits(Array(6).fill(""));
      applyChallenge(next); // inputs are enabled only because the server confirmed a new pending challenge
      setSuccessMsg(next.message || "");
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setErrorMsg(err instanceof ApiError ? err.message : "Không thể gửi lại mã. Vui lòng thử lại sau.");
      await revalidate(challenge.challenge_id);
    } finally {
      setIsResending(false);
    }
  };

  const restartRegistration = () => {
    storeChallenge(null);
    setChallenge(null);
    setErrorMsg("");
    setSuccessMsg("");
    setOtpDigits(Array(6).fill(""));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header đơn giản với Logo Tuyển Dụng Nội Bộ */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-100 transition-colors shadow-xs">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-gray-900 font-extrabold text-base sm:text-lg tracking-tight">
              TUYỂN DỤNG NỘI BỘ
            </span>
          </Link>

          <Link
            href="/login"
            className="text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* 2. Khối Form Đăng Ký (Main Card Căn Giữa Màn Hình) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sm:p-8 md:p-10 my-4 sm:my-8 transition-all">
          {/* Tiêu đề & Mô tả */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Tạo tài khoản ứng viên nội bộ
            </h1>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
              Tham gia ngay để khám phá các cơ hội phát triển sự nghiệp dành riêng cho bạn.
            </p>
          </div>

          {/* Thông báo lỗi nếu có */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 animate-fadeIn">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Thông báo thành công */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 animate-fadeIn">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Form Đăng ký */}
          {!challenge && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Họ và tên */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn An"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                />
              </div>
            </div>

            {/* 2. Email công ty */}
            <div>
              <label
                htmlFor="companyEmail"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Email công ty <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  required
                  value={formData.companyEmail}
                  onChange={handleChange}
                  placeholder="tennhanvien@congty.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Gợi ý: Sử dụng địa chỉ email chính thức có đuôi @congty.com
              </p>
            </div>

            {/* 3. Mật khẩu */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-4 pr-11 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 5. Xác nhận mật khẩu */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-4 pr-11 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Nút Đăng ký */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base shadow-sm hover:shadow transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Đang tạo tài khoản...</span>
                  </>
                ) : (
                  <span>Đăng ký</span>
                )}
              </button>
            </div>
          </form>
          )}

          {/* Bước xác thực email: mã OTP 6 số */}
          {challenge && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                Vui lòng nhập mã OTP 6 số đã được gửi đến{" "}
                <span className="font-semibold text-gray-900">{challenge.masked_email}</span>
              </p>

              <div className="flex justify-center items-center gap-2 sm:gap-2.5 py-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Chữ số OTP thứ ${idx + 1}`}
                    value={digit}
                    disabled={isBlocked || isLoading}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all ${
                      isBlocked
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50 select-none"
                        : "text-slate-800 bg-slate-50/80 border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    }`}
                    autoFocus={idx === 0 && !isBlocked}
                  />
                ))}
              </div>

              <div className="text-center space-y-1 text-xs">
                {challenge.challenge_status === "blocked" ? (
                  <p className="text-red-600 font-semibold">
                    Bạn đã nhập sai mã xác thực {challenge.max_attempts} lần. Mã OTP hiện tại đã bị vô hiệu hóa. Vui lòng yêu cầu mã mới.
                  </p>
                ) : challenge.challenge_status === "expired" ? (
                  <p className="text-red-600 font-semibold">Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.</p>
                ) : challenge.challenge_status !== "pending" ? (
                  <p className="text-red-600 font-semibold">Mã xác thực này không còn hiệu lực. Vui lòng yêu cầu mã mới.</p>
                ) : (
                  <>
                    <p className="text-gray-500">
                      Mã OTP có hiệu lực trong 10 phút. Bạn còn <span className="font-semibold text-gray-700">{challenge.remaining_attempts}</span> lần thử.
                    </p>
                    {cooldownSeconds > 0 ? (
                      <p className="text-gray-400 font-medium">
                        Gửi lại mã sau <span className="text-blue-600 font-bold">{formatTimer(cooldownSeconds)}</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="font-semibold text-blue-600 hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        Gửi lại mã
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  disabled={isBlocked || isLoading || otpDigits.join("").length < 6}
                  onClick={() => void verifyOtpCode(otpDigits.join(""))}
                  className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base shadow-sm hover:shadow transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? "Đang xác thực..." : "Xác nhận"}
                </button>

                {isBlocked && challenge.can_resend && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending || cooldownSeconds > 0}
                    className="w-full py-3 px-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {cooldownSeconds > 0 ? `Yêu cầu mã OTP mới sau ${formatTimer(cooldownSeconds)}` : "Yêu cầu mã OTP mới"}
                  </button>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={restartRegistration}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    Quay lại sửa thông tin đăng ký
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Liên kết điều hướng: Đã có tài khoản? Đăng nhập */}
          <div className="text-center mt-6 pt-5 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer bản quyền đơn giản */}
      <footer className="py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Hệ thống Tuyển Dụng Nội Bộ. Mọi quyền được bảo lưu.
      </footer>
    </div>
  );
}
