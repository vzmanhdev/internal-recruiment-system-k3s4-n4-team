"use client";

import React, { useEffect, useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Shield,
  KeyRound,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  Calendar,
  Camera,
  Save,
  Loader2,
  ShieldCheck,
  Check,
  Info,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { authService, type UserItem } from "@/features/auth/services/auth.service";
import { uploadFile, fileUrl } from "@/services/file.service";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/providers/auth-provider";
import { PasswordStrengthCard } from "@/components/ui/PasswordStrengthCard";
import { checkPasswordRules, getPasswordValidationErrorMessage } from "@/lib/validation/password";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { AvatarCropModal } from "@/components/profile/AvatarCropModal";
import { getLocalTodayDateString } from "@/utils/dateUtils";
import clsx from "clsx";

type Me = UserItem & {
  job_title?: string | null;
  department?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  bio?: string | null;
};

export function ProfileView() {
  const { refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "password" | "roles">("info");
  const [me, setMe] = useState<Me | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    job_title: "",
    date_of_birth: "",
    gender: "",
    bio: "",
  });
  const [loadError, setLoadError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Password state
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNotice, setPwNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Toast alert
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () =>
    authService
      .getCurrentUser()
      .then((u) => {
        const m = u as Me;
        setMe(m);
        setForm({
          full_name: m.full_name || "",
          phone: m.phone || "",
          job_title: m.job_title || "",
          date_of_birth: m.date_of_birth || "",
          gender: m.gender || "",
          bio: m.bio || "",
        });
        setLoadError(null);
      })
      .catch(setLoadError);

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save profile information
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
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
      showToast("Đã lưu thông tin hồ sơ cá nhân thành công!");
      void refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors || {});
        showToast(err.message, "error");
      } else {
        showToast("Không thể lưu thông tin hồ sơ.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // Save Avatar (from AvatarCropModal or file upload)
  const handleSaveAvatar = async (newAvatarUrl: string) => {
    try {
      await authService.updateProfile({ avatar_url: newAvatarUrl });
      localStorage.setItem("user_avatar_url", newAvatarUrl);
      window.dispatchEvent(new Event("avatar_updated"));
      await load();
      void refresh();
      setIsAvatarModalOpen(false);
      showToast("Cập nhật ảnh đại diện thành công!");
    } catch (err: any) {
      showToast(err?.message || "Không thể cập nhật ảnh đại diện.", "error");
    }
  };


  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwNotice(null);

    if (pw.new_password !== pw.confirm) {
      setPwNotice({ ok: false, text: "Mật khẩu xác nhận không khớp với mật khẩu mới." });
      return;
    }
    const rules = checkPasswordRules(pw.new_password);
    if (!rules.isValid) {
      setPwNotice({ ok: false, text: getPasswordValidationErrorMessage(rules, "Mật khẩu mới") });
      return;
    }

    setPwBusy(true);
    try {
      const r = await authService.changePassword({
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      setPw({ current_password: "", new_password: "", confirm: "" });
      setPwNotice({
        ok: true,
        text: r.message || "Đã đổi mật khẩu thành công. Các phiên đăng nhập khác đã được thu hồi.",
      });
      showToast("Đổi mật khẩu tài khoản thành công!");
    } catch (err) {
      setPwNotice({
        ok: false,
        text: err instanceof ApiError ? err.message : "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.",
      });
    } finally {
      setPwBusy(false);
    }
  };

  if (loadError) return <ErrorState error={loadError} onRetry={() => void load()} />;
  if (!me) return <LoadingState />;

  const roles = (me.roles || []).map((r) => (typeof r === "string" ? r : r.name));
  const roleDisplay = roles.join(", ");
  const avatar = me.avatar_url ? fileUrl(me.avatar_url) : null;

  return (
    <div className="space-y-6">
      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatar}
        onSaveAvatar={handleSaveAvatar}
        userName={me.full_name}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={clsx(
            "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200",
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
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

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-[#4285F4]" />
            <span>Hồ Sơ Cá Nhân</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý thông tin định danh, chức danh phòng ban và thiết lập bảo mật tài khoản người dùng.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span>Hệ thống</span>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Hồ sơ cá nhân</span>
        </div>
      </div>

      {/* 4-COLUMN MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* CỘT 1 (BÊN TRÁI - 1/4 GRID): KHỐI AVATAR & THÔNG TIN CƠ BẢN */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs p-6 border border-slate-100 text-center space-y-5">
            {/* Avatar Circle with Camera Button */}
            <div className="relative inline-block mx-auto group">
              {avatar ? (
                <img
                  src={avatar}
                  alt={me.full_name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-50 shadow-md ring-2 ring-blue-100"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#4285F4] to-indigo-600 text-white font-black text-3xl flex items-center justify-center border-4 border-blue-50 shadow-md">
                  {(me.full_name || "?").split(" ").slice(-1)[0][0]}
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-transform group-hover:scale-110 cursor-pointer border-2 border-white"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Name & Status Badges */}
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">{me.full_name}</h2>
              <p className="text-xs text-slate-400 font-medium truncate">{me.email}</p>

              <div className="pt-2 flex flex-col items-center gap-1.5">
                {/* Status Badge: Active */}
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang hoạt động
                </span>

                {/* Primary Role Badge */}
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                  {roles[0] || "Người dùng nội bộ"}
                </span>
              </div>
            </div>

            {/* Quick Meta List */}
            <div className="border-t border-slate-100 pt-4 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Mã nhân viên
                </span>
                <span className="font-bold text-slate-800 font-mono">
                  {me.employee_code || `ID-${me.id}`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  Phòng ban
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[150px]">
                  {me.department || "Nội bộ"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Chức danh
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[150px]">
                  {me.job_title || "Nhân viên"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Ngày tham gia
                </span>
                <span className="font-bold text-slate-800">
                  {me.created_at ? new Date(me.created_at).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT 2 (BÊN PHẢI - 3/4 GRID): CÁC TAB CÀI ĐẶT CHI TIẾT */}
        <div className="xl:col-span-3 space-y-5">
          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 bg-white p-2 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "info"
                  ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <UserIcon className="w-4 h-4" />
              <span>Thông Tin Cá Nhân</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "password"
                  ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <KeyRound className="w-4 h-4" />
              <span>Đổi Mật Khẩu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                activeTab === "roles"
                  ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Vai Trò & Quyền Hạn</span>
            </button>
          </div>

          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === "info" && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Chi Tiết Hồ Sơ Cá Nhân</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cập nhật họ tên, số điện thoại và thông tin cá nhân. Email, phòng ban và chức danh do Quản trị viên cấp.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Họ và tên *</span>
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Nhập họ và tên đầy đủ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    {fieldErrors.full_name && (
                      <p className="text-xs text-rose-600 font-medium">{fieldErrors.full_name}</p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Số điện thoại</span>
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0901234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-rose-600 font-medium">{fieldErrors.phone}</p>
                    )}
                  </div>

                  {/* Email (Readonly) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email đăng nhập</span>
                      <Lock className="w-3 h-3 text-slate-400 ml-auto" />
                    </label>
                    <input
                      type="text"
                      value={me.email}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400">Email công ty do IT/Admin quản lý</span>
                  </div>

                  {/* Chức danh hiển thị (Readonly) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>Chức danh hiển thị</span>
                      <Lock className="w-3 h-3 text-slate-400 ml-auto" />
                    </label>
                    <input
                      type="text"
                      value={me.job_title || "Quản trị hệ thống"}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400">Chức danh công tác do HR/Admin quản lý</span>
                  </div>

                  {/* Ngày sinh */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ngày sinh</span>
                    </label>
                    <input
                      type="date"
                      max={getLocalTodayDateString()}
                      value={form.date_of_birth}
                      onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  {/* Giới tính */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Giới tính</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">— Chọn giới tính —</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Giới thiệu bản thân */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Giới thiệu bản thân</label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Mô tả ngắn gọn về kinh nghiệm, định hướng làm việc hoặc chuyên môn..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Lưu Thay Đổi Hồ Sơ</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ĐỔI MẬT KHẨU */}
          {activeTab === "password" && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-blue-600" />
                    <span>Thiết Lập Mật Khẩu Tài Khoản</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Để bảo mật dữ liệu nhân sự, vui lòng đặt mật khẩu mạnh tối thiểu 8 ký tự và kết hợp số.
                  </p>
                </div>
              </div>

              {pwNotice && (
                <div
                  className={clsx(
                    "p-4 rounded-xl text-xs font-semibold border flex items-start gap-2.5",
                    pwNotice.ok
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  )}
                >
                  {pwNotice.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{pwNotice.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu hiện tại *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      required
                      value={pw.current_password}
                      onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      required
                      minLength={8}
                      value={pw.new_password}
                      onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                      placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Checklist (5 Criteria) */}
                  <div className="mt-2">
                    <PasswordStrengthCard password={pw.new_password} />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Xác nhận mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      required
                      value={pw.confirm}
                      onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={pwBusy || !checkPasswordRules(pw.new_password).isValid || pw.new_password !== pw.confirm || !pw.current_password}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {pwBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Xác Nhận Đổi Mật Khẩu</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: VAI TRÒ & QUYỀN HẠN */}
          {activeTab === "roles" && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-6 md:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Vai Trò & Phạm Vi Quyền Hạn Trong Hệ Thống</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân quyền theo mô hình chuẩn RBAC. Quản trị viên hệ thống là người có quyền phân quyền vai trò.
                </p>
              </div>

              {/* Roles Badge Cloud */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Các vai trò đang được cấp:</span>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Info Notice */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Info className="w-4 h-4 text-blue-600" /> Quản Trị Phân Quyền Tập Trung:
                </span>
                <p className="text-[11px] text-blue-800/80 leading-relaxed">
                  Nếu bạn cần mở rộng quyền hạn (ví dụ phê duyệt tờ trình tuyển dụng hoặc chấm điểm phỏng vấn), vui lòng liên hệ quản trị viên (Admin) hoặc Trưởng bộ phận Nhân sự để được cấu hình qua màn hình Quản lý người dùng.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
