export interface UserItem {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  roles: string[];
  is_active: boolean;
  account_status: "active" | "locked";
  lock_reason?: string;
  created_at: string;
  avatar_color?: string;
}

export interface RoleDefinition {
  code: string;
  name: string;
  shortName: string;
  description: string;
  badgeClass: string;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    code: "admin",
    name: "Quản trị hệ thống",
    shortName: "Admin",
    description: "Toàn quyền quản trị tài khoản, cấu hình hệ thống và thiết lập bảo mật RBAC.",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    code: "hr_manager",
    name: "Trưởng phòng Nhân sự",
    shortName: "HR Manager",
    description: "Quản lý tổng quan tuyển dụng, định biên, phê duyệt và quy trình nhân sự.",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    code: "recruiter",
    name: "Chuyên viên Tuyển dụng",
    shortName: "Recruiter",
    description: "Đăng tin tuyển dụng, sàng lọc hồ sơ, điều phối phỏng vấn và phát hành offer.",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    code: "approver",
    name: "Người phê duyệt",
    shortName: "Approver",
    description: "Phê duyệt các yêu cầu tuyển dụng (Requisition) và đề xuất thư mời nhận việc (Offer).",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    code: "hiring_manager",
    name: "Trưởng bộ phận",
    shortName: "Hiring Manager",
    description: "Tạo và duyệt yêu cầu tuyển dụng, tham gia phỏng vấn chuyên môn phòng ban.",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    code: "interviewer",
    name: "Người phỏng vấn",
    shortName: "Interviewer",
    description: "Tham gia hội đồng phỏng vấn, chấm điểm và gửi phản hồi đánh giá ứng viên.",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    code: "employee",
    name: "Nhân viên nội bộ",
    shortName: "Employee",
    description: "Xem tin nội bộ, giới thiệu ứng viên (Referral) và nộp đơn ứng tuyển nội bộ.",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
];

export const getRoleMeta = (roleCode: string): RoleDefinition => {
  const code = (roleCode || "").toLowerCase().trim();
  if (code === "hr") {
    return ROLE_DEFINITIONS.find((r) => r.code === "hr_manager")!;
  }
  const found = ROLE_DEFINITIONS.find(
    (r) => r.code === roleCode || r.code === code
  );
  if (found) return found;

  return {
    code: roleCode,
    name: roleCode,
    shortName: roleCode,
    description: "Vai trò hệ thống",
    badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
  };
};
