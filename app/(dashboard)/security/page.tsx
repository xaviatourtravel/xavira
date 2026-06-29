import { AccountPageShell } from "@/components/account/account-page-shell";
import { SecurityView } from "@/components/account/security-view";
import { requireProfile } from "@/lib/auth/session";

export default async function SecurityPage() {
  const { user } = await requireProfile();

  return (
    <AccountPageShell
      title="Keamanan"
      description="Kelola password, sesi login, dan perlindungan akun."
    >
      <SecurityView email={user.email ?? ""} />
    </AccountPageShell>
  );
}
