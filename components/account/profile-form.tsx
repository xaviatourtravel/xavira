"use client";

import { useActionState } from "react";

import { AccountCard } from "@/components/account/account-card";
import { formatProfileRoleLabel } from "@/components/layout/user-avatar";
import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import { DesklabsButton } from "@/components/ui/desklabs-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/account/actions";
import type { Profile } from "@/types/app-types";

type ProfileFormProps = {
  profile: Profile;
  email: string;
};

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, null);
  const displayName = profile.full_name?.trim() || "Pengguna";

  return (
    <form action={formAction} className="space-y-6">
      {state?.message ? (
        <div
          className={
            state.success
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          }
        >
          {state.message}
        </div>
      ) : null}

      <AccountCard title="Informasi Profil">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <DesklabsAvatar
            name={displayName}
            imageUrl={profile.avatar_url}
            size="xl"
            shape="rounded"
            fallbackClassName="bg-slate-900 text-white"
          />

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                required
                minLength={2}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={email}
                readOnly
                disabled
                className="h-11 bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                value={formatProfileRoleLabel(profile.role)}
                readOnly
                disabled
                className="h-11 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </AccountCard>

      <div className="flex justify-end">
        <DesklabsButton
          type="submit"
          loading={pending}
          loadingLabel="Menyimpan..."
          className="h-11 w-full sm:w-auto"
        >
          Simpan Perubahan
        </DesklabsButton>
      </div>
    </form>
  );
}
