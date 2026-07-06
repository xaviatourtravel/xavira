import type { ReactNode } from "react";

import {
  InspectorNotice,
  InspectorRow,
  InspectorSection,
} from "@/components/ui/inspector";

export * from "@/components/ui/inspector";

export function WorkspaceEmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] leading-relaxed text-muted-foreground">{children}</p>
  );
}

export function WorkspaceHealthCell({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return <InspectorRow label={label} value={value} />;
}

export function WorkspaceSection({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <InspectorSection title={title} action={action} className={className}>
      {children}
    </InspectorSection>
  );
}

export function InspectorInlineNotice({
  children,
  tone = "warning",
}: {
  children: ReactNode;
  tone?: "warning" | "neutral";
}) {
  return (
    <InspectorNotice tone={tone === "neutral" ? "neutral" : "warning"}>
      {children}
    </InspectorNotice>
  );
}
