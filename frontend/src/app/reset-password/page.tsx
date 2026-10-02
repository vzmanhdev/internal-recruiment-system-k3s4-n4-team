"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { authService } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api-client";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function ResetPasswordForm() {
  const token=useSearchParams().get("token")??"";
  const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [error,setError]=useState(""); const [success,setSuccess]=useState(""); const [loading,setLoading]=useState(false);
  const submit=async(event:FormEvent)=>{event.preventDefault();setError("");if(!token){setError("Liên kết đặt lại mật khẩu không hợp lệ.");return}if(!PASSWORD_PATTERN.test(password)){setError("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số.");return}if(password!==confirm){setError("Mật khẩu xác nhận không trùng khớp.");return}setLoading(true);try{const result=await authService.resetPassword(token,password);setSuccess(result.message);setPassword("");setConfirm("")}catch(caught:unknown){setError(caught instanceof ApiError?caught.message:"Không thể đặt lại mật khẩu.")}finally{setLoading(false)}};
  return <div className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16"><Card className="mx-auto w-full max-w-md p-6 sm:p-8"><div className="mb-6 flex justify-center"><BrandLogo size="md" href="/"/></div><div className="mb-6 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><KeyRound className="h-7 w-7"/></span><h1 className="mt-4 text-2xl font-extrabold text-slate-950">Đặt lại mật khẩu</h1><p className="mt-2 text-sm text-slate-500">Tạo mật khẩu mới cho tài khoản của bạn.</p></div>{error&&<Alert variant="error" className="mb-5">{error}</Alert>}{success?<div className="space-y-5"><Alert variant="success">{success}</Alert><Button href="/login" className="w-full">Đăng nhập ngay</Button></div>:<form onSubmit={submit} className="space-y-5"><PasswordInput label="Mật khẩu mới" required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} leftIcon={<ShieldCheck className="h-4 w-4"/>} helperText="Tối thiểu 8 ký tự, gồm chữ và số."/><PasswordInput label="Xác nhận mật khẩu" required autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} leftIcon={<ShieldCheck className="h-4 w-4"/>}/><Button type="submit" size="lg" isLoading={loading} className="w-full">Cập nhật mật khẩu</Button></form>}</Card></div>;
}

export default function ResetPasswordPage(){return <Suspense fallback={<div className="min-h-screen bg-slate-50"/>}><ResetPasswordForm/></Suspense>}
