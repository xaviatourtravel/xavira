import type { UserRole } from "@/types/app-types";

export function canDemoteOwner(
  currentRole: UserRole,
  newRole: UserRole,
  ownerCount: number,
) {
  if (currentRole !== "owner" || newRole === "owner") {
    return true;
  }

  return ownerCount > 1;
}

export function getTeamRoleChangeErrorMessage(
  currentRole: UserRole,
  newRole: UserRole,
  ownerCount: number,
) {
  if (currentRole === newRole) {
    return "Role tidak berubah.";
  }

  if (!canDemoteOwner(currentRole, newRole, ownerCount)) {
    return "Tidak dapat mengubah role owner terakhir di organisasi.";
  }

  return null;
}
