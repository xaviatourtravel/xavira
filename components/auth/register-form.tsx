"use client";

import { useActionState } from "react";

import { register } from "@/actions/auth";
import { AuthAlert, AuthFooterLink } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrganizationInvitePreview } from "@/lib/team/invites";
import { formatInviteRoleLabel } from "@/lib/team/invites";

type RegisterFormProps = {
  betaJoinMode: boolean;
  invitePreview?: OrganizationInvitePreview | null;
  inviteToken?: string;
  inviteError?: string | null;
};

export function RegisterForm({
  betaJoinMode,
  invitePreview,
  inviteToken,
  inviteError,
}: RegisterFormProps) {
  const [state, formAction, pending] = useActionState(register, null);
  const inviteMode = Boolean(invitePreview && inviteToken);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Daftar Xavira</CardTitle>
        <CardDescription>
          {inviteMode
            ? `Bergabung ke ${invitePreview?.organizationName} sebagai anggota tim.`
            : betaJoinMode
              ? "Buat akun untuk bergabung dengan tim Xavira yang sudah ada."
              : "Buat akun travel agency dan mulai kelola lead dalam hitungan menit."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inviteError && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
            {inviteError}
          </div>
        )}

        {inviteMode && (
          <div className="mb-4 rounded-md border bg-muted/30 p-4 text-sm">
            <p>
              <span className="font-medium">Organisasi:</span>{" "}
              {invitePreview?.organizationName}
            </p>
            <p className="mt-1">
              <span className="font-medium">Role:</span>{" "}
              {invitePreview ? formatInviteRoleLabel(invitePreview.role) : "-"}
            </p>
            <p className="mt-1">
              <span className="font-medium">Email undangan:</span>{" "}
              {invitePreview?.email}
            </p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <AuthAlert state={state} />

          {inviteToken && (
            <input type="hidden" name="inviteToken" value={inviteToken} />
          )}

          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input id="fullName" name="fullName" autoComplete="name" required />
          </div>

          {!betaJoinMode && !inviteMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Nama Travel Agency</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  placeholder="Contoh: Al-Haramain Travel"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Jenis Bisnis</Label>
                <select
                  id="businessType"
                  name="businessType"
                  defaultValue="both"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="umroh">Umroh</option>
                  <option value="halal_tour">Halal Tour</option>
                  <option value="both">Keduanya</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={invitePreview?.email}
              readOnly={inviteMode}
              required
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
              disabled={Boolean(inviteError)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={Boolean(inviteError)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={pending || Boolean(inviteError)}
          >
            {pending
              ? "Memproses..."
              : inviteMode
                ? "Daftar dengan Undangan"
                : betaJoinMode
                  ? "Daftar sebagai anggota tim"
                  : "Daftar"}
          </Button>
        </form>

        <div className="mt-6">
          <AuthFooterLink
            href="/login"
            label="Sudah punya akun?"
            linkText="Masuk"
          />
        </div>
      </CardContent>
    </Card>
  );
}
