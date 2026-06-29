"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

import { DesklabsButton } from "@/components/ui/desklabs-button";

type FormSubmitButtonProps = ComponentProps<typeof DesklabsButton> & {
  loadingLabel?: string;
};

export function FormSubmitButton({
  loadingLabel = "Memproses...",
  children,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <DesklabsButton
      type="submit"
      loading={pending}
      loadingLabel={loadingLabel}
      {...props}
    >
      {children}
    </DesklabsButton>
  );
}
