import { ComingSoonPage } from "@/components/layout/coming-soon-page";
import { requireProfile } from "@/lib/auth/session";

export default async function DocsPage() {
  await requireProfile();
  return <ComingSoonPage preset="docs" />;
}
