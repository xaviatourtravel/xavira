import { ComingSoonCreateView } from "@/components/layout/coming-soon-create-view";
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

  return (
    <ComingSoonCreateView
      title="Booking Baru"
      description="Buat booking customer dari workspace Desklabs. Form ini akan terhubung ke profil customer dan alur pembayaran."
      backHref={backHref}
      backLabel={params.lead_id ? "Kembali ke customer" : "Kembali ke booking"}
    />
  );
}
