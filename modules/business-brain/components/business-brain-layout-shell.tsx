import type { ReactNode } from "react";

/** @deprecated Layout is provided by BusinessBrainWorkspace. Pass children through. */
type BusinessBrainLayoutShellProps = {
  children: ReactNode;
};

export function BusinessBrainLayoutShell({
  children,
}: BusinessBrainLayoutShellProps) {
  return children;
}
