"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, Save, RefreshCw } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api-client";
import { InterviewItem } from "../services/interview.service";
import {
  fetchScorecard,
  ScoreCriterion,
  submitScorecard,
} from "../services/scorecard.service";

export function ScorecardModal({
  interview,
  onClose,
  onSaved,
}: {
  interview: InterviewItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [criteria, setCriteria] = useState<ScoreCriterion[]>([]);
  const [framework, setFramework] = useState("");
  const [recommendation, setRecommendation] = useState("hire");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fetchScorecard(interview.id)
      .then((data) => {
        if (cancelled) return;
        setFramework(data.framework_name);
        setCriteria(
          data.criteria.map((item) => ({
            ...item,
            score: item.score ?? item.required_level,
            comment: item.comment ?? "",
          })),
        );
        setRecommendation(data.evaluation?.recommendation ?? "hire");
        setFeedback(data.evaluation?.feedback ?? "");
      })
      .catch((caught: unknown) => {
        if (!cancelled)
          setError(
            caught instanceof ApiError
              ? caught.message
              : "Không thể tải khung năng lực.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      document.body.style.overflow = previous;
    };
  }, [interview.id]);

  const rawTotal = criteria.reduce(
    (total, item) => total + (item.score ?? 0),
    0,
  );
  const weightedScore =
    Math.round(
      criteria.reduce(
        (total, item) => total + ((item.score ?? 0) * item.weight) / 100,
        0,
      ) * 100,
    ) / 100;
  const totalPoints = Math.round(weightedScore * 20 * 100) / 100;
  function update(id: number, patch: Partial<ScoreCriterion>) {
    setCriteria((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (criteria.some((item) => (item.comment ?? "").trim().length < 5)) {
      setError("Nhận xét mỗi tiêu chí cần ít nhất 5 ký tự.");
      return;
    }
    if (feedback.trim().length < 5) {
      setError("Nhận xét chung cần ít nhất 5 ký tự.");
      return;
    }
    setSaving(true);
    try {
      await submitScorecard(interview.id, {
        criteria: criteria.map((item) => ({
          criterion_id: item.id,
          score: item.score ?? 3,
          comment: item.comment ?? "",
        })),
        recommendation,
        feedback,
      });
      onSaved();
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError ? caught.message : "Không thể lưu phiếu.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Phiếu đánh giá theo khung năng lực"
        onSubmit={save}
        className="max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white p-5">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Phiếu đánh giá năng lực
            </h2>
            <p className="text-sm text-slate-500">
              {interview.candidate_name} ·{" "}
              {interview.is_final_round ? "Vòng cuối" : "Vòng phỏng vấn"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng phiếu"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-5 p-5">
          {error && <Alert variant="error">{error}</Alert>}
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Đang tải tiêu chí...
            </p>
          ) : criteria.length === 0 ? (
            <Button href="/hr/master-data/competencies" variant="outline">
              Mở cấu hình khung năng lực
            </Button>
          ) : (
            <>
              <p className="font-bold text-blue-700">
                Khung năng lực: {framework}
              </p>
              {criteria.map((item, index) => (
                <section
                  key={item.id}
                  className="space-y-3 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-bold text-slate-950">
                      {index + 1}. {item.name}
                    </h3>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      Trọng số {item.weight}%
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-slate-500">{item.description}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Mức yêu cầu: {item.required_level}/5
                  </p>
                  <label className="block text-sm font-semibold text-slate-700">
                    Điểm {item.name}
                    <select
                      value={item.score}
                      onChange={(event) =>
                        update(item.id, { score: Number(event.target.value) })
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
                    >
                      {[1, 2, 3, 4, 5].map((score) => (
                        <option key={score} value={score}>
                          {score} / 5
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Nhận xét {item.name}
                    <textarea
                      required
                      minLength={5}
                      maxLength={1000}
                      value={item.comment}
                      onChange={(event) =>
                        update(item.id, { comment: event.target.value })
                      }
                      rows={2}
                      className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                    />
                  </label>
                </section>
              ))}
              <div
                role="status"
                aria-label="Điểm tự động"
                className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
              >
                <p>
                  Tổng điểm tiêu chí:{" "}
                  <strong>
                    {rawTotal}/{criteria.length * 5}
                  </strong>
                </p>
                <p>
                  Điểm theo trọng số:{" "}
                  <strong data-testid="weighted-score">
                    {weightedScore.toFixed(2)}/5
                  </strong>
                </p>
                <p
                  className="mt-1 text-lg font-black"
                  data-testid="total-points"
                >
                  Tổng quy đổi: {totalPoints.toFixed(2)}/100
                </p>
                <p className="mt-2 text-xs">
                  Điểm theo trọng số = tổng (điểm tiêu chí × trọng số %) / 100.
                </p>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Đề xuất
                <select
                  value={recommendation}
                  onChange={(event) => setRecommendation(event.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
                >
                  <option value="strong_hire">Rất nên tuyển</option>
                  <option value="hire">Nên tuyển</option>
                  <option value="hold">Cân nhắc</option>
                  <option value="reject">Không phù hợp</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Nhận xét chung
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                />
              </label>
            </>
          )}
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white p-5">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={loading || !criteria.length}
            isLoading={saving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Lưu phiếu
          </Button>
        </footer>
      </form>
    </div>
  );
}
