"use client";

import { useEffect, useState } from "react";

import {
  formatInboxActiveLabel,
  formatInboxRelativeTime,
} from "@/components/omnichannel-inbox/inbox-display";
import { cn } from "@/lib/utils";

type ClientOnlyRelativeTimeProps = {
  date: string | null;
  className?: string;
  placeholder?: string;
  emptyLabel?: string;
};

export function ClientOnlyRelativeTime({
  date,
  className,
  placeholder = "—",
  emptyLabel = "-",
}: ClientOnlyRelativeTimeProps) {
  const [mounted, setMounted] = useState(false);
  const [label, setLabel] = useState(emptyLabel);

  useEffect(() => {
    setMounted(true);

    const update = () => {
      setLabel(formatInboxRelativeTime(date));
    };

    update();
    const interval = window.setInterval(update, 60_000);

    return () => window.clearInterval(interval);
  }, [date]);

  const baseClassName = cn(
    "inline-block min-w-[64px] tabular-nums",
    className,
  );

  if (!date) {
    return <span className={baseClassName}>{emptyLabel}</span>;
  }

  if (!mounted) {
    return (
      <span className={baseClassName} suppressHydrationWarning>
        {placeholder}
      </span>
    );
  }

  return (
    <span className={baseClassName} suppressHydrationWarning>
      {label}
    </span>
  );
}

type ClientOnlyActiveLabelProps = {
  date: string | null;
  className?: string;
  placeholder?: string;
};

export function ClientOnlyActiveLabel({
  date,
  className,
  placeholder = "Aktif —",
}: ClientOnlyActiveLabelProps) {
  const [mounted, setMounted] = useState(false);
  const [label, setLabel] = useState(placeholder);

  useEffect(() => {
    setMounted(true);

    const update = () => {
      setLabel(formatInboxActiveLabel(date));
    };

    update();
    const interval = window.setInterval(update, 60_000);

    return () => window.clearInterval(interval);
  }, [date]);

  if (!mounted) {
    return (
      <span
        className={cn("inline-block min-w-[88px] tabular-nums", className)}
        suppressHydrationWarning
      >
        {placeholder}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-block min-w-[88px] tabular-nums", className)}
      suppressHydrationWarning
    >
      {label}
    </span>
  );
}
