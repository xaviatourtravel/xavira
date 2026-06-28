import type { LucideIcon } from "lucide-react";

import { AppWorkspaceFrame } from "@/components/layout/app-workspace-frame";
import { WorkspaceHubCard } from "@/components/layout/workspace-hub-card";

export type WorkspaceHubItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type WorkspaceHubViewProps = {
  title: string;
  subtitle: string;
  items: WorkspaceHubItem[];
};

export function WorkspaceHubView({ title, subtitle, items }: WorkspaceHubViewProps) {
  return (
    <AppWorkspaceFrame
      header={
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-500">{subtitle}</p>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <WorkspaceHubCard key={item.id ?? item.href} {...item} />
        ))}
      </div>
    </AppWorkspaceFrame>
  );
}
