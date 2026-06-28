import type { WorkspaceDescriptor } from "@/lib/workspace/types";

/**
 * Seed directory for workspace switcher UI.
 * Replace with membership query when multi-workspace is implemented.
 */
export const WORKSPACE_DIRECTORY_SEEDS: WorkspaceDescriptor[] = [
  {
    id: "seed-desklabs",
    slug: "desklabs",
    name: "Desklabs",
    description: "Platform operasional utama",
    brandColor: "#0f172a",
    logoUrl: null,
    timezone: "Asia/Jakarta",
    currency: "IDR",
    modulesEnabled: ["communication", "customer", "tasks", "finance", "ai"],
    aiPersonality: "professional",
    canSwitch: false,
  },
  {
    id: "seed-travel-agency",
    slug: "travel-agency",
    name: "Travel Agency",
    description: "Operasional travel dan booking",
    brandColor: "#047857",
    logoUrl: null,
    timezone: "Asia/Jakarta",
    currency: "IDR",
    modulesEnabled: ["communication", "customer", "bookings", "finance"],
    aiPersonality: "friendly",
    canSwitch: false,
  },
  {
    id: "seed-kreatifpedia",
    slug: "kreatifpedia",
    name: "Kreatifpedia",
    description: "Publishing",
    brandColor: "#7c3aed",
    logoUrl: null,
    timezone: "Asia/Jakarta",
    currency: "IDR",
    modulesEnabled: ["content", "campaign", "customer"],
    aiPersonality: "professional",
    canSwitch: false,
  },
  {
    id: "seed-flexgen",
    slug: "flexgen",
    name: "Flexgen",
    description: "AI Content Studio",
    brandColor: "#2563eb",
    logoUrl: null,
    timezone: "Asia/Jakarta",
    currency: "IDR",
    modulesEnabled: ["content", "ai", "campaign"],
    aiPersonality: "friendly",
    canSwitch: false,
  },
  {
    id: "seed-xavia-tour",
    slug: "xavia-tour",
    name: "Xavia Tour",
    description: "Operational",
    brandColor: "#ea580c",
    logoUrl: null,
    timezone: "Asia/Jakarta",
    currency: "IDR",
    modulesEnabled: ["communication", "operations", "finance"],
    aiPersonality: "professional",
    canSwitch: false,
  },
];

export function mergeWorkspaceDirectory(
  activeWorkspace: WorkspaceDescriptor,
): WorkspaceDescriptor[] {
  const normalizedActiveName = activeWorkspace.name.trim().toLowerCase();
  const seeds = WORKSPACE_DIRECTORY_SEEDS.filter(
    (seed) => seed.name.trim().toLowerCase() !== normalizedActiveName,
  );

  return [activeWorkspace, ...seeds];
}
