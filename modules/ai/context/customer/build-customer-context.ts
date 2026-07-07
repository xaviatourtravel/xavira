export type BuildCustomerContextInput = {
  customerId?: string | null;
  displayName?: string | null;
};

export type CustomerContext = {
  available: boolean;
  customerId: string | null;
  displayName: string | null;
};

export function buildCustomerContext(
  input?: BuildCustomerContextInput,
): CustomerContext {
  const customerId = input?.customerId?.trim() || null;
  const displayName = input?.displayName?.trim() || null;

  return {
    available: Boolean(customerId || displayName),
    customerId,
    displayName,
  };
}
