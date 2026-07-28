import type {
  BrainId,
  MeetingApprovedMemory,
} from "@/modules/ai-team-member/lib/meeting-domain";

export type ApprovedMemoryRepository = {
  listApprovedMemories(params: {
    organizationId: string;
    brainId: BrainId;
  }): Promise<MeetingApprovedMemory[]>;
};

/**
 * Safe empty repository until the approved-memory migration is deployed.
 * Never fabricates memories.
 */
export function createEmptyApprovedMemoryRepository(): ApprovedMemoryRepository {
  return {
    async listApprovedMemories(params) {
      void params.organizationId;
      void params.brainId;
      return [];
    },
  };
}

/**
 * In-memory repository for tests. Enforces same-org + same-brain isolation.
 */
export function createInMemoryApprovedMemoryRepository(
  rows: MeetingApprovedMemory[] = [],
): ApprovedMemoryRepository {
  return {
    async listApprovedMemories(params) {
      return rows.filter(
        (row) =>
          row.organizationId === params.organizationId &&
          row.brainId === params.brainId,
      );
    },
  };
}
