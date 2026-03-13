import { ActivityLog } from "../db/models/index.js";

export async function recordActivity({ actorId, actorRole, action, targetType, targetId, metadata = {} }) {
  return ActivityLog.create({
    actorId,
    actorRole,
    action,
    targetType,
    targetId,
    metadata,
  });
}

