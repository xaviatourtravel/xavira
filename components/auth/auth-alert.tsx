import Link from "next/link";

import type { AuthFormState } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

export function AuthAlert({ state }: { state: AuthFormState }) {
  if (!state) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        state.success
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
      role="alert"
    >
      {state.success ? state.message : state.error}
    </div>
  );
}

export function AuthFooterLink({
  href,
  label,
  linkText,
}: {
  href: string;
  label: string;
  linkText: string;
}) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {label}{" "}
      <Link href={href} className="font-medium text-primary hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
