"use client";

import { useCallback, useState } from "react";

import {
  buildMockOwnershipHistory,
  getMockTeamMember,
  MOCK_ASSIGNMENT_TEAM,
} from "./mock-team";
import type { Owner, OwnershipHistoryEntry } from "./types";

type ConversationAssignmentState = {
  ownerId: string | null;
  history: OwnershipHistoryEntry[];
};

function createInitialState(initialOwnerId: string | null): ConversationAssignmentState {
  if (!initialOwnerId) {
    return {
      ownerId: null,
      history: [],
    };
  }

  return {
    ownerId: initialOwnerId,
    history: buildMockOwnershipHistory(),
  };
}

export function useAssignmentState(subjectId: string, initialOwnerId: string | null) {
  const [stateBySubject, setStateBySubject] = useState<
    Record<string, ConversationAssignmentState>
  >({});

  const state = stateBySubject[subjectId] ?? createInitialState(initialOwnerId);

  const owner = state.ownerId ? getMockTeamMember(state.ownerId) ?? null : null;

  const assignOwner = useCallback(
    (member: Owner) => {
      const timestamp = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setStateBySubject((current) => {
        const previous = current[subjectId] ?? createInitialState(initialOwnerId);
        const previousOwner = previous.ownerId
          ? getMockTeamMember(previous.ownerId)
          : null;

        const historyEntry: OwnershipHistoryEntry = previousOwner
          ? {
              id: `history-transfer-${member.id}-${Date.now()}`,
              label: `Transferred to ${member.name}`,
              timestamp: `Today · ${timestamp}`,
              createdAt: new Date().toISOString(),
              assignedAt: new Date().toISOString(),
              assignedBy: previousOwner.name,
            }
          : {
              id: `history-assign-${member.id}-${Date.now()}`,
              label: `Assigned to ${member.name}`,
              timestamp: `Today · ${timestamp}`,
              createdAt: new Date().toISOString(),
              assignedAt: new Date().toISOString(),
              assignedBy: "You",
            };

        return {
          ...current,
          [subjectId]: {
            ownerId: member.id,
            history: [historyEntry, ...previous.history],
          },
        };
      });
    },
    [initialOwnerId, subjectId],
  );

  return {
    owner,
    history: state.history,
    team: MOCK_ASSIGNMENT_TEAM,
    assignOwner,
  };
}
