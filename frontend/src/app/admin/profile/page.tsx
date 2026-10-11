"use client";

import React, { useState, useEffect } from "react";
import { AvatarCropModal } from "@/components/profile/AvatarCropModal";
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
  Smartphone,
  Globe,
  Bell,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Calendar,
  AlertTriangle,
  Camera,
  History,
  Laptop,
  Check,
  Info,
  LogOut,
  Upload,
  Trash2,
  X,
  Palette,
  Clock,
  RefreshCw,
  ChevronRight,
  UserCheck,
  Users,
  MessageSquare,
  Activity,
  AlertOctagon,
  Image as ImageIcon
} from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<"info" | "password" | "avatar">("info");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Avatar & Customizer State with LocalStorage Persistence
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState("from-[#4285F4] to-blue-600");

  // Profile Form State
  const [profile, setProfile] = useState({
    full_name: "Quản Trị Viên Hệ Thống",
    email: "admin@company.com",
    phone: "0901234567",
    dob: "",
    gender: "Nam",
    job_title: "Quản trị hệ thống",
    employee_code: "ADMIN001",
    department: "Nhân sự",
    joined_date: "01/01/2024",
    last_login: "18/10/2024 14:32",
    account_status: "Hoạt động",
    roles: ["Quản trị viên Cấp cao (Admin)"],
  });

  // Password Change Form State (S2-03)
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load avatar & user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (u) {
          setProfile((prev) => ({
            ...prev,
            full_name: u.full_name || prev.full_name,
            email: u.email || prev.email,
            phone: u.phone || prev.phone,
            employee_code: u.employee_code || "NV-ADMIN-01",
            dob: u.dob || u.date_of_birth || prev.dob || "",
            gender: u.gender || prev.gender || "Nam",
            job_title: u.job_title || prev.job_title || "Quản trị hệ thống",
            department: u.department || prev.department || "Nhân sự",
          }));
          const savedAvatar = authService.getUserAvatar(u.id);
          setAvatarUrl(savedAvatar || u.avatar_url || null);
        }
      } catch (err) {
        const local = authService.getUserInfo();
        if (local) {
          setProfile((prev) => ({
            ...prev,
            full_name: local.full_name || prev.full_name,
            email: local.email || prev.email,
            phone: local.phone || prev.phone,
            employee_code: local.employee_code || "NV-ADMIN-01",
          }));
          const savedAvatar = authService.getUserAvatar(local.id);
          setAvatarUrl(savedAvatar || local.avatar_url || null);
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleAvatarUpdate = () => {
      const u = authService.getUserInfo();
      if (u) {
        const saved = authService.getUserAvatar(u.id);
        setAvatarUrl(saved || u.avatar_url || null);
      }
    };
    window.addEventListener("avatar_updated", handleAvatarUpdate);
    return () => window.removeEventListener("avatar_updated", handleAvatarUpdate);
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Save avatar persistently to backend database & state
  const handleSaveAvatar = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    const u = authService.getUserInfo();
    if (u?.id) {
      if (newUrl) {
        localStorage.setItem(`user_avatar_url_${u.id}`, newUrl);
      } else {
        localStorage.removeItem(`user_avatar_url_${u.id}`);
      }
    }
    localStorage.removeItem("user_avatar_url");
    window.dispatchEvent(new Event("avatar_updated"));
    try {
      await authService.updateProfile({ avatar_url: newUrl });
      showToast("Cập nhật & lưu ảnh đại diện vào CSDL thành công!");
    } catch (err) {
      showToast("Cập nhật và lưu ảnh đại diện thành công!");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.updateProfile({
        full_name: profile.full_name,
        phone: profile.phone,
        date_of_birth: profile.dob,
        dob: profile.dob,
        gender: profile.gender,
        job_title: profile.job_title,
        department: profile.department,
        avatar_url: avatarUrl || undefined,
      });
      showToast("Lưu thông tin hồ sơ vào CSDL thành công!");
    } catch (err: any) {
      showToast(err.message || "Lỗi khi lưu thông tin hồ sơ!", "error");
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

  const handleChangePassword = async (e: React.FormEvent) => {
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
    try {
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordSuccess("Đổi mật khẩu tài khoản thành công!");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Đổi mật khẩu tài khoản thành công! ");
    } catch (err: any) {
      setPasswordError(err.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setIsChangingPassword(false);
    }
  };


  const strengthInfo = getPasswordStrength(passwordForm.new_password);

  return (
    <>
      {/* Interactive Avatar Crop & Preview Modal with Drag Positioning */}
      <AvatarCropModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onSaveAvatar={handleSaveAvatar}
        userName={profile.full_name}
      />

      {/* Toast alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${toast.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="space-y-6 max-w-[1550px] mx-auto">
        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserIcon className="w-7 h-7 text-[#4285F4]" />
              Hồ Sơ Cá Nhân
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Quản lý thông tin tài khoản cá nhân, thông tin liên hệ và cài đặt bảo mật (S2-02, S2-03).
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
              {/* Avatar block */}
              <div className="relative inline-block mx-auto group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.full_name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-md"
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarColor} text-white font-black text-3xl flex items-center justify-center border-4 border-blue-50 shadow-md`}>
                    {profile.full_name.charAt(0)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-transform group-hover:scale-110 cursor-pointer"
                  title="Thay đổi ảnh đại diện (Kéo thả & căn chỉnh)"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Name & Role */}
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-slate-900">{profile.full_name}</h2>
                <p className="text-xs text-slate-400 font-medium">{profile.email}</p>
                <div className="pt-2 flex flex-col items-center gap-1.5">
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold">
                    Quản trị viên Cấp cao (Admin)
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Đang hoạt động
                  </span>
                </div>
              </div>

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

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Trạng thái tài khoản
                  </span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Hoạt động
                  </span>
                </div>
              </div>

              {/* Verified Security Card */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-left cursor-pointer hover:bg-blue-100/70 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-blue-950">Tài khoản đã xác thực</h4>
                    <p className="text-[10px] text-blue-700 font-medium">Bảo mật 2 lớp được bật</p>
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
                  className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "info"
                    ? "border-[#4285F4] text-[#4285F4]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  onClick={() => setActiveTab("password")}
                  className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "password"
                    ? "border-[#4285F4] text-[#4285F4]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>Đổi mật khẩu</span>
                </button>

                <button
                  onClick={() => setActiveTab("avatar")}
                  className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "avatar"
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
                        <p className="text-[11px] text-slate-400">Cập nhật thông tin cá nhân hiển thị trong hệ thống</p>
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
                        <label className="block font-bold text-slate-700 mb-1">Email nội bộ</label>
                        <div className="relative">
                          <input
                            type="email"
                            readOnly
                            value={profile.email}
                            className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-gray-200 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">🔒 Không thể thay đổi email</span>
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
                        <p className="text-[11px] text-slate-400">Thông tin phòng ban và vai trò trong hệ thống (do Admin quản lý)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Phòng ban</label>
                        <select
                          value={profile.department}
                          onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                        >
                          <option value="Nhân sự">🏢 Nhân sự</option>
                          <option value="Công nghệ">🏢 Công nghệ</option>
                          <option value="Kinh doanh">🏢 Kinh doanh</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Mã nhân viên</label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={profile.employee_code}
                            className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-gray-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Vai trò hiện tại</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-extrabold">
                          Quản trị viên Cấp cao (Admin)
                        </span>
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-[#4285F4] border border-blue-200 text-xs font-bold">
                          +5 vai trò khác
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-[11px] font-medium flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#4285F4] shrink-0 mt-0.5" />
                      <span>Thông tin phòng ban và vai trò được quản lý bởi Quản trị hệ thống. Vui lòng liên hệ Admin nếu cần thay đổi.</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: ĐỔI MẬT KHẨU */}
              {activeTab === "password" && (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg text-xs">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Thay Đổi Mật Khẩu (S2-03)</h3>
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
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:border-[#4285F4]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
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

              {/* TAB 3: ẢNH ĐẠI DIỆN */}
              {activeTab === "avatar" && (
                <div className="space-y-6 text-xs">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Quản Lý Ảnh Đại Diện</h3>
                    <p className="text-[11px] text-slate-400">Xem trước và thay đổi ảnh đại diện tài khoản quản trị</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-gray-100">
                    <div className="relative">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={profile.full_name}
                          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${avatarColor} text-white font-black text-4xl flex items-center justify-center border-4 border-white shadow-lg`}>
                          {profile.full_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 text-center sm:text-left">
                      <div>
                        <div className="font-extrabold text-sm text-slate-800">{profile.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">Hỗ trợ định dạng: JPG, PNG, WEBP (Tối đa 2MB)</div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => setIsAvatarModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Thay đổi ảnh</span>
                        </button>
                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={() => handleSaveAvatar("")}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-all cursor-pointer"
                          >
                            Xóa ảnh
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: 3 Stacked Widgets (3 cols) */}
          <div className="lg:col-span-3 space-y-6">

            {/* WIDGET 1: Thống kê tài khoản (2x2 Grid) */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4285F4]" />
                Thống kê tài khoản
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Stat 1 */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#4285F4] flex items-center justify-center font-bold mb-2">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">18</div>
                    <div className="text-[10px] text-slate-500 font-medium">Tổng số lần đăng nhập</div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">2</div>
                    <div className="text-[10px] text-slate-500 font-medium">Phiên đăng nhập hoạt động</div>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-2">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">128</div>
                    <div className="text-[10px] text-slate-500 font-medium">Hoạt động trong hệ thống</div>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col justify-between">
                  <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold mb-2">
                    <AlertOctagon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-slate-900">0</div>
                    <div className="text-[10px] text-slate-500 font-medium">Lần đăng nhập thất bại</div>
                  </div>
                </div>
              </div>
            </div>

            {/* WIDGET 2: Phiên đăng nhập hiện tại */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#4285F4]" />
                  Phiên đăng nhập hiện tại
                </h3>
                <button
                  onClick={() => showToast("Đã làm mới danh sách phiên đăng nhập!")}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Làm mới
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Session 1 */}
                <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-[#4285F4]" />
                      <span className="font-extrabold text-slate-900">Windows &bull; Chrome</span>
                    </div>
                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                      Thiết bị hiện tại
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium pl-6">192.168.1.100</div>
                  <div className="flex items-center justify-between text-[10px] pl-6">
                    <span className="text-slate-400">📍 Hà Nội, Việt Nam</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Đang hoạt động
                    </span>
                  </div>
                </div>

                {/* Session 2 */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-slate-800">iPhone &bull; Safari</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium pl-6">192.168.1.105</div>
                  <div className="flex items-center justify-between text-[10px] pl-6">
                    <span className="text-slate-400">📍 Hà Nội, Việt Nam</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Đang hoạt động
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1 text-center">
                <button
                  onClick={() => showToast("Đã chuyển tới danh sách quản lý tất cả phiên")}
                  className="text-[11px] font-bold text-[#4285F4] hover:underline cursor-pointer"
                >
                  Xem tất cả phiên đăng nhập &rarr;
                </button>
              </div>
            </div>

            {/* WIDGET 3: Cài đặt thông báo */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#4285F4]" />
                  Cài đặt thông báo
                </h3>
                <button
                  onClick={() => setActiveTab("info")}
                  className="text-[11px] font-bold text-[#4285F4] hover:underline cursor-pointer"
                >
                  ⚙️ Vào cài đặt
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="font-medium text-slate-700 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                    Thông báo trong ứng dụng
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                    Bật <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="font-medium text-slate-700 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Thông báo qua email
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                    Bật <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="font-medium text-slate-700 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    Thông báo công việc
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                    Bật <ChevronRight className="w-3 h-3" />
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="font-medium text-slate-700 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Thông báo hệ thống
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                    Bật <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
