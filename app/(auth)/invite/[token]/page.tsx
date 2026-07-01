import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { InviteJoinForm } from "@/components/auth/invite-join-form";
import {
  getOrganizationInviteByToken,
  getOrganizationInvitePreview,
  getInviteValidationError,
} from "@/lib/team/invites";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const inviteToken = token.trim();
  const invite = inviteToken
    ? await getOrganizationInviteByToken(inviteToken)
    : null;
  const inviteError = getInviteValidationError(invite);
  const invitePreview = inviteError
    ? null
    : await getOrganizationInvitePreview(inviteToken);

  if (!invitePreview) {
    return (
      <AuthShell cardSubtitle="Anda diundang bergabung ke workspace.">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {inviteError ?? "Undangan tidak ditemukan."}
        </div>
        <div className="mt-6 border-t border-slate-100 pt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            Kembali ke halaman masuk →
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell cardSubtitle="Anda diundang bergabung ke workspace.">
      <InviteJoinForm
        invitePreview={invitePreview}
        inviteToken={inviteToken}
      />
    </AuthShell>
  );
}
