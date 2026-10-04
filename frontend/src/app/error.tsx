"use client";
import { Button } from "@/components/ui/Button";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="state-card page-state"><h1>Không thể tải nội dung</h1><p>Đã có lỗi xảy ra. Vui lòng thử lại.</p><Button onClick={reset}>Thử lại</Button></main>}
