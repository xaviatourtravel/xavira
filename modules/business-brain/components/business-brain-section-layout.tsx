import type { ReactNode } from "react";

type BusinessBrainSectionLayoutProps = {
  children: ReactNode;
  inspector?: ReactNode;
};

export function BusinessBrainSectionLayout({
  children,
  inspector,
}: BusinessBrainSectionLayoutProps) {
  if (!inspector) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-start gap-8">
      <div className="min-w-0 flex-1 space-y-6">{children}</div>
      <aside className="hidden w-[380px] shrink-0 xl:block">{inspector}</aside>
    </div>
  );
}
