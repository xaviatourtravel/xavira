export type BookingPaymentLike = {
  payment_type: string;
  amount: number;
  payment_date?: string | null;
};

export function isDownPaymentType(paymentType: string) {
  return paymentType === "dp" || paymentType === "down_payment";
}

export function sumBookingPayments(payments: BookingPaymentLike[]) {
  return payments.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
}

export function sumDownPayments(payments: BookingPaymentLike[]) {
  return payments
    .filter((payment) => isDownPaymentType(payment.payment_type))
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
}

export function getOutstandingBalance(
  totalAmount: number,
  payments: BookingPaymentLike[],
) {
  return Number(totalAmount) - sumBookingPayments(payments);
}

export function getLastPaymentDate(payments: BookingPaymentLike[]) {
  const datedPayments = payments
    .map((payment) => payment.payment_date)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left));

  return datedPayments[0] ?? null;
}

export function buildBookingPaymentTotals(
  totalAmount: number,
  payments: BookingPaymentLike[],
) {
  const amountPaid = sumBookingPayments(payments);
  const dpAmount = sumDownPayments(payments);
  const outstandingBalance = getOutstandingBalance(totalAmount, payments);

  return {
    amountPaid,
    dpAmount,
    outstandingBalance,
    lastPaymentDate: getLastPaymentDate(payments),
  };
}
