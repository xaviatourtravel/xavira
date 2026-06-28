import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterWorkspaceForm } from "@/components/auth/register-workspace-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  const inviteToken = params.invite?.trim();

  if (inviteToken) {
    redirect(`/invite/${encodeURIComponent(inviteToken)}`);
  }

  return (
    <AuthShell cardSubtitle="Buat akun Desklabs. Setup workspace akan dilakukan setelah registrasi.">
      <RegisterWorkspaceForm />
    </AuthShell>
  );
}
