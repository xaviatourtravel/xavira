function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type OwnerExecutiveKpiSectionProps = {
  leadsToday: number;
  leadsThisMonth: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
};

export function OwnerExecutiveKpiSection({
  leadsToday,
  leadsThisMonth,
  bookingsThisMonth,
  revenueThisMonth,
}: OwnerExecutiveKpiSectionProps) {
  const items = [
    { label: "Leads Today", value: String(leadsToday) },
    { label: "Leads This Month", value: String(leadsThisMonth) },
    { label: "Bookings This Month", value: String(bookingsThisMonth) },
    {
      label: "Revenue This Month",
      value: formatCurrency(revenueThisMonth),
      valueClassName: "text-green-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <h2
            className={`mt-2 text-3xl font-bold ${item.valueClassName ?? ""}`.trim()}
          >
            {item.value}
          </h2>
        </div>
      ))}
    </div>
  );
}
