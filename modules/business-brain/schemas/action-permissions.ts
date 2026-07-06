import { z } from "zod";

import { PERMISSIONED_ACTION_TYPES } from "@/modules/business-brain/types/action-permissions";

export const updateActionPermissionSchema = z.object({
  actionType: z.enum(PERMISSIONED_ACTION_TYPES),
  enabled: z.boolean(),
  requireManualApproval: z.boolean(),
  minimumConfidence: z.number().min(0.5).max(1),
});
