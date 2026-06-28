import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { marketingAnimation } from "@/components/marketing/design-system/tokens/animation";
import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { cn } from "@/lib/utils";

export const marketingButtonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium",
    "rounded-md transition-colors",
    marketingColorClasses.focusRing,
    marketingAnimation.hoverScale,
    marketingAnimation.respectMotion,
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-emerald-700 text-white hover:bg-emerald-800",
        secondary: "bg-slate-950 text-white hover:bg-slate-800",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        outline:
          "border border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
        link: "text-emerald-700 underline-offset-4 hover:text-emerald-800 hover:underline",
      },
      size: {
        sm: "h-9 px-3",
        default: "h-10 px-4 py-2",
        lg: "h-11 px-8",
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
        className: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
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
