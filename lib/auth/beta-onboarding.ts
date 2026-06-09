const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BetaJoinState =
  | { mode: "inactive" }
  | { mode: "active"; organizationId: string }
  | { mode: "invalid"; rawValue: string };

export function resolveBetaJoinState(): BetaJoinState {
  const rawValue = process.env.BETA_JOIN_ORGANIZATION_ID?.trim();

  if (!rawValue) {
    return { mode: "inactive" };
  }

  if (!UUID_REGEX.test(rawValue)) {
    return { mode: "invalid", rawValue };
  }

  return { mode: "active", organizationId: rawValue };
}

export function isBetaJoinModeActive(): boolean {
  return resolveBetaJoinState().mode === "active";
}

export function getBetaJoinOrganizationId(): string | null {
  const state = resolveBetaJoinState();
  return state.mode === "active" ? state.organizationId : null;
}

export function getBetaJoinConfigError(): string | null {
  const state = resolveBetaJoinState();

  if (state.mode !== "invalid") {
    return null;
  }

  return `Konfigurasi BETA_JOIN_ORGANIZATION_ID tidak valid. Gunakan UUID organisasi owner (nilai saat ini: "${state.rawValue}").`;
}

export function logBetaJoinOnboarding(context: string): void {
  const rawValue = process.env.BETA_JOIN_ORGANIZATION_ID?.trim();

  console.log(
    `[onboarding:${context}] BETA_JOIN_ORGANIZATION_ID:`,
    rawValue ? "set" : "missing",
  );

  const state = resolveBetaJoinState();

  if (state.mode === "active") {
    console.log(`[onboarding:${context}] Using beta join flow`);
    return;
  }

  if (state.mode === "invalid") {
    console.log(
      `[onboarding:${context}] Invalid BETA_JOIN_ORGANIZATION_ID:`,
      state.rawValue,
    );
    return;
  }

  console.log(`[onboarding:${context}] Using create new organization flow`);
}
