import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BookingReadinessSummary } from "@/lib/leads/lead-customer-360";
import { cn } from "@/lib/utils";

export function LeadBookingReadinessCard({
  readiness,
  leadId,
  hasBooking,
  createBookingAction,
}: {
  readiness: BookingReadinessSummary;
  leadId: string;
  hasBooking: boolean;
  createBookingAction?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking readiness</CardTitle>
        <CardDescription>
          {readiness.confirmedCount} of {readiness.totalCount} items confirmed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {readiness.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 rounded-lg border px-3 py-2"
            >
              {item.confirmed ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.confirmed
                    ? item.detail || "Confirmed"
                    : "Not confirmed yet"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {readiness.isReady && !hasBooking ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            Ready to create booking
          </div>
        ) : null}

        {!hasBooking ? (
          createBookingAction ?? (
            <Link
              href={`/bookings/new?lead_id=${leadId}`}
              className={cn(buttonVariants({ size: "sm" }), "w-full")}
            >
              Create booking
            </Link>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            This lead already has a linked booking.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
