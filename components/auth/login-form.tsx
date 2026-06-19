"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { login } from "@/actions/auth";
import { AuthAlert, AuthFooterLink } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site";

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Masuk ke {siteConfig.name}</CardTitle>
        <CardDescription>
          {siteConfig.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <AuthAlert state={state} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nama@travel.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
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
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-6">
          <AuthFooterLink
            href="/register"
            label="Belum punya akun?"
            linkText="Daftar sekarang"
          />
        </div>
      </CardContent>
    </Card>
  );
}
