import { AccountPageShell } from "@/components/account/account-page-shell";
import { HelpView } from "@/components/account/help-view";
import { requireProfile } from "@/lib/auth/session";

export default async function HelpPage() {
  await requireProfile();

  return (
    <AccountPageShell
      title="Bantuan"
      description="Jawaban cepat untuk alur kerja yang paling sering digunakan."
    >
      <HelpView />
    </AccountPageShell>
  );
}
