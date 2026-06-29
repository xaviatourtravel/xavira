import { AccountPageShell } from "@/components/account/account-page-shell";
import { ProfileForm } from "@/components/account/profile-form";
import { requireProfile } from "@/lib/auth/session";

export default async function ProfilePage() {
  const { user, profile } = await requireProfile();

  return (
    <AccountPageShell
      title="Profil Saya"
      description="Kelola informasi akun dan identitas Anda di Desklabs."
    >
      <ProfileForm profile={profile} email={user.email ?? ""} />
    </AccountPageShell>
  );
}
