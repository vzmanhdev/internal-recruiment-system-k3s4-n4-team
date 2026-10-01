"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    companyEmail: "",
    employeeCode: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

    if (!formData.employeeCode.trim()) {
      setErrorMsg("Vui lòng nhập mã nhân viên.");
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
      await authService.register({
        full_name: formData.fullName.trim(),
        email: formData.companyEmail.trim(),
        password: formData.password,
        role: "employee",
      });

      setSuccessMsg("Tạo tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
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

            {/* 3. Mã nhân viên */}
            <div>
              <label
                htmlFor="employeeCode"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Mã nhân viên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="employeeCode"
                  name="employeeCode"
                  type="text"
                  required
                  value={formData.employeeCode}
                  onChange={handleChange}
                  placeholder="VD: NV01234"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white uppercase"
                />
              </div>
            </div>

            {/* 4. Mật khẩu */}
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
