import { loadBrainDocumentsAction } from "@/modules/business-brain/actions";
import { DocumentsPageClient } from "@/modules/business-brain/components/documents-page";

export const metadata = {
  title: "Documents · Business Brain · Desklabs",
};

export default async function BusinessBrainDocumentsPage() {
  const { documents, products, articles, canEdit } = await loadBrainDocumentsAction();

  return (
    <DocumentsPageClient
      initialDocuments={documents}
      productOptions={products}
      articleOptions={articles}
      canEdit={canEdit}
    />
  );
}
