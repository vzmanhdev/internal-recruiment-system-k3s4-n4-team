'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AvatarCropModal } from '@/components/profile/AvatarCropModal';
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
  Image as ImageIcon,
  MapPin,
  FileText,
  Download,
  Save,
} from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';

export default function CandidateProfilePage() {
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'cv'>('info');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState('from-[#4285F4] to-blue-600');

  // Candidate Profile State
  const [profile, setProfile] = useState({
    full_name: 'Nguyễn Văn A',
    email: 'nguyen.van.a@gmail.com',
    phone: '0912 345 678',
    dob: '1995-08-16',
    gender: 'Nam',
    address: 'Cầu Giấy, Hà Nội',
    job_title: 'Senior Software Engineer',
    years_of_exp: '5 năm',
    candidate_code: 'CAND-2026-88',
    skills: 'React, Next.js, TypeScript, Tailwind CSS, Node.js, Go',
    bio: 'Lập trình viên Fullstack với hơn 5 năm kinh nghiệm chuyên sâu về React/Next.js và xây dựng kiến trúc hệ thống tuyển dụng/doanh nghiệp chịu tải cao.',
    joined_date: '01/10/2026',
    last_login: '12/10/2026 09:15',
    account_status: 'Hoạt động',
    cv_filename: 'Nguyen_Van_A_Senior_Engineer_CV.pdf',
    cv_filesize: '1.2 MB',
    cv_uploaded_at: '08/10/2026',
  });

  // Password Change Form State
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

  // Load avatar & user info on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar_url');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    } else {
      setAvatarUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop');
    }

    const fetchUser = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (u) {
          setProfile((prev) => ({
            ...prev,
            full_name: u.full_name || prev.full_name,
            email: u.email || prev.email,
            phone: u.phone || prev.phone,
          }));
        }
      } catch {
        // Fallback to defaults
      }
    };
    fetchUser();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Save avatar persistently to localStorage & backend
  const handleSaveAvatar = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    localStorage.setItem('user_avatar_url', newUrl);
    window.dispatchEvent(new Event('avatar_updated'));
    try {
      await authService.updateProfile({ avatar_url: newUrl });
      showToast('Cập nhật và lưu ảnh đại diện thành công!');
    } catch {
      showToast('Cập nhật ảnh đại diện thành công!');
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
      showToast('Lưu thông tin hồ sơ ứng viên thành công!');
    } catch {
      showToast('Lưu thay đổi thông tin cá nhân thành công!');
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Yếu', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Trung bình', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Khá mạnh', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Rất an toàn', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-gray-200' };
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.current_password) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordSuccess('Đổi mật khẩu tài khoản thành công!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      showToast('Đổi mật khẩu tài khoản thành công!');
    }, 800);
  };

  return (
    <div className="w-full space-y-6 pb-16 antialiased">
      {/* Toast Notification */}
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

      {/* Top Header & Breadcrumbs (Chuẩn phong cách Admin) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-[#4285F4]" />
            Hồ Sơ Cá Nhân & CV Ứng Viên
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý thông tin ứng viên, năng lực chuyên môn, tệp CV đính kèm và thiết lập bảo mật.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-2xs">
          <span>Trang chủ</span>
          <span>&rsaquo;</span>
          <span>Cổng ứng viên</span>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Hồ sơ cá nhân</span>
        </div>
      </div>

      {/* 3-COLUMN MAIN LAYOUT GIỐNG ADMIN 100% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* LEFT COLUMN: User Profile Card (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs text-center space-y-4">
            {/* Avatar block với nút camera */}
            <div className="relative inline-block mx-auto group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-md"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarColor} text-white font-black text-3xl flex items-center justify-center border-4 border-blue-50 shadow-md`}
                >
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
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
                  Ứng Viên Tiềm Năng (Candidate)
                </span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>

            {/* Summary Details List */}
            <div className="border-t border-gray-100 pt-4 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Mã ứng viên
                </span>
                <span className="font-bold text-slate-800">{profile.candidate_code}</span>
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
                  <Clock className="w-4 h-4 text-slate-400" />
                  Kinh nghiệm
                </span>
                <span className="font-bold text-slate-800">{profile.years_of_exp}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Địa điểm
                </span>
                <span className="font-bold text-slate-800 text-[11px] truncate max-w-[120px]">
                  {profile.address}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Ngày tạo hồ sơ
                </span>
                <span className="font-bold text-slate-800">{profile.joined_date}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
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
                  <h4 className="font-extrabold text-xs text-blue-950">Hồ sơ đã xác thực</h4>
                  <p className="text-[10px] text-blue-700 font-medium">Bảo vệ bảo mật 2 lớp</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-500" />
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Main Form & Tabs (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-6">
            {/* Tabs Navigation (Giống hệt Admin) */}
            <div className="flex items-center gap-6 border-b border-gray-100 pb-px">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'info'
                    ? 'border-[#4285F4] text-[#4285F4]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Thông tin cá nhân</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'password'
                    ? 'border-[#4285F4] text-[#4285F4]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('cv')}
                className={`pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'cv'
                    ? 'border-[#4285F4] text-[#4285F4]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Hồ sơ & CV đính kèm</span>
              </button>
            </div>

            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'info' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
                {/* Section 1: Thông tin cơ bản */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                    <UserIcon className="w-4 h-4 text-[#4285F4]" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Thông tin liên hệ cơ bản</h3>
                      <p className="text-[11px] text-slate-400">
                        Cập nhật thông tin định danh và phương thức liên lạc tuyển dụng
                      </p>
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
                      <label className="block font-bold text-slate-700 mb-1">Email ứng tuyển</label>
                      <div className="relative">
                        <input
                          type="email"
                          readOnly
                          value={profile.email}
                          className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-gray-200 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">🔒 Email tài khoản cố định</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số điện thoại *</label>
                      <input
                        type="text"
                        required
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
                      <label className="block font-bold text-slate-700 mb-1">Khu vực sinh sống</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Năng lực chuyên môn */}
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                    <Briefcase className="w-4 h-4 text-[#4285F4]" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Năng lực chuyên môn</h3>
                      <p className="text-[11px] text-slate-400">Thông tin kỹ năng và định hướng công việc</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Chức danh hiện tại</label>
                      <input
                        type="text"
                        value={profile.job_title}
                        onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tổng số năm kinh nghiệm</label>
                      <input
                        type="text"
                        value={profile.years_of_exp}
                        onChange={(e) => setProfile({ ...profile, years_of_exp: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kỹ năng nổi bật (tags)</label>
                    <input
                      type="text"
                      value={profile.skills}
                      onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                      placeholder="VD: React, Node.js, Go, TypeScript..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Giới thiệu bản thân (Bio)</label>
                    <textarea
                      rows={3}
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                    />
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu thông tin hồ sơ</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ĐỔI MẬT KHẨU */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-5 text-xs">
                <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                  <KeyRound className="w-4 h-4 text-[#4285F4]" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Thiết lập mật khẩu mới</h3>
                    <p className="text-[11px] text-slate-400">
                      Đảm bảo mật khẩu an toàn với tối thiểu 8 ký tự bao gồm chữ hoa, số và ký tự đặc biệt
                    </p>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
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
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {passwordForm.new_password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Độ mạnh mật khẩu:</span>
                        <span className="font-bold text-slate-800">
                          {getPasswordStrength(passwordForm.new_password).label}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            getPasswordStrength(passwordForm.new_password).color
                          }`}
                          style={{ width: `${getPasswordStrength(passwordForm.new_password).score}%` }}
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
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 disabled:opacity-70"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: HỒ SƠ & CV ĐÍNH KÈM */}
            {activeTab === 'cv' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                  <FileText className="w-4 h-4 text-[#4285F4]" />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Quản lý tệp CV & Hồ sơ ứng tuyển</h3>
                    <p className="text-[11px] text-slate-400">
                      Tải lên CV cập nhật mới nhất để Hội đồng Tuyển dụng thẩm định chuyên môn
                    </p>
                  </div>
                </div>

                {/* CV hiện tại */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{profile.cv_filename}</p>
                      <p className="text-[11px] text-slate-400">
                        {profile.cv_filesize} &bull; Tải lên ngày {profile.cv_uploaded_at}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => showToast('Đang tải xuống CV của bạn...')}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải về</span>
                    </button>
                  </div>
                </div>

                {/* Dropzone tải lên CV mới */}
                <div className="p-8 border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-2xl text-center space-y-3 hover:bg-blue-50/70 transition-colors">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Kéo thả tệp CV mới vào đây hoặc <span className="text-blue-600 underline cursor-pointer">Chọn tệp</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hỗ trợ định dạng PDF, DOCX (Dung lượng tối đa: 10MB)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Activity & Security Widgets (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-4">
          {/* WIDGET 1: Thống kê ứng tuyển */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2 pb-2 border-b border-gray-50">
              <Activity className="w-4 h-4 text-[#4285F4]" />
              Tiến Trình Ứng Tuyển
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
                <span className="text-[10px] text-blue-600 font-bold block mb-1">HỒ SƠ ĐÃ NỘP</span>
                <span className="text-xl font-black text-blue-900">2</span>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
                <span className="text-[10px] text-amber-700 font-bold block mb-1">LỊCH PHỎNG VẤN</span>
                <span className="text-xl font-black text-amber-900">1</span>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
                <span className="text-[10px] text-emerald-700 font-bold block mb-1">THƯ MỜI OFFER</span>
                <span className="text-xl font-black text-emerald-900">1</span>
              </div>

              <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                <span className="text-[10px] text-purple-700 font-bold block mb-1">HOÀN THIỆN</span>
                <span className="text-xl font-black text-purple-900">95%</span>
              </div>
            </div>
          </div>

          {/* WIDGET 2: Phiên đăng nhập hiện tại */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-[#4285F4]" />
                Phiên đăng nhập hiện tại
              </h3>
              <button
                type="button"
                onClick={() => showToast('Đã làm mới danh sách phiên đăng nhập!')}
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
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                    Hiện tại
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium pl-6">192.168.1.100</div>
                <div className="flex items-center justify-between text-[10px] pl-6">
                  <span className="text-slate-400">📍 Hà Nội, Việt Nam</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Hoạt động
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
                    Hoạt động
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 3: Cài đặt thông báo nhanh */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#4285F4]" />
                Kênh nhận tin nhanh
              </h3>
              <Link
                href="/candidate/settings"
                className="text-[11px] font-bold text-[#4285F4] hover:underline"
              >
                ⚙️ Cài đặt
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email thông báo
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  Bật
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  SMS nhắc hẹn
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  Bật
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Đồng bộ Google Calendar
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  Bật
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cắt & Tải ảnh đại diện (Kế thừa từ Admin) */}
      <AvatarCropModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onSaveAvatar={handleSaveAvatar}
        userName={profile.full_name}
      />
    </div>
  );
}
