import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: React.ReactNode;
  cardSubtitle?: string;
  showLegalFooter?: boolean;
  className?: string;
};

export function AuthBrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-sm",
        className,
      )}
    >
      D
    </span>
  );
}

export function AuthShell({
  children,
  cardSubtitle,
  showLegalFooter = false,
  className,
}: AuthShellProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-10",
        "bg-[radial-gradient(ellipse_at_top,_rgba(148,163,184,0.18),_transparent_55%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_45%,#eef2ff_100%)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.08),transparent_40%)]" />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <AuthBrandMark />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Desklabs
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Operating System untuk bisnis modern.
          </p>
        </div>

        <div className="w-full max-w-[440px] rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-8">
          {cardSubtitle ? (
            <p className="mb-6 text-center text-sm leading-relaxed text-slate-500">
              {cardSubtitle}
            </p>
          ) : null}
          {children}
        </div>

        {showLegalFooter ? (
          <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-slate-500">
            Dengan masuk, Anda menyetujui{" "}
            <Link href="/terms" className="font-medium text-slate-700 hover:text-slate-950">
              Syarat Layanan
            </Link>{" "}
            dan{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-slate-700 hover:text-slate-950"
            >
              Kebijakan Privasi
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
