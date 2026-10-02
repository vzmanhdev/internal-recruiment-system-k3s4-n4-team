"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  ShieldCheck,
  FileText,
  Settings,
  UserPlus,
  FileSpreadsheet,
  Search,
  Edit3,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  UploadCloud,
  Download,
  LogOut,
  Building,
  Mail,
  Shield,
  Laptop,
  Camera,
  User as UserIcon,
  Phone,
  Briefcase
} from "lucide-react";
import { UserProfileModal } from "@/components/UserProfileModal";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { CroppedAvatarResult } from "@/lib/cropImage";

// Types
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  role: "Admin" | "HR Manager" | "Recruiter" | "Interviewer" | "Employee";
  department: string;
  status: "Active" | "Locked";
  lastLogin: string;
  createdAt: string;
}

// Initial mock data
const INITIAL_USERS: UserAccount[] = [
  {
    id: "USR-001",
    name: "Admin System",
    email: "admin@company.com",
    avatarColor: "bg-[#4285F4]",
    role: "Admin",
    department: "Ban Công Nghệ & Quản Trị Hệ Thống",
    status: "Active",
    lastLogin: "Vừa xong",
    createdAt: "01/01/2026",
  },
  {
    id: "USR-002",
    name: "Nguyễn Thị Thu Hà",
    email: "ha.nguyen@company.com",
    avatarColor: "bg-purple-500",
    role: "HR Manager",
    department: "Phòng Nhân Sự & Văn Hóa",
    status: "Active",
    lastLogin: "10 phút trước",
    createdAt: "12/01/2026",
  },
  {
    id: "USR-003",
    name: "Trần Minh Quân",
    email: "quan.tran@company.com",
    avatarColor: "bg-emerald-500",
    role: "Recruiter",
    department: "Khối Thu Hút Nhân Tài (TA)",
    status: "Active",
    lastLogin: "1 giờ trước",
    createdAt: "15/01/2026",
  },
  {
    id: "USR-004",
    name: "Lê Hoàng Long",
    email: "long.le@company.com",
    avatarColor: "bg-amber-500",
    role: "Interviewer",
    department: "Phòng Phát Triển Phần Mềm (Software)",
    status: "Active",
    lastLogin: "Hôm qua, 16:45",
    createdAt: "20/01/2026",
  },
  {
    id: "USR-005",
    name: "Phạm Đức Minh",
    email: "minh.pham@company.com",
    avatarColor: "bg-rose-500",
    role: "Employee",
    department: "Phòng Kinh Doanh & Dịch Vụ",
    status: "Locked",
    lastLogin: "20 ngày trước",
    createdAt: "05/02/2026",
  },
  {
    id: "USR-006",
    name: "Hoàng Mai Chi",
    email: "chi.hoang@company.com",
    avatarColor: "bg-indigo-500",
    role: "Recruiter",
    department: "Khối Thu Hút Nhân Tài (TA)",
    status: "Active",
    lastLogin: "3 giờ trước",
    createdAt: "10/02/2026",
  },
  {
    id: "USR-007",
    name: "Đặng Tiến Dũng",
    email: "dung.dang@company.com",
    avatarColor: "bg-teal-500",
    role: "Interviewer",
    department: "Phòng Thiết Kế Trải Nghiệm (UI/UX)",
    status: "Active",
    lastLogin: "2 ngày trước",
    createdAt: "14/02/2026",
  },
  {
    id: "USR-008",
    name: "Vũ Khánh Linh",
    email: "linh.vu@company.com",
    avatarColor: "bg-slate-500",
    role: "Employee",
    department: "Phòng Tài Chính - Kế Toán",
    status: "Locked",
    lastLogin: "45 ngày trước",
    createdAt: "22/02/2026",
  },
];

