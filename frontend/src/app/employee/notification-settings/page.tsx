"use client";

import React from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

export default function EmployeeNotificationSettingsPage() {
  return (
    <EmployeeAppShell activeTab="notification-settings">
      <NotificationPreferencesPanel title="Cài Đặt Thông Báo Nhân Viên" />
    </EmployeeAppShell>
  );
}
