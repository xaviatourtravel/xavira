"use client";

import Link from "next/link";

import { useTranslation } from "@/lib/i18n/use-translation";

export function WorkspaceBrandingBreadcrumb() {
  const { tStrict } = useTranslation();

  return (
    <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link href="/settings?section=general" className="hover:text-foreground">
        {tStrict("orgBrandingUi.breadcrumbSettings")}
      </Link>
      <span className="mx-2">/</span>
      <span className="text-foreground">
        {tStrict("orgBrandingUi.breadcrumbBranding")}
      </span>
    </nav>
  );
}
