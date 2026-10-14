"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  Clock3,
  Copy,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { ApiError } from "@/lib/api-client";
import {
  ApplicationItem,
  fetchManageApplications,
} from "@/features/applications/services/application.service";
import {
  AvailableInterviewer,
  checkInterviewConflicts,
  createInterviewBatch,
  sendInterviewInvitation,
  updateInterview,
  fetchAvailableInterviewers,
  fetchManageInterviews,
  InterviewConflict,
  InterviewItem,
} from "@/features/interviews/services/interview.service";

const responseLabel: Record<string, string> = {
  pending: "Chờ ứng viên",
  confirmed: "Đã xác nhận",
  declined: "Từ chối",
  reschedule_requested: "Đề nghị đổi lịch",
};
function toLocalInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function HRInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [interviewers, setInterviewers] = useState<AvailableInterviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflicts, setConflicts] = useState<InterviewConflict[]>([]);
  const [selectedApplications, setSelectedApplications] = useState<number[]>(
    [],
  );
  const [selectedInterviewers, setSelectedInterviewers] = useState<number[]>(
    [],
  );
  const [form, setForm] = useState({
    title: "Phỏng vấn chuyên môn",
    interview_type: "online",
    location_or_link: "",
    start_time: "",
    duration: 60,
    break_minutes: 15,
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [scheduleData, applicationData, interviewerData] =
        await Promise.all([
          fetchManageInterviews({ search, status, page_size: 100 }),
          fetchManageApplications({ page_size: 100 }),
          fetchAvailableInterviewers(),
        ]);
      setInterviews(scheduleData.items);
      setApplications(
        applicationData.items.filter((item) =>
          ["screening", "interviewing"].includes(item.status),
        ),
      );
      setInterviewers(interviewerData);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Không thể tải dữ liệu phỏng vấn.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setModalOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modalOpen, submitting]);

  const slots = useMemo(
    () =>
      form.start_time
        ? selectedApplications.map((applicationId, index) => {
            const start = new Date(form.start_time);
            start.setMinutes(
              start.getMinutes() + index * (form.duration + form.break_minutes),
            );
            const end = new Date(start.getTime() + form.duration * 60_000);
            return {
              applicationId,
              start,
              end,
              application: applications.find(
                (item) => item.id === applicationId,
              ),
            };
          })
        : [],
    [
      applications,
      form.break_minutes,
      form.duration,
      form.start_time,
      selectedApplications,
    ],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    setConflicts([]);
    if (!selectedApplications.length || !selectedInterviewers.length) {
      setError("Vui lòng chọn ít nhất một ứng viên và một người phỏng vấn.");
      return;
    }
    if (!form.start_time) {
      setError("Vui lòng chọn thời gian bắt đầu.");
      return;
    }
    if (!form.location_or_link.trim()) {
      setError("Vui lòng nhập phòng họp hoặc liên kết họp.");
      return;
    }
    setSubmitting(true);
    try {
      const found: InterviewConflict[] = [];
      for (const slot of slots) {
        const result = await checkInterviewConflicts({
          start_time: slot.start.toISOString(),
          end_time: slot.end.toISOString(),
          interviewer_ids: selectedInterviewers,
          interview_type: form.interview_type,
          location_or_link: form.location_or_link,
        });
        found.push(...result.conflicts);
      }
      if (found.length) {
        setConflicts(found);
        setError(
          "Không thể tạo lịch vì người phỏng vấn hoặc phòng họp bị trùng.",
        );
        return;
      }
      await createInterviewBatch(
        slots.map((slot) => ({
          application_id: slot.applicationId,
          title: form.title,
          interview_type: form.interview_type,
          location_or_link: form.location_or_link.trim(),
          start_time: slot.start.toISOString(),
          end_time: slot.end.toISOString(),
          notes: form.notes.trim() || undefined,
          interviewer_ids: selectedInterviewers,
        })),
      );
      setNotice(
        `Đã tạo ${slots.length} lịch phỏng vấn và chia khe thời gian thành công.`,
      );
      setModalOpen(false);
      setSelectedApplications([]);
      await load();
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Không thể tạo lịch phỏng vấn.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyResponseLink(item: InterviewItem) {
    if (!item.response_token) {
      setError("Lịch này chưa có mã phản hồi công khai.");
      return;
    }
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/interview-response?token=${encodeURIComponent(item.response_token)}`,
      );
      setNotice(`Đã sao chép liên kết phản hồi cho ${item.candidate_name}.`);
    } catch {
      setError("Trình duyệt không cho phép sao chép liên kết.");
    }
  }

  async function sendInvitation(item: InterviewItem) {
    setSendingId(item.id);
    setError("");
    setNotice("");
    try {
      const result = await sendInterviewInvitation(item.id);
      setNotice(result.message);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError ? caught.message : "Không thể gửi lời mời.",
      );
    } finally {
      setSendingId(null);
    }
  }

  async function acceptProposedTime(item: InterviewItem) {
    if (!item.candidate_proposed_start_time) return;
    setSendingId(item.id);
    setError("");
    const duration =
      new Date(item.end_time).getTime() - new Date(item.start_time).getTime();
    try {
      await updateInterview(item.id, {
        start_time: item.candidate_proposed_start_time,
        end_time: new Date(
          new Date(item.candidate_proposed_start_time).getTime() + duration,
        ).toISOString(),
        status: "rescheduled",
      });
      await load();
      setNotice("Đã đổi lịch. Gửi lại lời mời để ứng viên xác nhận lịch mới.");
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError ? caught.message : "Không thể đổi lịch.",
      );
    } finally {
      setSendingId(null);
    }
  }

  return (
    <WorkspaceShell
      title="Điều phối phỏng vấn"
      description="Đặt lịch, hội đồng và phản hồi ứng viên"
      icon={CalendarDays}
      items={[
        { href: "/hr/interviews", label: "Lịch phỏng vấn", icon: CalendarDays },
        { href: "/hr/applications", label: "Hồ sơ ứng viên", icon: Users },
        { href: "/interviewer", label: "Phiếu & so sánh điểm", icon: Users },
      ]}
      allowedRoles={["admin", "hr_manager", "recruiter"]}
    >
      <div className="space-y-6">
        <section className="workspace-hero flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">
              Sprint 6 · Interview Operations
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              Lịch phỏng vấn & hội đồng đánh giá
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Kiểm tra trùng lịch, chia khe thời gian hàng loạt và gửi liên kết
              phản hồi cho ứng viên.
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Tạo lịch phỏng vấn
          </Button>
        </section>
        {error && (
          <Alert variant="error" title="Cần kiểm tra">
            {error}
          </Alert>
        )}
        {notice && <Alert variant="success">{notice}</Alert>}
        <Card className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã hoặc tiêu đề..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="scheduled">Sắp diễn ra</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <Button
            variant="outline"
            onClick={() => void load()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Tải lại
          </Button>
        </Card>
        {loading ? (
          <Card className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Đang tải lịch...
          </Card>
        ) : interviews.length === 0 ? (
          <Card className="py-14 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-blue-500" />
            <h2 className="mt-3 font-bold text-slate-900">
              Chưa có lịch phỏng vấn
            </h2>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {interviews.map((item) => (
              <Card key={item.id} className="p-0 overflow-hidden">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                  <div>
                    <p className="text-xs font-bold text-blue-600">
                      {item.code}
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">
                      {item.candidate_name}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {item.job_title} · {item.title}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${item.candidate_response === "confirmed" ? "bg-emerald-50 text-emerald-700" : item.candidate_response === "reschedule_requested" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}
                  >
                    {responseLabel[item.candidate_response ?? "pending"]}
                  </span>
                </div>
                <div className="space-y-3 p-5 text-sm text-slate-600">
                  <p className="flex gap-2">
                    <Clock3 className="h-4 w-4 text-blue-600" />
                    {new Date(item.start_time).toLocaleString("vi-VN")} –{" "}
                    {new Date(item.end_time).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="flex gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {item.location_or_link}
                  </p>
                  <p className="flex gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    {item.interviewers
                      .map((person) => person.full_name)
                      .join(", ") || "Chưa gán hội đồng"}
                  </p>
                  {item.candidate_response === "reschedule_requested" && (
                    <Alert variant="warning">
                      Ứng viên đề nghị{" "}
                      {item.candidate_proposed_start_time
                        ? new Date(
                            item.candidate_proposed_start_time,
                          ).toLocaleString("vi-VN")
                        : "đổi lịch"}
                      . {item.candidate_response_note}
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        isLoading={sendingId === item.id}
                        onClick={() => void acceptProposedTime(item)}
                      >
                        Chấp nhận thời gian mới
                      </Button>
                    </Alert>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void copyResponseLink(item)}
                    leftIcon={<Copy className="h-4 w-4" />}
                  >
                    Sao chép liên kết email
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="ml-2"
                    isLoading={sendingId === item.id}
                    onClick={() => void sendInvitation(item)}
                    leftIcon={<Mail className="h-4 w-4" />}
                  >
                    Gửi lời mời
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
            <form
              role="dialog"
              aria-modal="true"
              aria-label="Tạo lịch phỏng vấn"
              onSubmit={submit}
              className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Tạo lịch & chia khe hàng loạt
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mỗi ứng viên nhận một khe liên tiếp theo thứ tự chọn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-6 p-6 lg:grid-cols-2">
                {error && (
                  <div className="lg:col-span-2">
                    <Alert variant="error">{error}</Alert>
                  </div>
                )}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-700">
                    Tiêu đề
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm font-bold text-slate-700">
                      Bắt đầu
                      <input
                        type="datetime-local"
                        min={toLocalInput()}
                        value={form.start_time}
                        onChange={(e) =>
                          setForm({ ...form, start_time: e.target.value })
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700">
                      Hình thức
                      <select
                        value={form.interview_type}
                        onChange={(e) =>
                          setForm({ ...form, interview_type: e.target.value })
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                      >
                        <option value="online">Trực tuyến</option>
                        <option value="offline">Tại văn phòng</option>
                      </select>
                    </label>
                    <label className="text-sm font-bold text-slate-700">
                      Thời lượng
                      <input
                        type="number"
                        min={15}
                        max={240}
                        value={form.duration}
                        onChange={(e) =>
                          setForm({ ...form, duration: Number(e.target.value) })
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                      />
                    </label>
                    <label className="text-sm font-bold text-slate-700">
                      Nghỉ giữa khe
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={form.break_minutes}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            break_minutes: Number(e.target.value),
                          })
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-bold text-slate-700">
                    Phòng họp / Liên kết
                    <input
                      list={
                        form.interview_type === "offline"
                          ? "meeting-rooms"
                          : undefined
                      }
                      value={form.location_or_link}
                      onChange={(e) =>
                        setForm({ ...form, location_or_link: e.target.value })
                      }
                      placeholder={
                        form.interview_type === "online"
                          ? "https://meet.google.com/..."
                          : "Phòng họp A3"
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                    />
                  </label>
                  <datalist id="meeting-rooms">
                    <option value="Phòng họp A3" />
                    <option value="Phòng họp B2" />
                    <option value="Phòng họp C1" />
                  </datalist>
                  <label className="block text-sm font-bold text-slate-700">
                    Ghi chú
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
                    />
                  </label>
                </div>
                <div className="space-y-5">
                  <Chooser
                    title={`1. Chọn ứng viên (${selectedApplications.length})`}
                    empty="Chưa có hồ sơ phù hợp."
                  >
                    {applications.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-blue-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedApplications.includes(item.id)}
                          onChange={() =>
                            setSelectedApplications((current) =>
                              current.includes(item.id)
                                ? current.filter((id) => id !== item.id)
                                : [...current, item.id],
                            )
                          }
                        />
                        <span>
                          <strong className="block text-sm text-slate-900">
                            {item.full_name}
                          </strong>
                          <small className="text-slate-500">
                            {item.job_title} · {item.code}
                          </small>
                        </span>
                      </label>
                    ))}
                  </Chooser>
                  <Chooser
                    title={`2. Chọn hội đồng (${selectedInterviewers.length})`}
                    empty="Chưa có người phỏng vấn."
                  >
                    {interviewers.map((person) => (
                      <label
                        key={person.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-blue-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedInterviewers.includes(person.id)}
                          onChange={() =>
                            setSelectedInterviewers((current) =>
                              current.includes(person.id)
                                ? current.filter((id) => id !== person.id)
                                : [...current, person.id],
                            )
                          }
                        />
                        <span>
                          <strong className="block text-sm text-slate-900">
                            {person.full_name}
                          </strong>
                          <small className="text-slate-500">
                            {person.roles.join(", ")}
                          </small>
                        </span>
                      </label>
                    ))}
                  </Chooser>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      3. Khe thời gian xem trước
                    </p>
                    <div className="mt-2 space-y-2">
                      {slots.map((slot, index) => (
                        <div
                          key={slot.applicationId}
                          className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-xs"
                        >
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 font-bold text-white">
                            {index + 1}
                          </span>
                          <span>
                            <strong className="block text-slate-900">
                              {slot.application?.full_name}
                            </strong>
                            {slot.start.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            –{" "}
                            {slot.end.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {conflicts.length > 0 && (
                <div className="mx-6 mb-4">
                  <Alert variant="warning" title="Phát hiện trùng lịch">
                    {conflicts.map((item) => (
                      <p key={`${item.interview_id}-${item.reason}`}>
                        {item.code}: {item.reason}
                      </p>
                    ))}
                  </Alert>
                </div>
              )}
              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isLoading={submitting}
                  leftIcon={<Video className="h-4 w-4" />}
                >
                  Kiểm tra & tạo {slots.length || ""} lịch
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

function Chooser({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <div className="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-3">
        {hasChildren ? (
          children
        ) : (
          <p className="p-3 text-sm text-slate-500">{empty}</p>
        )}
      </div>
    </div>
  );
}
