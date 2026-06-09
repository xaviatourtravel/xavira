"use client";

import { deleteContent } from "@/app/(dashboard)/content/actions";

type ContentDeleteButtonProps = {
  contentId: string;
};

export function ContentDeleteButton({ contentId }: ContentDeleteButtonProps) {
  return (
    <form
      action={deleteContent}
      onSubmit={(event) => {
        if (!confirm("Yakin ingin menghapus content ini?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="content_id" value={contentId} />
      <button
        type="submit"
        className="rounded border border-red-600 px-3 py-2 text-sm text-red-600"
      >
        Hapus
      </button>
    </form>
  );
}
