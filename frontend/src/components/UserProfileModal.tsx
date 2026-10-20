"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Building,
  Phone,
  Calendar,
  Lock,
  Camera,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  KeyRound,
  BadgeCheck,
  Save,
  Check
} from "lucide-react";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { CroppedAvatarResult } from "@/lib/cropImage";
import { authService } from "@/features/auth/services/auth.service";
import { getLocalTodayDateString } from "@/utils/dateUtils";

export interface UserProfileData {
  employeeCode?: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  gender?: "Nam" | "Nữ" | "Khác";
  dateOfBirth?: string;
  avatarUrl?: string; // 500x500 bản chất lượng cao
  thumbnailUrl?: string; // 150x150 bản thu nhỏ
  bio?: string;
}

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  initialTab?: "profile" | "security";
  initialData?: Partial<UserProfileData>;
  onSaveProfile?: (updatedData: UserProfileData) => void;
  onAvatarChange?: (result: CroppedAvatarResult) => void;
  onChangePassword?: (data: {
    currentPass: string;
    newPass: string;
  }) => Promise<boolean | void> | boolean | void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  userRole,
  initialTab = "profile",
  initialData,
  onSaveProfile,
  onAvatarChange,
  onChangePassword,
}: UserProfileModalProps) {
  // Tabs: "profile" | "security"
  const [activeTab, setActiveTab] = useState<"profile" | "security">(initialTab);

  // Avatar Cropper Modal State
  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPasswordMessage(null);
      setProfileSuccess(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen, initialTab]);

  // Tab 1: Profile Form State
  const [profile, setProfile] = useState<UserProfileData>({
    employeeCode: initialData?.employeeCode || "NV-2026-088",
    name: initialData?.name || "Lê Trưởng Nhóm",
    email: initialData?.email || "truongbophan@company.com",
    role: userRole || initialData?.role || "Trưởng Bộ Phận (Hiring Manager)",
    department:
      initialData?.department || "Phòng Phát Triển Công Nghệ & Phần Mềm",
    phone: initialData?.phone || "0912 345 678",
    gender: initialData?.gender || "Nam",
    dateOfBirth: initialData?.dateOfBirth || "1992-06-18",
    avatarUrl: initialData?.avatarUrl || "",
    bio:
      initialData?.bio ||
      "Quản lý kỹ thuật và điều phối tuyển dụng nhân sự chuyên môn cho các dự án nội bộ.",
  });

  // Keep state updated if initialData changes
  useEffect(() => {
    if (initialData) {
      setProfile((prev) => ({
        ...prev,
        ...initialData,
        role: userRole || initialData.role || prev.role,
      }));
    }
  }, [initialData, userRole]);

  const [profileSuccess, setProfileSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Security & Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Validation helpers
  const passwordsDoNotMatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isNewPasswordTooShort =
    newPassword.length > 0 && newPassword.length < 8;
  const hasLetterAndNumber =
    /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);

  // Avatar Upload Handler: Kích hoạt chọn file và mở Modal Crop
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WebP).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedRawImage(result);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Áp dụng ảnh sau khi cắt và tạo thumbnail
  const handleCropSave = (result: CroppedAvatarResult) => {
    const updated: UserProfileData = {
      ...profile,
      avatarUrl: result.avatarUrl,
      thumbnailUrl: result.thumbnailUrl,
    };
    setProfile(updated);

    if (onAvatarChange) {
      onAvatarChange(result);
    }
    if (onSaveProfile) {
      onSaveProfile(updated);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setProfileSuccess(true);
    setTimeout(() => {
      setProfileSuccess(false);
    }, 3500);
  };

  // Submit Profile Form
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveProfile) {
      onSaveProfile(profile);
    }
    setProfileSuccess(true);
    setTimeout(() => {
      setProfileSuccess(false);
    }, 3000);
  };

  // Submit Change Password Form
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Vui lòng nhập mật khẩu hiện tại.",
      });
      return;
    }

    if (newPassword.length < 8 || !hasLetterAndNumber) {
      setPasswordMessage({
        type: "error",
        text: "Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ và số.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Mật khẩu xác nhận không khớp với mật khẩu mới.",
      });
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage({
        type: "error",
        text: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
      });
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordMessage(null);

    try {
      if (onChangePassword) {
        await onChangePassword({
          currentPass: currentPassword,
          newPass: newPassword,
        });
      } else {
        await authService.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
      }
      setPasswordMessage({
        type: "success",
        text: "Cập nhật mật khẩu thành công!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({
        type: "error",
        text:
          err?.message ||
          "Có lỗi xảy ra khi đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200">
        {/* ========================================================================= */}
        {/* MODAL HEADER WITH TABS */}
        {/* ========================================================================= */}
        <div className="px-6 pt-6 pb-0 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Tài Khoản & Bảo Mật
                </h2>
                <p className="text-xs text-slate-500">
                  Quản lý thông tin hồ sơ cá nhân và cấu hình xác thực tài khoản
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs (Flexbox ngang) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "profile"
                ? "border-[#4285F4] text-[#4285F4]"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Thông tin cá nhân</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "security"
                ? "border-[#4285F4] text-[#4285F4]"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Bảo mật & Đổi mật khẩu</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY */}
        {/* ========================================================================= */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ----------------------------------------------------------------------- */}
          {/* TAB 1: THÔNG TIN CÁ NHÂN (PROFILE) */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Success Toast */}
              {profileSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cập nhật thông tin hồ sơ thành công! Dữ liệu đã được lưu an toàn.</span>
                </div>
              )}

              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl bg-slate-50/80 border border-gray-100">
                <div className="relative shrink-0">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-gradient-to-tr from-[#4285F4] to-indigo-600 flex items-center justify-center text-white text-2xl font-bold cursor-pointer group relative"
                    title="Nhấp để tải lên và chỉnh sửa ảnh đại diện"
                  >
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span>
                        {profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(-2)
                          .join("")}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-2xl text-white gap-1">
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-[10px] font-semibold">Đổi ảnh</span>
                    </div>
                  </div>

                  {/* Camera Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Tải ảnh đại diện mới"
                    className="absolute -bottom-1.5 -right-1.5 p-2 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white shadow-lg border-2 border-white transition-all cursor-pointer hover:scale-105"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {profile.name}
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#4285F4] border border-blue-200">
                      {profile.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    {profile.email} • {profile.department}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Bấm vào icon máy ảnh để thay đổi ảnh đại diện. Định dạng hỗ trợ: JPG, PNG, GIF (Dưới 5MB).
                  </p>
                </div>
              </div>

              {/* Form Grid 2 columns */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <span>Thông tin hồ sơ chi tiết</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* READ-ONLY: Mã nhân viên */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Mã nhân viên</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                        <Lock className="w-3 h-3" /> Chỉ đọc
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={profile.employeeCode || "NV-2026-088"}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-mono text-xs cursor-not-allowed select-all"
                      />
                    </div>
                  </div>

                  {/* READ-ONLY: Email công ty */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Email công ty</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                        <Lock className="w-3 h-3" /> Chỉ đọc
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        readOnly
                        value={profile.email}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-xs cursor-not-allowed select-all"
                      />
                    </div>
                  </div>

                  {/* READ-ONLY: Vai trò hệ thống */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Vai trò hệ thống</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                        <Lock className="w-3 h-3" /> Chỉ đọc
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={profile.role}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-xs cursor-not-allowed select-all"
                      />
                    </div>
                  </div>

                  {/* READ-ONLY: Phòng ban */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span>Phòng ban</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-normal">
                        <Lock className="w-3 h-3" /> Chỉ đọc
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={profile.department}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-xs cursor-not-allowed select-all"
                      />
                    </div>
                  </div>

                  {/* EDITABLE: Họ và tên hiển thị */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Họ và tên hiển thị <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.name}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Nhập họ và tên..."
                    />
                  </div>

                  {/* EDITABLE: Số điện thoại liên hệ */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="0912 xxx xxx"
                    />
                  </div>

                  {/* EDITABLE: Giới tính */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Giới tính
                    </label>
                    <select
                      value={profile.gender || "Nam"}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          gender: e.target.value as any,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  {/* EDITABLE: Ngày sinh */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      max={getLocalTodayDateString()}
                      value={profile.dateOfBirth || "1992-06-18"}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          dateOfBirth: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* EDITABLE: Giới thiệu bản thân (Bio) */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ghi chú / Giới thiệu nhiệm vụ công tác
                  </label>
                  <textarea
                    rows={2}
                    value={profile.bio || ""}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Mô tả tóm tắt vai trò công việc hoặc ghi chú liên hệ..."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Footer Tab 1 */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/25 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thông tin</span>
                </button>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------------------------- */}
          {/* TAB 2: BẢO MẬT & ĐỔI MẬT KHẨU (SECURITY) */}
          {/* ----------------------------------------------------------------------- */}
          {activeTab === "security" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {/* Password Status Message */}
              {passwordMessage && (
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium flex items-start gap-2.5 animate-in fade-in ${passwordMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                    }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              {/* Security Banner Card */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-blue-200/80 text-[#4285F4] shrink-0 shadow-xs">
                  <KeyRound className="w-5 h-5 text-[#4285F4]" />
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-800">
                    Chính sách an toàn & Bảo mật tài khoản
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Để đảm bảo an toàn cho dữ liệu tuyển dụng nội bộ, vui lòng đổi mật khẩu định kỳ 90 ngày. Mật khẩu không nên chứa tên hoặc thông tin cá nhân dễ đoán.
                  </p>
                </div>
              </div>

              {/* Form Đổi mật khẩu (Xếp dọc flex-col) */}
              <div className="flex flex-col gap-4">
                {/* Ô 1: Mật khẩu hiện tại */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện đang sử dụng..."
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Ô 2: Mật khẩu mới */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${isNewPasswordTooShort
                        ? "border-amber-400 bg-amber-50/20"
                        : "border-gray-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Gợi ý tiêu chuẩn mật khẩu */}
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 && hasLetterAndNumber
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                        }`}
                    />
                    <span>Mật khẩu tối thiểu 8 ký tự, gồm cả chữ và số.</span>
                  </p>
                </div>

                {/* Ô 3: Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all ${passwordsDoNotMatch
                        ? "border-red-500 ring-1 ring-red-500/20 bg-rose-50/20"
                        : confirmPassword && !passwordsDoNotMatch
                          ? "border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/20"
                          : "border-gray-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Validation Error Text */}
                  {passwordsDoNotMatch && (
                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Mật khẩu xác nhận không khớp với mật khẩu mới.</span>
                    </p>
                  )}

                  {confirmPassword && !passwordsDoNotMatch && (
                    <p className="text-[11px] text-emerald-600 mt-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Mật khẩu xác nhận hoàn toàn trùng khớp.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Tab 2 */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword || passwordsDoNotMatch}
                  className="px-6 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/25 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmittingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL CẮT & CHỈNH SỬA ẢNH ĐẠI DIỆN (AVATAR CROP MODAL) */}
      {/* ========================================================================= */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        imageSrc={selectedRawImage}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedRawImage(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
        onCropSave={handleCropSave}
      />
    </div>
  );
}
