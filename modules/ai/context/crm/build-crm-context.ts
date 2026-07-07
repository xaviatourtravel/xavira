export type BuildCrmContextInput = {
  leadId?: string | null;
};

export type CrmContext = {
  available: boolean;
  leadId: string | null;
};

export function buildCrmContext(input?: BuildCrmContextInput): CrmContext {
  const leadId = input?.leadId?.trim() || null;

  return {
    available: Boolean(leadId),
    leadId,
  };
}
