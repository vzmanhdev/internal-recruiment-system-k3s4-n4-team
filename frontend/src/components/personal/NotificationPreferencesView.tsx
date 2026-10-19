"use client";

import React, { useEffect, useState } from "react";
import { Bell, Loader2, Lock, Mail, Save } from "lucide-react";
import { notificationService, type NotificationPreferenceItem } from "@/services/notification.service";
import { ApiError } from "@/lib/api-client";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataStates";

/** Per-user, per-channel notification preferences (S8-04). Mandatory types cannot be switched off. */
export function NotificationPreferencesView({ title = "Cài đặt thông báo" }: { title?: string }) {
  const [prefs, setPrefs] = useState<NotificationPreferenceItem[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => notificationService.getPreferences().then((p) => { setPrefs(p); setError(null); }).catch(setError);
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (type: string, field: "in_app_enabled" | "email_enabled") =>
    setPrefs((prev) => (prev || []).map((p) => (p.type === type && !p.mandatory ? { ...p, [field]: !p[field] } : p)));

  const save = async () => {
    if (!prefs) return;
    setSaving(true); setNotice(null);
    try {
      const saved = await notificationService.savePreferences(
        prefs.filter((p) => !p.mandatory).map(({ type, in_app_enabled, email_enabled }) => ({ type, in_app_enabled, email_enabled })),
      );
      setPrefs(saved); // the persisted values returned by the server
      setNotice({ ok: true, text: "Đã lưu cấu hình thông báo." });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof ApiError ? err.message : "Lưu cấu hình thất bại." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">{title}</h1>
        <p className="text-sm text-[#64748B] mt-1">Bật hoặc tắt từng loại thông báo theo kênh. Thông báo bắt buộc không thể tắt.</p>
      </div>
      {notice && <div className={`text-sm rounded-xl px-4 py-3 border ${notice.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`} role="status">{notice.text}</div>}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        {error ? <ErrorState error={error} onRetry={() => void load()} /> : !prefs ? <LoadingState /> : prefs.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-[#64748B]">
                <tr>
                  <th className="px-4 py-3">Loại thông báo</th>
                  <th className="px-4 py-3 text-center"><Bell className="w-3.5 h-3.5 inline" aria-hidden="true" /> Trong ứng dụng</th>
                  <th className="px-4 py-3 text-center"><Mail className="w-3.5 h-3.5 inline" aria-hidden="true" /> Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {prefs.map((p) => (
                  <tr key={p.type}>
                    <td className="px-4 py-3 font-medium text-[#0F172A]">
                      {p.label}
                      {p.mandatory && <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-[#64748B]"><Lock className="w-3 h-3" aria-hidden="true" />Bắt buộc</span>}
                    </td>
                    {(["in_app_enabled", "email_enabled"] as const).map((f) => (
                      <td key={f} className="px-4 py-3 text-center">
                        <input type="checkbox" checked={p[f]} disabled={p.mandatory} onChange={() => toggle(p.type, f)}
                          aria-label={`${p.label} — ${f === "in_app_enabled" ? "trong ứng dụng" : "email"}`}
                          className="w-4 h-4 accent-[#2563EB] cursor-pointer disabled:cursor-not-allowed" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving || !prefs}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu cấu hình
        </button>
      </div>
    </div>
  );
}
