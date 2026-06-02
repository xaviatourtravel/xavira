"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <button type="button" onClick={reset}>
        Retry
      </button>
    </div>
  );
}
