"use client";
import { useEffect, useState } from "react";
import {
  EvaluationItem,
  fetchEvaluations,
} from "@/features/referrals/services/referral.service";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
export function EvaluationSummary({
  applicationId,
}: {
  applicationId: number;
}) {
  const [items, setItems] = useState<EvaluationItem[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetchEvaluations(applicationId)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((caught) => {
        if (active) setError(caught.message);
      });
    return () => {
      active = false;
    };
  }, [applicationId]);
  return (
    <Card>
      <h3 className="text-lg font-black">Tổng hợp toàn bộ phiếu đánh giá</h3>
      {error && <Alert variant="error">{error}</Alert>}
      {items === null && !error ? (
        <p className="mt-3 text-sm text-slate-500">Đang tải phiếu...</p>
      ) : items?.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Chưa có phiếu đánh giá.</p>
      ) : (
        items?.map((item) => (
          <article
            key={item.id}
            className="mt-4 rounded-xl border border-slate-100 p-4"
          >
            <p className="font-bold">
              {item.evaluator_name} · {item.overall_score}/5
            </p>
            <p className="mt-1 text-xs text-blue-600">
              {item.framework_name ?? "Đánh giá tổng hợp"} ·{" "}
              {item.recommendation}
            </p>
            {item.criteria_scores?.map((criterion) => (
              <p key={criterion.id} className="mt-2 text-sm text-slate-600">
                <strong>
                  {criterion.name}: {criterion.score}/5 · {criterion.weight}%
                </strong>
                <br />
                {criterion.comment}
              </p>
            ))}
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
              {item.feedback}
            </p>
          </article>
        ))
      )}
    </Card>
  );
}
