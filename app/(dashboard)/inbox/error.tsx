"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";
import {
  createInboxDiagnosticId,
  logInboxFailure,
} from "@/modules/inbox/lib/inbox-observability";

/**
 * Narrow Inbox route error boundary.
 * Keeps recovery inside /inbox; does not expose raw error.message.
 */
export default function InboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { ti } = useInboxTranslation();

  useEffect(() => {
    const diagnosticId = createInboxDiagnosticId();
    logInboxFailure({
      operation: "load_inbox",
      stage: "build_view_model",
      diagnosticId,
      error,
      message: "Inbox route error boundary caught render failure",
      errorCode: error.digest ?? null,
    });
  }, [error]);

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col items-start justify-center gap-4 px-6 py-10">
      <div>
        <h2 className="text-lg font-semibold">{ti("inboxBoundaryTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {ti("inboxBoundaryDesc")}
        </p>
        {error.digest ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {ti("conversationLoadFailedReference")}: {error.digest}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={reset}>
          {ti("inboxBoundaryRetry")}
        </Button>
        <Link
          href="/inbox"
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
        >
          {ti("conversationLoadFailedBack")}
        </Link>
      </div>
    </div>
  );
}
