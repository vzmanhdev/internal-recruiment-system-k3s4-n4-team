/**
 * Central route-policy registry.
 *
 * Declares, for every page, which backend permissions it needs. The DECISION is always made by the
 * backend (`GET /auth/route-access`, called from `src/proxy.ts` before a page renders). The same
 * declarations drive Sidebar visibility, so a menu item is shown exactly when its route is allowed.
 *
 * Rules:
 *  - `public`        → no authentication.
 *  - `auth`          → any authenticated, active session.
 *  - `all` / `any`   → every code in `all` AND at least one in `any` (backend effective permissions).
 *  - A path under a protected prefix with no entry here is DENIED (default deny).
 */

export type Workspace = "admin" | "hr" | "recruiter" | "manager" | "interviewer" | "approver" | "employee" | "candidate";

export interface RoutePolicy {
  pattern: string; // "/hr/candidates/[id]"
  public?: boolean;
  auth?: boolean;
  workspace?: Workspace;
  all?: string[];
  any?: string[];
}

const ws = (workspace: Workspace, extraAll: string[] = [], any?: string[]) => ({
  workspace,
  all: [`workspace:${workspace}:access`, ...extraAll],
  ...(any ? { any } : {}),
});

const entries: Array<[string, Omit<RoutePolicy, "pattern">]> = [
  // ---------------------------------------------------------------- public pages
  ["/", { public: true }],
  ["/faq", { public: true }],
  ["/process", { public: true }],
  ["/login", { public: true }],
  ["/register", { public: true }],
  ["/forgot-password", { public: true }],
  ["/unauthorized", { public: true }],
  ["/forbidden", { public: true }],
  ["/ui-preview", { public: true }],
  // candidate portal: job board, apply and status lookup are public (S4-01…S4-05)
  ["/candidate/jobs", { public: true }],
  ["/candidate/jobs/[id]", { public: true }],
  ["/candidate/apply/[id]", { public: true }],
  ["/candidate/track", { public: true }],
  ["/candidate/tracking", { public: true }],
  ["/candidate/interview/[id]", { public: true }],
  ["/candidate/offer/[id]", { public: true }],
  ["/candidate/withdraw/[id]", { public: true }],
  // candidate self-service (signed-in applicant with the candidate role)
  ["/candidate", ws("candidate")],
  ["/candidate/applications", ws("candidate")],
  ["/candidate/interviews", ws("candidate")],
  ["/candidate/offers", ws("candidate")],
  ["/candidate/profile", ws("candidate")],
  ["/candidate/settings", ws("candidate")],

  // ---------------------------------------------------------------- unified overview
  ["/workspace", { auth: true }],

  // ---------------------------------------------------------------- admin
  ["/admin", ws("admin")],
  ["/admin/dashboard", ws("admin")],
  ["/admin/users", ws("admin", ["user:view"])],
  ["/admin/users/import", ws("admin", ["user:view", "user:create"])],
  ["/admin/roles", ws("admin", ["permission:manage"])],
  ["/admin/permissions", ws("admin", ["permission:manage"])],
  ["/admin/audit-logs", ws("admin", ["audit:view"])],
  ["/admin/master-data", ws("admin", ["master_data:manage"])],
  ["/admin/notification-settings", ws("admin")],
  ["/admin/profile", ws("admin")],

  // ---------------------------------------------------------------- HR
  ["/hr", ws("hr")],
  ["/hr/dashboard", ws("hr")],
  ["/hr/requisitions", ws("hr", ["requisition:view"])],
  ["/hr/requisitions/[id]", ws("hr", ["requisition:view"])],
  ["/hr/approvals", ws("hr", ["requisition:approve"])],
  ["/hr/job-postings", ws("hr", ["requisition:view"])],
  ["/hr/jobs", ws("hr", ["requisition:view"])],
  ["/hr/candidates", ws("hr", ["candidate:view"])],
  ["/hr/candidates/[id]", ws("hr", ["candidate:view"])],
  ["/hr/talent-pool", ws("hr", ["candidate:view"])],
  ["/hr/interviews", ws("hr", ["interview:view"])],
  ["/hr/evaluations", ws("hr", ["interview:view"])],
  ["/hr/interview-questions", ws("hr", ["interview:view", "master_data:manage"])],
  ["/hr/offers", ws("hr", ["offer:view"])],
  ["/hr/onboarding", ws("hr", ["offer:view"])],
  ["/hr/reports", ws("hr", ["report:view"])],
  ["/hr/automation/email-templates", ws("hr", ["email:manage"])],
  ["/hr/automation/email-logs", ws("hr", ["email:manage"])],
  ["/hr/automation/templates", ws("hr", ["email:manage"])],
  ["/hr/email-templates", ws("hr", ["email:manage"])],
  ["/hr/master-data/departments", ws("hr", ["master_data:manage"])],
  ["/hr/master-data/positions", ws("hr", ["master_data:manage"])],
  ["/hr/master-data/competencies", ws("hr", ["master_data:manage"])],
  ["/hr/master-data/headcount", ws("hr", ["master_data:manage"])],
  ["/hr/master-data/approval-flows", ws("hr", ["master_data:manage"])],
  ["/hr/master-data/lookups", ws("hr", ["master_data:manage"])],
  ["/hr/categories", ws("hr", ["master_data:manage"])],
  ["/hr/competencies", ws("hr", ["master_data:manage"])],
  ["/hr/career-page-config", ws("hr", ["master_data:manage"])],

  // ---------------------------------------------------------------- recruiter
  ["/recruiter", ws("recruiter")],
  ["/recruiter/jobs", ws("recruiter", ["requisition:view"])],
  ["/recruiter/candidates", ws("recruiter", ["candidate:view"])],
  ["/recruiter/candidates/[id]", ws("recruiter", ["candidate:view"])],
  ["/recruiter/pipeline", ws("recruiter", ["candidate:view"])],
  ["/recruiter/interviews", ws("recruiter", ["interview:view"])],
  ["/recruiter/offers", ws("recruiter", ["offer:view"])],
  ["/recruiter/profile", ws("recruiter")],

  // ---------------------------------------------------------------- hiring manager
  ["/manager", ws("manager")],
  ["/manager/requisitions", ws("manager", ["requisition:view"])],
  ["/manager/requisitions/[id]", ws("manager", ["requisition:view"])],
  ["/manager/approvals", ws("manager", ["requisition:view"])],
  ["/manager/pipeline", ws("manager", ["candidate:view"])],
  ["/manager/evaluations", ws("manager", ["candidate:view"])],
  ["/manager/interviews", ws("manager", ["interview:view"])],
  ["/manager/notifications", ws("manager")],
  ["/manager/profile", ws("manager")],
  ["/manager/settings", ws("manager")],

  // ---------------------------------------------------------------- interviewer
  ["/interviewer", ws("interviewer")],
  ["/interviewer/schedule", ws("interviewer", ["interview:view"])],
  ["/interviewer/evaluations/pending", ws("interviewer", ["interview:evaluate"])],
  ["/interviewer/evaluations/history", ws("interviewer", ["interview:evaluate"])],
  ["/interviewer/evaluations/[id]", ws("interviewer", ["interview:evaluate"])],
  ["/interviewer/live/[id]", ws("interviewer", ["interview:evaluate"])],
  ["/interviewer/questions", ws("interviewer", ["interview:view"])],
  ["/interviewer/frameworks", ws("interviewer", ["interview:view"])],
  ["/interviewer/profile", ws("interviewer")],
  ["/interviewer/settings", ws("interviewer")],

  // ---------------------------------------------------------------- approver
  ["/approver", ws("approver")],
  ["/approver/requisitions", ws("approver", ["requisition:approve"])],
  ["/approver/offers", ws("approver", ["offer:approve"])],
  ["/approver/history", ws("approver", [], ["requisition:approve", "offer:approve"])],
  ["/approver/profile", ws("approver")],
  ["/approver/settings", ws("approver")],

  // ---------------------------------------------------------------- employee portal
  ["/employee", ws("employee")],
  ["/employee/dashboard", ws("employee")],
  ["/employee/jobs", ws("employee")],
  ["/employee/interviews", ws("employee")],
  ["/employee/referrals", ws("employee")],
  ["/employee/referrals/new", ws("employee")],
  ["/employee/notifications", ws("employee")],
  ["/employee/notification-settings", ws("employee")],
  ["/employee/profile", ws("employee")],
  ["/employee/settings", ws("employee")],
];

