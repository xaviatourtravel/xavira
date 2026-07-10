"use client";

import {
  AURORA_CUSTOMER_360_DEFINITION_DETAIL,
  AURORA_CUSTOMER_360_DEFINITION_LIST,
  AURORA_CUSTOMER_360_DEFINITION_TERM,
  AURORA_CUSTOMER_360_SUBSECTION_TITLE,
} from "@/components/workspace/aurora-tokens";
import { cn } from "@/lib/utils";

export type Customer360DefinitionItem = {
  term: string;
  detail: string;
};

type Customer360DefinitionListProps = {
  title: string;
  items: Customer360DefinitionItem[];
  className?: string;
};

export function Customer360DefinitionList({
  title,
  items,
  className,
}: Customer360DefinitionListProps) {
  const listId = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <section aria-labelledby={`${listId}-heading`} className={className}>
      <h4 id={`${listId}-heading`} className={AURORA_CUSTOMER_360_SUBSECTION_TITLE}>
        {title}
      </h4>
      <dl className={cn(AURORA_CUSTOMER_360_DEFINITION_LIST, "mt-2.5")}>
        {items.map((item) => (
          <div key={item.term} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3">
            <dt className={AURORA_CUSTOMER_360_DEFINITION_TERM}>{item.term}</dt>
            <dd className={cn(AURORA_CUSTOMER_360_DEFINITION_DETAIL, "truncate")}>
              {item.detail}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
