"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  sectionHref,
  sectionSlugFromPathname,
  type BusinessBrainSectionSlug,
} from "@/modules/business-brain/types/business-brain-workspace";

type BusinessBrainWorkspaceContextValue = {
  section: BusinessBrainSectionSlug;
  navigate: (slug: BusinessBrainSectionSlug) => void;
};

const BusinessBrainWorkspaceContext =
  createContext<BusinessBrainWorkspaceContextValue | null>(null);

export function BusinessBrainWorkspaceProvider({
  initialSection,
  children,
}: {
  initialSection: BusinessBrainSectionSlug;
  children: ReactNode;
}) {
  const [section, setSection] = useState<BusinessBrainSectionSlug>(initialSection);

  const navigate = useCallback((slug: BusinessBrainSectionSlug) => {
    setSection(slug);
    const href = sectionHref(slug);
    window.history.replaceState({ bbSection: slug }, "", href);
  }, []);

  useEffect(() => {
    window.history.replaceState(
      { bbSection: initialSection },
      "",
      window.location.pathname,
    );
  }, [initialSection]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const fromState = event.state?.bbSection as BusinessBrainSectionSlug | undefined;
      if (fromState) {
        setSection(fromState);
        return;
      }
      setSection(sectionSlugFromPathname(window.location.pathname));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value = useMemo(
    () => ({
      section,
      navigate,
    }),
    [navigate, section],
  );

  return (
    <BusinessBrainWorkspaceContext.Provider value={value}>
      {children}
    </BusinessBrainWorkspaceContext.Provider>
  );
}

export function useBusinessBrainWorkspace() {
  const context = useContext(BusinessBrainWorkspaceContext);
  if (!context) {
    throw new Error("useBusinessBrainWorkspace must be used within BusinessBrainWorkspaceProvider");
  }
  return context;
}

export function useBusinessBrainWorkspaceOptional() {
  return useContext(BusinessBrainWorkspaceContext);
}
