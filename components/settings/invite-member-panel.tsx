"use client";

import { useState, useTransition } from "react";

import { createOrganizationInvite } from "@/app/(dashboard)/settings/team/actions";
import { DesklabsButton } from "@/components/ui/desklabs-button";
import { INVITE_ROLES, formatInviteRoleLabel } from "@/lib/team/invites";

export function InviteMemberPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setInviteUrl(null);
    setCopyFeedback(null);

    startTransition(async () => {
      const result = await createOrganizationInvite(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setInviteUrl(result.inviteUrl ?? null);
    });
  }

  async function handleCopyInviteUrl() {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyFeedback("Link undangan berhasil disalin.");
    } catch {
      setCopyFeedback("Gagal menyalin link undangan.");
    }

    window.setTimeout(() => {
      setCopyFeedback(null);
    }, 3000);
  }

  return (
    <div className="rounded-xl border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Invite Member</h2>
          <p className="text-sm text-muted-foreground">
            Buat link undangan untuk menambah anggota ke organisasi yang sama.
          </p>
        </div>

        <DesklabsButton
          type="button"
          variant={isOpen ? "outline" : "default"}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? "Tutup" : "Invite Member"}
        </DesklabsButton>
      </div>

      {isOpen && (
        <form action={handleSubmit} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="invite_email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="invite_email"
                name="email"
                type="email"
                required
                placeholder="sales@agency.com"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="invite_role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="invite_role"
                name="role"
                defaultValue="agent"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              >
                {INVITE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {formatInviteRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DesklabsButton type="submit" loading={isPending} loadingLabel="Memproses...">
            Buat Undangan
          </DesklabsButton>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {inviteUrl && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">Link undangan siap dibagikan</p>
              <input
                readOnly
                value={inviteUrl}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <DesklabsButton type="button" variant="outline" onClick={handleCopyInviteUrl}>
                  Salin Link
                </DesklabsButton>
              </div>
              {copyFeedback && (
                <p
                  className={
                    copyFeedback.includes("Gagal")
                      ? "text-xs text-red-600"
                      : "text-xs text-green-700"
                  }
                >
                  {copyFeedback}
                </p>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
