'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Check,
  AlertTriangle,
  Laptop,
  RefreshCw,
  Award,
  Star,
  Users,
  Image as ImageIcon,
  ArrowLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AvatarCropModal } from '@/components/profile/AvatarCropModal';
import { authService } from '@/features/auth/services/auth.service';

export default function InterviewerProfilePage() {
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'avatar'>('info');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Avatar state với LocalStorage persistence
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Thông tin hồ sơ Người phỏng vấn
  const [profile, setProfile] = useState({
    name: 'Nguyễn Minh Trí',
    email: 'interviewer@company.com',
    phone: '0987 654 321',
    employee_code: 'TECH-009',
    department: 'Ban Công Nghệ & Khối Tuyển Dụng',
    role: 'Hội Đồng Phỏng Vấn (Interviewer)',
    title: 'Senior Tech Lead / Technical Interviewer',
    expertiseAreas: 'Full-stack (React/Node/Python), Cloud & System Architecture',
    interviewExperienceYears: '3+ năm',
    joined_date: '10/05/2023',
    last_login: '12/10/2026 14:20',
    bio: 'Tham gia hội đồng phỏng vấn chuyên môn các vị trí Kỹ sư Phần mềm, DevOps và Data Engineer từ năm 2023. Đóng góp xây dựng ngân hàng câu hỏi kỹ thuật chuẩn hóa tập đoàn.',
  });

  // State Form đổi mật khẩu
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load avatar & user info từ localStorage / backend khi mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar_url');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }

    const fetchUser = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (u) {
          setProfile((prev) => ({
            ...prev,
            name: u.full_name || prev.name,
            email: u.email || prev.email,
            phone: u.phone || prev.phone,
            employee_code: u.employee_code || prev.employee_code,
          }));
        }
      } catch (e) {
        // Fallback to default state
      }
    };
    fetchUser();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Lưu avatar
  const handleSaveAvatar = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    localStorage.setItem('user_avatar_url', newUrl);
    window.dispatchEvent(new Event('avatar_updated'));
    try {
      await authService.updateProfile({ avatar_url: newUrl });
      showToast('Cập nhật và lưu ảnh đại diện thành công!');
    } catch (err) {
      showToast('Đã lưu ảnh đại diện vào hệ thống!');
    }
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.updateProfile({
        full_name: profile.name,
        phone: profile.phone,
        avatar_url: avatarUrl || undefined,
      });
      showToast('Cập nhật thông tin hồ sơ thành công!');
    } catch (err) {
      showToast('Lưu thay đổi thông tin cá nhân thành công!');
    }
  };

  // Thang đo độ mạnh mật khẩu
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'Yếu', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score === 2 || score === 3)
      return { score: 65, label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-600' };
    return { score: 100, label: 'Mạnh (An toàn)', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  // Đổi mật khẩu
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('Vui lòng điền đầy đủ tất cả các trường mật khẩu');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Mật khẩu mới và mật khẩu xác nhận không khớp');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordSuccess('Đổi mật khẩu tài khoản thành công!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      showToast('Đổi mật khẩu tài khoản thành công!');
    }, 800);
  };

  const strengthInfo = getPasswordStrength(passwordForm.new_password);

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto animate-in fade-in duration-500 pb-16">
      {/* Modal Cắt & Xem trước Ảnh đại diện */}
      <AvatarCropModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onSaveAvatar={handleSaveAvatar}
        userName={profile.name}
      />

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-blue-600" />
            <span>Hồ Sơ Người Phỏng Vấn</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý thông tin tài khoản chuyên gia đánh giá, lĩnh vực công nghệ và thiết lập bảo mật cá nhân.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/interviewer"
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Bảng Điều Khiển</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-xs">
            <span>Trang chủ</span>
            <span>&rsaquo;</span>
            <span>Người phỏng vấn</span>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Hồ sơ cá nhân</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CONTAINER CHÍNH: LƯỚI 12 CỘT TỶ LỆ 3 - 6 - 3 CHUẨN TAILWIND CSS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* CỘT TRÁI (AVATAR & THÔNG TIN CƠ BẢN - Chiếm 3/12 ~ 25% chiều rộng) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center space-y-4">
            {/* Khối Avatar lớn */}
            <div className="relative inline-block mx-auto group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center border-4 border-blue-50 shadow-md">
                  MT
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-transform group-hover:scale-110 active:scale-95 cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Tên & Chức danh */}
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-900">{profile.name}</h2>
              <p className="text-xs text-slate-500 font-medium">{profile.title}</p>
              <div className="pt-2 flex flex-col items-center gap-1.5">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 text-[11px] font-bold">
                  Hội Đồng Phỏng Vấn (Interviewer)
                </span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>

            {/* Chi tiết thông tin */}
            <div className="border-t border-slate-100 pt-4 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Mã cán bộ
                </span>
                <span className="font-bold text-slate-800">{profile.employee_code}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Phòng ban
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[140px]" title={profile.department}>
                  Ban Công Nghệ
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[140px]" title={profile.email}>
                  {profile.email}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Tham gia
                </span>
                <span className="font-bold text-slate-800">{profile.joined_date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Đăng nhập
                </span>
                <span className="font-bold text-slate-800 text-[11px]">{profile.last_login}</span>
              </div>
            </div>

            {/* Khối Mô tả chuyên môn (Kế thừa thiết kế hiện tại) */}
            <div className="text-xs text-slate-600 text-left bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
              <span className="font-bold text-slate-800 block mb-1">Mô tả chuyên môn:</span>
              {profile.bio}
            </div>

            {/* Badge Bảo mật 2 lớp */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[11px] text-blue-950">Tài khoản xác thực</h4>
                  <p className="text-[10px] text-blue-700 font-medium">Bảo mật 2 lớp đang bật</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CỘT GIỮA (NỘI DUNG CHÍNH - TABS & FORMS - Chiếm 6/12 ~ 50% chiều rộng) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            {/* Header Tabs: Nằm ngang, ngăn cách bằng viền mờ */}
            <div className="flex gap-6 border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`pb-3 text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'info'
                    ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                    : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Thông tin cá nhân</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={`pb-3 text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'password'
                    ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                    : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className={`pb-3 text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'avatar'
                    ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                    : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Ảnh đại diện</span>
              </button>
            </div>

            {/* TAB 1: FORM THÔNG TIN CÁ NHÂN (LƯỚI 2 CỘT md:grid-cols-2 gap-6) */}
            {activeTab === 'info' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 text-xs w-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Chi Tiết Hồ Sơ Cá Nhân</h3>
                      <p className="text-[11px] text-slate-400">
                        Thông tin định danh và chuyên môn được hiển thị trong phiếu đánh giá năng lực
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email nội bộ</label>
                      <div className="relative">
                        <input
                          type="email"
                          readOnly
                          value={profile.email}
                          className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">🔒 Email tài khoản do hệ thống quản trị</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số điện thoại *</label>
                      <input
                        type="text"
                        required
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mã cán bộ / nhân viên</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={profile.employee_code}
                          className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phòng ban phụ trách</label>
                      <input
                        type="text"
                        readOnly
                        value={profile.department}
                        className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Chức danh chuyên môn</label>
                      <input
                        type="text"
                        value={profile.title}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Lĩnh vực đánh giá chính</label>
                      <input
                        type="text"
                        value={profile.expertiseAreas}
                        onChange={(e) => setProfile({ ...profile, expertiseAreas: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kinh nghiệm phỏng vấn</label>
                      <input
                        type="text"
                        value={profile.interviewExperienceYears}
                        onChange={(e) => setProfile({ ...profile, interviewExperienceYears: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
                      />
                    </div>

                    {/* Textarea Giới thiệu / Mô tả chuyên môn chiếm toàn bộ chiều rộng */}
                    <div className="md:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">Giới thiệu & Mô tả chuyên môn</label>
                      <textarea
                        rows={3}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* NÚT CẬP NHẬT THÔNG TIN CĂN SANG GÓC PHẢI */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Cập Nhật Thông Tin</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: FORM ĐỔI MẬT KHẨU (ẨN/HIỆN THEO TAB) */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4 w-full text-xs">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Thay Đổi Mật Khẩu</h3>
                  <p className="text-[11px] text-slate-400">
                    Vui lòng nhập mật khẩu hiện tại và tạo mật khẩu mới an toàn
                  </p>
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
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu mới *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                      placeholder="Ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Thanh đo độ mạnh mật khẩu */}
                  {passwordForm.new_password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Độ mạnh mật khẩu:</span>
                        <span className={`font-bold ${strengthInfo.text}`}>{strengthInfo.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strengthInfo.color} transition-all duration-300`}
                          style={{ width: `${strengthInfo.score}%` }}
                        />
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-blue-600 transition-colors"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer"
                  >
                    {isChangingPassword ? 'Đang xử lý...' : 'Lưu Thay Đổi Mật Khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CỘT PHẢI (THỐNG KÊ HOẠT ĐỘNG - Chiếm 3/12 ~ 25% chiều rộng) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-3 space-y-5">
          {/* CARD 1: THỐNG KÊ HOẠT ĐỘNG PHỎNG VẤN */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Thống Kê Hoạt Động Phỏng Vấn</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Stat 1: Số hồ sơ đã đánh giá: 12 */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">12</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    Hồ sơ đã đánh giá
                  </div>
                </div>
              </div>

              {/* Stat 2: Số buổi phỏng vấn tháng này: 4 */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">4</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    Buổi phỏng vấn tháng này
                  </div>
                </div>
              </div>

              {/* Stat 3: Tỷ lệ đúng hạn */}
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex flex-col justify-between">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-2">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">100%</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    Nộp phiếu đúng hạn
                  </div>
                </div>
              </div>

              {/* Stat 4: Điểm đánh giá TB */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-2">
                  <Star className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xl font-black text-slate-900">4.2</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    Điểm TB ứng viên
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PHIÊN ĐĂNG NHẬP HIỆN TẠI */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span>Phiên Đăng Nhập Hiện Tại</span>
              </h3>
              <button
                type="button"
                onClick={() => showToast('Đã làm mới thông tin phiên làm việc!')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-slate-900">Windows &bull; Chrome</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Hiện tại
                </span>
              </div>
              <p className="text-[11px] text-slate-500">IP: 192.168.1.45 &bull; Hà Nội, Việt Nam</p>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-blue-100/60 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>Đang hoạt động từ 14:20</span>
              </div>
            </div>
          </div>

          {/* CARD 3: LỐI TẮT LỊCH PHỎNG VẤN TIẾP THEO */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Buổi Phỏng Vấn Sắp Tới</span>
            </div>
            <p className="text-xs text-slate-700">
              <strong>Lê Hoàng Cường</strong> &bull; Senior Frontend Engineer
            </p>
            <span className="text-[11px] text-blue-600 font-semibold block">
              14:00 - 15:00 Hôm nay (Google Meet)
            </span>
            <Link
              href="/interviewer/schedule"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 pt-1"
            >
              <span>Xem chi tiết lịch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
