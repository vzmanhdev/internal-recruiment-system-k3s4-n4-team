"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, Clock3, FileCheck2, Search, X, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api-client";
import { approveRequisition, fetchRequisitions, rejectRequisition, RequisitionItem } from "@/features/hr/services/requisition.service";
import { ManagerShell } from "./ManagerShell";

const statusLabels: Record<string, string> = {
  draft: "Bản nháp",
  pending_dept: "Chờ Trưởng bộ phận",
  pending_hr: "Đã chuyển HR",
  approved: "Đã phê duyệt",
  rejected: "Bị từ chối",
  closed: "Đã đóng",
};

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_dept: "bg-amber-50 text-amber-700",
  pending_hr: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  closed: "bg-violet-50 text-violet-700",
};

export function ManagerRequisitionWorkspace({ view = "dashboard" }: { view?: "dashboard" | "all" }) {
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(view === "dashboard" ? "pending_dept" : "all");
  const [selected, setSelected] = useState<RequisitionItem | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchRequisitions({ page_size: 100 });
      setItems(result.items);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải yêu cầu tuyển dụng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => ({
    pending: items.filter((item) => item.status === "pending_dept").length,
    transferred: items.filter((item) => item.status === "pending_hr").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
  }), [items]);

  const visible = useMemo(() => items.filter((item) => {
    const matchStatus = status === "all" || item.status === status;
    const keyword = query.trim().toLowerCase();
    const matchQuery = !keyword || `${item.code} ${item.title} ${item.department_name ?? ""}`.toLowerCase().includes(keyword);
    return matchStatus && matchQuery;
  }), [items, query, status]);

  const act = async (action: "approve" | "reject") => {
    if (!selected) return;
    if (action === "reject" && comment.trim().length < 5) {
      setError("Vui lòng nhập lý do từ chối có ít nhất 5 ký tự.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (action === "approve") await approveRequisition(selected.id, comment || "Đồng ý nhu cầu tuyển dụng của bộ phận");
      else await rejectRequisition(selected.id, comment);
      setNotice(action === "approve" ? "Đã duyệt và chuyển tờ trình sang HR Manager." : "Đã từ chối tờ trình và lưu lý do.");
      setSelected(null);
      setComment("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể xử lý tờ trình.");
    } finally {
      setSaving(false);
    }
  };

  const metrics = [
    { label: "Chờ bộ phận duyệt", value: counts.pending, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "Đã chuyển HR", value: counts.transferred, icon: ClipboardCheck, tone: "bg-blue-50 text-blue-700" },
    { label: "Đã phê duyệt", value: counts.approved, icon: FileCheck2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Bị từ chối", value: counts.rejected, icon: XCircle, tone: "bg-rose-50 text-rose-700" },
  ];

  return <ManagerShell><div className="mx-auto max-w-[1400px] space-y-6">
    <header className="workspace-hero flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold text-blue-600"><ClipboardCheck className="h-4 w-4" />Không gian Trưởng bộ phận</div><h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">{view === "dashboard" ? "Tổng quan nhu cầu nhân sự" : "Duyệt yêu cầu tuyển dụng"}</h1><p className="mt-2 text-sm text-slate-500">Kiểm tra nhu cầu, ngân sách và chuyển tờ trình hợp lệ sang HR Manager.</p></div>{view === "dashboard" && <Link href="/manager/requisitions" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">Xem toàn bộ yêu cầu <ArrowRight className="h-4 w-4" /></Link>}</header>
    {error && <Alert variant="error">{error}</Alert>}{notice && <Alert variant="success">{notice}</Alert>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => { const Icon = metric.icon; return <Card key={metric.label}><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-500">{metric.label}</p><p className="mt-2 text-3xl font-black text-slate-950">{metric.value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl ${metric.tone}`}><Icon className="h-5 w-5" /></span></div></Card>; })}</div>
    {view === "all" && <Card><div className="grid gap-3 md:grid-cols-[1fr_220px]"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã, vị trí hoặc phòng ban..." className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-500" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="all">Tất cả trạng thái</option><option value="pending_dept">Chờ bộ phận duyệt</option><option value="pending_hr">Đã chuyển HR</option><option value="approved">Đã phê duyệt</option><option value="rejected">Bị từ chối</option></select></div></Card>}
    <Card className="overflow-hidden p-0"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="font-extrabold text-slate-950">{view === "dashboard" ? "Cần xử lý" : "Danh sách tờ trình"}</h2><span className="text-xs font-semibold text-slate-500">{visible.length} yêu cầu</span></div>{loading ? <div className="p-12 text-center text-sm text-slate-500">Đang tải dữ liệu...</div> : visible.length === 0 ? <div className="p-12 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" /><p className="mt-3 font-bold text-slate-800">Không có yêu cầu cần xử lý</p><p className="mt-1 text-sm text-slate-500">Các tờ trình mới sẽ xuất hiện tại đây.</p></div> : <div className="divide-y divide-slate-100">{visible.slice(0, view === "dashboard" ? 5 : undefined).map((item) => <article key={item.id} className="grid gap-4 p-5 hover:bg-slate-50 lg:grid-cols-[1.4fr_1fr_150px_auto] lg:items-center"><div><p className="text-xs font-bold text-blue-600">{item.code}</p><h3 className="mt-1 font-extrabold text-slate-950">{item.title}</h3><p className="mt-1 text-sm text-slate-500">Tạo bởi {item.creator_name ?? "Nhân viên"}</p></div><div><p className="text-sm font-semibold text-slate-800">{item.department_name ?? "Chưa xác định"}</p><p className="text-xs text-slate-500">Cần tuyển {item.quantity} người</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[item.status]}`}>{statusLabels[item.status]}</span><Button size="sm" variant="outline" onClick={() => { setSelected(item); setComment(""); setError(""); }}>Xem chi tiết</Button></article>)}</div>}</Card>
    {selected && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto bg-white"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-blue-600">{selected.code}</p><h2 className="mt-1 text-xl font-extrabold text-slate-950">{selected.title}</h2><p className="mt-1 text-sm text-slate-500">{selected.department_name} · {selected.quantity} nhân sự</p></div><button aria-label="Đóng" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="block text-xs text-slate-400">Lý do</span><b>{selected.reason === "replacement" ? "Tuyển thay thế" : selected.reason === "expansion" ? "Mở rộng bộ phận" : "Tuyển mới"}</b></p><p><span className="block text-xs text-slate-400">Dải lương</span><b>{selected.min_salary?.toLocaleString("vi-VN") ?? "—"} – {selected.max_salary?.toLocaleString("vi-VN") ?? "—"} VNĐ</b></p><p><span className="block text-xs text-slate-400">Địa điểm</span><b>{selected.work_location}</b></p><p><span className="block text-xs text-slate-400">Hạn tuyển</span><b>{selected.deadline ? new Date(selected.deadline).toLocaleDateString("vi-VN") : "Không giới hạn"}</b></p></div>{selected.job_description && <div className="mt-5"><h3 className="text-sm font-bold text-slate-900">Mô tả công việc</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{selected.job_description}</p></div>}{selected.status === "pending_dept" ? <div className="mt-5 space-y-3 border-t border-slate-100 pt-5"><label className="block text-sm font-semibold text-slate-800">Ghi chú phê duyệt hoặc lý do từ chối<textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Nhập nhận xét của Trưởng bộ phận..." className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500" /></label><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="danger" isLoading={saving} onClick={() => void act("reject")}><XCircle className="h-4 w-4" />Từ chối</Button><Button isLoading={saving} onClick={() => void act("approve")}><CheckCircle2 className="h-4 w-4" />Duyệt và chuyển HR</Button></div></div> : <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">Tờ trình này đã được xử lý ở vòng bộ phận.</p>}</Card></div>}
  </div></ManagerShell>;
}
