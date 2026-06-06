export function calculateBookingTotalAmount(
  pricePerPax: number | null | undefined,
  totalPax: number,
): number {
  if (pricePerPax == null || pricePerPax < 0) {
    return 0;
  }

  return Number(pricePerPax) * totalPax;
}
