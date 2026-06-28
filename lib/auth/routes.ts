const AUTH_ROUTES = ["/login", "/register", "/daftar", "/forgot-password", "/reset-password", "/invite"] as const;

const GUEST_ONLY_ROUTES = ["/login", "/register", "/daftar", "/forgot-password", "/invite"] as const;

const PUBLIC_ROUTES = [
  "/",
  "/platform",
  "/solutions",
  "/demo",
  "/contact",
  "/company",
  "/privacy-policy",
  "/data-deletion",
  "/terms",
  ...AUTH_ROUTES,
] as const;

const PROTECTED_PREFIXES = [
  "/onboarding",
  "/today",
  "/operations",
  "/finance",
  "/performance",
  "/dashboard",
  "/leads",
  "/customers",
  "/bookings",
  "/packages",
  "/revenue",
  "/knowledge",
  "/follow-ups",
  "/inbox",
  "/campaigns",
  "/content",
  "/scripts",
  "/notifications",
  "/profile",
  "/preferences",
  "/security",
  "/help",
  "/docs",
  "/support",
  "/workspace",
  "/settings",
] as const;

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith("/auth")) {
    return true;
  }

  return PUBLIC_ROUTES.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
