import { Sparkles } from "lucide-react";

import { TodayTaskCard } from "@/components/today/today-task-card";
import type { TodayFocusSection } from "@/lib/tasks/types";

type TodayFocusSidebarProps = {
  sections: TodayFocusSection[];
};

export function TodayFocusSidebar({ sections }: TodayFocusSidebarProps) {
  return (
    <aside className="space-y-4">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold">Today Focus</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick slices of what needs attention right now.
        </p>
      </div>

      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-xl border bg-card p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            {section.id === "ai-suggestions" ? (
              <Sparkles className="h-4 w-4 text-emerald-600" />
            ) : null}
            <h3 className="text-sm font-semibold">{section.title}</h3>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {section.tasks.length}
            </span>
          </div>

          {section.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{section.emptyLabel}</p>
          ) : (
            <div className="space-y-3">
              {section.tasks.map((task) => (
                <TodayTaskCard key={task.id} task={task} compact />
              ))}
            </div>
          )}
        </section>
      ))}
    </aside>
  );
}
