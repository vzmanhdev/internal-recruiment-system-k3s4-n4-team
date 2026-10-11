"use client";

import React, { useEffect, useState } from "react";
import { Settings, Bell, Mail, Save, Loader2, Lock } from "lucide-react";
import { notificationService, type NotificationPreferenceItem } from "@/services/notification.service";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api-client";

/** Per-user notification preferences (S8-04) backed by /notifications/preferences; shared by every workspace. */
export function NotificationPreferencesPanel({ title }: { title: string }) {
  const { showSuccess, showError } = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    notificationService.getPreferences()
      .then(setPrefs)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Không tải được cấu hình thông báo."))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (type: string, field: "in_app_enabled" | "email_enabled") =>
    setPrefs((prev) => prev.map((p) => (p.type === type && !p.mandatory ? { ...p, [field]: !p[field] } : p)));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await notificationService.savePreferences(
        prefs.filter((p) => !p.mandatory).map(({ type, in_app_enabled, email_enabled }) => ({ type, in_app_enabled, email_enabled }))
      );
      setPrefs(saved); // persisted values returned by the server
      showSuccess("Cấu hình thông báo đã được lưu.");
    } catch (err) {
      showError(err instanceof ApiError ? err.message : "Lưu cấu hình thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#4285F4]" /> {title}
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Bật hoặc tắt từng loại thông báo theo kênh. Thông báo bắt buộc không thể tắt (S8-04).</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
        ) : loadError ? (
          <div className="p-8 text-center text-xs text-rose-600">{loadError}</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Loại thông báo</th>
                <th className="p-4 text-center"><Bell className="w-3.5 h-3.5 inline" /> Trong ứng dụng</th>
                <th className="p-4 text-center"><Mail className="w-3.5 h-3.5 inline" /> Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prefs.map((p) => (
                <tr key={p.type}>
                  <td className="p-4 font-semibold text-slate-800">
                    {p.label}
                    {p.mandatory && <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-slate-400"><Lock className="w-3 h-3" />Bắt buộc</span>}
                  </td>
                  {(["in_app_enabled", "email_enabled"] as const).map((field) => (
                    <td key={field} className="p-4 text-center">
                      <input type="checkbox" checked={p[field]} disabled={p.mandatory} onChange={() => toggle(p.type, field)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saving || loading || !!loadError}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu cấu hình
        </button>
      </div>
    </form>
  );
}
