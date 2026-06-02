const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"] as const;

const GUEST_ONLY_ROUTES = ["/login", "/register", "/forgot-password"] as const;

const PUBLIC_ROUTES = ["/", ...AUTH_ROUTES] as const;

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/leads",
  "/follow-ups",
  "/campaigns",
  "/content",
  "/scripts",
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
