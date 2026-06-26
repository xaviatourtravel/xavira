export const CUSTOMER_WORKSPACE_TABS = [
  "overview",
  "conversation",
  "bookings",
  "payments",
  "participants",
  "notes",
  "activity",
  "ai",
] as const;

export type CustomerWorkspaceTab = (typeof CUSTOMER_WORKSPACE_TABS)[number];

export function parseCustomerWorkspaceTab(
  value: string | undefined,
): CustomerWorkspaceTab {
  if (
    value &&
    CUSTOMER_WORKSPACE_TABS.includes(value as CustomerWorkspaceTab)
  ) {
    return value as CustomerWorkspaceTab;
  }

  return "overview";
}
