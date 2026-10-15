"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  RefreshCw,
  Gift,
} from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api-client";
import {
  fetchMyInterviews,
  InterviewItem,
} from "@/features/interviews/services/interview.service";
import {
  CandidateScoreComparison,
  fetchEvaluationComparison,
} from "@/features/referrals/services/referral.service";
import { ScorecardModal } from "@/features/interviews/components/ScorecardModal";
import { InterviewCalendar } from "@/features/interviews/components/InterviewCalendar";
import {
  getSessionRoles,
  useAuthSession,
} from "@/features/auth/lib/auth-session";

const recommendationLabels: Record<string, string> = {
  strong_hire: "Rất nên tuyển",
  hire: "Nên tuyển",
  hold: "Cân nhắc",
  reject: "Không phù hợp",
};
const navItems = [
  {
    href: "/manager/hiring-decisions",
    label: "Tổng hợp & quyết định tuyển",
    icon: BarChart3,
  },
  { href: "/interviewer", label: "Lịch & đánh giá", icon: ClipboardCheck },
  { href: "/hr/offers", label: "Quyết định & offer", icon: Gift },
];

export default function InterviewerWorkspacePage() {
  const roles = getSessionRoles(useAuthSession());
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [comparison, setComparison] = useState<CandidateScoreComparison[]>([]);
  const [finalOnly, setFinalOnly] = useState(true);
  const [jobFilter, setJobFilter] = useState("all");
  const [selected, setSelected] = useState<InterviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const filtered = comparison.filter(
    (item) => jobFilter === "all" || item.job_title === jobFilter,
  );
  const columns = Array.from(
    new Map(
      filtered
        .flatMap((item) => item.criteria_scores ?? [])
        .map((item) => [item.id, item]),
    ).values(),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [schedules, scores] = await Promise.all([
        fetchMyInterviews(),
        fetchEvaluationComparison([], finalOnly),
      ]);
      setInterviews(schedules.items);
      setComparison(scores);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Không thể tải dữ liệu đánh giá.",
      );
    } finally {
      setLoading(false);
    }
  }, [finalOnly]);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  return (
    <WorkspaceShell
      title="Hội đồng phỏng vấn"
      description="Phiếu theo khung năng lực và so sánh vòng cuối"
      icon={ClipboardCheck}
      items={navItems
        .filter(
          (item) =>
            item.href !== "/manager/hiring-decisions" ||
            roles.some((role) =>
              [
                "admin",
                "manager",
                "hiring_manager",
                "hr_manager",
                "recruiter",
              ].includes(role),
            ),
        )
        .filter(
          (item) =>
            item.href !== "/hr/offers" ||
            roles.some((role) =>
              [
                "admin",
                "hr_manager",
                "recruiter",
                "manager",
                "hiring_manager",
              ].includes(role),
            ),
        )}
      allowedRoles={[
        "admin",
        "hr_manager",
        "recruiter",
        "manager",
        "hiring_manager",
        "interviewer",
      ]}
    >
      <div className="space-y-6">
        <section className="workspace-hero flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-600">
              Đặt lịch & phiếu đánh giá
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              Đánh giá năng lực ứng viên
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Tiêu chí theo khung năng lực, chấm điểm 1–5 và tổng hợp kết quả
              hội đồng.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void load()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Tải lại
          </Button>
        </section>
        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}
        {loading ? (
          <Card className="py-12 text-center text-sm text-slate-500">
            Đang tải dữ liệu...
          </Card>
        ) : (
          <>
            <InterviewCalendar interviews={interviews} onScore={setSelected} />
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Lịch được phân công
              </h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {interviews.length === 0 ? (
                  <Card>Chưa có lịch được phân công.</Card>
                ) : (
                  interviews.map((item) => (
                    <Card key={item.id}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-blue-600">
                            {item.code}
                          </p>
                          <h3 className="mt-1 font-black text-slate-950">
                            {item.candidate_name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {item.job_title}
                          </p>
                        </div>
                        {item.is_final_round && (
                          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                            Vòng cuối
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {new Date(item.start_time).toLocaleString("vi-VN")} ·{" "}
                        {item.location_or_link}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Khung:{" "}
                        {item.competency_category ?? "Khung năng lực mặc định"}
                      </p>
                      <Button
                        className="mt-4"
                        size="sm"
                        disabled={item.status === "cancelled"}
                        onClick={() => setSelected(item)}
                        leftIcon={<ClipboardCheck className="h-4 w-4" />}
                      >
                        Nhập phiếu đánh giá
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </section>
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
                <BarChart3 className="h-5 w-5 text-violet-600" />
                Bảng so sánh điểm ứng viên
              </h2>
              <Card className="p-0 overflow-hidden">
                <div className="grid gap-4 border-b border-slate-100 p-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Phạm vi so sánh
                    <select
                      value={String(finalOnly)}
                      onChange={(event) =>
                        setFinalOnly(event.target.value === "true")
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
                    >
                      <option value="true">Chỉ ứng viên vào vòng cuối</option>
                      <option value="false">Tất cả vòng phỏng vấn</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    So sánh theo vị trí
                    <select
                      value={jobFilter}
                      onChange={(event) => setJobFilter(event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"
                    >
                      <option value="all">Tất cả vị trí</option>
                      {Array.from(
                        new Set(
                          comparison
                            .map((item) => item.job_title)
                            .filter(Boolean),
                        ),
                      ).map((title) => (
                        <option key={title} value={title}>
                          {title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="p-4">Ứng viên</th>
                        {columns.map((item) => (
                          <th
                            key={item.id}
                            className="min-w-36 p-4 text-center"
                          >
                            {item.name}
                            <span className="mt-1 block text-[10px] normal-case">
                              {item.weight}%
                            </span>
                          </th>
                        ))}
                        <th className="p-4 text-center">
                          Điểm theo trọng số /5
                        </th>
                        <th className="p-4 text-center">Tổng /100</th>
                        <th className="p-4">Kết luận hội đồng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.length === 0 ? (
                        <tr>
                          <td
                            colSpan={columns.length + 4}
                            className="p-10 text-center text-slate-500"
                          >
                            {finalOnly
                              ? "Chưa có phiếu đánh giá của ứng viên vòng cuối."
                              : "Chưa có phiếu đánh giá phù hợp."}
                          </td>
                        </tr>
                      ) : (
                        filtered.map((item) => (
                          <tr
                            key={item.application_id}
                            className="hover:bg-blue-50/40"
                          >
                            <td className="p-4">
                              <strong className="block text-slate-950">
                                {item.candidate_name}
                              </strong>
                              <span className="text-xs text-slate-500">
                                {item.job_title} · {item.evaluation_count} phiếu
                              </span>
                            </td>
                            {columns.map((criterion) => (
                              <td
                                key={criterion.id}
                                className="p-4 text-center font-bold text-slate-700"
                              >
                                {item.criteria_scores
                                  ?.find((score) => score.id === criterion.id)
                                  ?.score.toFixed(2) ?? "—"}
                              </td>
                            ))}
                            <td className="p-4 text-center font-bold text-slate-900">
                              {item.overall_score.toFixed(2)}
                            </td>
                            <td className="p-4 text-center text-lg font-black text-blue-700">
                              {item.total_points?.toFixed(2) ?? "—"}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-2">
                                {item.recommendations.map((value, index) => (
                                  <span
                                    key={`${value}-${index}`}
                                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                                  >
                                    {recommendationLabels[value] ?? value}
                                  </span>
                                ))}
                              </div>
                              <details className="mt-2 text-xs text-slate-500">
                                <summary className="cursor-pointer">
                                  Xem nhận xét hội đồng
                                </summary>
                                {item.evaluators.map((evaluation) => (
                                  <p key={evaluation.id} className="mt-2">
                                    <strong>
                                      {evaluation.evaluator_name}:
                                    </strong>{" "}
                                    {evaluation.feedback}
                                  </p>
                                ))}
                              </details>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </>
        )}
        {selected && (
          <ScorecardModal
            key={selected.id}
            interview={selected}
            onClose={() => setSelected(null)}
            onSaved={() => {
              setSelected(null);
              setNotice("Đã lưu phiếu đánh giá theo khung năng lực.");
              void load();
            }}
          />
        )}
      </div>
    </WorkspaceShell>
  );
}
