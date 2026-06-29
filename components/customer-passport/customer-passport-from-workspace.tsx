"use client";

import { useMemo } from "react";

import { CustomerPassportPanel } from "@/components/customer-passport/customer-passport-panel";
import { mapPassportFromWorkspace } from "@/lib/customer-passport/map-from-workspace";
import type { CustomerPassportVariant } from "@/lib/customer-passport/types";
import type { CustomerWorkspaceData } from "@/lib/customers/load-customer-workspace";

type CustomerPassportFromWorkspaceProps = {
  data: CustomerWorkspaceData;
  variant?: CustomerPassportVariant;
  className?: string;
};

export function CustomerPassportFromWorkspace({
  data,
  variant = "full",
  className,
}: CustomerPassportFromWorkspaceProps) {
  const passport = useMemo(() => mapPassportFromWorkspace(data), [data]);

  return (
    <CustomerPassportPanel
      passport={passport}
      variant={variant}
      className={className}
    />
  );
}
