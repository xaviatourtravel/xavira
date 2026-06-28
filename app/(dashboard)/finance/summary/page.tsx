import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";

export default async function FinanceSummaryPage() {
  await requireProfile();
  redirect("/revenue");
}
