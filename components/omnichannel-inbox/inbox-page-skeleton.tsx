"use client";

import {
  AURORA_MESSAGE_AVATAR_SIZE,
  AURORA_MESSAGE_BUBBLE_RADIUS,
  AURORA_STATE_SKELETON,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

function Block({ className }: { className?: string }) {
  return <div className={cn(AURORA_STATE_SKELETON, className)} />;
}

export function InboxPageSkeleton() {
  const { ti } = useInboxTranslation();

  return (
    <div
      className="grid h-full min-h-0 overflow-hidden bg-background transition-[grid-template-columns] duration-[180ms] ease-out lg:grid-cols-[320px_minmax(0,1fr)_400px]"
      aria-busy="true"
      aria-label={ti("inboxLoading")}
    >
      <section className="flex min-h-0 flex-col border-r border-border/40">
        <div className="space-y-3 px-4 py-3">
          <div className="flex items-center justify-between">
            <Block className="h-4 w-28" />
            <Block className="h-3 w-6" />
          </div>
          <Block className="h-10 w-full rounded-full" />
          <div className="flex gap-1.5">
            <Block className="h-7 w-14 rounded-full" />
            <Block className="h-7 w-20 rounded-full" />
            <Block className="h-7 w-16 rounded-full" />
          </div>
        </div>
        <div className="flex-1 space-y-1 border-t border-border/40 px-2 py-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-start gap-2.5 rounded-xl px-3 py-3">
              <Block className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Block className="h-3 w-2/5" />
                  <Block className="h-2.5 w-10" />
                </div>
                <Block className="h-3 w-full" />
                <Block className="h-2.5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="hidden min-h-0 flex-col lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-border/30 px-5">
          <Block className="h-9 w-9 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Block className="h-3.5 w-40" />
            <Block className="h-2.5 w-28" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[740px] flex-1 space-y-5 px-4 py-6 sm:px-5">
          <div className="flex items-end gap-2">
            <Block className={cn(AURORA_MESSAGE_AVATAR_SIZE, "rounded-full")} />
            <div className="space-y-1.5">
              <Block className={cn("h-14 w-[52%] min-w-[8rem]", AURORA_MESSAGE_BUBBLE_RADIUS)} />
              <Block className="ml-auto h-2 w-10" />
            </div>
          </div>
          <div className="flex justify-end">
            <div className="space-y-1.5">
              <Block className={cn("h-10 w-[44%] min-w-[7rem]", AURORA_MESSAGE_BUBBLE_RADIUS)} />
              <Block className="ml-auto h-2 w-12" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <Block className={cn(AURORA_MESSAGE_AVATAR_SIZE, "rounded-full")} />
            <div className="space-y-1.5">
              <Block className={cn("h-12 w-[48%] min-w-[8rem]", AURORA_MESSAGE_BUBBLE_RADIUS)} />
              <Block className="ml-auto h-2 w-10" />
            </div>
          </div>
        </div>
        <div className="border-t border-border/40 px-4 py-3">
          <Block className="mx-auto h-14 max-w-[740px] rounded-2xl" />
        </div>
      </section>

      <section className="hidden min-h-0 flex-col border-l border-border/40 lg:flex">
        <div className="space-y-4 border-b border-border/40 p-5">
          <div className="flex items-center gap-3">
            <Block className="h-10 w-10 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Block className="h-3.5 w-32" />
              <Block className="h-2.5 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Block className="h-6 w-16 rounded-full" />
            <Block className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-5">
          <div className="space-y-2">
            <Block className="h-3 w-20" />
            <Block className="h-16 w-full rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Block className="h-3 w-24" />
            <div className="space-y-2 rounded-2xl border border-border/15 p-4">
              <Block className="h-3 w-full" />
              <Block className="h-3 w-4/5" />
              <Block className="h-3 w-2/3" />
            </div>
          </div>
          <div className="space-y-2">
            <Block className="h-3 w-28" />
            <Block className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
