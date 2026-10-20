"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Bell,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { slaService, type SlaRuleItem, type SlaCheckResult } from "@/services/sla.service";
import { useApiData } from "@/hooks/useApiData";
import { LoadingState, ErrorState } from "@/components/ui/DataStates";

interface StageMeta {
  code: string;
  name: string;
  description: string;
  defaultDays: number;
  badgeBg: string;
  badgeText: string;
  borderCol: string;
}

const STAGE_METADATA: Record<string, StageMeta> = {
  submitted: {
    code: "submitted",
    name: "Hồ sơ mới (CV Mới)",
    description: "Thời gian tối đa để Recruiter tiếp nhận, kiểm tra tính hợp lệ và sàng lọc ban đầu.",
    defaultDays: 3,
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "Giai đoạn đầu phễu",
    borderCol: "border-l-blue-500",
  },
  screening: {
    code: "screening",
    name: "Sàng lọc (Screening)",
    description: "Thời gian liên hệ ứng viên, phỏng vấn sơ bộ qua điện thoại và chốt danh sách vào vòng chuyên môn.",
    defaultDays: 5,
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badgeText: "Vòng sơ loại",
    borderCol: "border-l-purple-500",
  },
  interviewing: {
    code: "interviewing",
    name: "Phỏng vấn (Interviewing)",
    description: "Thời gian điều phối lịch hội đồng phỏng vấn, thực hiện phỏng vấn và nhập phiếu đánh giá.",
    defaultDays: 7,
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeText: "Hội đồng chuyên môn",
    borderCol: "border-l-amber-500",
  },
  offered: {
    code: "offered",
    name: "Thư mời nhận việc (Offer)",
    description: "Thời gian phê duyệt tờ trình tuyển dụng, phát hành thư mời nhận việc và chờ phản hồi từ ứng viên.",
    defaultDays: 3,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "Vòng đàm phán",
    borderCol: "border-l-emerald-500",
  },
};

