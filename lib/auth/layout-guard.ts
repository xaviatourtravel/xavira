import { enforceRoutePermission } from "@/lib/auth/route-access";
import { requireProfile } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permission-matrix";

export async function createModuleLayoutGuard(permission: Permission) {
  const { profile } = await requireProfile();
  await enforceRoutePermission(profile, permission);
}
