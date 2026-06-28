import * as React from "react";

import { marketingColorClasses } from "@/components/marketing/design-system/tokens/colors";
import { marketingRadius } from "@/components/marketing/design-system/tokens/radius";
import { cn } from "@/lib/utils";

const fieldBaseClass = [
  "flex w-full text-sm text-slate-950",
  marketingRadius.button,
  "border border-slate-200 bg-white",
  "ring-offset-background placeholder:text-slate-400",
  marketingColorClasses.focusRing,
].join(" ");

export const marketingInputClassName = cn(fieldBaseClass, "h-10 px-3 py-2");

export const marketingSelectClassName = cn(fieldBaseClass, "h-10 px-3 py-2");

export const marketingTextareaClassName = cn(
  fieldBaseClass,
  "min-h-[140px] px-3 py-2",
);

type MarketingFormFieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function MarketingFormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: MarketingFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-900">
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const MarketingInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(marketingInputClassName, className)}
    {...props}
  />
));
MarketingInput.displayName = "MarketingInput";

export const MarketingSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(marketingSelectClassName, className)} {...props}>
    {children}
  </select>
));
MarketingSelect.displayName = "MarketingSelect";

export const MarketingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(marketingTextareaClassName, className)}
    {...props}
  />
));
MarketingTextarea.displayName = "MarketingTextarea";

export function MarketingForm({
  children,
  className,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form className={cn("space-y-5", className)} {...props}>
      {children}
    </form>
  );
}
