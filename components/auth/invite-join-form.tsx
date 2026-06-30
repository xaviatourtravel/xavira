"use client";

import { useActionState } from "react";
import Link from "next/link";

import { joinWorkspaceViaInvite } from "@/actions/auth";
import { AuthAlert } from "@/components/auth/auth-alert";
import type { OrganizationInvitePreview } from "@/lib/team/invites";
import { formatInviteRoleLabel } from "@/lib/team/invites";
import { DesklabsButton } from "@/components/ui/desklabs-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteJoinFormProps = {
  invitePreview: OrganizationInvitePreview;
  inviteToken: string;
};

export function InviteJoinForm({
  invitePreview,
  inviteToken,
}: InviteJoinFormProps) {
  const [state, formAction, pending] = useActionState(joinWorkspaceViaInvite, null);

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Workspace:</span>{" "}
            {invitePreview.organizationName}
          </p>
          <p className="mt-1">
            <span className="font-medium text-foreground">Peran:</span>{" "}
            {formatInviteRoleLabel(invitePreview.role)}
          </p>
          <p className="mt-1">
            <span className="font-medium text-foreground">Email undangan:</span>{" "}
            {invitePreview.email}
          </p>
      </div>

      <form action={formAction} className="space-y-4">
        <AuthAlert state={state} />
        <input type="hidden" name="inviteToken" value={inviteToken} />

        <div className="space-y-2">
          <Label htmlFor="fullName">Nama</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-11"
          />
        </div>

        <DesklabsButton
          type="submit"
          className="h-11 w-full"
          loading={pending}
          loadingLabel="Memproses..."
        >
          Gabung Workspace
        </DesklabsButton>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center">
        <p className="text-sm text-muted-foreground">Sudah punya akun?</p>
        <Link
          href="/login"
          className="mt-1 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          Masuk →
        </Link>
      </div>
    </>
  );
}
