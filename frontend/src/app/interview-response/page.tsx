"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api-client";
import {
  fetchPublicInterview,
  InterviewItem,
  respondToPublicInterview,
} from "@/features/interviews/services/interview.service";

function InterviewResponseContent() {
  const token = useSearchParams().get("token") ?? "";
  const [interview, setInterview] = useState<InterviewItem | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [proposedStart, setProposedStart] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(
    token ? "" : "Liên kết phản hồi không hợp lệ hoặc bị thiếu mã xác thực.",
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchPublicInterview(token)
      .then(setInterview)
      .catch((caught: unknown) =>
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Không thể tải lịch phỏng vấn.",
        ),
      )
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(
    response: "confirmed" | "declined" | "reschedule_requested",
  ) {
    if (response === "reschedule_requested" && !proposedStart) {
      setError("Vui lòng chọn thời gian bạn đề nghị.");
      return;
    }
    if (response === "reschedule_requested" && note.trim().length < 5) {
      setError("Vui lòng nhập lý do đổi lịch (ít nhất 5 ký tự).");
      return;
    }
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const updated = await respondToPublicInterview(token, {
        response,
        note: note.trim() || undefined,
        proposed_start_time: proposedStart
          ? new Date(proposedStart).toISOString()
          : undefined,
      });
      setInterview(updated);
      setMode("view");
      setNotice(
        response === "confirmed"
          ? "Bạn đã xác nhận tham dự phỏng vấn."
          : response === "reschedule_requested"
            ? "Đề nghị đổi lịch đã được gửi tới bộ phận tuyển dụng."
            : "Phản hồi từ chối đã được gửi.",
      );
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError ? caught.message : "Không thể gửi phản hồi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="public-site min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="workspace-hero mb-6">
          <p className="text-sm font-bold text-blue-600">
            Cổng phản hồi phỏng vấn
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-4xl">
            Xác nhận lịch phỏng vấn
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Kiểm tra thông tin và phản hồi trực tiếp, không cần đăng nhập.
          </p>
        </section>
        {loading ? (
          <Card className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Đang xác thực liên kết...
          </Card>
        ) : error && !interview ? (
          <Alert variant="error" title="Không thể mở lịch">
            {error}
          </Alert>
        ) : (
          interview && (
            <div className="space-y-5">
              {error && <Alert variant="error">{error}</Alert>}
              {notice && <Alert variant="success">{notice}</Alert>}
              <Card className="p-0 overflow-hidden">
                <div className="border-b border-blue-100 bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-100">
                    {interview.code}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    {interview.title}
                  </h2>
                  <p className="mt-1 text-sm text-blue-50">
                    {interview.candidate_name} · {interview.job_title}
                  </p>
                </div>
                <div className="grid gap-5 p-6 sm:grid-cols-2">
                  <p className="flex gap-3 text-sm text-slate-700">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                    <span>
                      <strong className="block text-slate-950">
                        Thời gian
                      </strong>
                      {new Date(interview.start_time).toLocaleString("vi-VN")} –{" "}
                      {new Date(interview.end_time).toLocaleTimeString(
                        "vi-VN",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </p>
                  <p className="flex gap-3 text-sm text-slate-700">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>
                      <strong className="block text-slate-950">
                        Địa điểm / Liên kết
                      </strong>
                      {interview.location_or_link}
                    </span>
                  </p>
                  <p className="flex gap-3 text-sm text-slate-700 sm:col-span-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>
                      <strong className="block text-slate-950">
                        Hội đồng phỏng vấn
                      </strong>
                      {interview.interviewers
                        .map((person) => person.full_name)
                        .join(", ") || "Sẽ được cập nhật"}
                    </span>
                  </p>
                </div>
              </Card>
              {interview.candidate_response !== "pending" && (
                <Alert
                  variant={
                    interview.candidate_response === "confirmed"
                      ? "success"
                      : "warning"
                  }
                  title="Phản hồi đã ghi nhận"
                >
                  {interview.candidate_response === "confirmed"
                    ? "Bạn đã xác nhận tham dự."
                    : interview.candidate_response === "reschedule_requested"
                      ? "Bạn đã đề nghị đổi lịch. Recruiter sẽ liên hệ xác nhận lại."
                      : "Bạn đã từ chối lịch phỏng vấn."}
                </Alert>
              )}
              {interview.accepts_response === false ? (
                <Alert variant="warning">
                  Lịch phỏng vấn này đã đóng hoặc đã bắt đầu. Vui lòng liên hệ
                  bộ phận tuyển dụng.
                </Alert>
              ) : mode === "reschedule" ? (
                <Card>
                  <h3 className="font-bold text-slate-950">
                    Đề nghị thời gian mới
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">
                      Thời gian mong muốn
                      <input
                        type="datetime-local"
                        value={proposedStart}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(event) =>
                          setProposedStart(event.target.value)
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">
                      Lý do / ghi chú
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
                        placeholder="Ví dụ: Tôi có lịch công tác đột xuất..."
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      isLoading={submitting}
                      onClick={() => void submit("reschedule_requested")}
                      leftIcon={<Clock3 className="h-4 w-4" />}
                    >
                      Gửi đề nghị đổi lịch
                    </Button>
                    <Button variant="outline" onClick={() => setMode("view")}>
                      Quay lại
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="sm:flex-1"
                    isLoading={submitting}
                    onClick={() => void submit("confirmed")}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Xác nhận tham dự
                  </Button>
                  <Button
                    className="sm:flex-1"
                    variant="outline"
                    onClick={() => setMode("reschedule")}
                  >
                    Đề nghị đổi lịch
                  </Button>
                  <Button
                    variant="ghost"
                    isLoading={submitting}
                    onClick={() => void submit("declined")}
                  >
                    Không thể tham dự
                  </Button>
                </div>
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default function InterviewResponsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <InterviewResponseContent />
    </Suspense>
  );
}