// Initial audit logs mock data
const INITIAL_AUDIT_LOGS = [
  {
    id: "log-1",
    user: "Admin System",
    action: "Mở khóa tài khoản nhân sự USR-005 (Phạm Đức Minh)",
    time: "10 phút trước",
    ip: "192.168.1.105",
    icon: Unlock,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "log-2",
    user: "Nguyễn Thị Thu Hà",
    action: "Tạo mới tin tuyển dụng: Senior DevOps Engineer",
    time: "45 phút trước",
    ip: "192.168.1.88",
    icon: FileText,
    color: "text-[#4285F4] bg-blue-50",
  },
  {
    id: "log-3",
    user: "Admin System",
    action: "Cập nhật quyền hạn cho nhóm Recruiter",
    time: "2 giờ trước",
    ip: "192.168.1.105",
    icon: ShieldCheck,
    color: "text-purple-600 bg-purple-50",
  },
  {
    id: "log-4",
    user: "Hệ thống bảo mật",
    action: "Phát hiện đăng nhập sai mật khẩu 5 lần từ tài khoản Vũ Khánh Linh",
    time: "Hôm qua, 22:15",
    ip: "14.232.180.20",
    icon: AlertTriangle,
    color: "text-rose-600 bg-rose-50",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  // Navigation State
  const [activeMenu, setActiveMenu] = useState<"users" | "roles" | "logs" | "settings">("users");

  // User Accounts State
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Profile & Dropdown State
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<"profile" | "security">("profile");
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const [adminProfile, setAdminProfile] = useState({
    name: "Admin System",
    email: "admin@company.com",
    phone: "0987 654 321",
    role: "Quản trị viên cấp cao (System Administrator)",
    department: "Ban Công Nghệ & Quản Trị Hệ Thống",
    avatarUrl: "",
    bio: "Chịu trách nhiệm bảo mật, phân quyền và điều phối hệ thống tuyển dụng nội bộ toàn diện.",
  });

  const [editProfileForm, setEditProfileForm] = useState({
    name: "Admin System",
    phone: "0987 654 321",
    department: "Ban Công Nghệ & Quản Trị Hệ Thống",
    bio: "Chịu trách nhiệm bảo mật, phân quyền và điều phối hệ thống tuyển dụng nội bộ toàn diện.",
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedRawAvatar, setSelectedRawAvatar] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);

  // Đồng bộ thông tin quản trị viên đăng nhập từ session/localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) {
          setAdminProfile((prev) => ({
            ...prev,
            email: parsed.email,
            name: parsed.full_name || prev.name,
          }));
          setEditProfileForm((prev) => ({
            ...prev,
            name: parsed.full_name || prev.name,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Modals State for User Management
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Lock Account Modal State
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockTargetUser, setLockTargetUser] = useState<UserAccount | null>(null);
  const [lockReason, setLockReason] = useState("");

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Recruiter" as UserAccount["role"],
    department: "Khối Thu Hút Nhân Tài (TA)",
    password: "company123",
  });

  // Permissions Mock State for selected user
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({
    view_jobs: true,
    create_jobs: true,
    approve_jobs: false,
    view_candidates: true,
    interview_candidates: true,
    export_reports: false,
    manage_system: false,
  });

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Avatar Upload Handler: Đọc file và mở Modal Crop
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Vui lòng chọn file hình ảnh hợp lệ!");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedRawAvatar(event.target?.result as string);
        setIsAvatarCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarCropComplete = (result: CroppedAvatarResult) => {
    setAdminProfile((prev) => ({
      ...prev,
      avatarUrl: result.avatarUrl,
    }));
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    showToast("Đã cắt và cập nhật ảnh đại diện Quản trị viên chuẩn thành công!");
  };

  // Logout Handler
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("internal-recruitment-session");
    }
    showToast("Đã đăng xuất thành công khỏi hệ thống!");
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  // Save Edit Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminProfile((prev) => ({
      ...prev,
      name: editProfileForm.name,
      phone: editProfileForm.phone,
      department: editProfileForm.department,
      bio: editProfileForm.bio,
    }));
    setIsEditProfileModalOpen(false);
    showToast("Đã cập nhật thông tin hồ sơ cá nhân thành công!");
  };

  // Stats Calculations
  const totalAccounts = users.length;
  const activeAccounts = users.filter((u) => u.status === "Active").length;
  const lockedAccounts = users.filter((u) => u.status === "Locked").length;

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = selectedRole === "ALL" || user.role === selectedRole;
      const matchStatus = selectedStatus === "ALL" || user.status === selectedStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

  // Actions
  const handleOpenLockModal = (user: UserAccount) => {
    setLockTargetUser(user);
    setLockReason("");
    setIsLockModalOpen(true);
  };

  const handleConfirmLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockTargetUser) return;
    const reasonText =
      lockReason.trim() || "Vi phạm quy định hệ thống / Tạm ngưng hoạt động";

    setUsers((prev) =>
      prev.map((user) =>
        user.id === lockTargetUser.id ? { ...user, status: "Locked" } : user
      )
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        user: adminProfile.name,
        action: `Khóa tài khoản ${lockTargetUser.name} (${lockTargetUser.email}). Lý do: ${reasonText}`,
        time: "Vừa xong",
        ip: "192.168.1.105",
        icon: Lock,
        color: "text-rose-600 bg-rose-50",
      },
      ...prev,
    ]);

    setIsLockModalOpen(false);
    showToast(`Đã khóa thành công tài khoản ${lockTargetUser.name}`);
    setLockTargetUser(null);
    setLockReason("");
  };

  const handleUnlockUser = (user: UserAccount) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: "Active" } : u))
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        user: adminProfile.name,
        action: `Mở khóa tài khoản ${user.name} (${user.email})`,
        time: "Vừa xong",
        ip: "192.168.1.105",
        icon: Unlock,
        color: "text-emerald-600 bg-emerald-50",
      },
      ...prev,
    ]);

    showToast(`Đã mở khóa tài khoản ${user.name}`);
  };

  const handleToggleStatus = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.status === "Active") {
      handleOpenLockModal(target);
    } else {
      handleUnlockUser(target);
    }
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      password: "",
    });
    setIsEditUserOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              department: formData.department,
            }
          : u
      )
    );
    setIsEditUserOpen(false);
    showToast(`Đã cập nhật thông tin tài khoản ${formData.name}`);
  };

  const handleOpenPermission = (user: UserAccount) => {
    setSelectedUser(user);
    const isAdmin = user.role === "Admin";
    const isHR = user.role === "HR Manager";
    const isRecruiter = user.role === "Recruiter";
    setUserPermissions({
      view_jobs: true,
      create_jobs: isAdmin || isHR || isRecruiter,
      approve_jobs: isAdmin || isHR,
      view_candidates: isAdmin || isHR || isRecruiter,
      interview_candidates: isAdmin || isHR || user.role === "Interviewer",
      export_reports: isAdmin || isHR,
      manage_system: isAdmin,
    });
    setIsPermissionModalOpen(true);
  };

  const handleSavePermissions = () => {
    setIsPermissionModalOpen(false);
    showToast(`Đã lưu thiết lập phân quyền cho ${selectedUser?.name}`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Vui lòng điền đủ họ tên và email");
      return;
    }
    const newUser: UserAccount = {
      id: `USR-00${users.length + 1}`,
      name: formData.name,
      email: formData.email,
      avatarColor: "bg-[#4285F4]",
      role: formData.role,
      department: formData.department,
      status: "Active",
      lastLogin: "Chưa đăng nhập",
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };
    setUsers([newUser, ...users]);
    setIsAddUserOpen(false);
    setFormData({
      name: "",
      email: "",
      role: "Recruiter",
      department: "Khối Thu Hút Nhân Tài (TA)",
      password: "company123",
    });
    showToast(`Đã tạo thành công tài khoản cho ${newUser.name}`);
  };

  const handleMockExcelImport = () => {
    setIsImportExcelOpen(false);
    showToast("Đã nhập thành công 5 tài khoản nhân sự từ file Excel!");
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER (Cập nhật Dropdown Profile & Nút Đăng xuất cạnh Profile) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Branding & Breadcrumb */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-[#6ba5ff] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 tracking-tight">
                    Tuyển Dụng Nội Bộ
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                    System Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Hệ thống Quản trị & Điều phối Tuyển dụng Toàn diện
                </p>
              </div>
            </div>
          </div>

          {/* Right: Notification & profile dropdown + Logout button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <button className="relative w-10 h-10 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4285F4] ring-2 ring-white"></span>
            </button>

            {/* User Profile Dropdown Component (Có thể click để mở Dropdown Menu) */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 pl-3 border-l border-gray-100 hover:bg-slate-50/80 p-1.5 rounded-2xl transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="relative shrink-0">
                  {adminProfile.avatarUrl ? (
                    <img
                      src={adminProfile.avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-100">
                      AS
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Đang trực tuyến"
                  ></span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {adminProfile.name}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180 text-[#4285F4]" : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-500 block leading-tight">
                    {adminProfile.email}
                  </span>
                </div>
              </button>

              {/* DROPDOWN MENU */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Summary Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3 mb-2 border border-gray-100/70">
                    <div
                      onClick={() => {
                        avatarInputRef.current?.click();
                      }}
                      className="relative group cursor-pointer shrink-0"
                      title="Nhấp để tải lên ảnh mới"
                    >
                      {adminProfile.avatarUrl ? (
                        <img
                          src={adminProfile.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#4285F4] text-white flex items-center justify-center font-bold text-base shadow-sm">
                          AS
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {adminProfile.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {adminProfile.email}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                        Quản trị viên
                      </span>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-1">
                    {/* Tùy chọn 1: Upload ảnh đại diện */}
                    <button
                      type="button"
                      onClick={() => {
                        avatarInputRef.current?.click();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#4285F4]" />
                      <span>Upload ảnh đại diện</span>
                    </button>

                    {/* Tùy chọn 2: Hồ sơ cá nhân */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab("profile");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ cá nhân</span>
                    </button>

                    {/* Tùy chọn 3: Đổi mật khẩu & Bảo mật */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab("security");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>Đổi mật khẩu & Bảo mật</span>
                    </button>
                  </div>

                  <div className="my-1.5 border-t border-gray-100"></div>

                  {/* Tùy chọn 4: Đăng xuất trong Dropdown */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nút ĐĂNG XUẤT nằm ngay bên cạnh khu vực thông tin tài khoản */}
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all text-xs font-semibold cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDEBAR (Sidebar bên trái) */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 lg:sticky lg:top-28">
            <div className="px-4 py-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Menu Quản Trị
              </span>
            </div>

            <nav className="space-y-1.5">
              {/* Menu 1: Quản lý người dùng */}
              <button
                onClick={() => setActiveMenu("users")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "users"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Users className="w-5 h-5 shrink-0" />
                <span>Quản lý người dùng</span>
              </button>

              {/* Menu 2: Phân quyền & Vai trò */}
              <button
                onClick={() => setActiveMenu("roles")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "roles"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>Phân quyền & Vai trò</span>
              </button>

              {/* Menu 3: Nhật ký hệ thống */}
              <button
                onClick={() => setActiveMenu("logs")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "logs"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileText className="w-5 h-5 shrink-0" />
                <span>Nhật ký hệ thống</span>
              </button>

              {/* Menu 4: Cài đặt chung */}
              <button
                onClick={() => setActiveMenu("settings")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "settings"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Settings className="w-5 h-5 shrink-0" />
                <span>Cài đặt chung</span>
              </button>
            </nav>

            {/* Sidebar Footer Widget */}
            <div className="mt-8 pt-6 border-t border-gray-100 px-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
                  <Laptop className="w-4 h-4 text-[#4285F4]" />
                  <span>Trạng thái máy chủ</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Hoạt động ổn định (99.98%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Phiên bản hệ thống: v2.4.0-prod
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT (Khu vực chính) */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Welcome & Overview Header: ĐÃ XÓA 2 NÚT Ở TIÊU ĐỀ NÀY THEO YÊU CẦU 2 */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeMenu === "users" && "Quản lý Người Dùng & Tài Khoản"}
              {activeMenu === "roles" && "Cấu hình Phân Quyền & Vai Trò"}
              {activeMenu === "logs" && "Nhật Ký & Hoạt Động Hệ Thống"}
              {activeMenu === "settings" && "Cài Đặt Hệ Thống Tuyển Dụng"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi, phân quyền và kiểm soát quyền truy cập của nhân sự trong toàn hệ thống.
            </p>
          </div>

          {/* OVERVIEW STATS CARDS (Thẻ thống kê tổng quan) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Card 1: Tổng số tài khoản */}
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tổng số tài khoản
                </span>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {totalAccounts}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +12.5%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Bao gồm toàn bộ cán bộ nhân viên & quản trị
              </p>
            </div>

            {/* Card 2: Tài khoản đang hoạt động */}
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tài khoản đang hoạt động
                </span>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {activeAccounts}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ({Math.round((activeAccounts / totalAccounts) * 100)}% tổng số)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Đủ điều kiện truy cập và thao tác trên cổng
              </p>
            </div>

            {/* Card 3: Tài khoản bị khóa */}
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tài khoản bị khóa
                </span>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
                  {lockedAccounts}
                </span>
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  Cần kiểm tra
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Tạm ngưng quyền hạn hoặc nhân sự đã nghỉ việc
              </p>
            </div>
          </div>

          {/* MAIN SECTION: QUẢN LÝ TÀI KHOẢN (Bảng danh sách người dùng) */}
          {activeMenu === "users" && (
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              {/* TOP TOOLBAR: Tìm kiếm, Bộ lọc & 2 Nút hành động chuẩn ở hàng dưới */}
              <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo họ tên, email hoặc phòng ban..."
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter and Action Buttons: Duy trì 2 nút hành động ở hàng này */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filter by Role */}
                  <div className="relative">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-4 pr-9 py-2.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] cursor-pointer"
                    >
                      <option value="ALL">Tất cả vai trò</option>
                      <option value="Admin">Admin</option>
                      <option value="HR Manager">HR Manager</option>
                      <option value="Recruiter">Recruiter</option>
                      <option value="Interviewer">Interviewer</option>
                      <option value="Employee">Employee</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Filter by Status */}
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-4 pr-9 py-2.5 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4] cursor-pointer"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="Active">Đang hoạt động (Active)</option>
                      <option value="Locked">Đã bị khóa (Locked)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Nút 1: Nhập từ Excel (Màu trắng viền xanh lá) */}
                  <button
                    onClick={() => setIsImportExcelOpen(true)}
                    className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100/70 px-5 py-2.5 rounded-full font-medium text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Nhập từ Excel</span>
                  </button>

                  {/* Nút 2: Tạo tài khoản mới (Màu xanh dương) */}
                  <button
                    onClick={() => setIsAddUserOpen(true)}
                    className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-xs sm:text-sm inline-flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo tài khoản mới</span>
                  </button>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-gray-100 text-[13px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-4 px-6">Họ tên & Nhân sự</th>
                      <th className="py-4 px-6">Email công việc</th>
                      <th className="py-4 px-6">Vai trò (Role)</th>
                      <th className="py-4 px-6">Trạng thái</th>
                      <th className="py-4 px-6 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium text-slate-600">
                            Không tìm thấy tài khoản người dùng phù hợp
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Hãy thử thay đổi từ khóa tìm kiếm hoặc làm mới bộ lọc.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-blue-50/30 transition-colors duration-150 group"
                        >
                          {/* 1. Họ tên */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full ${user.avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm`}
                              >
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(-2)
                                  .join("")}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-[#4285F4] transition-colors">
                                  {user.name}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{user.id}</span>
                                  <span>•</span>
                                  <span>{user.department}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Email */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium">{user.email}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Lần đăng nhập cuối: {user.lastLogin}
                            </span>
                          </td>

                          {/* 3. Vai trò */}
                          <td className="py-4 px-6">
                            {user.role === "Admin" && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#4285F4] border border-blue-200">
                                <Shield className="w-3 h-3" />
                                Quản trị viên
                              </span>
                            )}
                            {user.role === "HR Manager" && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                <Building className="w-3 h-3" />
                                HR Manager
                              </span>
                            )}
                            {user.role === "Recruiter" && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Users className="w-3 h-3" />
                                Recruiter
                              </span>
                            )}
                            {user.role === "Interviewer" && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Interviewer
                              </span>
                            )}
                            {user.role === "Employee" && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                Nhân viên
                              </span>
                            )}
                          </td>

                          {/* 4. Trạng thái (Active / Locked) */}
                          <td className="py-4 px-6">
                            {user.status === "Active" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Locked
                              </span>
                            )}
                          </td>

                          {/* 5. Cột hành động dạng icon (Sửa, Khóa/Mở khóa, Phân quyền) */}
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Nút Sửa */}
                              <button
                                onClick={() => handleOpenEdit(user)}
                                title="Chỉnh sửa thông tin tài khoản"
                                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-[#4285F4] text-slate-600 flex items-center justify-center transition-colors border border-gray-100 cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Nút Khóa / Mở khóa */}
                              {user.status === "Active" ? (
                                <button
                                  onClick={() => handleOpenLockModal(user)}
                                  title="Khóa tài khoản này"
                                  className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors border border-gray-100 cursor-pointer"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnlockUser(user)}
                                  title="Mở khóa tài khoản này"
                                  className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center transition-colors border border-gray-100 cursor-pointer"
                                >
                                  <Unlock className="w-4 h-4" />
                                </button>
                              )}

                              {/* Nút Phân quyền */}
                              <button
                                onClick={() => handleOpenPermission(user)}
                                title="Phân quyền vai trò & chức năng"
                                className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-purple-50 hover:text-purple-600 text-slate-600 flex items-center justify-center transition-colors border border-gray-100 cursor-pointer"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* TABLE FOOTER / PAGINATION */}
              <div className="p-4 sm:px-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 bg-slate-50/50">
                <div>
                  Hiển thị{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredUsers.length}
                  </span>{" "}
                  trong tổng số{" "}
                  <span className="font-semibold text-slate-700">
                    {users.length}
                  </span>{" "}
                  tài khoản
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled
                    className="p-2 rounded-lg border border-gray-200 bg-white text-slate-300 cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-[#4285F4] text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                    1
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center justify-center cursor-pointer">
                    2
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center justify-center cursor-pointer">
                    3
                  </button>
                  <button className="p-2 rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PHÂN QUYỀN & VAI TRÒ */}
          {activeMenu === "roles" && (
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Ma trận Phân quyền theo Vai trò
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Quản lý danh mục các vai trò và quyền thao tác mặc định trong hệ thống Tuyển Dụng Nội Bộ
                  </p>
                </div>
                <button
                  onClick={() => showToast("Đã lưu cấu hình ma trận phân quyền!")}
                  className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-slate-50/75 text-xs uppercase font-bold text-slate-600">
                      <th className="py-4 px-6">Quyền hạn / Chức năng</th>
                      <th className="py-4 px-4 text-center">Admin</th>
                      <th className="py-4 px-4 text-center">HR Manager</th>
                      <th className="py-4 px-4 text-center">Recruiter</th>
                      <th className="py-4 px-4 text-center">Interviewer</th>
                      <th className="py-4 px-4 text-center">Employee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { name: "Xem bảng tin việc làm nội bộ", roles: [true, true, true, true, true] },
                      { name: "Tạo và đăng tin tuyển dụng mới", roles: [true, true, true, false, false] },
                      { name: "Phê duyệt yêu cầu mở tuyển", roles: [true, true, false, false, false] },
                      { name: "Xem và quản lý hồ sơ ứng viên", roles: [true, true, true, false, false] },
                      { name: "Đánh giá & chấm điểm phỏng vấn", roles: [true, true, true, true, false] },
                      { name: "Xuất báo cáo tuyển dụng Excel/PDF", roles: [true, true, false, false, false] },
                      { name: "Quản trị người dùng & phân quyền", roles: [true, false, false, false, false] },
                    ].map((perm, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-6 font-medium text-slate-800">
                          {perm.name}
                        </td>
                        {perm.roles.map((hasAccess, rIdx) => (
                          <td key={rIdx} className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              defaultChecked={hasAccess}
                              className="w-4 h-4 rounded text-[#4285F4] focus:ring-[#4285F4] accent-[#4285F4]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: NHẬT KÝ HỆ THỐNG */}
          {activeMenu === "logs" && (
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Nhật Ký Kiểm Toán & Truy Vết (Audit Logs)
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Lưu lại lịch sử đăng nhập, thay đổi dữ liệu, và các hành vi quan trọng của người dùng.
              </p>
              <div className="space-y-4">
                {auditLogs.map((log, index) => (
                  <div
                    key={log.id || index}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-gray-100"
                  >
                    <div className={`p-2.5 rounded-xl ${log.color} shrink-0`}>
                      <log.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {log.user}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {log.time}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{log.action}</p>
                      <span className="text-xs text-slate-400 mt-1 block">
                        IP: {log.ip}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: CÀI ĐẶT CHUNG */}
          {activeMenu === "settings" && (
            <div className="bg-[#ffffff] rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                Cài Đặt Cấu Hình Hệ Thống
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Tùy chỉnh thông số bảo mật, định dạng email thông báo và thông tin tổ chức.
              </p>

              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Tên tổ chức / Doanh nghiệp
                  </label>
                  <input
                    type="text"
                    defaultValue="Tập Đoàn Công Nghệ & Truyền Thông"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email gửi thông báo tuyển dụng tự động
                  </label>
                  <input
                    type="email"
                    defaultValue="no-reply.recruitment@company.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">
                    Chính sách mật khẩu & bảo mật
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded text-[#4285F4] accent-[#4285F4]"
                      />
                      <span className="text-sm text-slate-700">
                        Yêu cầu đổi mật khẩu sau lần đăng nhập đầu tiên
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded text-[#4285F4] accent-[#4285F4]"
                      />
                      <span className="text-sm text-slate-700">
                        Tự động khóa tài khoản sau 5 lần nhập sai liên tiếp
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded text-[#4285F4] accent-[#4285F4]"
                      />
                      <span className="text-sm text-slate-700">
                        Bắt buộc mật khẩu có độ dài tối thiểu 8 ký tự
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => showToast("Đã lưu các thiết lập cấu hình hệ thống!")}
                    className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                  >
                    Lưu cài đặt
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO TÀI KHOẢN MỚI */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Tạo Tài Khoản Mới
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cấp phát thông tin đăng nhập cho nhân sự nội bộ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Vai trò hệ thống <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserAccount["role"],
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]"
                  >
                    <option value="Admin">Admin (Quản trị hệ thống)</option>
                    <option value="HR Manager">HR Manager (Trưởng phòng)</option>
                    <option value="Recruiter">Recruiter (Tuyển dụng)</option>
                    <option value="Interviewer">Interviewer (Phỏng vấn)</option>
                    <option value="Employee">Employee (Nhân viên)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Phòng ban
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]"
                  >
                    <option value="Khối Thu Hút Nhân Tài (TA)">Khối Thu Hút Nhân Tài</option>
                    <option value="Phòng Nhân Sự & Văn Hóa">Phòng Nhân Sự</option>
                    <option value="Phòng Phát Triển Phần Mềm">Phát Triển Phần Mềm</option>
                    <option value="Phòng Thiết Kế Trải Nghiệm">Thiết Kế UI/UX</option>
                    <option value="Phòng Kinh Doanh & Dịch Vụ">Kinh Doanh & Dịch Vụ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mật khẩu mặc định ban đầu
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="company123"
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-mono text-[#4285F4] font-semibold"
                  />
                  <span className="text-xs text-slate-400 shrink-0">
                    (Yêu cầu đổi khi login)
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                >
                  Xác nhận tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NHẬP TỪ EXCEL (IMPORT) */}
      {/* ========================================================================= */}
      {isImportExcelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Nhập Danh Sách Từ Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ định dạng file .xlsx, .xls, .csv
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportExcelOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-gray-200 hover:border-[#4285F4] rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all">
                <UploadCloud className="w-10 h-10 text-[#4285F4] mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800">
                  Kéo thả file Excel vào đây, hoặc{" "}
                  <span className="text-[#4285F4] underline">chọn từ máy tính</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Kích thước file tối đa 10MB (Khuyến nghị dùng file mẫu)
                </p>
              </div>

              {/* Download template */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#4285F4]" />
                  <span className="text-xs font-semibold text-slate-700">
                    File mẫu: Mau_Nhap_Tai_Khoan_Nhan_Su.xlsx
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Đang tải file mẫu về máy...")}
                  className="text-xs font-bold text-[#4285F4] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải mẫu
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsImportExcelOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleMockExcelImport}
                  className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                >
                  Tiến hành nhập dữ liệu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHỈNH SỬA TÀI KHOẢN (EDIT) */}
      {/* ========================================================================= */}
      {isEditUserOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Chỉnh Sửa Thông Tin
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật tài khoản ID: {selectedUser.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditUserOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email công việc
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Vai trò
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as UserAccount["role"],
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  >
                    <option value="Admin">Admin</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Interviewer">Interviewer</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Phòng ban
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PHÂN QUYỀN VAI TRÒ CHO TỪNG TÀI KHOẢN (PERMISSION MODAL) */}
      {/* ========================================================================= */}
      {isPermissionModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Phân Quyền Chức Năng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thiết lập đặc quyền cho:{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedUser.name}
                    </span>{" "}
                    ({selectedUser.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPermissionModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Tùy chỉnh các quyền hành động chi tiết ghi đè quyền mặc định của vai trò:
              </p>

              <div className="space-y-3">
                {[
                  { key: "view_jobs", label: "Xem tin tuyển dụng nội bộ" },
                  { key: "create_jobs", label: "Đăng tải và chỉnh sửa tin tuyển dụng" },
                  { key: "approve_jobs", label: "Phê duyệt yêu cầu mở tuyển mới" },
                  { key: "view_candidates", label: "Truy cập danh sách hồ sơ ứng viên" },
                  { key: "interview_candidates", label: "Chấm điểm và phản hồi phỏng vấn" },
                  { key: "export_reports", label: "Xuất dữ liệu và báo cáo tuyển dụng" },
                  { key: "manage_system", label: "Toàn quyền quản trị hệ thống (System Admin)" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/40 border border-gray-100 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={!!userPermissions[item.key]}
                      onChange={(e) =>
                        setUserPermissions({
                          ...userPermissions,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#4285F4] focus:ring-[#4285F4] accent-[#4285F4]"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  onClick={handleSavePermissions}
                  className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                >
                  Cập nhật phân quyền
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL 5: QUẢN LÝ HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU (REUSABLE USER PROFILE MODAL) */}
      {/* ========================================================================= */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userRole="Quản trị viên cấp cao (System Administrator)"
        initialTab={profileModalTab}
        initialData={{
          employeeCode: "ADM-2026-001",
          name: adminProfile.name,
          email: adminProfile.email,
          role: adminProfile.role,
          department: adminProfile.department,
          phone: adminProfile.phone,
          avatarUrl: adminProfile.avatarUrl,
          bio: adminProfile.bio,
          gender: "Nam",
          dateOfBirth: "1988-12-10",
        }}
        onSaveProfile={(updated) => {
          setAdminProfile((prev) => ({
            ...prev,
            name: updated.name,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl || prev.avatarUrl,
            bio: updated.bio || prev.bio,
          }));
          showToast("Đã cập nhật thông tin Quản trị viên thành công!");
        }}
        onChangePassword={async ({ currentPass, newPass }) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          showToast("Đổi mật khẩu Quản trị viên thành công! Mật khẩu mới đã được lưu.");
        }}
      />

      {/* MODAL CẮT ẢNH CHO HEADER UPLOAD NHANH */}
      <AvatarCropModal
        isOpen={isAvatarCropOpen}
        imageSrc={selectedRawAvatar}
        onClose={() => {
          setIsAvatarCropOpen(false);
          setSelectedRawAvatar(null);
          if (avatarInputRef.current) avatarInputRef.current.value = "";
        }}
        onCropSave={handleAvatarCropComplete}
      />

      {/* ========================================================================= */}
      {/* MODAL 6: CHỈNH SỬA HỒ SƠ (EDIT PROFILE) */}
      {/* ========================================================================= */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Chỉnh Sửa Hồ Sơ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật thông tin định danh cá nhân Quản trị viên
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {/* Avatar upload quick area */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-gray-100">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative group cursor-pointer shrink-0"
                  title="Chọn ảnh đại diện mới"
                >
                  {adminProfile.avatarUrl ? (
                    <img
                      src={adminProfile.avatarUrl}
                      alt="Avatar"
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#4285F4] text-white flex items-center justify-center font-bold text-lg">
                      AS
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-[#4285F4]" />
                    <span>Upload ảnh đại diện</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1">Định dạng PNG, JPG, WEBP tối đa 5MB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email công việc (Cố định)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={adminProfile.email}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Phòng ban / Bộ phận
                </label>
                <input
                  type="text"
                  value={editProfileForm.department}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, department: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mô tả công việc & Trách nhiệm
                </label>
                <textarea
                  rows={2}
                  value={editProfileForm.bio}
                  onChange={(e) => setEditProfileForm({ ...editProfileForm, bio: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: XÁC NHẬN KHÓA TÀI KHOẢN (LOCK ACCOUNT CONFIRMATION) */}
      {/* ========================================================================= */}
      {isLockModalOpen && lockTargetUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsLockModalOpen(false);
              setLockTargetUser(null);
              setLockReason("");
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Xác nhận khóa tài khoản
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vui lòng xác nhận lý do trước khi tạm ngưng tài khoản
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLockModalOpen(false);
                  setLockTargetUser(null);
                  setLockReason("");
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmLock} className="p-6 space-y-5">
              {/* Tóm tắt thông tin người dùng đang thao tác để tránh khóa nhầm */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200/80 flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-full ${lockTargetUser.avatarColor} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}
                >
                  {lockTargetUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {lockTargetUser.name}
                    </h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-slate-600 shrink-0">
                      {lockTargetUser.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{lockTargetUser.email}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>Mã NV: <strong className="text-slate-700">{lockTargetUser.id}</strong></span>
                    <span>•</span>
                    <span className="truncate">{lockTargetUser.department}</span>
                  </div>
                </div>
              </div>

              {/* Ô nhập nguyên nhân khóa tài khoản */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Nguyên nhân khóa tài khoản <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Nhập lý do vi phạm, nghỉ việc, bảo mật..."
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                  <span>Lý do này sẽ được ghi nhận vào nhật ký kiểm toán hệ thống.</span>
                  <span>{lockReason.length} ký tự</span>
                </p>
              </div>

              {/* Cảnh báo tác động */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Sau khi khóa, người dùng này sẽ không thể đăng nhập hoặc thực hiện bất kỳ thao tác nào trên hệ thống cho tới khi quản trị viên mở khóa.
                </span>
              </div>

              {/* Footer buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsLockModalOpen(false);
                    setLockTargetUser(null);
                    setLockReason("");
                  }}
                  className="px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-gray-300 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full transition-all font-medium text-sm shadow-md shadow-red-600/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Xác nhận khóa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
