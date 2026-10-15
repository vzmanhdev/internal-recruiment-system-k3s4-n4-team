"use client";
import { useCallback, useEffect, useState } from "react";
import { HrShell } from "@/features/hr/components/HrShell";
import {
  fetchManageOnboarding,
  updateOnboarding,
  OnboardingItem,
} from "@/features/offers/services/offer.service";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
const tasks = [
  ["welcome_email_sent", "Gửi email chào mừng"],
  ["equipment_prepared", "Chuẩn bị thiết bị"],
  ["account_created", "Tạo tài khoản làm việc"],
  ["documents_submitted", "Hoàn tất hồ sơ nhận việc"],
  ["orientation_scheduled", "Sắp lịch hội nhập"],
] as const;
export default function OnboardingPage() {
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchManageOnboarding({ page, status });
      setItems(result.items);
      setPages(result.pages);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể tải checklist",
      );
    } finally {
      setLoading(false);
    }
  }, [page, status]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);
  async function toggle(item: OnboardingItem, key: (typeof tasks)[number][0]) {
    if (busy !== null) return;
    setBusy(item.id);
    setError("");
    setItems((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, [key]: !item[key] } : row,
      ),
    );
    try {
      const updated = await updateOnboarding(item.id, { [key]: !item[key] });
      setItems((current) =>
        current.map((row) => (row.id === item.id ? updated : row)),
      );
      if (status !== "all" && updated.status !== status) await load();
    } catch (caught) {
      setItems((current) =>
        current.map((row) => (row.id === item.id ? item : row)),
      );
      setError(
        caught instanceof Error ? caught.message : "Không thể lưu tiến độ",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <HrShell>
      <div className="space-y-6">
        <section className="workspace-hero">
          <p className="text-sm font-bold text-blue-600">
            Onboarding · Chuẩn bị nhận việc
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Checklist hội nhập
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Checklist được tạo khi ứng viên chấp nhận thư mời. Các thay đổi được
            lưu ngay.
          </p>
        </section>
        {error && <Alert variant="error">{error}</Alert>}
        <Card>
          <label className="text-sm font-semibold">
            Lọc tiến độ
            <select
              className="ml-3 rounded-xl border border-slate-200 p-3"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chưa bắt đầu</option>
              <option value="in_progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </label>
        </Card>
        {loading ? (
          <Card>Đang tải checklist...</Card>
        ) : items.length === 0 ? (
          <Card>Chưa có checklist nhận việc phù hợp.</Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {items.map((item) => {
              const done = tasks.filter(([key]) => item[key]).length;
              const progress = (done / tasks.length) * 100;
              return (
                <Card key={item.id}>
                  <h2 className="text-lg font-black text-slate-950">
                    {item.candidate_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.job_title} · {item.department_name}
                  </p>
                  <p className="mt-4 text-sm font-bold text-blue-700">
                    {progress}% hoàn thành · {done}/{tasks.length} công việc
                  </p>
                  <div
                    role="progressbar"
                    aria-label={`Tiến độ ${item.candidate_name}`}
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
                    {tasks.map(([key, label]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-blue-600"
                          checked={item[key]}
                          disabled={busy !== null}
                          onChange={() => void toggle(item, key)}
                        />
                        <span
                          className={
                            item[key]
                              ? "text-slate-400 line-through"
                              : "text-slate-700"
                          }
                        >
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button
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
            variant="outline"
            disabled={page >= pages || loading}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </HrShell>
  );
}
