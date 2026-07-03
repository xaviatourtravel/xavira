"use client";

import { DsCard } from "@/components/design-system/card";
import type { PlaygroundMemoryDisplay } from "@/modules/ai/types/memory";
import { MEMORY_KEY_LABELS, PLAYGROUND_MEMORY_KEYS } from "@/modules/ai/types/memory";

type PlaygroundMemoryPanelProps = {
  memory: PlaygroundMemoryDisplay | null;
};

export function PlaygroundMemoryPanel({ memory }: PlaygroundMemoryPanelProps) {
  return (
    <DsCard
      title="Customer Memory"
      description="Facts remembered across playground test runs in this session."
      className="min-h-[220px]"
    >
      {!memory ? (
        <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
          Run a test to build customer memory.
        </div>
      ) : (
        <dl className="space-y-3">
          {PLAYGROUND_MEMORY_KEYS.map((key) => {
            const value = memory[key];
            const label = MEMORY_KEY_LABELS[key];

            return (
              <div
                key={key}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {value ?? <span className="text-muted-foreground">—</span>}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </DsCard>
  );
}
