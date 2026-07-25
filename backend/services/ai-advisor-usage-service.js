import { env } from "../config/env.js";
import { query } from "../db/postgres-client.js";
import { HttpError } from "../utils/http-error.js";

const USAGE_COLLECTION = "ai_advisor_usage";

export function getAiAdvisorPeriod(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getAiAdvisorResetAt(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function usageId(userId, period) {
  return `${String(userId)}:${period}`;
}

function serializeUsage({ messagesUsed = 0, date = new Date(), limit = env.aiAdvisorMonthlyMessageLimit }) {
  const used = Math.max(0, Math.min(Number(messagesUsed || 0), limit));
  return {
    period: getAiAdvisorPeriod(date),
    limit,
    used,
    remaining: Math.max(0, limit - used),
    resetsAt: getAiAdvisorResetAt(date).toISOString(),
  };
}

export async function getAiAdvisorUsage(
  userId,
  {
    date = new Date(),
    limit = env.aiAdvisorMonthlyMessageLimit,
    queryFn = query,
  } = {},
) {
  const period = getAiAdvisorPeriod(date);
  const result = await queryFn(
    `
      SELECT data
      FROM eo_documents
      WHERE collection = $1 AND id = $2
      LIMIT 1
    `,
    [USAGE_COLLECTION, usageId(userId, period)],
  );

  return serializeUsage({
    messagesUsed: result.rows[0]?.data?.messagesUsed || 0,
    date,
    limit,
  });
}

export async function reserveAiAdvisorMessage(
  userId,
  {
    date = new Date(),
    limit = env.aiAdvisorMonthlyMessageLimit,
    queryFn = query,
  } = {},
) {
  const period = getAiAdvisorPeriod(date);
  const id = usageId(userId, period);
  const now = new Date();
  const result = await queryFn(
    `
      INSERT INTO eo_documents (collection, id, data, created_at, updated_at)
      VALUES (
        $1,
        $2,
        jsonb_build_object(
          'userId', $3::text,
          'period', $4::text,
          'messagesUsed', 1,
          'monthlyLimit', $5::int
        ),
        $6,
        $6
      )
      ON CONFLICT (collection, id) DO UPDATE
      SET
        data = eo_documents.data || jsonb_build_object(
          'messagesUsed', COALESCE((eo_documents.data->>'messagesUsed')::int, 0) + 1,
          'monthlyLimit', $5::int
        ),
        updated_at = $6
      WHERE COALESCE((eo_documents.data->>'messagesUsed')::int, 0) < $5::int
      RETURNING data
    `,
    [USAGE_COLLECTION, id, String(userId), period, limit, now],
  );

  const row = result.rows[0];
  if (!row) {
    throw new HttpError(429, `You have used all ${limit} AI Advisor messages for this month.`, {
      code: "AI_ADVISOR_MONTHLY_LIMIT_REACHED",
      usage: serializeUsage({ messagesUsed: limit, date, limit }),
    });
  }

  return serializeUsage({
    messagesUsed: row.data?.messagesUsed || 1,
    date,
    limit,
  });
}

export async function refundAiAdvisorMessage(
  userId,
  {
    date = new Date(),
    queryFn = query,
  } = {},
) {
  const period = getAiAdvisorPeriod(date);
  await queryFn(
    `
      UPDATE eo_documents
      SET
        data = jsonb_set(
          data,
          '{messagesUsed}',
          to_jsonb(GREATEST(COALESCE((data->>'messagesUsed')::int, 0) - 1, 0)),
          true
        ),
        updated_at = $3
      WHERE collection = $1 AND id = $2
    `,
    [USAGE_COLLECTION, usageId(userId, period), new Date()],
  );
}
