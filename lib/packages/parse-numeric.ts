function parseOptionalRoundedInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const rounded = Math.round(numeric);
  if (rounded < 0) {
    return null;
  }

  return rounded;
}

export function parseOptionalDurationDays(value: string): number | null {
  const rounded = parseOptionalRoundedInt(value);
  if (rounded == null || rounded < 1) {
    return null;
  }

  return rounded;
}

export function parseOptionalQuota(value: string): number | null {
  return parseOptionalRoundedInt(value);
}

export function parseOptionalPriceIdr(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}
