"use client";

import Link from "next/link";

import { deletePackage } from "@/app/(dashboard)/packages/actions";

type PackageRowActionsProps = {
  packageId: string;
};

export function PackageRowActions({ packageId }: PackageRowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/packages/${packageId}/edit`}
        className="rounded border border-blue-600 px-2 py-1 text-xs text-blue-600"
      >
        Edit
      </Link>

      <form
        action={deletePackage}
        onSubmit={(event) => {
          if (!confirm("Yakin ingin menghapus paket ini?")) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="package_id" value={packageId} />
        <button
          type="submit"
          className="rounded border border-red-600 px-2 py-1 text-xs text-red-600"
        >
          Hapus
        </button>
      </form>
    </div>
  );
}
