import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-section";
import { platformWorkflowStory } from "@/lib/marketing/platform-content";

export function PlatformWorkflowStorySection() {
  return (
    <MarketingSection>
      <MarketingSectionHeader
        eyebrow="Workflow story"
        title="Dari pesan pertama hingga customer yang kembali"
        description="Desklabs tidak hanya menyimpan data—platform ini menggerakkan operasional customer secara end-to-end."
      />

      <div className="relative mx-auto mt-12 max-w-4xl">
        <div
          aria-hidden
          className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-emerald-200 via-slate-200 to-emerald-200 sm:block"
        />

        <ol className="space-y-4">
          {platformWorkflowStory.map((step, index) => (
            <li
              key={step}
              className="relative flex gap-4 sm:gap-6"
            >
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/70">
                <p className="text-sm font-medium text-slate-900 sm:text-base">{step}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </MarketingSection>
  );
}
