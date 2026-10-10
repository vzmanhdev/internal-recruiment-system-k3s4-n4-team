export interface MenuItem {
  id: string;
  label: string;
  href: string;
  permission: string | null; // null means accessible to all authenticated users
  group: 'overview' | 'recruitment' | 'candidate' | 'interview' | 'approval' | 'offer' | 'admin' | 'personal';
  iconName: string;
  badgeCount?: number;
}

export interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

export const ALL_SYSTEM_MENUS: MenuItem[] = [
  // TỔNG QUAN
  {
    id: "workspace-overview",
    label: "Tổng quan",
    href: "/workspace",
    permission: null,
    group: "overview",
    iconName: "LayoutDashboard",
  },
  {
    id: "admin-dashboard",
    label: "Quản trị hệ thống",
    href: "/admin",
    permission: "user:view",
    group: "admin",
    iconName: "ShieldCheck",
  },

  // YÊU CẦU TUYỂN DỤNG & ĐỊNH BIÊN
  {
    id: "hr-requisitions",
    label: "Quản lý Đề xuất tuyển dụng",
    href: "/hr/requisitions",
    permission: "requisition:approve",
    group: "recruitment",
    iconName: "FileSpreadsheet",
  },
  {
    id: "manager-requisitions",
    label: "Yêu cầu tuyển dụng của tôi",
    href: "/manager/requisitions",
    permission: "requisition:view",
    group: "recruitment",
    iconName: "FileText",
  },

  // ỨNG VIÊN & TUYỂN DỤNG
  {
    id: "candidate-pipeline",
    label: "Hồ sơ & Quy trình Ứng viên",
    href: "/hr/candidates",
    permission: "candidate:view",
    group: "candidate",
    iconName: "Users",
  },
  {
    id: "recruiter-jobs",
    label: "Tin tuyển dụng & Nguồn tin",
    href: "/recruiter/jobs",
    permission: "candidate:create",
    group: "candidate",
    iconName: "Briefcase",
  },

  // PHỎNG VẤN & ĐÁNH GIÁ
  {
    id: "interviews-list",
    label: "Lịch phỏng vấn",
    href: "/interviewer/interviews",
    permission: "interview:view",
    group: "interview",
    iconName: "Calendar",
  },
  {
    id: "evaluations-list",
    label: "Phiếu đánh giá phỏng vấn",
    href: "/interviewer/evaluations",
    permission: "interview:evaluate",
    group: "interview",
    iconName: "ClipboardCheck",
  },

  // TRUNG TÂM PHÊ DUYỆT
  {
    id: "approval-center",
    label: "Trung tâm phê duyệt",
    href: "/approver",
    permission: "offer:approve",
    group: "approval",
    iconName: "CheckCircle2",
  },

  // OFFER & ONBOARDING
  {
    id: "offer-management",
    label: "Đề xuất & Thư mời Offer",
    href: "/hr/offers",
    permission: "offer:create",
    group: "offer",
    iconName: "Award",
  },

  // QUẢN TRỊ ADMIN
  {
    id: "admin-users",
    label: "Quản lý Người dùng",
    href: "/admin/users",
    permission: "user:create",
    group: "admin",
    iconName: "UserCheck",
  },
  {
    id: "admin-permissions",
    label: "Ma trận phân quyền RBAC",
    href: "/admin/permissions",
    permission: "permission:manage",
    group: "admin",
    iconName: "KeyRound",
  },
  {
    id: "admin-audit",
    label: "Nhật ký kiểm toán Audit Log",
    href: "/admin/audit-logs",
    permission: "audit:view",
    group: "admin",
    iconName: "History",
  },
];

const GROUP_TITLES: Record<string, string> = {
  overview: "TỔNG QUAN",
  recruitment: "TUYỂN DỤNG & ĐỊNH BIÊN",
  candidate: "QUẢN LÝ ỨNG VIÊN",
  interview: "PHỎNG VẤN & ĐÁNH GIÁ",
  approval: "PHÊ DUYỆT",
  offer: "OFFER & THƯ MỜI",
  admin: "QUẢN TRỊ HỆ THỐNG",
  personal: "CÁ NHÂN",
};

/**
 * Filter and deduplicate menu items based on current user's effective permissions.
 */
export function getAggregatedMenuGroups(effectivePermissions: string[] | null, isSuperAdmin: boolean = false): MenuGroup[] {
  const permSet = new Set(effectivePermissions || []);

  const accessibleItems = ALL_SYSTEM_MENUS.filter((item) => {
    if (isSuperAdmin) return true;
    if (item.permission === null) return true; // Always visible
    return permSet.has(item.permission);
  });

  // Deduplicate by item.id
  const seenIds = new Set<string>();
  const uniqueItems: MenuItem[] = [];
  for (const item of accessibleItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      uniqueItems.push(item);
    }
  }

  // Group items into categories
  const groupsMap = new Map<string, MenuItem[]>();
  for (const item of uniqueItems) {
    if (!groupsMap.has(item.group)) {
      groupsMap.set(item.group, []);
    }
    groupsMap.get(item.group)!.push(item);
  }

  const result: MenuGroup[] = [];
  const groupOrder = ['overview', 'recruitment', 'candidate', 'interview', 'approval', 'offer', 'admin', 'personal'];

  for (const groupKey of groupOrder) {
    const items = groupsMap.get(groupKey);
    if (items && items.length > 0) {
      result.push({
        id: groupKey,
        title: GROUP_TITLES[groupKey] || groupKey.toUpperCase(),
        items,
      });
    }
  }

  return result;
}
