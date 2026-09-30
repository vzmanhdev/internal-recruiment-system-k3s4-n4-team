"use client";

import { useState } from "react";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ApiError } from "@/lib/api-client";
import { authService } from "@/features/auth/services/auth.service";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
    if (!PASSWORD_PATTERN.test(newPassword)) errors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ và số.";
    if (newPassword !== confirmPassword) errors.confirmPassword = "Mật khẩu xác nhận không trùng khớp.";
    if (currentPassword && currentPassword === newPassword) errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Vui lòng kiểm tra lại thông tin mật khẩu.");
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      const result = await authService.changePassword({ current_password: currentPassword, new_password: newPassword });
      setSuccess(result.message || "Đổi mật khẩu thành công.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (caught: unknown) {
      if (caught instanceof ApiError) setError(caught.message);
      else setError("Không thể đổi mật khẩu. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  }

  return <div className="min-h-screen bg-slate-50"><Header/><main className="mx-auto flex w-full max-w-6xl items-start justify-center px-4 py-12 sm:px-6 lg:py-16"><Card className="w-full max-w-xl p-6 sm:p-8"><div className="mb-7 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><KeyRound className="h-7 w-7"/></span><h1 className="mt-4 text-2xl font-extrabold text-slate-950 sm:text-3xl">Đổi mật khẩu</h1><p className="mt-2 text-sm leading-6 text-slate-500">Nhập mật khẩu hiện tại và tạo mật khẩu mới an toàn cho tài khoản của bạn.</p></div>{error&&<Alert variant="error" title="Không thể đổi mật khẩu" className="mb-5">{error}</Alert>}{success&&<Alert variant="success" title="Thành công" className="mb-5">{success}</Alert>}<form onSubmit={handleSubmit} className="space-y-5"><PasswordInput label="Mật khẩu hiện tại" value={currentPassword} onChange={(event)=>setCurrentPassword(event.target.value)} leftIcon={<LockKeyhole className="h-4 w-4"/>} autoComplete="current-password" error={fieldErrors.currentPassword} required/><PasswordInput label="Mật khẩu mới" value={newPassword} onChange={(event)=>setNewPassword(event.target.value)} leftIcon={<ShieldCheck className="h-4 w-4"/>} autoComplete="new-password" helperText="Tối thiểu 8 ký tự, bao gồm ít nhất một chữ và một số." error={fieldErrors.newPassword} required/><PasswordInput label="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(event)=>setConfirmPassword(event.target.value)} leftIcon={<ShieldCheck className="h-4 w-4"/>} autoComplete="new-password" error={fieldErrors.confirmPassword} required/><Button type="submit" size="lg" isLoading={isLoading} className="w-full">Cập nhật mật khẩu</Button></form></Card></main><Footer/></div>;
}