export default function SlaRulesPage() {
  const { data: rulesData, loading, error, reload } = useApiData(
    () => slaService.getRules(),
    []
  );

  const [ruleEdits, setRuleEdits] = useState<Record<string, { max_days: number; is_active: boolean }>>({});
  const [savingStage, setSavingStage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SlaCheckResult | null>(null);

  useEffect(() => {
    if (rulesData) {
      const initial: Record<string, { max_days: number; is_active: boolean }> = {};
      for (const r of rulesData) {
        initial[r.stage] = { max_days: r.max_days, is_active: r.is_active };
      }
      setRuleEdits(initial);
    }
  }, [rulesData]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDayChange = (stage: string, val: number) => {
    const days = Math.max(1, Math.min(90, val || 1));
    setRuleEdits((prev) => ({
      ...prev,
      [stage]: {
        max_days: days,
        is_active: prev[stage]?.is_active ?? true,
      },
    }));
  };

  const handleToggleActive = (stage: string) => {
    setRuleEdits((prev) => ({
      ...prev,
      [stage]: {
        max_days: prev[stage]?.max_days ?? STAGE_METADATA[stage]?.defaultDays ?? 3,
        is_active: !prev[stage]?.is_active,
      },
    }));
  };

  const handleSaveRule = async (stage: string) => {
    const edit = ruleEdits[stage];
    if (!edit) return;
    setSavingStage(stage);
    try {
      await slaService.updateRule(stage, edit.max_days, edit.is_active);
      showToast("success", `Đã lưu thành công cấu hình SLA cho giai đoạn "${STAGE_METADATA[stage]?.name || stage}" (${edit.max_days} ngày)`);
      reload();
    } catch (err: any) {
      showToast("error", err?.message || "Không thể lưu cấu hình SLA");
    } finally {
      setSavingStage(null);
    }
  };

  const handleTriggerSlaScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await slaService.triggerCheck();
      setScanResult(res);
      showToast(
        "success",
        `Đã quét xong: Gắn cờ ${res.flagged} hồ sơ quá hạn, gửi ${res.reminded} thông báo nhắc việc!`
      );
    } catch (err: any) {
      showToast("error", err?.message || "Không thể kích hoạt quét SLA");
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <LoadingState label="Đang tải danh mục cấu hình SLA tuyển dụng..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const stagesList = ["submitted", "screening", "interviewing", "offered"];

  return (
    <div className="w-full space-y-5 antialiased font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={clsx(
            "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200",
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span className="text-slate-500">Dữ liệu danh mục</span>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Thiết lập SLA tuyển dụng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-8 h-8 text-blue-600" />
            <span>Cấu Hình Ngưỡng SLA & Tự Động Nhắc Việc</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Quy định số ngày tối đa cho mỗi giai đoạn. Hệ thống tự động kiểm tra mỗi ngày, gắn cờ vi phạm và bắn thông báo tới Recruiter phụ trách.
          </p>
        </div>

        {/* Nút Quét SLA On-demand */}
        <button
          type="button"
          onClick={handleTriggerSlaScan}
          disabled={scanning}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
        >
          <Play className={clsx("w-4 h-4", scanning && "animate-spin")} />
          <span>{scanning ? "Đang quét vi phạm SLA..." : "Quét & Nhắc Việc Ngay"}</span>
        </button>
      </div>

      {/* Scan Result Banner */}
      {scanResult && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                Kết quả quét SLA gần nhất ({new Date().toLocaleTimeString("vi-VN")})
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Tìm thấy <strong>{scanResult.flagged}</strong> hồ sơ vượt ngưỡng SLA • Đã gửi <strong>{scanResult.reminded}</strong> thông báo in-app mới tới các Recruiter phụ trách (không gửi trùng lặp).
              </p>
            </div>
          </div>
          <a
            href="/recruiter/pipeline"
            className="px-4 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
          >
            <span>Mở Kanban Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tổng giai đoạn</span>
            <span className="text-2xl font-black text-slate-900">4 Giai đoạn</span>
            <span className="text-[11px] text-slate-500 block font-medium">Áp dụng toàn bộ phễu</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ngưỡng nhanh nhất</span>
            <span className="text-2xl font-black text-emerald-600">3 Ngày</span>
            <span className="text-[11px] text-slate-500 block font-medium">CV Mới & Thư mời</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ngưỡng dài nhất</span>
            <span className="text-2xl font-black text-amber-600">7 Ngày</span>
            <span className="text-[11px] text-slate-500 block font-medium">Hội đồng phỏng vấn</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tần suất tự động</span>
            <span className="text-2xl font-black text-purple-600">1 Lần / Ngày</span>
            <span className="text-[11px] text-slate-500 block font-medium">Chống spam nhắc trùng</span>
          </div>
        </div>
      </div>

      {/* Main SLA Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Bảng Cấu Hình Ngưỡng Giới Hạn Từng Giai Đoạn (User Story S5-10)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Thay đổi số ngày tối đa cho từng bước. Khi hồ sơ vượt quá số ngày này, hệ thống sẽ tự động bật cờ vi phạm màu đỏ và gửi thông báo.
            </p>
          </div>
          <button
            type="button"
            onClick={reload}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
            title="Tải lại dữ liệu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {stagesList.map((stageKey) => {
            const meta = STAGE_METADATA[stageKey];
            const edit = ruleEdits[stageKey] || { max_days: meta?.defaultDays ?? 3, is_active: true };
            const isSaving = savingStage === stageKey;

            return (
              <div
                key={stageKey}
                className={clsx(
                  "p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors border-l-4",
                  meta?.borderCol || "border-l-blue-500"
                )}
              >
                {/* Stage Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className={clsx("text-[10px] font-black px-2.5 py-0.5 rounded-full border", meta?.badgeBg)}>
                      {meta?.badgeText}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">{meta?.name}</h3>
                    <span className="text-xs font-mono text-slate-400">({stageKey})</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {meta?.description}
                  </p>
                </div>

                {/* Edit Controls */}
                <div className="flex flex-wrap items-center gap-4 shrink-0">
                  {/* Status Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Kích hoạt:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(stageKey)}
                      className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                        edit.is_active ? "bg-emerald-500" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={clsx(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs",
                          edit.is_active ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {/* Days Input */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Ngưỡng tối đa:</span>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={edit.max_days}
                        onChange={(e) => handleDayChange(stageKey, parseInt(e.target.value, 10))}
                        className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">ngày</span>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    onClick={() => handleSaveRule(stageKey)}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all transform active:scale-95 cursor-pointer"
                  >
                    <Save className={clsx("w-3.5 h-3.5", isSaving && "animate-spin")} />
                    <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SLA Policy Guide & Rules Information */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-black">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-black tracking-tight">Quy trình vận hành SLA tự động (SCRUM-105)</h3>
            <p className="text-xs text-slate-400 font-medium">Đảm bảo trải nghiệm ứng viên chuyên nghiệp và năng suất làm việc của Recruiter.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-xs font-black text-blue-400 uppercase tracking-wider block">1. Gắn cờ vi phạm</span>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Khi ứng viên ở một giai đoạn vượt quá ngưỡng ngày quy định, thẻ ứng viên trên Kanban sẽ hiển thị cảnh báo đỏ và icon đồng hồ nhấp nháy.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">2. Gửi nhắc việc</span>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Job định kỳ chạy hàng ngày sẽ gửi thông báo in-app kèm đường link trực tiếp đến hồ sơ cần xử lý cho đúng Recruiter phụ trách.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">3. Chống gửi trùng lặp</span>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Hệ thống sử dụng deduplication key theo ngày để ngăn ngừa spam thông báo, chỉ gửi nhắc việc tối đa 1 lần mỗi ngày cho mỗi ứng viên.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
