"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  deletePackage,
  duplicatePackage,
} from "@/app/(dashboard)/packages/actions";
import { cn } from "@/lib/utils";

type PackageRowActionsProps = {
  packageId: string;
  canEdit?: boolean;
  canDelete?: boolean;
};

export function PackageRowActions({
  packageId,
  canEdit = true,
  canDelete = true,
}: PackageRowActionsProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        type="button"
        aria-label="Package actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] rounded-xl border bg-background p-1 shadow-lg">
          {canEdit ? (
            <>
              <Link
                href={`/packages/${packageId}/edit`}
                onClick={() => setOpen(false)}
                className="flex min-h-[40px] items-center gap-2 rounded-lg px-3 text-sm hover:bg-muted"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Edit
              </Link>

              <form
                action={duplicatePackage}
                onSubmit={() => setOpen(false)}
              >
                <input type="hidden" name="package_id" value={packageId} />
                <button
                  type="submit"
                  className="flex min-h-[40px] w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-muted"
                >
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  Duplicate / Buat Salinan
                </button>
              </form>
            </>
          ) : null}

          {canDelete ? (
            <form
              action={deletePackage}
              onSubmit={(event) => {
                setOpen(false);

                if (!confirm("Yakin ingin menghapus paket ini?")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="package_id" value={packageId} />
              <button
                type="submit"
                className={cn(
                  "flex min-h-[40px] w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-red-600 hover:bg-red-50",
                )}
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
