/**
 * Declarative navigation tree (presentation only: labels, icons, routes, grouping, order).
 *
 * There is NO authorization data here. Whether an item is shown is derived from the route-policy
 * registry (`route-registry.ts`) evaluated against the backend effective permissions, so the Sidebar
 * shows exactly the routes the server would let the user open. Multi-role users therefore get the
 * union of all modules; admin (full allow on the backend) gets the whole tree.
 *
 * `hrefs` lists alternatives for one feature (e.g. a personal profile page that exists in several
 * workspaces): the first accessible one is used, so the item appears once.
 */

export type NavIcon =
  | "home" | "shield" | "users" | "upload" | "key" | "grid" | "database" | "building" | "badge" | "layers"
  | "scroll" | "file" | "check" | "megaphone" | "user-search" | "kanban" | "star" | "share" | "calendar"
  | "clipboard" | "clock" | "book" | "gift" | "rocket" | "mail" | "inbox" | "bell" | "settings" | "chart"
  | "briefcase" | "user" | "history" | "wallet" | "flow" | "target";

export interface NavLeaf {
  id: string;
  label: string;
  icon: NavIcon;
  hrefs: string[];
}

export interface NavSubgroup {
  id: string;
  label: string;
  icon: NavIcon;
  children: NavLeaf[];
}

export interface NavGroup {
  id: string;
  label: string;
  icon: NavIcon;
  items: Array<NavLeaf | NavSubgroup>;
}

const leaf = (id: string, label: string, icon: NavIcon, ...hrefs: string[]): NavLeaf => ({ id, label, icon, hrefs });
const sub = (id: string, label: string, icon: NavIcon, children: NavLeaf[]): NavSubgroup => ({ id, label, icon, children });

export const NAVIGATION: NavGroup[] = [
  {
    id: "overview", label: "Tổng quan", icon: "home", items: [
      leaf("overview.workspace", "Tổng quan", "home", "/workspace"),
    ],
  },
  {
    id: "admin", label: "Quản trị hệ thống", icon: "shield", items: [
      leaf("admin.dashboard", "Bảng điều khiển hệ thống", "chart", "/admin/dashboard"),
      sub("admin.users", "Quản lý người dùng", "users", [
        leaf("admin.users.list", "Danh sách người dùng", "users", "/admin/users"),
        leaf("admin.users.import", "Nhập nhân sự từ Excel", "upload", "/admin/users/import"),
      ]),
      sub("admin.access", "Truy cập & phân quyền", "key", [
        leaf("admin.roles", "Vai trò", "badge", "/admin/roles"),
        leaf("admin.permissions", "Ma trận phân quyền RBAC", "grid", "/admin/permissions"),
      ]),
      leaf("admin.master-data", "Dữ liệu hệ thống", "database", "/admin/master-data"),
      leaf("admin.audit", "Nhật ký hệ thống (Audit Logs)", "scroll", "/admin/audit-logs"),
    ],
  },
  {
    id: "hr", label: "Quản lý nhân sự", icon: "building", items: [
      leaf("hr.dashboard", "Tổng quan nhân sự", "chart", "/hr/dashboard"),
      sub("hr.master", "Danh mục tuyển dụng", "database", [
        leaf("hr.departments", "Phòng ban", "building", "/hr/master-data/departments"),
        leaf("hr.positions", "Chức danh & dải lương", "badge", "/hr/master-data/positions"),
        leaf("hr.competencies", "Khung năng lực", "target", "/hr/master-data/competencies"),
        leaf("hr.lookups", "Danh mục dùng chung", "layers", "/hr/master-data/lookups"),
        leaf("hr.career-page", "Trang tuyển dụng công khai", "megaphone", "/hr/career-page-config"),
      ]),
    ],
  },
  {
    id: "recruitment", label: "Quản lý tuyển dụng", icon: "briefcase", items: [
      leaf("rec.requisitions", "Yêu cầu tuyển dụng", "file", "/hr/requisitions", "/manager/requisitions"),
      leaf("rec.flows", "Luồng phê duyệt", "flow", "/hr/master-data/approval-flows"),
      leaf("rec.headcount", "Ngân sách tuyển dụng / Headcount", "wallet", "/hr/master-data/headcount"),
      leaf("rec.postings", "Tin tuyển dụng", "megaphone", "/hr/job-postings", "/recruiter/jobs"),
      leaf("rec.hr-approvals", "Duyệt yêu cầu (HR)", "check", "/hr/approvals"),
    ],
  },
  {
    id: "candidates", label: "Quản lý ứng viên", icon: "user-search", items: [
      leaf("cand.list", "Danh sách ứng viên", "user-search", "/hr/candidates", "/recruiter/candidates"),
      leaf("cand.pipeline", "Pipeline tuyển dụng", "kanban", "/recruiter/pipeline", "/manager/pipeline"),
      leaf("cand.talent", "Kho ứng viên Talent Pool", "star", "/hr/talent-pool"),
    ],
  },
  {
    id: "interviews", label: "Phòng vấn & đánh giá", icon: "calendar", items: [
      leaf("int.schedule", "Lịch phỏng vấn", "calendar", "/hr/interviews", "/recruiter/interviews", "/manager/interviews"),
      leaf("int.evaluations", "Phiếu & Kết quả đánh giá", "clipboard", "/hr/evaluations", "/manager/evaluations"),
      leaf("int.questions", "Ngân hàng câu hỏi", "book", "/hr/interview-questions", "/interviewer/questions"),
      leaf("int.mine", "Lịch phỏng vấn của tôi", "clock", "/interviewer/schedule"),
      leaf("int.pending", "Phiếu đánh giá chờ nộp", "clipboard", "/interviewer/evaluations/pending"),
      leaf("int.history", "Lịch sử đánh giá", "history", "/interviewer/evaluations/history"),
    ],
  },
  {
    id: "approvals", label: "Phê duyệt", icon: "check", items: [
      leaf("appr.center", "Trung tâm phê duyệt", "check", "/approver"),
      leaf("appr.requisitions", "Yêu cầu chờ duyệt", "file", "/approver/requisitions"),
      leaf("appr.offers", "Offer chờ duyệt", "gift", "/approver/offers"),
      leaf("appr.history", "Lịch sử phê duyệt", "history", "/approver/history"),
      leaf("appr.manager", "Quyết định của bộ phận", "check", "/manager/approvals"),
    ],
  },
  {
    id: "offers", label: "Offer & onboarding", icon: "gift", items: [
      leaf("off.manage", "Quản lý Offer", "gift", "/hr/offers", "/recruiter/offers"),
      leaf("off.onboarding", "Onboarding", "rocket", "/hr/onboarding"),
    ],
  },
  {
    id: "comms", label: "Email & thông báo", icon: "mail", items: [
      leaf("mail.templates", "Mẫu email", "mail", "/hr/automation/email-templates"),
      leaf("mail.logs", "Nhật ký email", "inbox", "/hr/automation/email-logs"),
    ],
  },
  {
    id: "reports", label: "Báo cáo & thống kê", icon: "chart", items: [
      leaf("rep.recruitment", "Báo cáo tuyển dụng", "chart", "/hr/reports"),
    ],
  },
  {
    id: "employee", label: "Cổng nhân viên", icon: "briefcase", items: [
      leaf("emp.home", "Trang nhân viên", "home", "/employee/dashboard"),
      leaf("emp.jobs", "Việc làm nội bộ", "briefcase", "/employee/jobs"),
      leaf("emp.interviews", "Lịch phỏng vấn ứng tuyển", "calendar", "/employee/interviews"),
      leaf("emp.referrals", "Giới thiệu ứng viên", "share", "/employee/referrals"),
    ],
  },
  {
    id: "candidate", label: "Cổng ứng viên", icon: "user", items: [
      leaf("candidate.home", "Tổng quan ứng tuyển", "home", "/candidate"),
      leaf("candidate.applications", "Hồ sơ đã nộp", "file", "/candidate/applications"),
      leaf("candidate.interviews", "Lịch phỏng vấn", "calendar", "/candidate/interviews"),
      leaf("candidate.offers", "Thư mời nhận việc", "gift", "/candidate/offers"),
    ],
  },
  {
    id: "personal", label: "Cá nhân", icon: "user", items: [
      leaf("me.profile", "Hồ sơ cá nhân", "user",
        "/employee/profile", "/admin/profile", "/manager/profile", "/recruiter/profile", "/interviewer/profile", "/approver/profile", "/candidate/profile"),
      leaf("me.notifications", "Thông báo", "bell", "/employee/notifications", "/manager/notifications"),
      leaf("me.notification-settings", "Cài đặt thông báo", "settings",
        "/employee/notification-settings", "/admin/notification-settings", "/manager/settings", "/interviewer/settings", "/approver/settings", "/candidate/settings"),
    ],
  },
];

