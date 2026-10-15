"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { OnboardingItem, PaginatedOnboarding } from "../services/offer.service";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
const tasks = [
  ["welcome_email_sent", "Email chào mừng", "Nhân sự phụ trách"],
  ["equipment_prepared", "Chuẩn bị thiết bị", "Nhân sự phụ trách"],
  ["account_created", "Tài khoản làm việc", "Nhân sự phụ trách"],
  ["documents_submitted", "Hoàn tất hồ sơ nhận việc", "Bạn xác nhận"],
  ["orientation_scheduled", "Lịch hội nhập", "Nhân sự phụ trách"],
] as const;
export function CandidateOnboarding({
  applicationId,
}: {
  applicationId?: number;
}) {
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page) });
      if (applicationId) query.set("application_id", String(applicationId));
      const result = await apiRequest<PaginatedOnboarding>(
        `/onboarding/my?${query}`,
      );
      setItems(result.items);
      setPages(result.pages);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không tải được checklist nhận việc",
      );
    } finally {
      setLoading(false);
    }
  }, [applicationId, page]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  async function update(item: OnboardingItem) {
    if (busy !== null) return;
    setBusy(item.id);
    setError("");
    setItems((current) =>
      current.map((row) =>
        row.id === item.id
          ? { ...row, documents_submitted: !row.documents_submitted }
          : row,
      ),
    );
    try {
      const updated = await apiRequest<OnboardingItem>(
        `/onboarding/${item.id}/candidate`,
        {
          method: "PUT",
          body: JSON.stringify({
            documents_submitted: !item.documents_submitted,
          }),
        },
      );
      setItems((current) =>
        current.map((row) => (row.id === item.id ? updated : row)),
      );
    } catch (caught) {
      setItems((current) =>
        current.map((row) => (row.id === item.id ? item : row)),
      );
      setError(
        caught instanceof Error
          ? caught.message
          : "Chưa lưu được xác nhận của bạn",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Checklist nhận việc của bạn
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Bạn xác nhận phần hồ sơ của mình; các mục còn lại do Nhân sự cập
            nhật.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={loading || busy !== null}
          onClick={() => void load()}
        >
          Tải lại tiến độ
        </Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      {loading ? (
        <Card>Đang tải checklist...</Card>
      ) : items.length === 0 ? (
        <Card>
          Checklist sẽ hiển thị sau khi bạn chấp nhận thư mời nhận việc.
        </Card>
      ) : (
        items.map((item) => {
          const done = tasks.filter(([key]) => item[key]).length;
          const progress = (done / tasks.length) * 100;
          return (
            <Card key={item.id}>
              <h3 className="font-black">{item.job_title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {item.department_name}
              </p>
              <p className="mt-4 text-sm font-bold text-blue-700">
                {progress}% hoàn thành · {done}/{tasks.length} công việc
              </p>
              <div
                role="progressbar"
                aria-label={`Tiến độ nhận việc ${item.job_title}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-5 space-y-3">
                {tasks.map(([key, label, owner]) => (
                  <label
                    key={key}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"
                  >
                    <input
                      type="checkbox"
                      aria-label={label}
                      className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
                      checked={item[key]}
                      disabled={key !== "documents_submitted" || busy !== null}
                      onChange={() => void update(item)}
                    />
                    <span>
                      <span
                        className={`block text-sm font-semibold ${item[key] ? "text-emerald-700" : "text-slate-700"}`}
                      >
                        {label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {owner}
                        {key === "documents_submitted"
                          ? " · Chỉ tích khi đã hoàn tất hồ sơ theo hướng dẫn của HR."
                          : " · Chỉ xem tiến độ"}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          );
        })
      )}
      {pages > 1 && (
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
      )}
    </section>
  );
}
