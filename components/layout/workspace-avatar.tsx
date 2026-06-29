import {
  DesklabsAvatar,
  type DesklabsAvatarSize,
} from "@/components/ui/desklabs-avatar";
import { cn } from "@/lib/utils";
import type { WorkspaceDescriptor } from "@/lib/workspace/types";

type WorkspaceAvatarProps = {
  workspace: Pick<WorkspaceDescriptor, "name" | "brandColor" | "logoUrl">;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_MAP: Record<NonNullable<WorkspaceAvatarProps["size"]>, DesklabsAvatarSize> = {
  sm: "sm",
  md: "md",
};

/** @deprecated Use DesklabsAvatar with shape="rounded" directly */
export function WorkspaceAvatar({
  workspace,
  size = "md",
  className,
}: WorkspaceAvatarProps) {
  if (workspace.logoUrl) {
    return (
      <DesklabsAvatar
        name={workspace.name}
        imageUrl={workspace.logoUrl}
        size={SIZE_MAP[size]}
        shape="rounded"
        className={cn("ring-1 ring-slate-200/80", className)}
      />
    );
  }

  return (
    <DesklabsAvatar
      name={workspace.name}
      size={SIZE_MAP[size]}
      shape="rounded"
      fallbackBackgroundColor={workspace.brandColor}
      className={cn("text-white ring-1 ring-black/5", className)}
    />
  );
}
