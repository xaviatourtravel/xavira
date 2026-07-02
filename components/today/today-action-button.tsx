"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { completeTodayTaskAction } from "@/app/(dashboard)/today/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { WorkspaceTask } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";

type TodayActionButtonProps = {
  task: WorkspaceTask;
  size?: "default" | "lg";
  /** Priority hero card — brand blue CTA with conversational label. */
  variant?: "default" | "priority";
  className?: string;
};

export function TodayActionButton({
  task,
  size = "default",
  variant = "default",
  className,
}: TodayActionButtonProps) {
  const action = task.primaryAction;
  const sizeClass = size === "lg" ? "h-11 px-6 text-base" : "";

  if (action.kind === "mark_done") {
    return (
      <form action={completeTodayTaskAction}>
        <input type="hidden" name="task_id" value={task.id} />
        <Button type="submit" size={size === "lg" ? "lg" : "default"} className={className}>
          Selesaikan
        </Button>
      </form>
    );
  }

  const label =
    variant === "priority"
      ? "Buka Percakapan"
      : action.kind === "reply"
        ? "Balas Sekarang"
        : action.label === "Open Customer"
          ? "Buka Customer"
          : action.label === "Open Booking"
            ? "Buka Booking"
            : action.label;

  return (
    <Link
      href={action.href}
      className={cn(
        buttonVariants({ size: size === "lg" ? "lg" : "default" }),
        variant === "priority"
          ? "bg-[#2563EB] hover:bg-[#1D4ED8]"
          : "bg-emerald-700 hover:bg-emerald-800",
        sizeClass,
        className,
      )}
    >
      {label}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}
