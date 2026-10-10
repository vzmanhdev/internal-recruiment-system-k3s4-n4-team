'use client';

import React, { useState, useEffect } from 'react';
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
  Globe,
  Bell,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Calendar,
  AlertTriangle,
  Camera,
  Laptop,
  Check,
  Info,
  LogOut,
  Upload,
  Clock,
  RefreshCw,
  ChevronRight,
  Users,
  MessageSquare,
  Activity,
  AlertOctagon,
  Image as ImageIcon,
} from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import clsx from 'clsx';

export default function RecruiterProfilePage() {
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'avatar'>('info');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Profile Form state - Mock Data cho Trần Thị Recruiter (NV-REC-05)
  const [profile, setProfile] = useState({
    full_name: 'Trần Thị Recruiter',
    email: 'recruiter@company.com',
    phone: '0934567891',
    dob: '1995-08-20',
    gender: 'Nữ',
    job_title: 'Chuyên viên tuyển dụng cấp cao (Senior Recruiter)',
    employee_code: 'NV-REC-05',
    department: 'Phòng Tuyển Dụng & Thu Hút Nhân Tài',
    joined_date: '10/01/2022',
    last_login: 'Hôm nay, 16:45',
    account_status: 'Hoạt động',
    roles: [
      'Recruiter (Nhân Viên Tuyển Dụng)',
      'Điều Phối Pipeline (Kanban Operator)',
      'Soạn Thảo Đề Xuất Offer',
      'Điều Phối Lịch Phỏng Vấn',
    ],
  });

  // Password Change state
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

  // Toast alert
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const savedAvatar = localStorage.getItem('recruiter_avatar_url');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    } else {
      setAvatarUrl(
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500&auto=format&fit=crop'
      );
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
            employee_code: u.employee_code || prev.employee_code,
          }));
        }
      } catch (err) {
        // Fallback to initial mock data
      }
    };
    fetchUser();
  }, []);

  const handleSaveAvatar = (newUrl: string) => {
    setAvatarUrl(newUrl);
    localStorage.setItem('recruiter_avatar_url', newUrl);
    setIsAvatarModalOpen(false);
    showToast('Cập nhật ảnh đại diện thành công!');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Lưu thông tin hồ sơ cá nhân thành công!');
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score, label: 'Yếu', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score <= 50) return { score, label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score <= 75) return { score, label: 'Khá mạnh', color: 'bg-blue-500', text: 'text-blue-600' };
    return { score, label: 'Rất mạnh', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError('Vui lòng điền đầy đủ tất cả các trường mật khẩu.');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError('Mật khẩu mới và mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordSuccess('Đổi mật khẩu tài khoản thành công!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      showToast('Đổi mật khẩu tài khoản thành công!');
    }, 700);
  };

  const strengthInfo = getPasswordStrength(passwordForm.new_password);

  return (
    <div className="space-y-6">
      {/* Interactive Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={avatarUrl}
        onSaveAvatar={handleSaveAvatar}
        userName={profile.full_name}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200',
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          )}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-blue-600" />
            <span>Hồ Sơ Cá Nhân Recruiter</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý thông tin định danh chuyên viên, phân quyền tuyển dụng và thiết lập bảo mật.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span>Trang chủ</span>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Hồ sơ cá nhân</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-COLUMN MAIN GRID LAYOUT: grid-cols-1 xl:grid-cols-4 gap-6              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* ===================================================================== */}
        {/* CỘT 1 (BÊN TRÁI - CHIẾM 1/4 GRID): KHỐI AVATAR & THÔNG TIN CƠ BẢN      */}
        {/* ===================================================================== */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 text-center space-y-5">
            {/* Avatar tròn to kèm icon Camera ở góc dưới phải */}
            <div className="relative inline-block mx-auto group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile.full_name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-50 shadow-md ring-2 ring-blue-100"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-4xl flex items-center justify-center border-4 border-blue-50 shadow-md">
                  {profile.full_name.charAt(0)}
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

            {/* Tên Recruiter & 2 Badges */}
            <div className="space-y-1.5">
              <h2 className="text-lg font-black text-slate-900">{profile.full_name}</h2>
              <p className="text-xs text-slate-400 font-medium">{profile.email}</p>

              <div className="pt-2 flex flex-col items-center gap-1.5">
                {/* Badge 1: Vai trò (Recruiter - màu xanh tím) */}
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold">
                  Recruiter (Nhân viên tuyển dụng)
                </span>

                {/* Badge 2: Trạng thái (Đang hoạt động - màu xanh lá) */}
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang hoạt động
                </span>
              </div>
            </div>

            {/* Danh sách thông tin dạng dòng có icon */}
            <div className="border-t border-slate-100 pt-4 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  Mã nhân viên
                </span>
                <span className="font-bold text-slate-800 font-mono">{profile.employee_code}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  Phòng ban
                </span>
                <span className="font-bold text-slate-800 text-[11px]">{profile.department}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Chức danh
                </span>
                <span className="font-bold text-slate-800 text-[11px] truncate max-w-[140px] text-right">
                  Chuyên viên tuyển dụng
                </span>
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

            {/* Khung nổi bật dưới cùng: Tài khoản đã xác thực (Bảo mật 2 lớp) */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between text-left cursor-pointer hover:bg-blue-100/70 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
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

        {/* ===================================================================== */}
        {/* CỘT 2 (Ở GIỮA - CHIẾM 2/4 GRID): VÙNG FORM & TABS                     */}
        {/* ===================================================================== */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-6">
            
            {/* Tabs Navigation (Chữ xanh, viền dưới xanh khi Active) */}
            <div className="flex items-center gap-6 border-b border-slate-100 pb-px">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={clsx(
                  'pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer',
                  activeTab === 'info'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <UserIcon className="w-4 h-4" />
                <span>Thông tin cá nhân</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={clsx(
                  'pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer',
                  activeTab === 'password'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <Lock className="w-4 h-4" />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className={clsx(
                  'pb-3 text-xs font-extrabold transition-all border-b-2 flex items-center gap-2 cursor-pointer',
                  activeTab === 'avatar'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Ảnh đại diện</span>
              </button>
            </div>

            {/* TAB 1: THÔNG TIN CÁ NHÂN */}
            {activeTab === 'info' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
                {/* 1. KHỐI FORM: THÔNG TIN CƠ BẢN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Thông tin cơ bản</h3>
                      <p className="text-[11px] text-slate-400">
                        Cập nhật thông tin chuyên viên tuyển dụng trên hệ thống nội bộ
                      </p>
                    </div>
                  </div>

                  {/* 2 Cột Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        required
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
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
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        🔒 Email doanh nghiệp cố định do Quản trị viên cấp
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Số điện thoại *</label>
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        value={profile.dob}
                        onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
                      <select
                        value={profile.gender}
                        onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      >
                        <option value="Nữ">Nữ</option>
                        <option value="Nam">Nam</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Chức danh hiển thị</label>
                      <input
                        type="text"
                        value={profile.job_title}
                        onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. KHỐI FORM: THÔNG TIN TỔ CHỨC */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Thông tin tổ chức</h3>
                      <p className="text-[11px] text-slate-400">
                        Thông tin phòng ban phụ trách và mã định danh nhân viên
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phòng ban</label>
                      <select
                        value={profile.department}
                        onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      >
                        <option value="Phòng Tuyển Dụng & Thu Hút Nhân Tài">🏢 Phòng Tuyển Dụng & Thu Hút Nhân Tài</option>
                        <option value="Khối Công Nghệ & Phần Mềm">🏢 Khối Công Nghệ & Phần Mềm</option>
                        <option value="Phòng Phát Triển Sản Phẩm (Product)">🏢 Phòng Phát Triển Sản Phẩm (Product)</option>
                        <option value="Phòng Quản Trị Nhân Sự Tổng Hợp">🏢 Phòng Quản Trị Nhân Sự Tổng Hợp</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mã nhân viên</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={profile.employee_code}
                          className="w-full pl-3.5 pr-9 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-slate-700 cursor-not-allowed"
                        />
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                      </div>
                    </div>
                  </div>

                  {/* Mục "Vai trò hiện tại" dạng danh sách các Badges */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Vai trò hiện tại trong hệ thống
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-extrabold">
                        Recruiter (Nhân Viên Tuyển Dụng)
                      </span>
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                        Điều Phối Pipeline (Kanban Operator)
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        Soạn Thảo Đề Xuất Offer
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        Đặt Lịch Phỏng Vấn (Scheduler)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                  >
                    Lưu Thay Đổi Hồ Sơ
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ĐỔI MẬT KHẨU */}
            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-medium">
                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật khẩu hiện tại *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                      placeholder="••••••••"
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
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, new_password: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                      placeholder="Ít nhất 8 ký tự..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Thanh độ mạnh mật khẩu */}
                  {passwordForm.new_password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Độ mạnh mật khẩu:</span>
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
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
                  >
                    {isChangingPassword ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CỘT 3 (BÊN PHẢI - CHIẾM 1/4 GRID): KHỐI THỐNG KÊ & BẢO MẬT           */}
        {/* ===================================================================== */}
        <div className="xl:col-span-1 space-y-6">

          {/* WIDGET 1: KHỐI THỐNG KÊ TÀI KHOẢN (GRID 2x2 Ô VUÔNG MÀU PASTEL) */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Thống kê tài khoản</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Stat 1: Tổng số lần đăng nhập (Xanh nhạt pastel) */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-col justify-between">
                <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">34</div>
                  <div className="text-[10px] text-slate-500 font-medium">Tổng số lần đăng nhập</div>
                </div>
              </div>

              {/* Stat 2: Phiên đăng nhập hoạt động (Xanh ngọc pastel) */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
                <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">2</div>
                  <div className="text-[10px] text-slate-500 font-medium">Phiên đăng nhập hoạt động</div>
                </div>
              </div>

              {/* Stat 3: Hoạt động trong hệ thống (Tím pastel) */}
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col justify-between">
                <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-2">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">218</div>
                  <div className="text-[10px] text-slate-500 font-medium">Hoạt động trong hệ thống</div>
                </div>
              </div>

              {/* Stat 4: Lần đăng nhập thất bại (Đỏ nhạt pastel) */}
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

          {/* WIDGET 2: KHỐI PHIÊN ĐĂNG NHẬP HIỆN TẠI */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-600" />
                <span>Phiên đăng nhập hiện tại</span>
              </h3>
              <button
                type="button"
                onClick={() => showToast('Đã làm mới danh sách phiên đăng nhập!')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Thiết bị 1: Windows • Chrome */}
              <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span className="font-extrabold text-slate-900">Windows &bull; Chrome</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                    Thiết bị hiện tại
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono font-medium pl-6">
                  192.168.1.105
                </div>
                <div className="flex items-center justify-between text-[10px] pl-6">
                  <span className="text-slate-400">📍 Hà Nội, Việt Nam</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đang hoạt động
                  </span>
                </div>
              </div>

              {/* Thiết bị 2: MacBook Air • Safari */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-slate-400" />
                    <span className="font-extrabold text-slate-700">MacBook Air &bull; Safari</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">macOS 14.3</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono pl-6">113.190.45.12</div>
                <div className="flex items-center justify-between text-[10px] pl-6 text-slate-400">
                  <span>📍 Hà Nội, Việt Nam</span>
                  <span>Hoạt động 3 giờ trước</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
