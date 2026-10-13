"use client";

import { ProfileView } from "@/components/personal/ProfileView";

// Real profile of the signed-in user (shared by every workspace; no per-role demo data).
export default function ProfilePage() {
  return <ProfileView />;
}
