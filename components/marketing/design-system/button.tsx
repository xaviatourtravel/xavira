import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { marketingAnimation } from "@/components/marketing/design-system/tokens/animation";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { marketingRadius } from "@/components/marketing/design-system/tokens/radius";
import { cn } from "@/lib/utils";

export const marketingButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
    marketingRadius.button,
    "transition-colors duration-[var(--marketing-duration-fast)] ease-[var(--marketing-ease-standard)]",
    marketingColorClasses.focusRing,
    marketingAnimation.respectMotion,
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--marketing-primary)] text-[var(--marketing-primary-foreground)] hover:bg-[var(--marketing-primary-hover)]",
        secondary:
          "bg-[var(--marketing-foreground)] text-white hover:bg-slate-800",
        ghost:
          "text-[var(--marketing-muted)] hover:bg-[var(--marketing-surface)] hover:text-[var(--marketing-foreground)]",
        outline:
          "border border-[var(--marketing-border-strong)] bg-[var(--marketing-background)] text-[var(--marketing-foreground)] hover:bg-[var(--marketing-surface)]",
        link: "h-auto min-h-0 px-0 text-[var(--marketing-primary)] underline-offset-4 hover:text-[var(--marketing-primary-hover)] hover:underline",
      },
      size: {
        sm: "min-h-11 h-11 px-3",
        default: "min-h-11 h-11 px-4",
        lg: "min-h-11 h-11 px-8 text-base",
      },
      /** For CTA sections on dark backgrounds */
      onDark: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        onDark: true,
        className:
          "bg-[var(--marketing-brand-500)] text-white hover:bg-[var(--marketing-brand-600)]",
      },
      {
        variant: "outline",
        onDark: true,
        className:
          "border-slate-700 bg-transparent text-white hover:bg-slate-900 hover:text-white",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
      onDark: false,
    },
  },
);

export type MarketingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof marketingButtonVariants>;

export const MarketingButton = React.forwardRef<
  HTMLButtonElement,
  MarketingButtonProps
>(({ className, variant, size, onDark, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(marketingButtonVariants({ variant, size, onDark, className }))}
    {...props}
  />
));
MarketingButton.displayName = "MarketingButton";
