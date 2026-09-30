"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, UserCheck } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api-client";
import { approvalService, type PendingUser } from "../services/approval.service";

export function PendingApprovals() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPendingUsers() {
    setIsLoading(true);
    setError("");
    try { setUsers(await approvalService.listPending()); }
    catch (caught: unknown) { setError(caught instanceof ApiError ? caught.message : "Không thể tải danh sách yêu cầu đăng ký."); }
    finally { setIsLoading(false); }
  }

  useEffect(() => {
    let isCancelled = false;
    approvalService.listPending()
      .then((items) => { if (!isCancelled) setUsers(items); })
      .catch((caught: unknown) => { if (!isCancelled) setError(caught instanceof ApiError ? caught.message : "Không thể tải danh sách yêu cầu đăng ký."); })
      .finally(() => { if (!isCancelled) setIsLoading(false); });
    return () => { isCancelled = true; };
  }, []);

  async function approve(user: PendingUser) {
    setApprovingId(user.id);
    setError("");
    setSuccess("");
    try {
      await approvalService.approve(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSuccess(`Đã phê duyệt tài khoản ${user.email}. Người dùng có thể đăng nhập ngay.`);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể phê duyệt tài khoản.");
    } finally { setApprovingId(null); }
  }

  return <div className="mx-auto max-w-[1400px] space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold text-blue-600"><UserCheck className="h-4 w-4"/>Quản lý đăng ký</div><h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">Yêu cầu chờ phê duyệt</h1><p className="mt-2 text-sm text-slate-500">Kiểm tra và kích hoạt tài khoản trước khi cho phép người dùng đăng nhập.</p></div><Button variant="outline" onClick={()=>void loadPendingUsers()} leftIcon={<RefreshCw className="h-4 w-4"/>}>Tải lại</Button></header>{error&&<Alert variant="error" title="Không thể tải dữ liệu">{error}</Alert>}{success&&<Alert variant="success" title="Phê duyệt thành công">{success}</Alert>}<Card className="overflow-hidden p-0"><div className="border-b border-slate-200 px-5 py-4"><p className="text-sm font-bold text-slate-900">{users.length} yêu cầu đang chờ</p></div>{isLoading?<div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500"><RefreshCw className="h-5 w-5 animate-spin"/>Đang tải yêu cầu...</div>:users.length===0?<div className="p-12 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500"/><h2 className="mt-3 font-bold text-slate-900">Không còn yêu cầu chờ duyệt</h2><p className="mt-1 text-sm text-slate-500">Tất cả tài khoản đăng ký đã được xử lý.</p></div>:<div className="divide-y divide-slate-100">{users.map((user)=><article key={user.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 font-bold text-amber-700">{user.full_name.split(" ").slice(-2).map((part)=>part[0]).join("")}</span><div className="min-w-0 flex-1"><h2 className="font-bold text-slate-900">{user.full_name}</h2><p className="truncate text-sm text-slate-500">{user.email}</p><p className="mt-1 flex items-center gap-1 text-xs text-amber-700"><Clock3 className="h-3.5 w-3.5"/>Đăng ký {user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "gần đây"}</p></div><Button onClick={()=>void approve(user)} isLoading={approvingId===user.id} leftIcon={<UserCheck className="h-4 w-4"/>}>Phê duyệt</Button></article>)}</div>}</Card></div>;
}
