import { BookingWorkspacePage } from "@/components/booking-workspace/booking-workspace-page";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <BookingWorkspacePage bookingId={id} />;
}
