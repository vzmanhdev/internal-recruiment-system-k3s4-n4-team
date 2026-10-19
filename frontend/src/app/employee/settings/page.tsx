"use client";

import { NotificationPreferencesView } from "@/components/personal/NotificationPreferencesView";

// Real per-user notification preferences (S8-04), shared by every workspace.
export default function NotificationSettingsPage() {
  return <NotificationPreferencesView />;
}
