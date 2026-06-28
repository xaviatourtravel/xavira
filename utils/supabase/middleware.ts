import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isGuestOnlyRoute,
  isProtectedRoute,
  isPublicRoute,
} from "@/lib/auth/routes";
import {
  getOnboardingStateAdmin,
  getPostAuthDestination,
  resolveOnboardingRedirect,
} from "@/lib/onboarding/get-onboarding-state";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: {
          name: string;
          value: string;
          options: CookieOptions;
        }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !isPublicRoute(pathname)) {
    const appliesOnboardingGuard =
      isProtectedRoute(pathname) || pathname.startsWith("/onboarding");

    if (appliesOnboardingGuard) {
      const state = await getOnboardingStateAdmin(user.id);

      if (!state) {
        if (isProtectedRoute(pathname) && !pathname.startsWith("/onboarding")) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/onboarding";
          redirectUrl.search = "";
          return NextResponse.redirect(redirectUrl);
        }
      } else {
        const destination = resolveOnboardingRedirect(pathname, state);

        if (destination && destination !== pathname) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = destination;
          redirectUrl.search = "";
          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    if (isGuestOnlyRoute(pathname)) {
      const state = await getOnboardingStateAdmin(user.id);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = state
        ? getPostAuthDestination(state)
        : "/onboarding";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
