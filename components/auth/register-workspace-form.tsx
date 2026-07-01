"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerWorkspace } from "@/actions/auth";
import { AuthAlert } from "@/components/auth/auth-alert";
import { DesklabsButton } from "@/components/ui/desklabs-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterWorkspaceForm() {
  const [state, formAction, pending] = useActionState(registerWorkspace, null);

  return (
    <>
      <form action={formAction} className="space-y-4">
        <AuthAlert state={state} />

        <div className="space-y-2">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
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
          className="mt-2 h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          loading={pending}
          loadingLabel="Memproses..."
        >
          Buat Akun
        </DesklabsButton>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center">
        <p className="text-sm text-muted-foreground">Sudah punya akun?</p>
        <Link
          href="/login"
          className="mt-1 inline-flex text-sm font-semibold text-primary hover:text-primary/80"
        >
          Masuk →
        </Link>
      </div>
    </>
  );
}
