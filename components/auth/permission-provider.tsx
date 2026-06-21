"use client";

import { createContext, useContext, useMemo } from "react";

import type { Permission } from "@/lib/auth/permission-matrix";

type PermissionContextValue = {
  permissions: ReadonlySet<Permission>;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  permissions,
  children,
}: {
  permissions: Permission[];
  children: React.ReactNode;
}) {
  const value = useMemo<PermissionContextValue>(() => {
    const permissionSet = new Set(permissions);

    return {
      permissions: permissionSet,
      can: (permission) => permissionSet.has(permission),
      canAny: (required) => required.some((permission) => permissionSet.has(permission)),
      canAll: (required) =>
        required.every((permission) => permissionSet.has(permission)),
    };
  }, [permissions]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }

  return context;
}

export function usePermission(permission: Permission) {
  const { can } = usePermissions();
  return can(permission);
}