export interface VisibleLeaf { id: string; label: string; icon: NavIcon; href: string }
export interface VisibleSubgroup { id: string; label: string; icon: NavIcon; children: VisibleLeaf[] }
export interface VisibleGroup { id: string; label: string; icon: NavIcon; items: Array<VisibleLeaf | VisibleSubgroup> }

export const isSubgroup = (i: VisibleLeaf | VisibleSubgroup): i is VisibleSubgroup => "children" in i;

/**
 * Filter the tree with an access predicate. Each feature appears once (first accessible href),
 * duplicate hrefs are dropped, and empty subgroups/groups are removed.
 */
export function visibleNavigation(canAccess: (href: string) => boolean): VisibleGroup[] {
  const seen = new Set<string>();
  const pick = (l: NavLeaf): VisibleLeaf | null => {
    const href = l.hrefs.find((h) => canAccess(h));
    if (!href || seen.has(href)) return null;
    seen.add(href);
    return { id: l.id, label: l.label, icon: l.icon, href };
  };
  const out: VisibleGroup[] = [];
  for (const g of NAVIGATION) {
    const items: Array<VisibleLeaf | VisibleSubgroup> = [];
    for (const item of g.items) {
      if ("children" in item) {
        const children = item.children.map(pick).filter((x): x is VisibleLeaf => !!x);
        if (children.length) items.push({ id: item.id, label: item.label, icon: item.icon, children });
      } else {
        const v = pick(item);
        if (v) items.push(v);
      }
    }
    if (items.length) out.push({ id: g.id, label: g.label, icon: g.icon, items });
  }
  return out;
}

/** All hrefs of the visible tree (used to find the active item and the group to expand). */
export function flattenHrefs(groups: VisibleGroup[]): Array<{ href: string; groupId: string; subId?: string }> {
  const out: Array<{ href: string; groupId: string; subId?: string }> = [];
  for (const g of groups) {
    for (const i of g.items) {
      if (isSubgroup(i)) i.children.forEach((c) => out.push({ href: c.href, groupId: g.id, subId: i.id }));
      else out.push({ href: i.href, groupId: g.id });
    }
  }
  return out;
}
