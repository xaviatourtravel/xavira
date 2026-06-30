"use client";

import {
  PassportEmptyHint,
  PassportPerforation,
  PassportSection,
} from "@/components/customer-passport/primitives";
import type { CustomerPassport } from "@/lib/customer-passport/types";

function MemoryGroup({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: CustomerPassport["memory"]["pinnedFacts"];
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-1.5 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-soft bg-card/70 px-3 py-2"
            >
              <p className="text-xs font-medium text-foreground">{item.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-1.5">
          <PassportEmptyHint>{emptyLabel}</PassportEmptyHint>
        </div>
      )}
    </div>
  );
}

export function PassportMemorySection({
  passport,
}: {
  passport: CustomerPassport;
}) {
  const { memory } = passport;

  return (
    <>
      <PassportSection number={7} title="Memory">
        <div className="space-y-4">
          <MemoryGroup
            title="AI Memories"
            items={memory.aiMemories}
            emptyLabel="AI memories will appear as conversations grow."
          />
          <MemoryGroup
            title="Pinned Facts"
            items={memory.pinnedFacts}
            emptyLabel="Add internal notes to pin customer facts."
          />
          <MemoryGroup
            title="Travel History"
            items={memory.travelHistory}
            emptyLabel="Completed bookings will populate travel history."
          />
        </div>
      </PassportSection>
      <PassportPerforation />
    </>
  );
}
