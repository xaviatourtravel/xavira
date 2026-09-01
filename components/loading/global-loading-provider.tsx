"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { GlobalLoadingOverlay } from "@/components/loading/global-loading-overlay";
import {
  createGlobalLoadingController,
  ROUTE_LOADING_TOKEN,
  type GlobalLoadingController,
} from "@/lib/loading/global-loading-controller";
import {
  isGlobalLoadingForm,
  isRedirectError,
  resolveAppNavigationHref,
} from "@/lib/loading/is-app-navigation-click";

const ROUTE_LOADING_TIMEOUT_MS = 12_000;

type GlobalLoadingContextValue = {
  active: boolean;
  startLoading: (token?: string) => string;
  stopLoading: (token: string) => void;
  withGlobalLoading: <T>(operation: () => Promise<T>) => Promise<T>;
  navigate: (href: string) => void;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(
  null,
);

function closestAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest("a");
}

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const controllerRef = useRef<GlobalLoadingController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = createGlobalLoadingController();
  }
  const controller = controllerRef.current;
  const [activeCount, setActiveCount] = useState(0);
  const routeTimeoutRef = useRef<number | null>(null);

  const clearRouteTimeout = useCallback(() => {
    if (routeTimeoutRef.current != null) {
      window.clearTimeout(routeTimeoutRef.current);
      routeTimeoutRef.current = null;
    }
  }, []);

  const beginRouteLoading = useCallback(() => {
    controller.start(ROUTE_LOADING_TOKEN);
    clearRouteTimeout();
    routeTimeoutRef.current = window.setTimeout(() => {
      controller.stop(ROUTE_LOADING_TOKEN);
      routeTimeoutRef.current = null;
    }, ROUTE_LOADING_TIMEOUT_MS);
  }, [clearRouteTimeout, controller]);

  useEffect(() => controller.subscribe(setActiveCount), [controller]);

  useEffect(() => {
    controller.stop(ROUTE_LOADING_TOKEN);
    clearRouteTimeout();
  }, [clearRouteTimeout, controller, pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const href = resolveAppNavigationHref(
        event,
        closestAnchor(event.target),
        window.location,
      );
      if (!href) return;
      beginRouteLoading();
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (!isGlobalLoadingForm(form)) return;
      beginRouteLoading();
    }

    function onPopState() {
      beginRouteLoading();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
      clearRouteTimeout();
    };
  }, [beginRouteLoading, clearRouteTimeout]);

  const startLoading = useCallback(
    (token?: string) => controller.start(token),
    [controller],
  );
  const stopLoading = useCallback(
    (token: string) => controller.stop(token),
    [controller],
  );

  const withGlobalLoading = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      const token = controller.start();
      try {
        return await operation();
      } catch (error) {
        if (isRedirectError(error)) {
          beginRouteLoading();
        }
        throw error;
      } finally {
        controller.stop(token);
      }
    },
    [beginRouteLoading, controller],
  );

  const navigate = useCallback(
    (href: string) => {
      beginRouteLoading();
      router.push(href);
    },
    [beginRouteLoading, router],
  );

  const value = useMemo<GlobalLoadingContextValue>(
    () => ({
      active: activeCount > 0,
      startLoading,
      stopLoading,
      withGlobalLoading,
      navigate,
    }),
    [activeCount, navigate, startLoading, stopLoading, withGlobalLoading],
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingOverlay active={activeCount > 0} />
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within GlobalLoadingProvider");
  }
  return context;
}
