"use client";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { InterviewItem } from "../services/interview.service";
import { apiRequest } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
type Panel = {
  framework_name: string;
  questions: Array<{
    id: number;
    competency: string;
    text: string;
    guidance?: string;
    asked: boolean;
  }>;
};
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
export function InterviewCalendar({
  interviews,
  onScore,
}: {
  interviews: InterviewItem[];
  onScore: (item: InterviewItem) => void;
}) {
  const [week, setWeek] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date;
  });
  const [selected, setSelected] = useState<InterviewItem | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const activeInterview = useRef<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(week);
    date.setDate(date.getDate() + index);
    return date;
  });
  const upcoming = interviews
    .filter(
      (item) =>
        item.status !== "cancelled" &&
        new Date(item.end_time || item.start_time).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  useEffect(() => {
    if (!selected) return;
    let active = true;
    apiRequest<Panel>(`/interviews/${selected.id}/questions`)
      .then((data) => {
        if (active) setPanel(data);
      })
      .catch((caught) => {
        if (active) setError(caught.message);
      });
    return () => {
      active = false;
    };
  }, [selected]);
  function open(item: InterviewItem) {
    activeInterview.current = item.id;
    setSelected(item);
    setPanel(null);
    setError("");
  }
  async function toggle(id: number, asked: boolean) {
    if (!selected || busy) return;
    const previous = panel;
    const interviewId = selected.id;
    setBusy(true);
    setError("");
    setPanel(
      (current) =>
        current && {
          ...current,
          questions: current.questions.map((question) =>
            question.id === id ? { ...question, asked } : question,
          ),
        },
    );
    try {
      const saved = await apiRequest<Panel>(
        `/interviews/${interviewId}/questions`,
        {
          method: "PUT",
          body: JSON.stringify({ question_id: id, asked }),
        },
      );
      if (activeInterview.current === interviewId) setPanel(saved);
    } catch (caught) {
      if (activeInterview.current === interviewId) {
        setPanel(previous);
        setError(
          caught instanceof Error ? caught.message : "Không thể lưu câu hỏi",
        );
      }
    } finally {
      setBusy(false);
    }
  }
  function move(direction: number) {
    const date = new Date(week);
    date.setDate(date.getDate() + 7 * direction);
    setWeek(date);
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          Lịch phỏng vấn cá nhân
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            aria-label="Tuần trước"
            onClick={() => move(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {days[0].toLocaleDateString("vi-VN")} –{" "}
            {days[6].toLocaleDateString("vi-VN")}
          </span>
          <Button
            size="sm"
            variant="outline"
            aria-label="Tuần sau"
            onClick={() => move(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        {days.map((day) => (
          <div
            key={dayKey(day)}
            className={`min-h-32 rounded-2xl border p-3 ${dayKey(day) === dayKey(new Date()) ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}
          >
            <p className="text-xs font-bold text-slate-600">
              {day.toLocaleDateString("vi-VN", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              })}
            </p>
            {interviews
              .filter(
                (item) =>
                  item.status !== "cancelled" &&
                  dayKey(new Date(item.start_time)) === dayKey(day),
              )
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => open(item)}
                  className="mt-2 block w-full rounded-xl border border-blue-100 bg-blue-50 p-2 text-left text-xs text-blue-800 hover:border-blue-400"
                >
                  <strong className="block">
                    {new Date(item.start_time).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                  {item.candidate_name}
                </button>
              ))}
          </div>
        ))}
      </div>
      <Card>
        <h3 className="font-bold text-slate-950">
          Sắp diễn ra ({upcoming.length})
        </h3>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Chưa có buổi phỏng vấn sắp tới.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {upcoming.map((item) => (
              <button
                key={item.id}
                onClick={() => open(item)}
                className="rounded-xl border border-slate-100 p-3 text-left hover:bg-blue-50"
              >
                <strong className="text-sm text-slate-900">
                  {item.candidate_name}
                </strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {new Date(item.start_time).toLocaleString("vi-VN")} ·{" "}
                  {item.job_title}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>
      {selected && (
        <Card className="border-blue-200">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-blue-600">
                Màn hình phỏng vấn · {selected.code}
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-950">
                {selected.candidate_name}
              </h3>
              <p className="mt-1 break-all text-sm text-slate-500">
                {new Date(selected.start_time).toLocaleString("vi-VN")} ·{" "}
                {selected.location_or_link}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onScore(selected)}>
                Nhập phiếu đánh giá
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-4">
              <Alert variant="error">{error}</Alert>
            </div>
          )}
          {panel ? (
            <>
              <h4 className="mt-5 font-bold">
                Câu hỏi gợi ý · {panel.framework_name}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                Đã hỏi {panel.questions.filter((q) => q.asked).length}/
                {panel.questions.length}. Đánh dấu được lưu riêng cho từng người
                phỏng vấn.
              </p>
              <div className="mt-4 space-y-3">
                {panel.questions.map((question) => (
                  <label
                    key={question.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${question.asked ? "border-emerald-100 bg-emerald-50" : "border-slate-100"}`}
                  >
                    <input
                      className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
                      type="checkbox"
                      checked={question.asked}
                      disabled={busy || selected.status === "cancelled"}
                      onChange={(e) =>
                        void toggle(question.id, e.target.checked)
                      }
                    />
                    <span>
                      <strong className="flex items-center gap-2 text-sm">
                        {question.competency}
                        {question.asked && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                      </strong>
                      <span className="mt-1 block text-sm text-slate-600">
                        {question.text}
                      </span>
                      {question.guidance && (
                        <span className="mt-2 block text-xs text-slate-500">
                          Gợi ý đối chiếu: {question.guidance}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            !error && (
              <p className="mt-4 text-sm text-slate-500">
                Đang tải bộ câu hỏi...
              </p>
            )
          )}
        </Card>
      )}
    </section>
  );
}
