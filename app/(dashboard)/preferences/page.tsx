import { AccountPageShell } from "@/components/account/account-page-shell";
import { PreferencesForm } from "@/components/account/preferences-form";
import { requireProfile } from "@/lib/auth/session";

export default async function PreferencesPage() {
  await requireProfile();

  return (
    <AccountPageShell
      title="Preferensi"
      description="Sesuaikan bahasa, tampilan, dan format regional workspace Anda."
    >
      <PreferencesForm />
    </AccountPageShell>
  );
}
