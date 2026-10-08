import { apiRequest } from "@/lib/api-client";

export interface AuditLogItem {
  id: string;
  actor: string;
  email: string;
  action: string;
  module: string;
  ip_address: string;
  status: "success" | "warning" | "error";
  timestamp: string;
  details: string;
}

export interface SystemSettingsData {
  company_name: string;
  allow_registration: boolean;
  require_approval: boolean;
  email_notifications: boolean;
  session_timeout: number;
  updated_at?: string;
}

export const systemService = {
  auditLogs: () => apiRequest<AuditLogItem[]>("/admin/audit-logs"),
  settings: () => apiRequest<SystemSettingsData>("/admin/settings"),
  updateSettings: (payload: SystemSettingsData) =>
    apiRequest<SystemSettingsData>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
