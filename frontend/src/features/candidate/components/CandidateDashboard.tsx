"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarDays, FileText, Gift } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchMyApplications, ApplicationItem, withdrawApplication } from "@/features/applications/services/application.service";
import { getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";
import { fetchCandidateInterviews, InterviewItem, respondToInterview } from "@/features/interviews/services/interview.service";
import { fetchMyOffers, OfferItem, respondToOffer } from "@/features/offers/services/offer.service";
import { ApiError } from "@/lib/api-client";

const appStatus: Record<string, string> = {
  applied: "Đã nộp", screening: "Đang sàng lọc", interviewing: "Phỏng vấn", offered: "Đã gửi offer",
  hired: "Trúng tuyển", rejected: "Chưa phù hợp", withdrawn: "Đã rút",
};
const responseLabel: Record<string, string> = { pending: "Chờ phản hồi", confirmed: "Đã xác nhận", declined: "Đã từ chối", reschedule_requested: "Đã đề nghị đổi lịch" };

export function CandidateDashboard() {
  const session = useAuthSession();
  const router = useRouter();
  const roles = getSessionRoles(session);
  const isCandidate = roles.includes("candidate");
  const sessionId = session?.id;
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [applicationResult, interviewResult, offerResult] = await Promise.all([
        fetchMyApplications(), fetchCandidateInterviews(), fetchMyOffers(),
      ]);
      setApplications(applicationResult.items);
      setInterviews(interviewResult.items);
      setOffers(offerResult.items);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải cổng thông tin ứng viên.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionId && !isCandidate) router.replace("/employee/dashboard");
    else if (sessionId) queueMicrotask(() => void load());
  }, [isCandidate, load, router, sessionId]);

  async function runAction(key: string, action: () => Promise<unknown>, success: string) {
    setWorkingId(key); setError(""); setNotice("");
    try { await action(); setNotice(success); await load(); }
    catch (caught: unknown) { setError(caught instanceof ApiError ? caught.message : "Không thể thực hiện thao tác."); }
    finally { setWorkingId(""); }
  }

  if (!session) return <Alert variant="warning">Vui lòng đăng nhập bằng tài khoản ứng viên để theo dõi hồ sơ.</Alert>;
  if (!isCandidate) return <Alert variant="warning">Đang chuyển tới cổng nhân sự nội bộ...</Alert>;
  if (loading) return <Card><p className="text-sm text-slate-500">Đang tải dữ liệu ứng tuyển...</p></Card>;

  const notifications = [
    ...interviews.map((item) => ({ id: `i-${item.id}`, text: `Lịch phỏng vấn: ${item.title}`, time: item.updated_at })),
    ...offers.map((item) => ({ id: `o-${item.id}`, text: `Thư mời ${item.position_title}: ${responseLabel[item.status] ?? item.status}`, time: item.updated_at })),
    ...applications.map((item) => ({ id: `a-${item.id}`, text: `${item.job_title}: ${appStatus[item.status] ?? item.status}`, time: item.updated_at })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="workspace-hero p-5 sm:p-7">
        <p className="text-sm font-semibold text-blue-600">Cổng thông tin ứng viên</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Xin chào, {session.full_name}</h1>
        <p className="mt-2 text-sm text-slate-500">Theo dõi toàn bộ hành trình ứng tuyển, lịch phỏng vấn và thư mời của bạn.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Button href="/jobs" variant="secondary">Xem việc làm</Button><Button href="/profile" variant="outline">Cập nhật hồ sơ</Button></div>
      </section>

      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><FileText className="h-6 w-6 text-blue-600"/><p className="mt-3 text-3xl font-black text-slate-900">{applications.length}</p><p className="text-sm text-slate-500">Hồ sơ đã nộp</p></Card>
        <Card className="p-5"><CalendarDays className="h-6 w-6 text-violet-600"/><p className="mt-3 text-3xl font-black text-slate-900">{interviews.length}</p><p className="text-sm text-slate-500">Lịch phỏng vấn</p></Card>
        <Card className="p-5"><Gift className="h-6 w-6 text-emerald-600"/><p className="mt-3 text-3xl font-black text-slate-900">{offers.length}</p><p className="text-sm text-slate-500">Thư mời làm việc</p></Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Hồ sơ ứng tuyển</h2><Link href="/jobs" className="text-sm font-semibold text-blue-600">Tìm vị trí mới</Link></div>
        {applications.length === 0 ? <p className="p-6 text-sm text-slate-500">Bạn chưa nộp hồ sơ nào.</p> : applications.map((item) => (
          <div key={item.id} className="border-b border-slate-100 p-5 last:border-0">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><p className="text-xs font-bold text-blue-600">{item.code}</p><h3 className="font-bold text-slate-900">{item.job_title}</h3><p className="text-xs text-slate-500">Nộp ngày {new Date(item.created_at).toLocaleDateString("vi-VN")}</p></div>
              <div className="flex items-center gap-3"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{appStatus[item.status] ?? item.status}</span>{!["hired", "rejected", "withdrawn"].includes(item.status) && <Button size="sm" variant="danger" isLoading={workingId === `app-${item.id}`} onClick={() => runAction(`app-${item.id}`, () => withdrawApplication(item.id), "Hồ sơ đã được rút.")}>Rút hồ sơ</Button>}</div>
            </div>
            {item.logs.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{item.logs.map((log) => <span key={log.id} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">{appStatus[log.to_status] ?? log.to_status} · {new Date(log.created_at).toLocaleDateString("vi-VN")}</span>)}</div>}
          </div>
        ))}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-violet-600"/><h2 className="font-bold text-slate-900">Lịch phỏng vấn</h2></div>
          <div className="mt-4 space-y-4">{interviews.length === 0 ? <p className="text-sm text-slate-500">Chưa có lịch phỏng vấn.</p> : interviews.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{new Date(item.start_time).toLocaleString("vi-VN")} · {item.location_or_link}</p><p className="mt-2 text-xs font-semibold text-violet-700">{responseLabel[item.candidate_response ?? "pending"]}</p>{item.response_token && <Button size="sm" variant="outline" className="mt-3" href={`/interview-response?token=${encodeURIComponent(item.response_token)}`}>Xem lịch / đề nghị đổi lịch</Button>}{(item.candidate_response ?? "pending") === "pending" && <div className="mt-3 flex gap-2"><Button size="sm" isLoading={workingId === `int-${item.id}`} onClick={() => runAction(`int-${item.id}`, () => respondToInterview(item.id, "confirmed"), "Đã xác nhận tham gia phỏng vấn.")}>Xác nhận</Button><Button size="sm" variant="outline" onClick={() => runAction(`int-${item.id}`, () => respondToInterview(item.id, "declined"), "Đã gửi phản hồi từ chối.")}>Từ chối</Button></div>}</div>
          ))}</div>
        </Card>

        <Card>
          <div className="flex items-center gap-2"><Gift className="h-5 w-5 text-emerald-600"/><h2 className="font-bold text-slate-900">Thư mời làm việc</h2></div>
          <div className="mt-4 space-y-4">{offers.length === 0 ? <p className="text-sm text-slate-500">Chưa có thư mời làm việc.</p> : offers.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><h3 className="font-bold text-slate-900">{item.position_title}</h3><p className="mt-1 text-sm text-slate-600">{item.offered_salary.toLocaleString("vi-VN")} VNĐ · {item.work_location}</p><p className="mt-1 text-xs text-slate-500">Bắt đầu: {new Date(item.start_date).toLocaleDateString("vi-VN")}</p><p className="mt-2 text-xs font-semibold text-emerald-700">{responseLabel[item.status] ?? item.status}</p>{item.status === "sent" && <div className="mt-3 flex gap-2"><Button size="sm" isLoading={workingId === `offer-${item.id}`} onClick={() => runAction(`offer-${item.id}`, () => respondToOffer(item.id, "accepted"), "Bạn đã chấp nhận thư mời.")}>Chấp nhận</Button><Button size="sm" variant="outline" onClick={() => runAction(`offer-${item.id}`, () => respondToOffer(item.id, "declined"), "Bạn đã từ chối thư mời.")}>Từ chối</Button></div>}</div>
          ))}</div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-amber-500"/><h2 className="font-bold text-slate-900">Thông báo gần đây</h2></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{notifications.length === 0 ? <p className="text-sm text-slate-500">Chưa có thông báo mới.</p> : notifications.map((item) => <div key={item.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-800">{item.text}</p><p className="mt-1 text-xs text-slate-500">{new Date(item.time).toLocaleString("vi-VN")}</p></div>)}</div>
      </Card>

    </div>
  );
}
