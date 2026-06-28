import { ComingSoonWorkspace } from "@/components/layout/coming-soon-workspace";
import {
  COMING_SOON_PRESETS,
  resolveComingSoonPreset,
} from "@/lib/navigation/coming-soon-presets";
import { requireProfile } from "@/lib/auth/session";

type NewBookingPageProps = {
  searchParams: Promise<{
    lead_id?: string;
  }>;
};

export default async function NewBookingPage({ searchParams }: NewBookingPageProps) {
  await requireProfile();
  const params = await searchParams;
  const backHref = params.lead_id ? `/leads/${params.lead_id}` : "/bookings";
  const backLabel = params.lead_id ? "Kembali ke customer" : "Kembali ke Booking";

  const preset = resolveComingSoonPreset({
    ...COMING_SOON_PRESETS.newBooking,
    primaryActionHref: backHref,
    primaryActionLabel: backLabel,
  });

  return <ComingSoonWorkspace {...preset} />;
}
