import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/session";

export default async function FinanceInvoicesPage() {
  await requireProfile();
  redirect("/revenue");
}
