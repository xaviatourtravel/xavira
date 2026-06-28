"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { login } from "@/actions/auth";
import { AuthAlert } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "";
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <>
      <form action={formAction} className="space-y-5">
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}
        <AuthAlert state={state} />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@perusahaan.com"
            required
            className="h-11 border-slate-200 bg-white"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-violet-700 hover:text-violet-900"
            >
              Lupa password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 border-slate-200 bg-white"
          />
        </div>

        <Button
          type="submit"
          className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800"
          disabled={pending}
        >
          {pending ? "Memproses..." : "Masuk"}
        </Button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-6 text-center">
        <p className="text-sm text-slate-500">Belum punya workspace?</p>
        <Link
          href="/register"
          className="mt-1 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900"
        >
          Daftar gratis →
        </Link>
      </div>
    </>
  );
}
