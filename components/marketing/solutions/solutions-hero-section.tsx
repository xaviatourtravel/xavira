import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { marketingRoutes } from "@/lib/marketing/routes";
import { cn } from "@/lib/utils";

export function SolutionsHeroSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_40%),linear-gradient(to_bottom,#ffffff,#f8fafc)] pb-16 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
            Solutions
          </p>
          <h1 className="mt-5 text-[2rem] font-semibold leading-[1.12] tracking-tight text-balance text-slate-950 sm:mt-6 sm:text-5xl lg:text-[3.1rem]">
            Solusi operasional customer untuk berbagai industri.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">
            Desklabs memiliki core platform yang sama—Communication, Customer, Task,
            Sales, Finance, Knowledge, Automation, dan AI—yang dapat disesuaikan
            untuk kebutuhan industri berbeda.
          </p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href={marketingRoutes.demo}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto",
              )}
            >
              Coba Demo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={marketingRoutes.platform}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              Lihat Platform
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
