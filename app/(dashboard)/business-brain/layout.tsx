import type { ReactNode } from "react";

import { BusinessBrainLayoutShell } from "@/modules/business-brain/components/business-brain-layout-shell";
import { requireProfile } from "@/lib/auth/session";

export default async function BusinessBrainLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireProfile();

  return <BusinessBrainLayoutShell>{children}</BusinessBrainLayoutShell>;
}
