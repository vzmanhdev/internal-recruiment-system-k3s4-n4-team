"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Mail, Save, Shield, Sliders } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { SystemSettingsData, systemService } from "../services/system.service";

const defaults: SystemSettingsData = {
  company_name: "Internal Recruitment System",
  allow_registration: true,
  require_approval: true,
  email_notifications: true,
  session_timeout: 60,
};

export function SystemSettings() {
  const [form, setForm] = useState<SystemSettingsData>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    systemService.settings()
      .then(setForm)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Không thể tải cấu hình hệ thống."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      setForm(await systemService.updateSettings(form));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể lưu cấu hình hệ thống.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Cấu hình Hệ thống</h1><p className="mt-1 text-sm text-slate-500">Các thay đổi được lưu vào cơ sở dữ liệu và áp dụng cho đăng ký, đăng nhập.</p></div>
        <button form="system-settings-form" type="submit" disabled={loading || saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {saved ? <><CheckCircle2 className="h-4 w-4 text-emerald-300" />Đã lưu cài đặt</> : <><Save className="h-4 w-4" />{saving ? "Đang lưu..." : "Lưu cấu hình"}</>}
        </button>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      <form id="system-settings-form" onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Sliders className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">Thông tin Chung</h2><p className="text-xs text-slate-500">Tên hệ thống và thời hạn phiên</p></div></div>
          <label className="block text-xs font-semibold text-slate-700">Tên Hệ thống / Doanh nghiệp<input required minLength={2} value={form.company_name} onChange={(event) => setForm({...form, company_name: event.target.value})} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm" /></label>
          <label className="block text-xs font-semibold text-slate-700">Thời gian hết hạn phiên làm việc<select value={form.session_timeout} onChange={(event) => setForm({...form, session_timeout: Number(event.target.value)})} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm"><option value={30}>30 phút</option><option value={60}>60 phút</option><option value={120}>120 phút</option><option value={480}>8 giờ</option></select></label>
        </section>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Shield className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">Đăng ký & Phê duyệt</h2><p className="text-xs text-slate-500">Chính sách tài khoản mới</p></div></div>
          <Toggle label="Cho phép Đăng ký Tài khoản mới" description="Cho phép sử dụng trang đăng ký" checked={form.allow_registration} onChange={(checked) => setForm({...form, allow_registration: checked})} />
          <Toggle label="Yêu cầu Phê duyệt Đăng ký" description="Admin phải duyệt tài khoản trước khi đăng nhập" checked={form.require_approval} onChange={(checked) => setForm({...form, require_approval: checked})} />
        </section>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Mail className="h-5 w-5" /></span><div><h2 className="font-bold text-slate-900">Thông báo & Email</h2><p className="text-xs text-slate-500">Cấu hình email tự động</p></div></div>
          <Toggle label="Gửi Email tự động cho Ứng viên & HR" description="Thông báo trạng thái ứng tuyển, lịch phỏng vấn và kết quả" checked={form.email_notifications} onChange={(checked) => setForm({...form, email_notifications: checked})} />
        </section>
      </form>
    </div>
  );
}

function Toggle({label, description, checked, onChange}: {label: string; description: string; checked: boolean; onChange: (checked: boolean) => void}) {
  return <label className="flex cursor-pointer items-center justify-between gap-4"><span><span className="block text-sm font-semibold text-slate-900">{label}</span><span className="block text-xs text-slate-500">{description}</span></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-slate-300 text-blue-600" /></label>;
}
