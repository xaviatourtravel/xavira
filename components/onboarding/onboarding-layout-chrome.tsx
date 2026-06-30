import type { ReactNode } from "react";

type OnboardingLayoutProps = {
  children: ReactNode;
};

export function OnboardingLayoutChrome({ children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.07),transparent_42%),linear-gradient(to_bottom,#ffffff,#f8fafc)]">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              D
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-950">
              Desklabs
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.28)] sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
