"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone, Lock, IdCard, User, ArrowRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    employeeCode: "",
    fullName: "",
    companyEmail: "",
    phone: "",
    department: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.employeeCode || !formData.fullName || !formData.companyEmail || !formData.department) {
      setErrorMsg("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!formData.agreeTerms) {
      setErrorMsg("Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg("Tạo tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }, 1000);
  };

  return (
    <Card className="w-full max-w-[520px] mx-auto p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-[0_15px_40px_rgba(59,130,246,0.08)] space-y-6">
      {/* Header with Logo & Language Dropdown */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <BrandLogo size="md" href="/" />
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer">
          <span className="text-sm">🇻🇳</span>
          <span>VI</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </div>
      </div>

      <div className="space-y-1 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-heading)] tracking-tight">
          Tạo tài khoản
        </h2>
        <p className="text-xs text-slate-500">
          Đăng ký để bắt đầu sử dụng hệ thống tuyển dụng nội bộ
        </p>
      </div>

      {errorMsg && (
        <Alert variant="error" title="Lỗi đăng ký">
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" title="Thành công">
          {successMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Employee Code & Full Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mã nhân viên *"
            placeholder="VD: NV001"
            value={formData.employeeCode}
            onChange={(e) => handleChange("employeeCode", e.target.value)}
            leftIcon={<IdCard className="w-4 h-4 text-slate-400" />}
            required
          />
          <Input
            label="Họ và tên *"
            placeholder="Nhập họ và tên"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />
        </div>

        {/* Row 2: Company Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email công ty *"
            type="email"
            placeholder="name@company.com"
            value={formData.companyEmail}
            onChange={(e) => handleChange("companyEmail", e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />
          <Input
            label="Số điện thoại *"
            type="tel"
            placeholder="+84 - Nhập số điện thoại"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Row 3: Department Select */}
        <Select
          label="Phòng ban hiện tại *"
          value={formData.department}
          onChange={(e) => handleChange("department", e.target.value)}
          required
          options={[
            { value: "", label: "Chọn phòng ban" },
            { value: "it", label: "Khối Công nghệ Thông tin" },
            { value: "product", label: "Phát triển Sản phẩm (Khối Sản phẩm)" },
            { value: "hr", label: "Quản trị Nhân sự (Khối Nhân sự)" },
            { value: "finance", label: "Tài chính - Kế toán" },
            { value: "marketing", label: "Truyền thông & Marketing" },
          ]}
        />

        {/* Row 4: Passwords */}
        <PasswordInput
          label="Mật khẩu *"
          placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />

        <PasswordInput
          label="Xác nhận mật khẩu *"
          placeholder="Nhập lại mật khẩu"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          required
        />

        {/* Agreement Checkbox */}
        <div className="pt-2">
          <Checkbox
            label={
              <span className="text-xs text-slate-600 leading-normal">
                Tôi đồng ý với{" "}
                <Link href="#" className="text-[var(--color-primary)] font-semibold hover:underline">
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link href="#" className="text-[var(--color-primary)] font-semibold hover:underline">
                  Chính sách bảo mật
                </Link>{" "}
                của hệ thống.
              </span>
            }
            checked={formData.agreeTerms}
            onChange={(e) => handleChange("agreeTerms", e.target.checked)}
          />
        </div>

        {/* Submit CTA */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full h-12 text-sm font-bold rounded-xl"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Đăng ký tài khoản
        </Button>
      </form>

      {/* Footer link */}
      <div className="text-center pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-600">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </Card>
  );
}
