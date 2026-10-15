"use client";
import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Gift, Users } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getSessionRoles,
  useAuthSession,
} from "@/features/auth/lib/auth-session";
import { EvaluationItem } from "@/features/referrals/services/referral.service";
import {
  fetchHiringApplications,
  fetchHiringDetail,
  saveHiringDecision,
  HiringApplication,
  HiringDetail,
} from "@/features/offers/services/hiring.service";
const labels: Record<string, string> = {
  selected: "Quyết định tuyển",
  rejected: "Loại",
  pending: "Chưa quyết định",
  hire: "Nên tuyển",
  strong_hire: "Rất nên tuyển",
  hold: "Cân nhắc",
  reject: "Không phù hợp",
};
function Evaluation({ item }: { item: EvaluationItem }) {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <strong className="text-sm">{item.evaluator_name}</strong>
        <span className="text-sm font-black text-blue-700">
          {item.overall_score}/5
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {item.framework_name || "Đánh giá tổng hợp"} ·{" "}
        {labels[item.recommendation] ?? item.recommendation}
      </p>
      {item.criteria_scores?.map((criterion) => (
        <p key={criterion.id} className="mt-3 text-sm text-slate-600">
          <strong>
            {criterion.name}: {criterion.score}/5 · {criterion.weight}%
          </strong>
          <span className="mt-1 block whitespace-pre-wrap">
            {criterion.comment}
          </span>
        </p>
      ))}
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
        {item.feedback}
      </p>
    </article>
  );
}
export default function HiringDecisionsPage() {
  const roles = getSessionRoles(useAuthSession());
  const canDecide = roles.some((role) =>
    ["admin", "manager", "hiring_manager"].includes(role),
  );
  const [items, setItems] = useState<HiringApplication[]>([]);
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<HiringDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<"selected" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchHiringApplications(search, decision, page);
      setItems(result.items);
      setPages(result.pages);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không tải được hồ sơ",
      );
    } finally {
      setLoading(false);
    }
  }, [search, decision, page]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);
  async function open(id: number) {
    setDetailLoading(true);
    setDetail(null);
    setError("");
    try {
      setDetail(await fetchHiringDetail(id));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không tải được kết quả phỏng vấn",
      );
    } finally {
      setDetailLoading(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!detail || !action) return;
    setBusy(true);
    setError("");
    try {
      setDetail(await saveHiringDecision(detail.id, action, note));
      setAction(null);
      setNotice(
        action === "selected"
          ? "Đã lưu quyết định tuyển. Recruiter có thể soạn đề xuất offer; hồ sơ chỉ chuyển sang đã tuyển sau khi ứng viên chấp nhận."
          : "Đã loại hồ sơ và dừng các offer chưa gửi.",
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể lưu quyết định",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceShell
      title="Quyết định tuyển dụng"
      description="Đối chiếu kết quả nhiều vòng trước khi quyết định"
      icon={Users}
      allowedRoles={[
        "admin",
        "manager",
        "hiring_manager",
        "hr_manager",
        "recruiter",
      ]}
      items={[
        {
          href: "/manager/hiring-decisions",
          label: "Tổng hợp & quyết định tuyển",
          icon: Users,
        },
        {
          href: "/interviewer",
          label: "Phỏng vấn & đánh giá",
          icon: ClipboardCheck,
        },
        { href: "/hr/offers", label: "Đề xuất & duyệt offer", icon: Gift },
      ]}
    >
      <div className="space-y-6">
        <section className="workspace-hero">
          <p className="text-sm font-bold text-blue-600">
            Hiring Manager · Sprint 7
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Tổng hợp kết quả & quyết định tuyển
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Xem toàn bộ phiếu đánh giá ở các vòng. Trưởng bộ phận quyết định
            tuyển hoặc loại trong phạm vi phụ trách.
          </p>
        </section>
        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Tìm tên, email hoặc mã hồ sơ
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="text-sm font-semibold">
              Quyết định
              <select
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
                value={decision}
                onChange={(e) => {
                  setDecision(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chưa quyết định</option>
                <option value="selected">Quyết định tuyển</option>
                <option value="rejected">Loại</option>
              </select>
            </label>
          </div>
        </Card>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(260px,1fr)_2fr]">
          <div className="space-y-3">
            {loading ? (
              <Card>Đang tải...</Card>
            ) : items.length === 0 ? (
              <Card>Chưa có hồ sơ phù hợp.</Card>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm ${detail?.id === item.id ? "border-blue-400" : "border-slate-100"}`}
                  disabled={detailLoading || busy}
                  onClick={() => void open(item.id)}
                >
                  <p className="text-xs font-bold text-blue-600">{item.code}</p>
                  <h2 className="mt-2 font-black">{item.full_name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.job_title}
                  </p>
                  <p className="mt-3 text-xs text-slate-600">
                    {item.evaluation_count} phiếu · Điểm TB{" "}
                    {item.average_score ?? "—"}/5
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {labels[item.hiring_decision?.decision ?? "pending"]}
                  </span>
                </button>
              ))
            )}
            <div className="flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <span className="text-sm">
                {page}/{pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages || loading}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            {detailLoading ? (
              <Card>Đang tổng hợp các vòng...</Card>
            ) : !detail ? (
              <Card>Chọn hồ sơ để đối chiếu kết quả và ra quyết định.</Card>
            ) : (
              <>
                <Card>
                  <h2 className="text-xl font-black">{detail.full_name}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {detail.job_title} · {detail.evaluation_count} phiếu đánh
                    giá · Điểm trung bình {detail.average_score ?? "—"}/5
                  </p>
                  {detail.hiring_decision && (
                    <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm">
                      <strong>{labels[detail.hiring_decision.decision]}</strong>
                      <p className="mt-1 whitespace-pre-wrap">
                        {detail.hiring_decision.note}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {detail.hiring_decision.decided_by} ·{" "}
                        {new Date(
                          detail.hiring_decision.updated_at,
                        ).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  )}
                  {canDecide && detail.status === "interviewing" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        disabled={detail.evaluation_count === 0}
                        onClick={() => {
                          setAction("selected");
                          setNote("");
                        }}
                      >
                        Quyết định tuyển
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAction("rejected");
                          setNote("");
                        }}
                      >
                        Loại hồ sơ
                      </Button>
                    </div>
                  )}
                  {detail.evaluation_count === 0 && (
                    <p className="mt-3 text-xs text-amber-700">
                      Chưa có phiếu đánh giá để quyết định tuyển.
                    </p>
                  )}
                </Card>
                {detail.rounds.map((round) => (
                  <Card key={round.id}>
                    <p className="text-xs font-bold text-blue-600">
                      Vòng {round.round_number} ·{" "}
                      {round.status === "cancelled"
                        ? "Đã hủy"
                        : new Date(round.start_time).toLocaleString("vi-VN")}
                    </p>
                    <h3 className="mt-2 font-black">
                      {round.title || round.round_name}
                    </h3>
                    <div className="mt-4 space-y-3">
                      {round.evaluations.length ? (
                        round.evaluations.map((item) => (
                          <Evaluation key={item.id} item={item} />
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          Chưa có phiếu đánh giá cho vòng này.
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
                {detail.general_evaluations.length > 0 && (
                  <Card>
                    <h3 className="font-black">Phiếu đánh giá tổng</h3>
                    <div className="mt-4 space-y-3">
                      {detail.general_evaluations.map((item) => (
                        <Evaluation key={item.id} item={item} />
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
        {action && detail && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-title"
          >
            <Card className="w-full max-w-lg">
              <form onSubmit={submit}>
                <h2 id="decision-title" className="text-xl font-black">
                  {action === "selected"
                    ? "Xác nhận quyết định tuyển"
                    : "Xác nhận loại hồ sơ"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {detail.full_name}
                </p>
                <label className="mt-4 block text-sm font-semibold">
                  Ý kiến quyết định (bắt buộc)
                  <textarea
                    autoFocus
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                {error && <Alert variant="error">{error}</Alert>}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setAction(null)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" isLoading={busy}>
                    Lưu quyết định
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
