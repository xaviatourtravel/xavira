import { AccountPageShell } from "@/components/account/account-page-shell";
import { SupportForm } from "@/components/account/support-form";
import { requireProfile } from "@/lib/auth/session";

export default async function SupportPage() {
  const { user, profile } = await requireProfile();

  return (
    <AccountPageShell
      title="Hubungi Support"
      description="Kirim pertanyaan atau laporan kendala ke tim Desklabs."
    >
      <SupportForm
        defaultName={profile.full_name?.trim() || ""}
        defaultEmail={user.email ?? ""}
      />
    </AccountPageShell>
  );
}
