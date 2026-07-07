"use client";

import { cn } from "@/lib/utils";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />;
}

export function InboxPageSkeleton() {
  const { ti } = useInboxTranslation();

  return (
    <div
      className="grid h-full min-h-[480px] overflow-hidden bg-background lg:grid-cols-[320px_minmax(0,1fr)_420px]"
      aria-busy="true"
      aria-label={ti("inboxLoading")}
    >
      <section className="flex min-h-0 flex-col border-r border-border/40">
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center justify-between">
            <Block className="h-4 w-28" />
            <Block className="h-3 w-6" />
          </div>
          <Block className="h-8 w-full rounded-lg" />
          <div className="flex gap-1.5">
            <Block className="h-7 w-14" />
            <Block className="h-7 w-20" />
            <Block className="h-7 w-16" />
          </div>
        </div>
        <div className="flex-1 space-y-1 border-t border-border/40 px-2 py-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-start gap-2.5 rounded-lg px-3 py-3">
              <Block className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Block className="h-3 w-3/5" />
                <Block className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="hidden min-h-0 flex-col lg:flex">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <Block className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Block className="h-3.5 w-32" />
            <Block className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 space-y-4 px-6 py-6">
          <div className="flex justify-start">
            <Block className="h-14 w-[52%] rounded-2xl rounded-tl-sm" />
          </div>
          <div className="flex justify-end">
            <Block className="h-10 w-[44%] rounded-2xl rounded-tr-sm" />
          </div>
          <div className="flex justify-start">
            <Block className="h-12 w-[48%] rounded-2xl rounded-tl-sm" />
          </div>
        </div>
        <div className="border-t border-border/40 px-4 py-3">
          <Block className="mx-auto h-10 max-w-3xl rounded-xl" />
        </div>
      </section>

      <section className="hidden min-h-0 flex-col border-l border-border/40 lg:flex">
        <div className="border-b border-border/40 px-4 py-3">
          <Block className="h-4 w-24" />
        </div>
        <div className="flex gap-1 border-b border-border/40 px-2 py-1.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Block key={index} className="h-10 flex-1 rounded-md" />
          ))}
        </div>
        <div className="flex-1 space-y-4 px-4 py-4">
          <Block className="h-20 w-full rounded-lg" />
          <Block className="h-24 w-full rounded-lg" />
          <Block className="h-16 w-full rounded-lg" />
        </div>
      </section>
    </div>
  );
}
