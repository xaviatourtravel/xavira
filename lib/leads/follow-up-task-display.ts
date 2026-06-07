export const AUTOMATIC_FOLLOW_UP_PREFIX = "[Auto] ";

export function formatAutomaticFollowUpTitle(title: string) {
  const trimmed = title.trim();

  if (trimmed.startsWith(AUTOMATIC_FOLLOW_UP_PREFIX)) {
    return trimmed;
  }

  if (trimmed.startsWith("[Auto]")) {
    return trimmed.replace("[Auto]", AUTOMATIC_FOLLOW_UP_PREFIX);
  }

  return `${AUTOMATIC_FOLLOW_UP_PREFIX}${trimmed}`;
}

export function isAutomaticFollowUpTitle(title: string) {
  return title.trim().startsWith("[Auto]");
}

export function getFollowUpTaskDisplayTitle(title: string) {
  if (!isAutomaticFollowUpTitle(title)) {
    return title;
  }

  return title.trim().replace(/^\[Auto\]\s*/, "");
}
