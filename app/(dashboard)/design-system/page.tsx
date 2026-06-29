import { DesignSystemShowcase } from "@/components/design-system/design-system-showcase";
import { requireProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Design System · Desklabs",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DesignSystemPage() {
  await requireProfile();

  return <DesignSystemShowcase />;
}
