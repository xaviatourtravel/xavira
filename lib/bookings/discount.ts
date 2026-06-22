export function normalizeDiscountAmount(value: number | null | undefined) {
  if (value == null || Number.isNaN(value) || value < 0) {
    return 0;
  }

  return value;
}

export function resolveBookingSubtotal(
  subtotalAmount: number | null | undefined,
  totalAmount: number | null | undefined,
  discountAmount: number | null | undefined,
) {
  const normalizedSubtotal = Number(subtotalAmount ?? 0);
  const normalizedTotal = Number(totalAmount ?? 0);
  const normalizedDiscount = normalizeDiscountAmount(discountAmount);

  if (normalizedSubtotal > 0) {
    return normalizedSubtotal;
  }

  if (normalizedDiscount > 0) {
    return normalizedTotal + normalizedDiscount;
  }

  return normalizedTotal;
}

export function calculateBookingFinalTotal(
  subtotalAmount: number,
  discountAmount: number,
) {
  const subtotal = Math.max(0, Number(subtotalAmount));
  const discount = normalizeDiscountAmount(discountAmount);
  const cappedDiscount = Math.min(discount, subtotal);

  return Math.max(0, subtotal - cappedDiscount);
}

export function validateBookingDiscount(
  subtotalAmount: number,
  discountAmount: number,
) {
  const subtotal = Number(subtotalAmount);
  const discount = normalizeDiscountAmount(discountAmount);

  if (Number.isNaN(subtotal) || subtotal < 0) {
    return "Subtotal tidak valid";
  }

  if (Number.isNaN(discount) || discount < 0) {
    return "Discount amount must be 0 or greater";
  }

  if (discount > subtotal) {
    return "Discount cannot exceed subtotal";
  }

  return null;
}
