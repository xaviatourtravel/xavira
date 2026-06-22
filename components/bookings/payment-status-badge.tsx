import { formatPaymentStatusLabel } from "@/lib/bookings/payment-status";

const statusStyles: Record<string, string> = {
  unpaid: "bg-slate-100 text-slate-800",
  dp_paid: "bg-blue-100 text-blue-800",
  fully_paid: "bg-green-100 text-green-800",
  overpaid: "bg-purple-100 text-purple-800",
  pending: "bg-slate-100 text-slate-800",
  partial_paid: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
};

type PaymentStatusBadgeProps = {
  status: string;
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${statusStyles[status] ?? "bg-slate-100 text-slate-800"}`}
    >
      {formatPaymentStatusLabel(status)}
    </span>
  );
}
