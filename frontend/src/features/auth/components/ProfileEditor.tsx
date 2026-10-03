"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Camera, KeyRound, UserRound } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthSession } from "../lib/auth-session";
import { authService } from "../services/auth.service";
import { ApiError } from "@/lib/api-client";

export function ProfileEditor() {
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

  function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Vui lòng chọn đúng định dạng ảnh.");
    if (file.size > 2 * 1024 * 1024) return setError("Ảnh đại diện không được vượt quá 2 MB.");
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!fullName.trim()) return setError("Họ và tên không được để trống.");
    setSaving(true);
    try {
      await authService.updateProfile({ full_name: fullName.trim(), phone: phone.trim() || undefined, avatar_url: avatarUrl || undefined });
      setSuccess("Thông tin cá nhân đã được cập nhật.");
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể cập nhật hồ sơ.");
    } finally {
      setSaving(false);
    }
  }

  if (!session) return <Alert variant="warning">Vui lòng đăng nhập để xem hồ sơ cá nhân.</Alert>;

  return (
    <Card className="mx-auto w-full max-w-2xl p-6 sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-white bg-blue-50 text-blue-600 shadow-lg">
          {avatarUrl ? <Image src={avatarUrl} alt="Ảnh đại diện" fill unoptimized className="object-cover" /> : <UserRound className="h-12 w-12" />}
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
          <Camera className="h-4 w-4" /> Thay ảnh đại diện
          <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} />
        </label>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG hoặc WebP; tối đa 2 MB.</p>
      </div>

      {error && <Alert variant="error" className="mb-5">{error}</Alert>}
      {success && <Alert variant="success" className="mb-5">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input label="Họ và tên *" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        <Input label="Email" value={session.email} disabled />
        <Input label="Số điện thoại" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Ví dụ: 0901234567" />
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
