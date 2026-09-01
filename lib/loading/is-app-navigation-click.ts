export type NavigationClickLike = {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  defaultPrevented?: boolean;
};

export type NavigationAnchorLike = {
  href: string;
  target: string;
  hasAttribute: (name: string) => boolean;
};

export type NavigationLocationLike = {
  origin: string;
  pathname: string;
};

function isModifiedClick(event: NavigationClickLike) {
  return Boolean(
    event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
  );
}

export function resolveAppNavigationHref(
  event: NavigationClickLike,
  anchor: NavigationAnchorLike | null,
  location: NavigationLocationLike,
): string | null {
  if (!anchor) return null;
  if (event.defaultPrevented) return null;
  if ((event.button ?? 0) !== 0) return null;
  if (isModifiedClick(event)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  let url: URL;
  try {
    url = new URL(anchor.href, location.origin);
  } catch {
    return null;
  }

  if (url.origin !== location.origin) return null;
  if (url.pathname === location.pathname) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

export function isGlobalLoadingForm(form: {
  method?: string;
  hasAttribute: (name: string) => boolean;
}): boolean {
  const method = (form.method ?? "get").toLowerCase();
  if (method === "get") return false;
  return form.hasAttribute("data-global-loading");
}

export function isRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = "digest" in error ? String(error.digest) : "";
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK");
}
