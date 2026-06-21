export function getCustomerDisplayName(
  customerName: string | null,
  customerUsername: string | null,
  externalUserId: string | null,
) {
  if (customerName?.trim()) {
    return customerName.trim();
  }

  if (customerUsername?.trim()) {
    return `@${customerUsername.trim().replace(/^@/, "")}`;
  }

  if (externalUserId?.trim()) {
    return `Customer ${externalUserId.slice(-6)}`;
  }

  return "Unknown Customer";
}
