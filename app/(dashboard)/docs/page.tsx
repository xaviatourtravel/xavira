import { AccountPageShell } from "@/components/account/account-page-shell";
import { DocsView } from "@/components/account/docs-view";
import { requireProfile } from "@/lib/auth/session";

export default async function DocsPage() {
  await requireProfile();

  return (
    <AccountPageShell
      title="Dokumentasi"
      description="Panduan modul Desklabs untuk tim sales, operasional, dan keuangan."
    >
      <DocsView />
    </AccountPageShell>
  );
}
