import { cn } from "@/lib/utils";
import { getWorkspaceInitials } from "@/lib/workspace/parse-organization-workspace";
import type { WorkspaceDescriptor } from "@/lib/workspace/types";

type WorkspaceAvatarProps = {
  workspace: Pick<WorkspaceDescriptor, "name" | "brandColor" | "logoUrl">;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
};

export function WorkspaceAvatar({
  workspace,
  size = "md",
  className,
}: WorkspaceAvatarProps) {
  const initials = getWorkspaceInitials(workspace.name);

  if (workspace.logoUrl) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 overflow-hidden rounded-lg ring-1 ring-slate-200/80",
          SIZE_CLASSES[size],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={workspace.logoUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white ring-1 ring-black/5",
        SIZE_CLASSES[size],
        className,
      )}
      style={{ backgroundColor: workspace.brandColor }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
