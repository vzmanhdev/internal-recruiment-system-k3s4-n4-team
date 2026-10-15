"use client";
import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Gift, Users } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import {
  getSessionRoles,
  useAuthSession,
} from "@/features/auth/lib/auth-session";
import {
  fetchManageOffers,
  OfferItem,
  updateOfferStatus,
} from "@/features/offers/services/offer.service";
import { OfferComposer } from "@/features/offers/components/OfferComposer";
import {
  money,
  offerLabels,
  OfferPreview,
} from "@/features/offers/components/OfferPreview";
import { apiRequest } from "@/lib/api-client";
import { EvaluationSummary } from "@/features/offers/components/EvaluationSummary";
const nav = [
  { href: "/hr/offers", label: "Quyết định & thư mời", icon: Gift },
  { href: "/interviewer", label: "Phỏng vấn & đánh giá", icon: ClipboardCheck },
];
const stateLabels: Record<string, string> = {
  pending: "Đang chờ",
  waiting: "Chưa tới lượt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  changes_requested: "Cần bổ sung",
  cancelled: "Đã thay thế",
};
export default function OffersPage() {
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  const canEdit = roles.some((r) =>
    ["admin", "hr_manager", "recruiter"].includes(r),
  );
  const [items, setItems] = useState<OfferItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [composer, setComposer] = useState<OfferItem | "new" | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [review, setReview] = useState<{
    offer: OfferItem;
    action: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchManageOffers({ search, status, page });
      setItems(result.items);
      setPages(result.pages);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể tải offer",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);
  async function action(id: number, type: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (type === "sent") await updateOfferStatus(id, "sent");
      else if (type === "submit")
        await apiRequest(`/offers/${id}/submit`, { method: "POST" });
      else
        await apiRequest(`/offers/${id}/review`, {
          method: "POST",
          body: JSON.stringify({ status: type, notes: note }),
        });
      setReview(null);
      setNote("");
      setNotice(
        type === "sent"
          ? "Thư mời đã hiển thị trong tài khoản ứng viên. Chưa gửi email tự động."
          : "Đã lưu thao tác và cập nhật chuỗi duyệt.",
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể xử lý offer",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceShell
      title="Quyết định tuyển dụng"
      description="Tổng hợp đánh giá, duyệt offer và chuẩn bị nhận việc"
      icon={Gift}
      items={
        canEdit
          ? [
              ...nav,
              {
                href: "/hr/applications",
                label: "Hồ sơ ứng viên",
                icon: Users,
              },
              {
                href: "/hr/onboarding",
                label: "Checklist nhận việc",
                icon: ClipboardCheck,
              },
            ]
          : nav
      }
      allowedRoles={[
        "admin",
        "hr_manager",
        "recruiter",
        "manager",
        "hiring_manager",
        "approver",
      ]}
    >
      <div className="space-y-6">
        <section className="workspace-hero flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-blue-600">
              Quyết định tuyển · Sprint 7
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Thư mời & phê duyệt offer
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Trưởng bộ phận → Trưởng phòng Nhân sự → duyệt ngoại lệ lương (nếu
              có).
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setComposer("new")}>Soạn offer</Button>
          )}
        </section>
        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}
        {composer && (
          <OfferComposer
            key={composer === "new" ? "new" : composer.id}
            existing={composer === "new" ? undefined : composer}
            onClose={() => setComposer(null)}
            onSaved={() => {
              setComposer(null);
              setNotice(
                "Đã lưu bản nháp. Hãy trình duyệt để bắt đầu chuỗi phê duyệt.",
              );
              void load();
            }}
          />
        )}
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Tìm mã offer / chức danh
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
              Trạng thái
              <select
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                {Object.entries(offerLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>
        {loading ? (
          <Card>Đang tải thư mời...</Card>
        ) : items.length === 0 ? (
          <Card>Chưa có thư mời phù hợp.</Card>
        ) : (
          items.map((offer) => {
            const pending = offer.approvals.find((s) => s.status === "pending");
            const permitted =
              pending &&
              roles.some(
                (role) =>
                  role === "admin" ||
                  role === pending.role ||
                  (role === "hiring_manager" && pending.role === "manager"),
              );
            return (
              <Card key={offer.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-blue-600">
                      {offer.code}
                    </p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">
                      {offer.candidate_name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {offer.position_title} · {money(offer.offered_salary)}
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                    {offerLabels[offer.status]}
                  </span>
                </div>
                {offer.salary_exception_reason && (
                  <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                    Giải trình ngoại lệ: {offer.salary_exception_reason}
                  </p>
                )}
                <ol className="mt-4 grid gap-3 md:grid-cols-3">
                  {offer.approvals.map((step, index) => (
                    <li
                      key={index}
                      className={`rounded-xl border p-3 text-sm ${step.status === "pending" ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-slate-50"}`}
                    >
                      <strong>{step.label}</strong>
                      <p className="mt-1 text-xs text-slate-500">
                        Lần {step.round} · {stateLabels[step.status]}
                      </p>
                      {step.reviewer && (
                        <p className="mt-2 text-xs">
                          {step.reviewer} ·{" "}
                          {step.reviewed_at &&
                            new Date(step.reviewed_at).toLocaleString("vi-VN")}
                        </p>
                      )}
                      {step.note && (
                        <p className="mt-2 whitespace-pre-wrap">{step.note}</p>
                      )}
                    </li>
                  ))}
                </ol>
                {offer.response_notes && (
                  <p className="mt-4 text-sm text-slate-600">
                    Phản hồi ứng viên: {offer.response_notes}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPreview(preview === offer.id ? null : offer.id)
                    }
                  >
                    Xem nội dung
                  </Button>
                  {canEdit &&
                    ["draft", "changes_requested"].includes(offer.status) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setComposer(offer)}
                        >
                          Chỉnh sửa
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => void action(offer.id, "submit")}
                        >
                          Trình duyệt
                        </Button>
                      </>
                    )}
                  {offer.status === "pending_approval" &&
                    permitted &&
                    [
                      ["approved", "Duyệt"],
                      ["rejected", "Từ chối"],
                      ["changes_requested", "Yêu cầu bổ sung"],
                    ].map(([type, label]) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={type === "approved" ? "primary" : "outline"}
                        disabled={busy}
                        onClick={() => {
                          setReview({ offer, action: type });
                          setNote("");
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  {canEdit && offer.status === "approved" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => void action(offer.id, "sent")}
                    >
                      Gửi vào tài khoản ứng viên
                    </Button>
                  )}
                </div>
                {preview === offer.id && (
                  <div className="mt-4">
                    <OfferPreview offer={offer} />
                    <div className="mt-4">
                      <EvaluationSummary applicationId={offer.application_id} />
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <span className="text-sm">
            Trang {page}/{pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || loading}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
        {review && (
          <div
            className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <Card className="w-full max-w-lg">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(review.offer.id, review.action);
                }}
              >
                <h2 id="review-title" className="text-xl font-black">
                  {review.action === "approved"
                    ? "Phê duyệt offer"
                    : review.action === "rejected"
                      ? "Từ chối offer"
                      : "Yêu cầu bổ sung"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {review.offer.candidate_name} · {review.offer.code}
                </p>
                <label className="mt-4 block text-sm font-semibold">
                  Ý kiến{" "}
                  {review.action !== "approved"
                    ? "(bắt buộc)"
                    : "(không bắt buộc)"}
                  <textarea
                    autoFocus
                    required={review.action !== "approved"}
                    minLength={review.action !== "approved" ? 5 : undefined}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                {error && <Alert variant="error">{error}</Alert>}
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setReview(null)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" isLoading={busy}>
                    Xác nhận
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
