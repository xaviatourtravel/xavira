"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/lib/settings/constants";
import type { SettingsWorkspaceData } from "@/lib/settings/queries";
import { cn } from "@/lib/utils";

import { SettingsSectionPanel } from "@/components/settings/settings-section-panels";

type SettingsWorkspaceProps = {
  data: SettingsWorkspaceData;
  flashMessage?: string | null;
  flashError?: string | null;
};

export function SettingsWorkspace({
  data,
  flashMessage,
  flashError,
}: SettingsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeSection =
    (searchParams.get("section") as SettingsSectionId | null) ??
    data.activeSection;

  function navigateToSection(sectionId: SettingsSectionId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", sectionId);
    params.delete("message");
    params.delete("error");
    params.delete("instagram");

    startTransition(() => {
      router.push(`/settings?${params.toString()}`);
    });
  }

  const currentSection =
    SETTINGS_SECTIONS.find((section) => section.id === activeSection) ??
    SETTINGS_SECTIONS[0];

  const visibleSections = SETTINGS_SECTIONS.filter(
    (section) =>
      !("requiresAdminOrOwner" in section && section.requiresAdminOrOwner) ||
      data.canViewAuditLogs,
  );

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden">
      <div className="mb-6 space-y-2 md:mb-8">
        <p className="text-sm font-medium text-muted-foreground">Desklabs</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Manage your workspace profile, team access, integrations, and automation
          preferences from one place.
        </p>
      </div>

      {flashMessage ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {flashMessage}
        </div>
      ) : null}

      {flashError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {flashError}
        </div>
      ) : null}

      {!data.canManage ? (
        <div className="mb-6 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          You have view-only access. Contact an owner or admin to change workspace
          settings.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <label className="mb-2 block text-sm font-medium lg:hidden">
            Section
          </label>
          <select
            value={activeSection}
            onChange={(event) =>
              navigateToSection(event.target.value as SettingsSectionId)
            }
            className="mb-4 flex h-11 w-full rounded-xl border bg-card px-3 text-sm lg:hidden"
          >
            {visibleSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>

          <nav className="hidden space-y-1 rounded-2xl border bg-card p-2 shadow-sm lg:block">
            {visibleSections.map((section) => {
              const Icon = section.icon;
              const isActive = section.id === activeSection;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => navigateToSection(section.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      isActive ? "text-primary-foreground" : "text-muted-foreground",
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{section.label}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs leading-snug",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {section.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl border bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
            Need webhook setup for Instagram?{" "}
            <Link
              href="/settings/integrations/instagram/webhook"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Open webhook tools
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">{currentSection.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentSection.description}
            </p>
          </div>

          <SettingsSectionPanel
            sectionId={activeSection}
            data={data}
          />
        </div>
      </div>
    </div>
  );
}
