"use client";

import {
  AURORA_CUSTOMER_360_SUBSECTION_TITLE,
  AURORA_CUSTOMER_360_TAG,
} from "@/components/workspace/aurora-tokens";
import { useInboxTranslation } from "@/modules/inbox/hooks/use-inbox-translation";

type Customer360InterestTagsProps = {
  tags: string[];
};

export function Customer360InterestTags({ tags }: Customer360InterestTagsProps) {
  const { ti } = useInboxTranslation();

  return (
    <section aria-labelledby="customer-360-tags-heading">
      <h4 id="customer-360-tags-heading" className={AURORA_CUSTOMER_360_SUBSECTION_TITLE}>
        {ti("customer360InterestTags")}
      </h4>
      <ul
        className="mt-2.5 flex flex-wrap gap-1.5"
        aria-label={ti("customer360InterestTags")}
      >
        {tags.map((tag) => (
          <li key={tag} className={AURORA_CUSTOMER_360_TAG}>
            {tag}
          </li>
        ))}
      </ul>
    </section>
  );
}
