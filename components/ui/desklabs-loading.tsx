import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { designSystemPanelClass } from "@/lib/design-system/tokens";

export type DesklabsLoadingMessage =
  | "Menyiapkan workspace..."
  | "AI sedang menyusun prioritas..."
  | "Memuat data customer..."
  | "Mengambil percakapan terbaru..."
  | "Menyiapkan halaman..."
  | "Memproses..."
  | "Menyimpan..."
  | "Membuat workspace..."
  | "Masuk..."
  | string;

type DesklabsSpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

const SPINNER_SIZE = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-8 w-8 border-[2.5px]",
} as const;

export function DesklabsSpinner({
  className,
  size = "md",
  label = "Memuat",
}: DesklabsSpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-slate-200 border-t-slate-600 motion-reduce:animate-none",
        SPINNER_SIZE[size],
        className,
      )}
    />
  );
}

type DesklabsInlineLoadingProps = {
  message?: DesklabsLoadingMessage;
  className?: string;
};

export function DesklabsInlineLoading({
  message = "Memproses...",
  className,
}: DesklabsInlineLoadingProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-slate-600", className)}>
      <DesklabsSpinner size="sm" label={message} />
      <span>{message}</span>
    </span>
  );
}

type DesklabsPageLoaderProps = {
  message?: DesklabsLoadingMessage;
  className?: string;
};

export function DesklabsPageLoader({
  message = "Menyiapkan halaman...",
  className,
}: DesklabsPageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center",
        className,
      )}
    >
      <DesklabsSpinner size="lg" label={message} />
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}

export function DesklabsSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-200/70 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export function DesklabsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(designSystemPanelClass, "p-5", className)}>
      <div className="flex items-center gap-3">
        <DesklabsSkeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <DesklabsSkeleton className="h-3 w-2/5" />
          <DesklabsSkeleton className="h-3 w-4/5" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <DesklabsSkeleton className="h-3 w-full" />
        <DesklabsSkeleton className="h-3 w-11/12" />
        <DesklabsSkeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

type DesklabsTableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

export function DesklabsTableSkeleton({
  rows = 6,
  columns = 4,
  className,
}: DesklabsTableSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <DesklabsSkeleton key={`head-${index}`} className="h-3 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <DesklabsSkeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn("h-3", colIndex === 0 ? "w-2/3" : "w-full")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

type DesklabsWorkspaceSkeletonProps = {
  message?: DesklabsLoadingMessage;
  cards?: number;
  className?: string;
};

export function DesklabsWorkspaceSkeleton({
  message = "Menyiapkan workspace...",
  cards = 3,
  className,
}: DesklabsWorkspaceSkeletonProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl space-y-6 px-4 py-6", className)}>
      <div className="flex items-center gap-3">
        <DesklabsSpinner label={message} />
        <p className="text-sm text-slate-600">{message}</p>
      </div>
      <div className="space-y-3">
        <DesklabsSkeleton className="h-8 w-64" />
        <DesklabsSkeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <DesklabsCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function DesklabsCustomerWorkspaceSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl space-y-8 px-4 py-6", className)}>
      <DesklabsSkeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <DesklabsCardSkeleton />
          <DesklabsCardSkeleton />
        </div>
        <DesklabsSkeleton className="h-[420px] w-full rounded-2xl" />
      </div>
      <DesklabsCardSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        <DesklabsCardSkeleton />
        <DesklabsCardSkeleton />
      </div>
    </div>
  );
}

export function DesklabsLoadingOverlay({
  message = "Memproses...",
  children,
}: {
  message?: DesklabsLoadingMessage;
  children?: ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-white/70 backdrop-blur-[1px]">
        <DesklabsInlineLoading message={message} />
      </div>
    </div>
  );
}
