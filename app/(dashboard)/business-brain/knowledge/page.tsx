import { loadBrainArticlesAction } from "@/modules/business-brain/actions";
import { KnowledgePageClient } from "@/modules/business-brain/components/knowledge-page";

export const metadata = {
  title: "Knowledge · Business Brain · Desklabs",
};

export default async function BusinessBrainKnowledgePage() {
  const { articles, products, canEdit } = await loadBrainArticlesAction();

  return (
    <KnowledgePageClient
      initialArticles={articles}
      productOptions={products}
      canEdit={canEdit}
    />
  );
}