export const ROUTE_POLICIES: RoutePolicy[] = entries.map(([pattern, p]) => ({ pattern, ...p }));

/** Prefixes whose pages are never public unless an entry above says so. */
export const PROTECTED_PREFIXES = ["/admin", "/hr", "/recruiter", "/manager", "/interviewer", "/approver", "/employee", "/candidate", "/workspace"];

const compiled = ROUTE_POLICIES.map((p) => ({
  policy: p,
  re: new RegExp("^" + p.pattern.replace(/\[[^/\]]+\]/g, "[^/]+").replace(/\//g, "\\/") + "\\/?$"),
}));

export function normalizePath(pathname: string): string {
  const clean = pathname.split("?")[0].split("#")[0];
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

/** The policy for a concrete path, or null when none is declared. */
export function policyFor(pathname: string): RoutePolicy | null {
  const path = normalizePath(pathname);
  const hit = compiled.find((c) => c.re.test(path));
  return hit ? hit.policy : null;
}

export function isProtectedPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

/**
 * Client-side evaluation for NAVIGATION ONLY (which links to show). It mirrors the backend rule
 * (admin full allow, all + any) but grants nothing: the proxy and every API re-check on the server.
 */
export function canSee(policy: RoutePolicy | null, permissions: ReadonlySet<string>, isAdmin: boolean): boolean {
  if (!policy) return false;
  if (policy.public || policy.auth) return true;
  if (isAdmin) return true;
  if ((policy.all || []).some((c) => !permissions.has(c))) return false;
  if (policy.any && policy.any.length && !policy.any.some((c) => permissions.has(c))) return false;
  return true;
}
