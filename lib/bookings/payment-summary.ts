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

export function getDpRequiredAmount(totalAmount: number) {
  return Math.round(Number(totalAmount) * 0.35);
}

const OUTSTANDING_ROUNDING_TOLERANCE = 100;

export function normalizeOutstandingBalance(balance: number) {
  if (Math.abs(balance) <= OUTSTANDING_ROUNDING_TOLERANCE) {
    return 0;
  }

  return balance;
}

export function buildBookingPaymentTotals(
  totalAmount: number,
  payments: BookingPaymentLike[],
) {
  const amountPaid = sumBookingPayments(payments);
  const dpAmount = sumDownPayments(payments);
  const outstandingBalance = normalizeOutstandingBalance(
    getOutstandingBalance(totalAmount, payments),
  );

  return {
    amountPaid,
    dpAmount,
    dpRequired: getDpRequiredAmount(totalAmount),
    outstandingBalance,
    lastPaymentDate: getLastPaymentDate(payments),
  };
}
