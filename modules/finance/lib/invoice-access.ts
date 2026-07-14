import type { Profile } from "@/types/app-types";

import { hasPermission } from "@/lib/auth/permissions";
import type { Permission } from "@/lib/auth/permission-matrix";

export function requireOrganizationId(profile: Profile): string {
  if (!profile.organization_id) {
    throw new Error("Organization is required.");
  }
  return profile.organization_id;
}

export function assertSameOrganization(
  resourceOrganizationId: string,
  actorOrganizationId: string,
  message = "Resource does not belong to your organization.",
): void {
  if (resourceOrganizationId !== actorOrganizationId) {
    throw new Error(message);
  }
}

export function assertInvoicePermission(
  profile: Profile,
  permission: Permission,
): void {
  if (!hasPermission(profile, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
}

export function canViewInvoices(profile: Profile) {
  return hasPermission(profile, "invoices.view");
}

export function canCreateInvoices(profile: Profile) {
  return hasPermission(profile, "invoices.create");
}

export function canEditInvoices(profile: Profile) {
  return hasPermission(profile, "invoices.edit");
}

export function canIssueInvoices(profile: Profile) {
  return hasPermission(profile, "invoices.issue");
}

export function canVoidInvoices(profile: Profile) {
  return hasPermission(profile, "invoices.void");
}

export function isCommerciallyLockedLifecycle(
  lifecycleStatus: string,
): boolean {
  return (
    lifecycleStatus === "issued" ||
    lifecycleStatus === "sent" ||
    lifecycleStatus === "void"
  );
}

/** Reject cross-customer booking references for linked_customer invoices. */
export function assertBookingMatchesInvoiceCustomer(
  bookingLeadId: string | null | undefined,
  invoiceCustomerId: string,
): void {
  if (bookingLeadId && bookingLeadId !== invoiceCustomerId) {
    throw new Error("Booking customer must match invoice customer");
  }
}
