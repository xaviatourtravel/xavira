import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { WorkspaceEmptyState } from "./workspace-empty-state";
import { workspaceCardClass, workspaceSectionDescriptionClass, workspaceSectionTitleClass } from "./styles";
import type { WorkspaceAISection } from "./types";

type WorkspaceAIPanelProps = {
  sections?: WorkspaceAISection[];
  title?: string;
  description?: string;
  className?: string;
  headerAction?: ReactNode;
  emptyAction?: ReactNode;
};

function WorkspaceAISectionCard({ section }: { section: WorkspaceAISection }) {
  const hasContent = Boolean(section.content);

  return (
    <section className={cn(workspaceCardClass, "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={workspaceSectionTitleClass}>{section.title}</h3>
          {section.description ? (
            <p className={workspaceSectionDescriptionClass}>{section.description}</p>
          ) : null}
        </div>
        {section.action}
      </div>

      <div className="mt-4">
        {hasContent ? (
          <div className="text-sm leading-relaxed text-foreground">{section.content}</div>
        ) : (
          <p className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            {section.placeholder ?? "Insights will appear here."}
          </p>
        )}
      </div>
    </section>
  );
}

export function WorkspaceAIPanel({
  sections = [],
  title = "AI Insights",
  description = "Summary, recommendations, and suggested next steps.",
  className,
  headerAction,
  emptyAction,
}: WorkspaceAIPanelProps) {
  const hasAnyContent = sections.some((section) => Boolean(section.content));

  if (sections.length === 0) {
    return (
      <section className={cn("space-y-4", className)}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {headerAction}
        </div>

        <WorkspaceEmptyState
          preset="ai"
          title="Generate AI summary."
          description="Use AI to summarize context, surface missing information, and suggest the next best action."
          action={emptyAction}
        />
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {headerAction}
      </div>

      {!hasAnyContent && emptyAction ? (
        <div className="flex justify-start">{emptyAction}</div>
      ) : null}

      <div className="space-y-4">
        {sections.map((section) => (
          <WorkspaceAISectionCard key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}

export const DEFAULT_AI_SECTIONS: WorkspaceAISection[] = [
  {
    id: "summary",
    title: "Summary",
    placeholder: "A concise overview of this record will appear here.",
  },
  {
    id: "insights",
    title: "Insights",
    placeholder: "Key signals and context detected by AI.",
  },
  {
    id: "recommendations",
    title: "Recommendations",
    placeholder: "Suggested improvements and follow-up opportunities.",
  },
  {
    id: "next-best-action",
    title: "Next Best Action",
    placeholder: "The highest-impact action to take next.",
  },
  {
    id: "suggested-reply",
    title: "Suggested Reply",
    placeholder: "Draft messaging ready for review and copy.",
  },
];
