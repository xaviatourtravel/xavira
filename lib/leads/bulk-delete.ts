const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FK_TABLE_PATTERNS = [
  /on table "([^"]+)"/i,
  /from table "([^"]+)"/i,
  /table "([^"]+)"/i,
];

export function parseLeadIds(values: FormDataEntryValue[]): string[] {
  const uniqueIds = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();

    if (!trimmed || !UUID_REGEX.test(trimmed)) {
      continue;
    }

    uniqueIds.add(trimmed);
  }

  return [...uniqueIds];
}

export function parseBlockingTableFromError(message: string): string | null {
  for (const pattern of FK_TABLE_PATTERNS) {
    const match = message.match(pattern);

    if (match?.[1] && match[1] !== "leads") {
      return match[1];
    }
  }

  return null;
}

export function formatBulkDeleteFailureMessage(input: {
  leadId: string;
  message: string;
}): string {
  const blockingTable = parseBlockingTableFromError(input.message);

  if (blockingTable) {
    return `Lead ${input.leadId} diblokir oleh data terkait di tabel "${blockingTable}".`;
  }

  return `Lead ${input.leadId}: ${input.message}`;
}

export function buildLeadsActionRedirectPath(
  returnTo: string,
  type: "success" | "error",
  message: string,
): string {
  const basePath =
    returnTo.startsWith("/leads") && !returnTo.startsWith("//")
      ? returnTo
      : "/leads";
  const separator = basePath.includes("?") ? "&" : "?";

  return `${basePath}${separator}${type}=${encodeURIComponent(message)}`;
}
