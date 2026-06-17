import { cn } from "@/lib/utils";
import {
  formatKnowledgeCategoryLabel,
  type KnowledgeCategory,
} from "@/lib/knowledge/constants";

const CATEGORY_CLASSES: Record<KnowledgeCategory, string> = {
  product_knowledge: "bg-blue-50 text-blue-700",
  sop: "bg-purple-50 text-purple-700",
  faq: "bg-amber-50 text-amber-700",
  marketing_assets: "bg-emerald-50 text-emerald-700",
};

export function CategoryBadge({ category }: { category: KnowledgeCategory }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        CATEGORY_CLASSES[category] ?? "bg-muted text-muted-foreground",
      )}
    >
      {formatKnowledgeCategoryLabel(category)}
    </span>
  );
}
