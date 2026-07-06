import type { ReactNode } from "react";

import { requireProfile } from "@/lib/auth/session";

export default async function BusinessBrainLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireProfile();

  return children;
}
