import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { siteConfig } from "@/config/site";
import { isBetaJoinModeActive } from "@/lib/auth/beta-onboarding";
import {
  getOrganizationInviteByToken,
  getOrganizationInvitePreview,
  getInviteValidationError,
} from "@/lib/team/invites";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  const inviteToken = params.invite?.trim() ?? "";
  const betaJoinMode = isBetaJoinModeActive();

  let invitePreview = null;
  let inviteError: string | null = null;

  if (inviteToken) {
    const invite = await getOrganizationInviteByToken(inviteToken);
    inviteError = getInviteValidationError(invite);
    invitePreview = inviteError
      ? null
      : await getOrganizationInvitePreview(inviteToken);
  }

  const useBetaJoinMode = betaJoinMode && !inviteToken;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-xl font-semibold">
        {siteConfig.name}
      </Link>
      <RegisterForm
        betaJoinMode={useBetaJoinMode}
        invitePreview={invitePreview}
        inviteToken={invitePreview ? inviteToken : undefined}
        inviteError={inviteToken ? inviteError : null}
      />
    </div>
  );
}
