import type { Owner, OwnershipHistoryEntry } from "./types";

export const MOCK_ASSIGNMENT_TEAM: Owner[] = [
  {
    id: "adi",
    name: "Adi Saputra",
    avatar: null,
    role: "Sales Consultant",
    status: "online",
    workload: 12,
    teamId: "sales-jakarta",
  },
  {
    id: "hisbi",
    name: "Hisbi",
    avatar: null,
    role: "Sales Consultant",
    status: "online",
    workload: 8,
    teamId: "sales-jakarta",
  },
  {
    id: "sri",
    name: "Sri",
    avatar: null,
    role: "Senior Consultant",
    status: "away",
    workload: 15,
    teamId: "sales-jakarta",
  },
  {
    id: "rendhy",
    name: "Rendhy",
    avatar: null,
    role: "Team Lead",
    status: "offline",
    workload: 6,
    teamId: "sales-jakarta",
  },
  {
    id: "shinta",
    name: "Shinta",
    avatar: null,
    role: "Sales Consultant",
    status: "online",
    workload: 10,
    teamId: "sales-jakarta",
  },
];

export function getMockTeamMember(id: string): Owner | undefined {
  return MOCK_ASSIGNMENT_TEAM.find((member) => member.id === id);
}

export function buildMockOwnershipHistory(): OwnershipHistoryEntry[] {
  const now = new Date();
  const today = new Date(now);
  today.setHours(9, 30, 0, 0);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 15, 0, 0);

  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(11, 0, 0, 0);

  return [
    {
      id: "history-assigned-adi",
      label: "Assigned to Adi",
      timestamp: "Today · 09:30",
      createdAt: today.toISOString(),
      assignedAt: today.toISOString(),
      assignedBy: "System",
    },
    {
      id: "history-transferred-sri",
      label: "Transferred from Sri",
      timestamp: "Yesterday",
      createdAt: yesterday.toISOString(),
      assignedAt: yesterday.toISOString(),
      assignedBy: "Rendhy",
    },
    {
      id: "history-assigned-ai",
      label: "Assigned by AI",
      timestamp: "2 days ago",
      createdAt: twoDaysAgo.toISOString(),
      assignedAt: twoDaysAgo.toISOString(),
      assignedBy: "AI",
    },
  ];
}
