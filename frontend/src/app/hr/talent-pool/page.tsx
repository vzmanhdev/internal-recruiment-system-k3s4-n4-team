"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Search, Sparkles, Star, Tags, Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { fetchTalentPool, updateCandidateProfile, type ApplicationItem } from "@/features/applications/services/application.service";

const message = (error: unknown) => error instanceof Error ? error.message : "Không thể tải kho ứng viên.";

export default function HRTalentPoolPage() {
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const result = await fetchTalentPool(search); setItems(result.items); setError(""); }
    catch (caught) { setError(message(caught)); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);

  async function toggle(item: ApplicationItem) {
    setBusyId(item.id); setError("");
    try {
      const updated = await updateCandidateProfile(item.id, { is_talent_pool: !item.is_talent_pool });
      setItems(current => current.map(value => value.id === item.id ? updated : value));
      setNotice(updated.is_talent_pool ? "Đã lưu ứng viên vào kho tiềm năng." : "Đã bỏ đánh dấu lưu thủ công; ứng viên vẫn có thể xuất hiện nếu đạt tiêu chí gợi ý.");
    } catch (caught) { setError(message(caught)); }
    finally { setBusyId(null); }
  }

  return <div className="space-y-6">
    <header className="workspace-hero flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="flex items-center gap-2 text-sm font-bold text-violet-600"><Sparkles className="h-4 w-4" />Gợi ý từ Pipeline</p><h1 className="mt-2 text-3xl font-black text-slate-950">Kho ứng viên tiềm năng</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Tự động gợi ý hồ sơ đạt từ 4 sao, điểm phù hợp từ 70% hoặc được đánh dấu Đạt trong bước sàng lọc.</p></div>
      <Button href="/hr/candidates" variant="outline" leftIcon={<Users className="h-4 w-4" />}>Quay lại Pipeline</Button>
    </header>
    {error && <Alert variant="error">{error}</Alert>}{notice && <Alert variant="success">{notice}</Alert>}
    <Card><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo tên, email hoặc nhãn kỹ năng" leftIcon={<Search className="h-4 w-4" />} /></Card>
    {loading ? <Card><p className="py-12 text-center text-sm text-slate-500">Đang phân tích hồ sơ phù hợp...</p></Card> : !items.length ? <Card><div className="py-14 text-center"><Sparkles className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-bold text-slate-800">Chưa có gợi ý phù hợp</h2><p className="mt-1 text-sm text-slate-500">Hãy đánh giá hồ sơ trong Pipeline để hệ thống tạo gợi ý.</p></div></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(item => <Card key={item.id} className={item.is_talent_pool ? "border-violet-200 bg-violet-50/30" : ""}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-blue-600">{item.code}</p><h2 className="mt-1 text-lg font-bold text-slate-950">{item.full_name}</h2><p className="mt-1 text-xs text-slate-500">{item.job_title || "Hồ sơ ứng viên"}</p></div>{item.is_talent_pool && <span title="Đã lưu vào kho" className="rounded-full bg-violet-100 p-2 text-violet-700"><CheckCircle2 className="h-4 w-4" /></span>}</div>
      <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-3"><p className="text-[10px] font-bold text-slate-400">ĐIỂM PHÙ HỢP</p><p className="mt-1 text-xl font-black text-blue-700">{item.fit_score}%</p></div><div className="rounded-xl bg-white p-3"><p className="text-[10px] font-bold text-slate-400">ĐÁNH GIÁ</p><p className="mt-1 flex items-center gap-1 text-xl font-black text-amber-500"><Star className="h-4 w-4 fill-current" />{item.rating}/5</p></div></div>
      <div className="mt-4 flex flex-wrap gap-1.5"><Tags className="h-4 w-4 text-slate-400" />{item.tags.length ? item.tags.map(tag => <span key={tag} className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">{tag}</span>) : <span className="text-xs text-slate-400">Chưa có nhãn</span>}</div>
      <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><Button size="sm" variant={item.is_talent_pool ? "outline" : "primary"} isLoading={busyId === item.id} onClick={() => void toggle(item)}>{item.is_talent_pool ? "Bỏ lưu thủ công" : "Lưu vào kho"}</Button><Link href={`/hr/applications/${item.id}`} className="inline-flex items-center text-xs font-bold text-blue-600">Xem hồ sơ →</Link></div>
    </Card>)}</div>}
  </div>;
}
