"use client";

import React from "react";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

// Previously a local-only form that showed a success toast without saving anything.
export default function AdminNotificationSettingsPage() {
  return <NotificationPreferencesPanel title="Cài Đặt Thông Báo" />;
}
