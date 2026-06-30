"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { getUserFriendlyErrorMessage } from "@/lib/errors/get-user-friendly-error-message";
import { logServerError } from "@/lib/errors/log-server-error";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  logServerError("dashboard-error-boundary", error);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 rounded-lg border bg-background p-6">
      <BrandLogo variant="icon" size="md" />
      <div>
        <h2 className="text-lg font-semibold">Terjadi gangguan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {getUserFriendlyErrorMessage(error)}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Coba Lagi
      </button>
    </div>
  );
}
