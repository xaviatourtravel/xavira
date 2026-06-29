"use client";

import type { ComponentProps } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { DesklabsSpinner } from "@/components/ui/desklabs-loading";
import { cn } from "@/lib/utils";

export { buttonVariants };

type DesklabsButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingLabel?: string;
};

export function DesklabsButton({
  loading = false,
  loadingLabel = "Memproses...",
  disabled,
  children,
  className,
  ...props
}: DesklabsButtonProps) {
  return (
    <Button
      disabled={disabled || loading}
      className={cn("gap-2", className)}
      {...props}
    >
      {loading ? <DesklabsSpinner size="sm" label={loadingLabel} /> : null}
      {loading ? loadingLabel : children}
    </Button>
  );
}
