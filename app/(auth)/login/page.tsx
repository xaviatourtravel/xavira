import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

function LoginAlerts({
  searchParams,
}: {
  searchParams: { message?: string; error?: string };
}) {
  const error = searchParams.error
    ? decodeURIComponent(searchParams.error)
    : null;
  const message = searchParams.message
    ? decodeURIComponent(searchParams.message)
    : null;

  if (!error && !message) {
    return null;
  }

  return (
    <div className="mb-5 space-y-3">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      cardSubtitle="Kelola customer, komunikasi, operasional, dan keuangan dalam satu platform."
      showLegalFooter
    >
      <LoginAlerts searchParams={params} />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
