"use client";

import {
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { formatTranslation } from "@/lib/i18n/dictionary";
import { useBbTranslation } from "@/modules/business-brain/hooks/use-bb-translation";
import { cn } from "@/lib/utils";

export const EXPANDABLE_LIST_DEFAULT_VISIBLE_COUNT = 5;

const EXPAND_ANIMATION_CLASS =
  "transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none";
const EXPAND_CONTENT_CLASS =
  "animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none";

type ExpandableListProps<T> = {
  items: readonly T[];
  initialVisibleCount?: number;
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  as?: ElementType;
  itemAs?: ElementType;
  className?: string;
  itemsClassName?: string;
  itemClassName?: string;
  toggleClassName?: string;
};

export function ExpandableList<T>({
  items,
  initialVisibleCount = EXPANDABLE_LIST_DEFAULT_VISIBLE_COUNT,
  getItemKey,
  renderItem,
  as: Container = "div",
  itemAs: ItemWrapper,
  className,
  itemsClassName,
  itemClassName,
  toggleClassName,
}: ExpandableListProps<T>) {
  const { bb } = useBbTranslation();
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const hasHiddenItems = items.length > initialVisibleCount;
  const primaryItems = hasHiddenItems
    ? items.slice(0, initialVisibleCount)
    : items;
  const overflowItems = hasHiddenItems ? items.slice(initialVisibleCount) : [];
  const remainingCount = overflowItems.length;

  const renderListItem = (item: T, index: number) => {
    const key = getItemKey(item, index);
    if (ItemWrapper) {
      return (
        <ItemWrapper key={key} className={itemClassName}>
          {renderItem(item, index)}
        </ItemWrapper>
      );
    }

    return (
      <div key={key}>
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <div className={className}>
      <Container className={itemsClassName}>
        {primaryItems.map((item, index) => renderListItem(item, index))}
      </Container>

      {hasHiddenItems ? (
        <div
          className={cn(
            EXPAND_ANIMATION_CLASS,
            "grid",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
          )}
          aria-hidden={!expanded}
        >
          <div className="overflow-hidden">
            <Container
              className={cn(itemsClassName, EXPAND_CONTENT_CLASS, expanded ? "mt-1.5" : undefined)}
            >
              {overflowItems.map((item, overflowIndex) =>
                renderListItem(item, overflowIndex + initialVisibleCount),
              )}
            </Container>
          </div>
        </div>
      ) : null}

      {hasHiddenItems ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
            toggleClassName,
          )}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {bb("showLess")}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {formatTranslation(bb("showMore"), { count: String(remainingCount) })}
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
