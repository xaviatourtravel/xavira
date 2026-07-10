"use client";

import { useMemo } from "react";

import {
  bookingWorkspaceEn,
  bookingWorkspaceId,
} from "@/lib/i18n/booking-workspace-dictionary";
import { useTranslation } from "@/lib/i18n/use-translation";

import { BookingWorkspace } from "./booking-workspace";
import { buildMockBookingWorkspace } from "./mock-booking-workspace";
import type { BookingWorkspaceData, BookingWorkspaceLabels } from "./types";

type BookingWorkspacePageProps = {
  bookingId: string;
  data?: BookingWorkspaceData;
  className?: string;
};

export function BookingWorkspacePage({
  bookingId,
  data,
  className,
}: BookingWorkspacePageProps) {
  const { locale } = useTranslation();

  const workspaceData = useMemo(
    () => data ?? buildMockBookingWorkspace(bookingId),
    [bookingId, data],
  );

  const labels = useMemo<BookingWorkspaceLabels>(() => {
    const dictionary = locale === "id" ? bookingWorkspaceId : bookingWorkspaceEn;
    return { ...dictionary };
  }, [locale]);

  return (
    <BookingWorkspace data={workspaceData} labels={labels} className={className} />
  );
}
