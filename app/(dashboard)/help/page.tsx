import { ComingSoonPage } from "@/components/layout/coming-soon-page";
import { requireProfile } from "@/lib/auth/session";

export default async function HelpPage() {
  await requireProfile();
  return <ComingSoonPage preset="help" />;
}
