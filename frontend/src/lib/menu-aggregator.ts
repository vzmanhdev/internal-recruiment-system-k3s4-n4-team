export interface MenuItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  roles: string[];
}

export interface MenuGroup {
  groupName: string;
  items: MenuItem[];
}

export const ALL_MENU_GROUPS: MenuGroup[] = [
  {
    groupName: "TỔNG QUAN",
    items: [
      {
        id: "dashboard",
        label: "Tổng quan hệ thống",
        href: "/admin/dashboard",
        iconName: "LayoutDashboard",
        roles: ["admin", "hr_manager", "recruiter", "hiring_manager", "approver"],
      },
    ],
  },
  {
    groupName: "QUẢN TRỊ",
    items: [
      {
        id: "users",
        label: "Người dùng",
        href: "/admin/users",
        iconName: "Users",
        roles: ["admin", "hr_manager"],
      },
      {
        id: "roles",
        label: "Vai trò & Phân quyền",
        href: "/admin/roles",
        iconName: "ShieldCheck",
        roles: ["admin"],
      },
      {
        id: "permissions",
        label: "Ma trận phân quyền",
        href: "/admin/permissions",
        iconName: "ShieldCheck",
        roles: ["admin"],
      },
      {
        id: "import",
        label: "Import nhân sự Excel",
        href: "/admin/users/import",
        iconName: "FileSpreadsheet",
        roles: ["admin", "hr_manager"],
      },
    ],
  },
  {
    groupName: "TỔ CHỨC & DANH MỤC",
    items: [
      {
        id: "departments",
        label: "Phòng ban & Sơ đồ tổ chức",
        href: "/hr/master-data/departments",
        iconName: "Building2",
        roles: ["admin", "hr_manager"],
      },
      {
        id: "positions",
        label: "Chức danh & Dải lương",
        href: "/hr/master-data/positions",
        iconName: "Briefcase",
        roles: ["admin", "hr_manager"],
      },
      {
        id: "competencies",
        label: "Khung năng lực",
        href: "/hr/master-data/competencies",
        iconName: "Award",
        roles: ["admin", "hr_manager"],
      },
      {
        id: "lookups",
        label: "Danh mục dùng chung",
        href: "/hr/master-data/lookups",
        iconName: "ListFilter",
        roles: ["admin", "hr_manager"],
      },
    ],
  },
  {
    groupName: "TUYỂN DỤNG",
    items: [
      {
        id: "requisitions",
        label: "Yêu cầu tuyển dụng",
        href: "/hr/requisitions",
        iconName: "FileText",
        roles: ["admin", "hr_manager", "hiring_manager", "approver", "recruiter"],
      },
      {
        id: "approval-flows",
        label: "Luồng phê duyệt",
        href: "/hr/master-data/approval-flows",
        iconName: "GitMerge",
        roles: ["admin", "hr_manager"],
      },
      {
        id: "headcount",
        label: "Ngân sách Headcount",
        href: "/hr/master-data/headcount",
        iconName: "TrendingUp",
        roles: ["admin", "hr_manager", "hiring_manager"],
      },
      {
        id: "job-postings",
        label: "Tin tuyển dụng",
        href: "/hr/job-postings",
        iconName: "Megaphone",
        roles: ["admin", "hr_manager", "recruiter"],
      },
      {
        id: "candidates",
        label: "Ứng viên & Pipeline",
        href: "/hr/candidates",
        iconName: "UserCheck",
        roles: ["admin", "hr_manager", "recruiter", "hiring_manager"],
      },
      {
        id: "talent-pool",
        label: "Kho ứng viên",
        href: "/hr/talent-pool",
        iconName: "FolderGit2",
        roles: ["admin", "hr_manager", "recruiter"],
      },
      {
        id: "interviews",
        label: "Lịch phỏng vấn",
        href: "/hr/interviews",
        iconName: "Calendar",
        roles: ["admin", "hr_manager", "recruiter", "hiring_manager", "interviewer"],
      },
      {
        id: "evaluations",
        label: "Phiếu đánh giá",
        href: "/interviewer",
        iconName: "ClipboardCheck",
        roles: ["admin", "hr_manager", "interviewer", "hiring_manager"],
      },
      {
        id: "offers",
        label: "Offer",
        href: "/hr/offers",
        iconName: "FileSignature",
        roles: ["admin", "hr_manager", "recruiter", "approver"],
      },
      {
        id: "onboarding",
        label: "Onboarding",
        href: "/hr/onboarding",
        iconName: "UserPlus",
        roles: ["admin", "hr_manager", "recruiter"],
      },
    ],
  },
  {
    groupName: "CỔNG TUYỂN DỤNG",
    items: [
      {
        id: "jobs-portal",
        label: "Trang tuyển dụng",
        href: "/jobs",
        iconName: "Globe",
        roles: ["admin", "hr_manager", "recruiter", "hiring_manager", "interviewer", "approver", "employee"],
      },
    ],
  },
  {
    groupName: "EMAIL & THÔNG BÁO",
    items: [
      {
        id: "email-templates",
        label: "Mẫu Email tự động",
        href: "/hr/automation/templates",
        iconName: "Mail",
        roles: ["admin", "hr_manager", "recruiter"],
      },
      {
        id: "email-logs",
        label: "Nhật ký gửi Email",
        href: "/hr/automation/email-logs",
        iconName: "Send",
        roles: ["admin", "hr_manager"],
      },
      {
        id: "notifications",
        label: "Thông báo",
        href: "/employee/notifications",
        iconName: "Bell",
        roles: ["admin", "hr_manager", "recruiter", "hiring_manager", "interviewer", "approver", "employee"],
      },
    ],
  },
  {
    groupName: "BÁO CÁO",
    items: [
      {
        id: "reports-overview",
        label: "Tổng quan tuyển dụng",
        href: "/hr/reports",
        iconName: "BarChart3",
        roles: ["admin", "hr_manager", "approver"],
      },
      {
        id: "reports-funnel",
        label: "Phễu tuyển dụng",
        href: "/hr/reports#funnel",
        iconName: "Filter",
        roles: ["admin", "hr_manager", "recruiter"],
      },
      {
        id: "reports-efficiency",
        label: "Thời gian & Chi phí",
        href: "/hr/reports#efficiency",
        iconName: "Clock",
        roles: ["admin", "hr_manager"],
      },
      {
        id: "reports-sources",
        label: "Hiệu quả nguồn ứng viên",
        href: "/hr/reports#sources",
        iconName: "PieChart",
        roles: ["admin", "hr_manager", "recruiter"],
      },
    ],
  },
  {
    groupName: "HỆ THỐNG",
    items: [
      {
        id: "audit-logs",
        label: "Nhật ký hệ thống",
        href: "/admin/audit-logs",
        iconName: "ScrollText",
        roles: ["admin"],
      },
      {
        id: "master-data",
        label: "Danh mục hệ thống",
        href: "/admin/master-data",
        iconName: "SlidersHorizontal",
        roles: ["admin"],
      },
      {
        id: "notification-settings",
        label: "Cấu hình thông báo",
        href: "/admin/notification-settings",
        iconName: "Bell",
        roles: ["admin"],
      },
      {
        id: "profile",
        label: "Hồ sơ cá nhân",
        href: "/admin/profile",
        iconName: "CircleUserRound",
        roles: ["admin"],
      },
    ],
  },
];

export function getAggregatedMenu(userRoles: string[]): MenuGroup[] {
  const normalized = userRoles.map((role) =>
    role.trim().toLowerCase().replace(/[\s-]+/g, "_")
  );
  const isAdmin = normalized.includes("admin");

  if (isAdmin) {
    return ALL_MENU_GROUPS;
  }

  const resultGroups: MenuGroup[] = [];

  for (const group of ALL_MENU_GROUPS) {
    const matchedItems = group.items.filter((item) =>
      item.roles.some((r) => normalized.includes(r.toLowerCase()))
    );

    if (matchedItems.length > 0) {
      resultGroups.push({
        groupName: group.groupName,
        items: matchedItems,
      });
    }
  }

  return resultGroups;
}
