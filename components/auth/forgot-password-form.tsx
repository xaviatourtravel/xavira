"use client";

import { useActionState } from "react";

import { forgotPassword } from "@/actions/auth";
import { AuthAlert, AuthFooterLink } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPassword, null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Lupa Password</CardTitle>
        <CardDescription>
          Masukkan email Anda. Kami akan kirim link untuk reset password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Mengirim..." : "Kirim Link Reset"}
          </Button>
        </form>

        <div className="mt-6">
          <AuthFooterLink href="/login" label="Ingat password?" linkText="Kembali ke login" />
        </div>
      </CardContent>
    </Card>
  );
}
