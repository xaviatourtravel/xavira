import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const dsBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        aktif: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
        menunggu: "bg-amber-50 text-amber-800 ring-amber-200/80",
        diproses: "bg-sky-50 text-sky-800 ring-sky-200/80",
        "perlu-tindakan": "bg-violet-50 text-violet-800 ring-violet-200/80",
        bermasalah: "bg-red-50 text-red-800 ring-red-200/80",
        netral: "bg-slate-100 text-slate-700 ring-slate-200/80",
      },
    },
    defaultVariants: {
      variant: "netral",
    },
  },
);

export type DsBadgeProps = VariantProps<typeof dsBadgeVariants> & {
  children: ReactNode;
  className?: string;
};

export function DsBadge({ children, variant, className }: DsBadgeProps) {
  return (
    <span className={cn(dsBadgeVariants({ variant, className }))}>{children}</span>
  );
}

export { dsBadgeVariants };
