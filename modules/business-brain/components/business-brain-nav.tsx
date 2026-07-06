"use client";



import { BusinessBrainSectionIcon } from "@/modules/business-brain/components/business-brain-section-icon";

import { useBusinessBrainWorkspace } from "@/modules/business-brain/components/business-brain-workspace-context";

import { BUSINESS_BRAIN_WORKSPACE_TABS } from "@/modules/business-brain/types/business-brain-workspace";
import { translateBusinessBrainTabLabel } from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

export function BusinessBrainNav() {
  const { section, navigate } = useBusinessBrainWorkspace();
  const { t } = useTranslation();



  return (

    <nav aria-label="Business Brain sections" className="-mx-1 overflow-x-auto pb-1">

      <ul className="flex min-w-max items-center gap-1 px-1">

        {BUSINESS_BRAIN_WORKSPACE_TABS.map((tab) => {

          const active = section === tab.slug;



          return (

            <li key={tab.id}>

              <button

                type="button"

                onClick={() => navigate(tab.slug)}

                aria-current={active ? "page" : undefined}

                className={cn(

                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",

                  active

                    ? "bg-primary/10 text-primary ring-1 ring-primary/20 dark:bg-primary/20"

                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",

                )}

              >

                <BusinessBrainSectionIcon slug={tab.slug} />

                {translateBusinessBrainTabLabel(t, tab.id)}

              </button>

            </li>

          );

        })}

      </ul>

    </nav>

  );

}

