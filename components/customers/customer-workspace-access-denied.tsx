import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { CUSTOMER_LIST_HREF } from "@/lib/customers/routes";
import { cn } from "@/lib/utils";

export function CustomerWorkspaceAccessDenied() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-violet-700">Ruang Kerja Customer</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-950">
        Anda tidak memiliki akses ke customer ini
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Hubungi admin workspace jika Anda yakin seharusnya bisa melihat customer ini.
      </p>
      <Link
        href={CUSTOMER_LIST_HREF}
        className={cn(buttonVariants(), "mt-6 gap-2")}
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Customer
      </Link>
    </div>
  );
}
