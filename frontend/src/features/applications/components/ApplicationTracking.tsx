"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, FileSearch, Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { trackApplication, type TrackingResult } from "@/features/applications/services/application.service";

const statusLabels: Record<string, string> = { applied:"Đã tiếp nhận", screening:"Đang sơ tuyển", interviewing:"Đang phỏng vấn", offered:"Đã gửi đề nghị", hired:"Đã tuyển", rejected:"Chưa phù hợp", withdrawn:"Đã rút hồ sơ" };

export function ApplicationTracking() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(""); setResult(null);
    try { setResult(await trackApplication(code.trim().toUpperCase())); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không tìm thấy hồ sơ."); }
    finally { setLoading(false); }
  }
  return <div className="public-site min-h-screen"><Header /><main className="container py-12 sm:py-20">
    <div className="mx-auto max-w-3xl">
      <div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-600"><FileSearch /></div><h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl">Tra cứu trạng thái hồ sơ</h1><p className="mt-3 text-slate-500">Nhập mã được cấp sau khi nộp hồ sơ để xem tiến độ mới nhất.</p></div>
      <form onSubmit={submit} className="mx-auto mt-8 flex max-w-xl flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-blue-900/5 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Mã hồ sơ</span><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input required minLength={8} value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Ví dụ: APP-2026-0001" className="h-12 w-full rounded-2xl border border-slate-200 pl-12 pr-4 font-mono uppercase outline-none focus:border-blue-500" /></label><button disabled={loading} className="h-12 rounded-2xl bg-blue-600 px-7 font-bold text-white disabled:opacity-50">{loading?"Đang tra cứu...":"Tra cứu"}</button></form>
      {error && <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">{error}</div>}
      {result && <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-900/5">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white"><p className="font-mono text-sm text-blue-100">{result.code}</p><h2 className="mt-1 text-2xl font-black">{result.job_title}</h2><p className="mt-1 text-sm text-blue-100">{result.department_name}</p></div>
        <div className="p-6"><div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4"><CheckCircle2 className="h-7 w-7 text-emerald-600" /><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Trạng thái hiện tại</p><p className="font-black text-slate-950">{statusLabels[result.status] || result.status}</p></div></div>
        <h3 className="mt-7 font-black text-slate-950">Lịch sử xử lý</h3><div className="mt-4 space-y-4">{result.history.map((item,index)=><div key={`${item.created_at}-${index}`} className="flex gap-3"><div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600"><Clock3 className="h-4 w-4" /></div><div><p className="font-bold">{statusLabels[item.to_status] || item.to_status}</p><p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString("vi-VN")}</p></div></div>)}</div></div>
      </section>}
      <p className="mt-8 text-center text-sm text-slate-500"><Link href="/jobs" className="font-bold text-blue-600">← Xem các vị trí đang tuyển</Link></p>
    </div>
  </main><Footer /></div>;
}
