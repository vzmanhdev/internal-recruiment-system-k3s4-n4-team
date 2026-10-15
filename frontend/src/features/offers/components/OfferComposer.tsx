"use client";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import {
  fetchManageApplications,
  ApplicationItem,
} from "@/features/applications/services/application.service";
import { EvaluationSummary } from "./EvaluationSummary";
import {
  createOffer,
  CreateOfferPayload,
  OfferItem,
} from "../services/offer.service";
import { money, OfferPreview } from "./OfferPreview";
const input =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";
const localDate = (value?: string) =>
  value
    ? new Date(
        new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
export function OfferComposer({
  existing,
  onSaved,
  onClose,
}: {
  existing?: OfferItem;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const chosenId = useRef(existing?.application_id ?? 0);
  const [band, setBand] = useState<{
    min_salary?: number;
    max_salary?: number;
  }>({ min_salary: existing?.min_salary, max_salary: existing?.max_salary });
  const [form, setForm] = useState({
    application_id: existing?.application_id ?? 0,
    position_title: existing?.position_title ?? "",
    offered_salary: existing?.offered_salary ?? 0,
    start_date: localDate(existing?.start_date),
    probation_period_months: existing?.probation_period_months ?? 2,
    work_location: existing?.work_location ?? "",
    expiration_date: localDate(existing?.expiration_date),
    notes: existing?.notes ?? "",
    salary_exception_reason: existing?.salary_exception_reason ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const candidate = applications.find(
    (item) => item.id === form.application_id,
  );
  const outside =
    (band.min_salary != null && form.offered_salary < band.min_salary) ||
    (band.max_salary != null && form.offered_salary > band.max_salary);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchManageApplications({ search, page_size: 100 })
        .then((result) => {
          if (active)
            setApplications(
              result.items.filter(
                (item) =>
                  !["hired", "rejected", "withdrawn"].includes(item.status),
              ),
            );
        })
        .catch((caught) => {
          if (active) setError(caught.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);
  const choose = async (id: number) => {
    chosenId.current = id;
    const app = applications.find((item) => item.id === id);
    setForm((current) => ({
      ...current,
      application_id: id,
      position_title: app?.job_title ?? "",
    }));
    setBand({});
    setError("");
    if (app) {
      try {
        const job = await apiRequest<{
          min_salary?: number;
          max_salary?: number;
          work_location: string;
        }>(`/offers/applications/${id}/context`);
        if (chosenId.current !== id) return;
        setBand(job);
        setForm((current) =>
          current.application_id === id
            ? { ...current, work_location: job.work_location }
            : current,
        );
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Không tải được dải lương",
        );
      }
    }
  };
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (outside && form.salary_exception_reason.trim().length < 10) {
      setError("Lương ngoài dải: nhập giải trình ít nhất 10 ký tự.");
      return;
    }
    setBusy(true);
    try {
      const payload: CreateOfferPayload = {
        ...form,
        start_date: new Date(form.start_date).toISOString(),
        expiration_date: new Date(form.expiration_date).toISOString(),
      };
      if (existing)
        await apiRequest(`/offers/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      else await createOffer(payload);
      onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không lưu được offer",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5 rounded-3xl border border-blue-100 bg-blue-50/40 p-4 sm:p-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-xl font-black text-slate-950">
          {existing ? "Bổ sung thư mời" : "Soạn thư mời nhận việc"}
        </h2>
        <Button variant="outline" onClick={onClose}>
          Đóng soạn thảo
        </Button>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">
            Tìm ứng viên theo tên hoặc email
            <input
              className={input}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập để tìm trong hồ sơ"
              disabled={!!existing}
            />
          </label>
          <label className="block text-sm font-semibold">
            Hồ sơ ứng viên
            <select
              className={input}
              required
              disabled={!!existing || loading}
              value={form.application_id || ""}
              onChange={(e) => void choose(Number(e.target.value))}
            >
              <option value="">{loading ? "Đang tìm..." : "Chọn hồ sơ"}</option>
              {existing &&
                !applications.some((a) => a.id === existing.application_id) && (
                  <option value={existing.application_id}>
                    {existing.candidate_name}
                  </option>
                )}
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.full_name} · {app.job_title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Chức danh
            <input
              required
              minLength={2}
              className={input}
              value={form.position_title}
              onChange={(e) =>
                setForm({ ...form, position_title: e.target.value })
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            Lương đề xuất (VNĐ/tháng)
            <input
              type="number"
              required
              min={0}
              step={1000}
              className={input}
              value={form.offered_salary}
              onChange={(e) =>
                setForm({ ...form, offered_salary: Number(e.target.value) })
              }
            />
            <span className="mt-1 block text-xs text-slate-500">
              Dải: {money(band.min_salary)} – {money(band.max_salary)}
            </span>
          </label>
          {outside && (
            <Alert variant="warning">
              Lương nằm ngoài dải. Offer cần giải trình và thêm cấp duyệt ngoại
              lệ.
            </Alert>
          )}
          {outside && (
            <label className="block text-sm font-semibold">
              Giải trình lương ngoài dải
              <textarea
                required
                minLength={10}
                className={input}
                value={form.salary_exception_reason}
                onChange={(e) =>
                  setForm({ ...form, salary_exception_reason: e.target.value })
                }
              />
            </label>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Ngày nhận việc
              <input
                required
                type="datetime-local"
                min={localDate(new Date().toISOString())}
                className={input}
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold">
              Hạn phản hồi
              <input
                required
                type="datetime-local"
                min={localDate(new Date().toISOString())}
                max={form.start_date || undefined}
                className={input}
                value={form.expiration_date}
                onChange={(e) =>
                  setForm({ ...form, expiration_date: e.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold">
              Thử việc (tháng)
              <input
                required
                type="number"
                min={0}
                max={12}
                className={input}
                value={form.probation_period_months}
                onChange={(e) =>
                  setForm({
                    ...form,
                    probation_period_months: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="text-sm font-semibold">
              Địa điểm làm việc
              <input
                required
                minLength={2}
                className={input}
                value={form.work_location}
                onChange={(e) =>
                  setForm({ ...form, work_location: e.target.value })
                }
              />
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Điều khoản & phúc lợi
            <textarea
              className={input}
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Ẩn xem trước" : "Xem trước thư mời"}
            </Button>
            <Button
              type="submit"
              isLoading={busy}
              disabled={!form.application_id}
            >
              Lưu bản nháp
            </Button>
          </div>
        </form>
        <div className="space-y-4">
          {preview && (
            <OfferPreview
              offer={{
                ...form,
                candidate_name:
                  existing?.candidate_name ?? candidate?.full_name,
              }}
            />
          )}
          {form.application_id ? (
            <EvaluationSummary
              key={form.application_id}
              applicationId={form.application_id}
            />
          ) : (
            <Card>Chọn ứng viên để tổng hợp kết quả hội đồng.</Card>
          )}
        </div>
      </div>
    </section>
  );
}
