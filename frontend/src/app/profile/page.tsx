import { AccountWorkspaceShell } from "@/components/layout/AccountWorkspaceShell";
import { ProfileEditor } from "@/features/auth/components/ProfileEditor";

export default function ProfilePage() {
  return (
    <AccountWorkspaceShell>
      <section className="py-2">
        <div className="mx-auto mb-7 max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-sm text-slate-500">Cập nhật ảnh đại diện và thông tin liên hệ của bạn.</p>
        </div>
        <ProfileEditor />
      </section>
    </AccountWorkspaceShell>
  );
}
