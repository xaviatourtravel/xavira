import type { Profile } from "@/types/app-types";

import { hasPermission } from "./permissions";
import type { Permission } from "./permission-matrix";

export function denyAction(profile: Profile, permission: Permission) {
  if (hasPermission(profile, permission)) {
    return null;
  }

  return {
    success: false as const,
    message: "You do not have permission to perform this action.",
  };
}

export function assertActionPermission(profile: Profile, permission: Permission) {
  const denied = denyAction(profile, permission);
  if (denied) {
    throw new Error(denied.message);
  }
}
