export type {
  Owner,
  OwnerStatus,
  OwnershipHistoryEntry,
  SubjectAssignment,
} from "@/lib/domain/owner";

/** UI copy bundle for assignment components — not part of the domain model. */
export type AssignmentLabels = {
  assignOwner: string;
  sheetTitle: string;
  sheetSubtext: string;
  searchPlaceholder: string;
  ownershipHistory: string;
  unassigned: string;
  statusOnline: string;
  statusAway: string;
  statusOffline: string;
  workloadChats: string;
  closeAriaLabel: string;
};
