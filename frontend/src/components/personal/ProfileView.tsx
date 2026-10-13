"use client";

import React, { useEffect, useState } from "react";
import { KeyRound, Loader2, Save, Upload } from "lucide-react";
import { authService, type UserItem } from "@/features/auth/services/auth.service";
import { uploadFile, fileUrl } from "@/services/file.service";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/providers/auth-provider";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";

type Me = UserItem & { job_title?: string | null; department?: string | null; date_of_birth?: string | null; gender?: string | null; bio?: string | null };

const input = "w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] disabled:bg-slate-50 disabled:text-[#64748B]";
const label = "block text-xs font-semibold text-[#334155] mb-1";
const card = "bg-white border border-[#E2E8F0] rounded-2xl p-5";

/**
 * The signed-in user's profile (S2-02, S2-03, S1-04): real /auth/me data, self-editable fields only
 * (email, department and roles are read-only), avatar via the validated upload API, password change.
 */
export function ProfileView() {
  const { refresh } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", job_title: "", date_of_birth: "", gender: "", bio: "" });
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNotice, setPwNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    authService.getCurrentUser()
      .then((u) => {
        const m = u as Me;
        setMe(m);
        setForm({
          full_name: m.full_name || "", phone: m.phone || "", job_title: m.job_title || "",
          date_of_birth: m.date_of_birth || "", gender: m.gender || "", bio: m.bio || "",
        });
        setLoadError(null);
      })
      .catch(setLoadError);

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setNotice(null); setFieldErrors({});
    try {
      const updated = await authService.updateProfile({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || undefined,
        ...(form.job_title ? { job_title: form.job_title.trim() } : {}),
        ...(form.date_of_birth ? { date_of_birth: form.date_of_birth } : {}),
        ...(form.gender ? { gender: form.gender } : {}),
        bio: form.bio,
      });
      setMe((prev) => ({ ...(prev as Me), ...(updated as Me) }));
      setNotice({ ok: true, text: "Đã lưu hồ sơ cá nhân." });
      void refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors || {});
        setNotice({ ok: false, text: err.message });
      } else setNotice({ ok: false, text: "Không lưu được hồ sơ." });
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = async (file: File) => {
    setUploading(true); setNotice(null);
    try {
      const stored = await uploadFile("avatar", file); // PNG/JPG ≤ 2 MB, checked by the server
      await authService.updateProfile({ avatar_url: stored.url });
      await load();
      void refresh();
      setNotice({ ok: true, text: "Đã cập nhật ảnh đại diện." });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof ApiError ? err.message : "Không tải được ảnh lên." });
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwNotice(null);
    if (pw.new_password !== pw.confirm) { setPwNotice({ ok: false, text: "Mật khẩu xác nhận không khớp." }); return; }
    setPwBusy(true);
    try {
      const r = await authService.changePassword({ current_password: pw.current_password, new_password: pw.new_password });
      setPw({ current_password: "", new_password: "", confirm: "" });
      setPwNotice({ ok: true, text: r.message || "Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị thu hồi." });
    } catch (err) {
      setPwNotice({ ok: false, text: err instanceof ApiError ? err.message : "Không đổi được mật khẩu." });
    } finally {
      setPwBusy(false);
    }
  };

  if (loadError) return <ErrorState error={loadError} onRetry={() => void load()} />;
  if (!me) return <LoadingState />;

  const roles = (me.roles || []).map((r) => (typeof r === "string" ? r : r.name)).join(", ");
  const avatar = me.avatar_url ? fileUrl(me.avatar_url) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Hồ sơ cá nhân</h1>
        <p className="text-sm text-[#64748B] mt-1">Email, phòng ban và vai trò do Quản trị hệ thống quản lý nên không thể tự thay đổi.</p>
      </div>

      {notice && (
        <div className={`text-sm rounded-xl px-4 py-3 border ${notice.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`} role="status">
          {notice.text}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`${card} space-y-4`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white text-lg font-bold flex items-center justify-center overflow-hidden">
              {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (me.full_name || "?").split(" ").slice(-1)[0][0]}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-[#0F172A] truncate">{me.full_name}</div>
              <div className="text-xs text-[#64748B] truncate">{me.email}</div>
            </div>
          </div>
          <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E2E8F0] text-[13px] font-semibold cursor-pointer hover:bg-slate-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Đổi ảnh đại diện
            <input type="file" accept="image/png,image/jpeg" className="hidden" disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void changeAvatar(f); e.target.value = ""; }} />
          </label>
          <p className="text-[11px] text-[#64748B]">PNG hoặc JPG, tối đa 2MB.</p>
          <dl className="text-sm space-y-2 pt-2 border-t border-[#E2E8F0]">
            <div><dt className="text-xs text-[#64748B]">Vai trò</dt><dd className="font-medium">{roles || "—"}</dd></div>
            <div><dt className="text-xs text-[#64748B]">Phòng ban</dt><dd className="font-medium">{me.department || "—"}</dd></div>
            <div><dt className="text-xs text-[#64748B]">Mã nhân viên</dt><dd className="font-medium">{me.employee_code || "—"}</dd></div>
          </dl>
        </section>

        <form onSubmit={save} className={`${card} lg:col-span-2 space-y-4`}>
          <h2 className="text-sm font-bold text-[#0F172A]">Thông tin cá nhân</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Họ và tên *</label><input className={input} required minLength={2} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              {fieldErrors.full_name && <p className="text-xs text-red-600 mt-1">{fieldErrors.full_name}</p>}</div>
            <div><label className={label}>Số điện thoại</label><input className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xxxxxxxx" />
              {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}</div>
            <div><label className={label}>Chức danh hiển thị</label><input className={input} value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} /></div>
            <div><label className={label}>Email</label><input className={input} value={me.email} disabled /></div>
            <div><label className={label}>Ngày sinh</label><input type="date" className={input} value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
            <div><label className={label}>Giới tính</label>
              <select className={input} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">—</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option>
              </select></div>
          </div>
          <div><label className={label}>Giới thiệu bản thân</label>
            <textarea className={`${input} h-auto py-2`} rows={3} maxLength={1000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={changePassword} className={`${card} space-y-4 max-w-2xl`}>
        <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#2563EB]" /> Đổi mật khẩu</h2>
        {pwNotice && <div className={`text-sm rounded-xl px-4 py-3 border ${pwNotice.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-700"}`}>{pwNotice.text}</div>}
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={label}>Mật khẩu hiện tại</label><input type="password" className={input} required value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} autoComplete="current-password" /></div>
          <div><label className={label}>Mật khẩu mới</label><input type="password" className={input} required minLength={8} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} autoComplete="new-password" /></div>
          <div><label className={label}>Xác nhận mật khẩu mới</label><input type="password" className={input} required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" /></div>
        </div>
        <p className="text-[11px] text-[#64748B]">Tối thiểu 8 ký tự, gồm chữ và số. Sau khi đổi, các phiên đăng nhập khác sẽ bị thu hồi.</p>
        <div className="flex justify-end">
          <button type="submit" disabled={pwBusy} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-[#E2E8F0] text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer">
            {pwBusy && <Loader2 className="w-4 h-4 animate-spin" />} Đổi mật khẩu
          </button>
        </div>
      </form>
    </div>
  );
}
