"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { AvatarUploader } from "./AvatarUploader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthSession } from "../lib/auth-session";
import { authService } from "../services/auth.service";
import { ApiError } from "@/lib/api-client";

export function ProfileEditor({ embedded = false }: { embedded?: boolean }) {
  const session = useAuthSession();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const sessionName = session?.full_name;
  const sessionPhone = session?.phone;
  const sessionAvatar = session?.avatar_url;

  useEffect(() => {
    if (!sessionName) return;
    queueMicrotask(() => {
      setFullName(sessionName);
      setPhone(sessionPhone ?? "");
      setAvatarUrl(sessionAvatar ?? "");
    });
  }, [sessionAvatar, sessionName, sessionPhone]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!fullName.trim()) return setError("Họ và tên không được để trống.");
    const normalizedPhone = phone.replace(/\s/g, "");
    if (normalizedPhone && !/^(?:\+84|0)[35789]\d{8}$/.test(normalizedPhone)) return setError("Số điện thoại Việt Nam không hợp lệ.");
    setSaving(true);
    try {
      await authService.updateProfile({ full_name: fullName.trim(), phone: normalizedPhone || undefined, avatar_url: avatarUrl || undefined });
      setSuccess("Thông tin cá nhân đã được cập nhật.");
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  if (!session) return <Alert variant="warning">Vui lòng đăng nhập để xem hồ sơ cá nhân.</Alert>;

  return (
    <Card className={embedded ? "w-full p-5 sm:p-6" : "mx-auto w-full max-w-2xl p-5 sm:p-8"}>
      {embedded && <h2 className="mb-5 text-lg font-bold text-slate-900">Hồ sơ cá nhân</h2>}
      <div className="mb-6"><AvatarUploader value={avatarUrl} onChange={(value) => { setAvatarUrl(value); setSuccess(""); }} /></div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}
      {success && <Alert variant="success" className="mb-5">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Họ và tên *" minLength={2} maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        <Input label="Email" value={session.email} disabled />
        <Input label="Số điện thoại" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ví dụ: 0901234567" helperText="Hỗ trợ đầu số 03, 05, 07, 08, 09 hoặc +84." />
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
          <Link href="/change-password" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600">
            <KeyRound className="h-4 w-4" /> Đổi mật khẩu
          </Link>
          <Button type="submit" isLoading={saving}>Lưu thay đổi</Button>
        </div>
      </form>
    </Card>
  );
}
