import { cn } from "@/lib/utils";

export const workspacePageClass = "space-y-0";

export const workspaceStickyShellClass =
  "-mx-3 border-b border-border/60 bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6";

export const workspaceStickyRegionClass =
  "sticky top-0 z-20";

export const workspaceCardClass =
  "rounded-xl border border-border/60 bg-card shadow-sm";

export const workspaceSidebarCardClass =
  "rounded-xl border border-border/60 bg-card p-4 shadow-sm";

export const workspaceSectionTitleClass = "text-sm font-semibold tracking-tight";

export const workspaceSectionDescriptionClass =
  "mt-1 text-xs leading-relaxed text-muted-foreground";

export const workspaceMutedPanelClass =
  "rounded-xl border border-border/50 bg-muted/20";

export function getWorkspaceStatusToneClass(
  tone: "default" | "success" | "warning" | "danger" | "info" = "default",
) {
  return cn(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
    tone === "success" && "bg-emerald-50 text-emerald-700",
    tone === "warning" && "bg-amber-50 text-amber-700",
    tone === "danger" && "bg-red-50 text-red-700",
    tone === "info" && "bg-blue-50 text-blue-700",
    tone === "default" && "bg-muted text-muted-foreground",
  );
}

export function getWorkspacePriorityToneClass(priority: string) {
  const normalized = priority.toLowerCase();

  if (normalized.includes("urgent")) {
    return "bg-red-50 text-red-700";
  }

  if (normalized.includes("high")) {
    return "bg-orange-50 text-orange-700";
  }

  if (normalized.includes("low")) {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-slate-100 text-slate-800";
}

export function getWorkspaceTimelineToneClass(
  tone: "default" | "success" | "warning" | "danger" | "info" = "default",
) {
  return cn(
    "rounded px-2 py-0.5 text-[11px] font-medium",
    tone === "success" && "bg-emerald-100 text-emerald-800",
    tone === "warning" && "bg-amber-100 text-amber-800",
    tone === "danger" && "bg-red-100 text-red-800",
    tone === "info" && "bg-blue-100 text-blue-800",
    tone === "default" && "bg-muted text-muted-foreground",
  );
}

export function getWorkspaceTimelineDotClass(
  tone: "default" | "success" | "warning" | "danger" | "info" = "default",
) {
  return cn(
    tone === "success" && "bg-emerald-500",
    tone === "warning" && "bg-amber-500",
    tone === "danger" && "bg-red-500",
    tone === "info" && "bg-blue-500",
    tone === "default" && "bg-slate-400",
  );
}
