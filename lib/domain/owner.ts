export type OwnerStatus = "online" | "away" | "offline";

/** Team member who can own conversations, leads, or tasks. */
export type Owner = {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  status: OwnerStatus;
  workload: number;
  teamId?: string | null;
};

/** Persisted ownership transfer event. */
export type AssignmentEvent = {
  id: string;
  assignedFromId: string | null;
  assignedFromName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedByName: string | null;
  createdAt: string;
};

/** Display-oriented ownership history entry for timeline UI. */
export type OwnershipHistoryEntry = {
  id: string;
  label: string;
  timestamp: string;
  createdAt: string;
  assignedAt?: string | null;
  assignedBy?: string | null;
};

export type SubjectAssignment = {
  subjectId: string;
  owner: Owner | null;
  assignedAt: string | null;
  assignedBy: string | null;
  history: OwnershipHistoryEntry[];
};
