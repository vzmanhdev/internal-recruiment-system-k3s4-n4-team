"use client";

import { CircleAlert, Home, RefreshCw } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({reset}:{reset:()=>void}) {
  return <div className="flex min-h-screen flex-col bg-slate-50"><Header/><main className="grid flex-1 place-items-center px-4 py-16"><section className="w-full max-w-xl animate-[fadeIn_.25s_ease-out] rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600"><CircleAlert className="h-7 w-7"/></span><h1 className="mt-5 text-2xl font-extrabold text-slate-950 sm:text-3xl">Không thể tải nội dung</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Hệ thống gặp lỗi khi xử lý yêu cầu. Bạn có thể thử tải lại hoặc quay về trang chủ.</p><div className="mt-6 flex flex-col justify-center gap-3 min-[400px]:flex-row"><Button onClick={reset} leftIcon={<RefreshCw className="h-4 w-4"/>}>Thử lại</Button><Button href="/" variant="outline" leftIcon={<Home className="h-4 w-4"/>}>Về trang chủ</Button></div></section></main><Footer/></div>;
}
