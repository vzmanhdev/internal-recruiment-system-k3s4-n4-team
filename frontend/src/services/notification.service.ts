import { apiRequest } from "@/lib/api-client";

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at?: string;
}

export interface NotificationPreferenceItem {
  type: string;
  label: string;
  mandatory: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
}

export const notificationService = {
  async list(unreadOnly = false): Promise<{ items: NotificationItem[]; unread_count: number }> {
    return apiRequest(`/notifications${unreadOnly ? "?unread_only=true" : ""}`);
  },

  async unreadCount(): Promise<number> {
    const res = await apiRequest<{ unread_count: number }>("/notifications/unread-count");
    return res.unread_count;
  },

  async markRead(id: number): Promise<NotificationItem> {
    return apiRequest(`/notifications/${id}/read`, { method: "POST" });
  },

  async markAllRead(): Promise<{ updated: number }> {
    return apiRequest("/notifications/read-all", { method: "POST" });
  },

  async getPreferences(): Promise<NotificationPreferenceItem[]> {
    return apiRequest("/notifications/preferences");
  },

  async savePreferences(items: Array<Pick<NotificationPreferenceItem, "type" | "in_app_enabled" | "email_enabled">>): Promise<NotificationPreferenceItem[]> {
    return apiRequest("/notifications/preferences", { method: "PUT", body: JSON.stringify({ items }) });
  },
};
