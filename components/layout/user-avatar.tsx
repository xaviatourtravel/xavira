import { formatEffectiveRoleLabel } from "@/lib/auth/permission-matrix";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
};

const SIZE_CLASSES = {
  sm: "h-6 w-6 text-[10px] rounded-md",
  md: "h-10 w-10 text-xs rounded-lg",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }

  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

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

export function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  if (imageUrl) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 overflow-hidden ring-1 ring-slate-200/80",
          SIZE_CLASSES[size],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-slate-900 font-semibold text-white ring-1 ring-black/5",
        SIZE_CLASSES[size],
        className,
      )}
      aria-hidden
    >
      {getInitials(name)}
    </span>
  );
}
