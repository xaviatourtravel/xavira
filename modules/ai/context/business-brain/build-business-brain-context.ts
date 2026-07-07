export type BuildBusinessBrainContextInput = {
  workspaceId?: string | null;
};

export type BusinessBrainContextSlice = {
  available: boolean;
  workspaceId: string | null;
};

export function buildBusinessBrainContext(
  input?: BuildBusinessBrainContextInput,
): BusinessBrainContextSlice {
  const workspaceId = input?.workspaceId?.trim() || null;

  return {
    available: Boolean(workspaceId),
    workspaceId,
  };
}
