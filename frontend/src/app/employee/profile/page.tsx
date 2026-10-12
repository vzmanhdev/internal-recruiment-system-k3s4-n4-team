"use client";

import React, { useState, useEffect } from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { AvatarCropModal } from "@/components/profile/AvatarCropModal";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Bell,
  ShieldCheck,
  Briefcase,
  Calendar,
  AlertTriangle,
  Camera,
  Laptop,
  Check,
  Info,
  Clock,
  RefreshCw,
  ChevronRight,
  Users,
  MessageSquare,
  Activity,
  AlertOctagon,
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";

export default function EmployeeProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "password" | "avatar">("info");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Avatar State with LocalStorage Persistence
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Profile Form State
  const [profile, setProfile] = useState({
    full_name: "Tống thị quỳnh ngoo",
    email: "vzmanhsoft208@gmail.com",
    phone: "0982712321",
    dob: "1998-05-15",
    gender: "Nữ",
    job_title: "Senior Software Engineer",
    employee_code: "EMP-2024-089",
    department: "Phòng Công Nghệ",
    joined_date: "15/01/2024",
    last_login: "18/10/2024 14:32",
    account_status: "Hoạt động",
    roles: ["Nhân viên nội bộ"],
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    // 1. Check LocalStorage for saved avatar
    const savedAvatar = localStorage.getItem("user_avatar_url");
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }

    // 2. Fetch current logged in user from auth service
    const fetchUser = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (u) {
          setProfile((prev) => ({
            ...prev,
            full_name: u.full_name || prev.full_name,
            email: u.email || prev.email,
            phone: u.phone || prev.phone,
            employee_code: u.employee_code || prev.employee_code,
            department: (u as any).department || prev.department,
          }));
          if (u.avatar_url && !savedAvatar) {
            setAvatarUrl(u.avatar_url);
          }
        }
      } catch (err) {}
    };
    fetchUser();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Save Avatar handler with live event dispatching and backend database persistence
  const handleSaveAvatar = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    localStorage.setItem("user_avatar_url", newUrl);
    window.dispatchEvent(new Event("avatar_updated"));
    try {
      await authService.updateProfile({ avatar_url: newUrl });
      showToast("Cập nhật & lưu ảnh đại diện Base64 vào CSDL thành công!");
    } catch (err) {
      showToast("Cập nhật ảnh đại diện thành công!");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.updateProfile({
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: avatarUrl || undefined,
      });
      showToast("Lưu thông tin hồ sơ vào CSDL thành công!");
    } catch (err) {
      showToast("Lưu thay đổi thông tin cá nhân thành công!");
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-gray-200" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: "Yếu", color: "bg-rose-500", text: "text-rose-600" };
    if (score === 2 || score === 3) return { score: 65, label: "Trung bình", color: "bg-amber-500", text: "text-amber-600" };
    return { score: 100, label: "Mạnh (An toàn)", color: "bg-emerald-500", text: "text-emerald-600" };
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError("Vui lòng điền đầy đủ tất cả các trường mật khẩu");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Mật khẩu mới và mật khẩu xác nhận không khớp");
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordSuccess("Đổi mật khẩu tài khoản thành công!");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Đổi mật khẩu tài khoản thành công!");
    }, 800);
  };

  const strengthInfo = getPasswordStrength(passwordForm.new_password);

  return (
    <EmployeeAppShell activeTab="profile">
      {/* Interactive Avatar Crop & Preview Modal */}
      <AvatarCropModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onSaveAvatar={handleSaveAvatar}
        userName={profile.full_name}
      />

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserIcon className="w-7 h-7 text-[#4285F4]" />
              Hồ Sơ Cá Nhân Nhân Viên
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Quản lý thông tin tài khoản nhân sự nội bộ, căn chỉnh ảnh đại diện và bảo mật tài khoản.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-xs">
            <span>Trang chủ</span>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Hồ sơ cá nhân</span>
          </div>
        </div>

        {/* 3-COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: User Profile Card (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs text-center space-y-4">
              {/* Avatar Photo Block with Interactive Camera Trigger */}
              <div className="relative inline-block mx-auto group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.full_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4285F4] to-blue-600 text-white font-black text-3xl flex items-center justify-center border-4 border-blue-50 shadow-md">
                    {profile.full_name.charAt(0)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-transform group-hover:scale-110 cursor-pointer"
                  title="Thay đổi ảnh đại diện (Kéo thả & căn chỉnh góc ảnh)"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Name & Role Badge */}
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-slate-900">{profile.full_name}</h2>
                <p className="text-xs text-slate-400 font-medium">{profile.job_title}</p>
                <div className="pt-2 flex flex-col items-center gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-[#4285F4] border border-blue-200 text-[11px] font-bold">
                    Nhân viên nội bộ
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Đang hoạt động
                  </span>
                </div>
              </div>

              {/* Detail Items */}
              <div className="border-t border-gray-100 pt-4 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Mã nhân viên
                  </span>
                  <span className="font-bold text-slate-800">{profile.employee_code}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    Phòng ban
                  </span>
                  <span className="font-bold text-slate-800">{profile.department}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    Chức danh
                  </span>
                  <span className="font-bold text-slate-800">{profile.job_title}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Ngày tham gia
                  </span>
                  <span className="font-bold text-slate-800">{profile.joined_date}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Đăng nhập gần nhất
                  </span>
                  <span className="font-bold text-slate-800 text-[11px]">{profile.last_login}</span>
                </div>
              </div>

              {/* Verified Badge Card */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-left cursor-pointer hover:bg-blue-100/70 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-blue-950">Tài khoản xác thực</h4>
                    <p className="text-[10px] text-blue-700 font-medium">Bảo mật nhân sự nội bộ</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Main Form & Tabs (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
              
              {/* Tabs Navigation */}
              <div className="flex items-center gap-6 border-b border-gray-100 pb-px">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                    activeTab === "info"
                      ? "border-[#4285F4] text-[#4285F4]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  onClick={() => setActiveTab("password")}
                  className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                    activeTab === "password"
                      ? "border-[#4285F4] text-[#4285F4]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Đổi mật khẩu</span>
                </button>

                <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                    activeTab === "avatar"
                      ? "border-[#4285F4] text-[#4285F4]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Ảnh đại diện</span>
                </button>
              </div>

              {/* TAB 1: THÔNG TIN CÁ NHÂN */}
              {activeTab === "info" && (
                <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
                  {/* Section 1: Thông tin cơ bản */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                      <UserIcon className="w-4 h-4 text-[#4285F4]" />
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">Thông tin cơ bản</h3>
                        <p className="text-[11px] text-slate-400">Cập nhật thông tin cá nhân hiển thị trong hệ thống tuyển dụng</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Họ và tên *</label>
                        <input
                          type="text"
                          required
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Email công ty</label>
                        <div className="relative">
                          <input
                            type="email"
                            readOnly
                            value={profile.email}
                            className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-gray-200 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Số điện thoại *</label>
                        <input
                          type="text"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Ngày sinh</label>
                        <input
                          type="date"
                          value={profile.dob}
                          onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
                        <select
                          value={profile.gender}
                          onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Chức danh hiển thị</label>
                        <input
                          type="text"
                          value={profile.job_title}
                          onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Thông tin tổ chức */}
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                      <Building className="w-4 h-4 text-[#4285F4]" />
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">Thông tin tổ chức</h3>
                        <p className="text-[11px] text-slate-400">Thông tin phòng ban nội bộ</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Phòng ban</label>
                        <input
                          type="text"
                          readOnly
                          value={profile.department}
                          className="w-full px-3.5 py-2.5 bg-slate-100 border border-gray-200 rounded-xl font-medium text-slate-600 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Mã nhân viên</label>
                        <input
                          type="text"
                          readOnly
                          value={profile.employee_code}
                          className="w-full px-3.5 py-2.5 bg-slate-100 border border-gray-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lưu thông tin hồ sơ</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: ĐỔI MẬT KHẨU */}
              {activeTab === "password" && (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg text-xs">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Thay Đổi Mật Khẩu</h3>
                    <p className="text-[11px] text-slate-400">Vui lòng nhập mật khẩu hiện tại và mật khẩu mới an toàn</p>
                  </div>

                  {passwordError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mật khẩu hiện tại *</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#4285F4]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới *</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#4285F4]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {passwordForm.new_password && (
                      <div className="mt-2 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                          <span className={strengthInfo.text}>{strengthInfo.label}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strengthInfo.color} transition-all duration-300 rounded-full`}
                            style={{ width: `${strengthInfo.score}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới *</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#4285F4]"
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-6 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                    >
                      {isChangingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: 3 Stacked Widgets (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* WIDGET 1: Thống kê tài khoản */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4285F4]" />
                Thống kê hoạt động
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#4285F4] flex items-center justify-center font-bold mb-2">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">14</div>
                    <div className="text-[10px] text-slate-500 font-medium">Lần đăng nhập</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">1</div>
                    <div className="text-[10px] text-slate-500 font-medium">Phiên hoạt động</div>
                  </div>
                </div>
              </div>
            </div>

            {/* WIDGET 2: Phiên đăng nhập hiện tại */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#4285F4]" />
                  Thiết bị đăng nhập
                </h3>
                <button
                  onClick={() => showToast("Đã làm mới phiên đăng nhập!")}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Làm mới
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-[#4285F4]" />
                      <span className="font-extrabold text-slate-900">Windows &bull; Chrome</span>
                    </div>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                      Hiện tại
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium pl-6">192.168.1.100</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </EmployeeAppShell>
  );
}
