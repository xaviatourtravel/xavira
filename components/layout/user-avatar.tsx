import { formatEffectiveRoleLabel } from "@/lib/auth/permission-matrix";
import {
  DesklabsAvatar,
  type DesklabsAvatarSize,
} from "@/components/ui/desklabs-avatar";

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_MAP: Record<NonNullable<UserAvatarProps["size"]>, DesklabsAvatarSize> = {
  sm: "xs",
  md: "md",
};

export function formatProfileRoleLabel(role: string) {
  const label = formatEffectiveRoleLabel(role);

  switch (label) {
    case "Owner":
      return "Pemilik";
    case "Admin":
      return "Administrator";
    case "Sales":
      return "Sales";
    case "Marketing":
      return "Marketing";
    case "Finance":
      return "Keuangan";
    default:
      return label;
  }
}

/** @deprecated Use DesklabsAvatar directly */
export function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  return (
    <DesklabsAvatar
      name={name}
      imageUrl={imageUrl}
      size={SIZE_MAP[size]}
      shape="rounded"
      fallbackClassName="bg-primary text-primary-foreground"
      className={className}
    />
  );
}
