import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{siteConfig.name}</h1>
        <p className="mt-2 text-muted-foreground">{siteConfig.description}</p>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
          Masuk
        </Link>
        <Link href="/register" className={cn(buttonVariants())}>
          Daftar
        </Link>
      </div>
    </main>
  );
}
