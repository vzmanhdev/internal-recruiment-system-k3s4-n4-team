"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Star,
  X,
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
  createEvaluation,
  fetchEvaluationComparison,
} from "@/features/referrals/services/referral.service";

const recommendationLabel: Record<string, string> = {
  strong_hire: "Rất nên tuyển",
  hire: "Nên tuyển",
  hold: "Cân nhắc",
  reject: "Không phù hợp",
};
const navItems = [
  { href: "/interviewer", label: "Lịch & đánh giá", icon: ClipboardCheck },
];

export default function InterviewerWorkspacePage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [comparison, setComparison] = useState<CandidateScoreComparison[]>([]);
  const [jobFilter, setJobFilter] = useState("all");
  const filteredComparison = comparison.filter(
    (candidate) => jobFilter === "all" || candidate.job_title === jobFilter,
  );
  const [selected, setSelected] = useState<InterviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    overall_score: 4,
    competency_score: 4,
    culture_fit_score: 4,
    recommendation: "hire",
    feedback: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [scheduleData, scoreData] = await Promise.all([
        fetchMyInterviews(),
        fetchEvaluationComparison(),
      ]);
      setInterviews(scheduleData.items);
      setComparison(scoreData);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Không thể tải dữ liệu đánh giá.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function submitEvaluation(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (form.feedback.trim().length < 5) {
      setError("Nhận xét phải có ít nhất 5 ký tự.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createEvaluation(selected.application_id, form);
      setNotice(`Đã lưu phiếu đánh giá cho ${selected.candidate_name}.`);
      setSelected(null);
      await load();
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Không thể lưu phiếu đánh giá.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceShell
      title="Hội đồng phỏng vấn"
      description="Lịch phỏng vấn, phiếu đánh giá và so sánh ứng viên"
      icon={ClipboardCheck}
      items={navItems}
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
              Sprint 6 · Interview Scorecards
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
              Phiếu đánh giá & so sánh ứng viên
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Nộp đánh giá theo thang 1–5 và đối chiếu kết quả của hội đồng trên
              một lưới chung.
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
          <Card className="flex items-center justify-center gap-3 py-14 text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Đang tải dữ liệu...
          </Card>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-slate-950">
                  Lịch được phân công
                </h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {interviews.length === 0 ? (
                  <Card>
                    <p className="text-sm text-slate-500">
                      Bạn chưa được phân công lịch phỏng vấn.
                    </p>
                  </Card>
                ) : (
                  interviews.map((item) => (
                    <Card key={item.id}>
                      <div className="flex items-start justify-between gap-3">
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
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {new Date(item.start_time).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                      <p className="mt-4 text-sm text-slate-600">
                        {new Date(item.start_time).toLocaleString("vi-VN")} ·{" "}
                        {item.location_or_link}
                      </p>
                      <Button
                        className="mt-4"
                        size="sm"
                        onClick={() => {
                          setForm({
                            overall_score: 4,
                            competency_score: 4,
                            culture_fit_score: 4,
                            recommendation: "hire",
                            feedback: "",
                          });
                          setSelected(item);
                        }}
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
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-600" />
                <h2 className="text-lg font-black text-slate-950">
                  Bảng so sánh điểm ứng viên
                </h2>
              </div>
              <Card className="overflow-x-auto p-0">
                <label className="block border-b border-slate-100 p-4 text-sm font-semibold text-slate-700">
                  So sánh theo vị trí
                  <select
                    value={jobFilter}
                    onChange={(event) => setJobFilter(event.target.value)}
                    className="mt-2 block h-10 w-full rounded-xl border border-slate-200 px-3 sm:w-80"
                  >
                    <option value="all">Tất cả vị trí</option>
                    {Array.from(
                      new Set(
                        comparison
                          .map((candidate) => candidate.job_title)
                          .filter(Boolean),
                      ),
                    ).map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                </label>
                <table className="min-w-[850px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-4">Ứng viên</th>
                      <th className="p-4 text-center">Tổng quan</th>
                      <th className="p-4 text-center">Chuyên môn</th>
                      <th className="p-4 text-center">Văn hóa</th>
                      <th className="p-4 text-center">CV phù hợp</th>
                      <th className="p-4">Kết luận hội đồng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredComparison.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-10 text-center text-slate-500"
                        >
                          Chưa có phiếu đánh giá để so sánh.
                        </td>
                      </tr>
                    ) : (
                      filteredComparison.map((candidate) => (
                        <tr
                          key={candidate.application_id}
                          className="hover:bg-blue-50/40"
                        >
                          <td className="p-4">
                            <strong className="block text-slate-950">
                              {candidate.candidate_name}
                            </strong>
                            <span className="text-xs text-slate-500">
                              {candidate.job_title} ·{" "}
                              {candidate.evaluation_count} phiếu
                            </span>
                          </td>
                          <Score value={candidate.overall_score} />
                          <Score value={candidate.competency_score} />
                          <Score value={candidate.culture_fit_score} />
                          <td className="p-4 text-center">
                            <span className="rounded-full bg-cyan-50 px-3 py-1 font-bold text-cyan-700">
                              {candidate.fit_score}%
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1.5">
                              {candidate.recommendations.length ? (
                                candidate.recommendations.map(
                                  (value, index) => (
                                    <span
                                      key={`${value}-${index}`}
                                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${value.includes("hire") ? "bg-emerald-50 text-emerald-700" : value === "reject" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}
                                    >
                                      {recommendationLabel[value] ?? value}
                                    </span>
                                  ),
                                )
                              ) : (
                                <span className="text-xs text-slate-400">
                                  Chưa kết luận
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Card>
            </section>
          </>
        )}
        {selected && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm">
            <form
              onSubmit={submitEvaluation}
              className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    Phiếu đánh giá 1–5 điểm
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selected.candidate_name} · {selected.job_title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                {error && (
                  <div className="sm:col-span-3">
                    <Alert variant="error">{error}</Alert>
                  </div>
                )}
                <ScoreInput
                  label="Tổng quan"
                  value={form.overall_score}
                  onChange={(value) =>
                    setForm({ ...form, overall_score: value })
                  }
                />
                <ScoreInput
                  label="Chuyên môn"
                  value={form.competency_score}
                  onChange={(value) =>
                    setForm({ ...form, competency_score: value })
                  }
                />
                <ScoreInput
                  label="Phù hợp văn hóa"
                  value={form.culture_fit_score}
                  onChange={(value) =>
                    setForm({ ...form, culture_fit_score: value })
                  }
                />
                <label className="sm:col-span-3 text-sm font-bold text-slate-700">
                  Đề xuất
                  <select
                    value={form.recommendation}
                    onChange={(event) =>
                      setForm({ ...form, recommendation: event.target.value })
                    }
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                  >
                    <option value="strong_hire">Rất nên tuyển</option>
                    <option value="hire">Nên tuyển</option>
                    <option value="hold">Cân nhắc</option>
                    <option value="reject">Không phù hợp</option>
                  </select>
                </label>
                <label className="sm:col-span-3 text-sm font-bold text-slate-700">
                  Nhận xét
                  <textarea
                    rows={4}
                    value={form.feedback}
                    onChange={(event) =>
                      setForm({ ...form, feedback: event.target.value })
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"
                    placeholder="Nêu điểm mạnh, rủi ro và khuyến nghị..."
                  />
                </label>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelected(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  isLoading={saving}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Lưu phiếu
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}

function Score({ value }: { value: number }) {
  return (
    <td className="p-4 text-center">
      <span className="inline-flex items-center gap-1 font-black text-slate-900">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        {value ? value.toFixed(1) : "—"}
      </span>
    </td>
  );
}
function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-bold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
      >
        {[5, 4, 3, 2, 1].map((score) => (
          <option key={score} value={score}>
            {score} / 5
          </option>
        ))}
      </select>
    </label>
  );
}
