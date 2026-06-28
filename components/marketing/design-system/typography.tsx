import type { ElementType, ReactNode } from "react";

import {
  marketingTypography,
  type MarketingTypographyVariant,
} from "@/components/marketing/design-system/tokens/typography";
import { cn } from "@/lib/utils";

type MarketingTextProps = {
  variant: MarketingTypographyVariant;
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

const defaultElements: Record<MarketingTypographyVariant, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  bodyLarge: "p",
  body: "p",
  small: "p",
  caption: "p",
  eyebrow: "p",
};

export function MarketingText({
  variant,
  as,
  children,
  className,
}: MarketingTextProps) {
  const Component = as ?? defaultElements[variant];

  return (
    <Component className={cn(marketingTypography[variant], className)}>
      {children}
    </Component>
  );
}

export function MarketingDisplay(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="display" {...props} />;
}

export function MarketingH1(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="h1" {...props} />;
}

export function MarketingH2(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="h2" {...props} />;
}

export function MarketingH3(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="h3" {...props} />;
}

export function MarketingBodyLarge(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="bodyLarge" {...props} />;
}

export function MarketingBody(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="body" {...props} />;
}

export function MarketingSmall(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="small" {...props} />;
}

export function MarketingCaption(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="caption" {...props} />;
}

export function MarketingEyebrow(props: Omit<MarketingTextProps, "variant">) {
  return <MarketingText variant="eyebrow" {...props} />;
}
