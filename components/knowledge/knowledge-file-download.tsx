"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getKnowledgeFileUrl } from "@/app/(dashboard)/knowledge/actions";

type KnowledgeFileDownloadProps = {
  entryId: string;
  fileName: string | null;
};

export function KnowledgeFileDownload({
  entryId,
  fileName,
}: KnowledgeFileDownloadProps) {
  const [isPending, startTransition] = useTransition();

  function handleDownload() {
    startTransition(async () => {
      const result = await getKnowledgeFileUrl(entryId);
      if (result.success) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        window.alert(result.message);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isPending}
    >
      <Download className="h-4 w-4" />
      {isPending ? "Menyiapkan..." : `Unduh ${fileName ? "dokumen" : "file"}`}
    </Button>
  );
}
