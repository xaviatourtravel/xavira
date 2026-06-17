"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { deleteKnowledgeEntry } from "@/app/(dashboard)/knowledge/actions";

export function KnowledgeDeleteButton({ entryId }: { entryId: string }) {
  return (
    <form
      action={deleteKnowledgeEntry}
      onSubmit={(event) => {
        if (!window.confirm("Hapus knowledge ini? Tindakan tidak bisa dibatalkan.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="entry_id" value={entryId} />
      <button
        type="submit"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-red-200 text-red-600 hover:bg-red-50",
        )}
      >
        Hapus
      </button>
    </form>
  );
}
