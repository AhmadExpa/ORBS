import { ensurePostgresSchema } from "./postgres-schema.js";
import { query } from "./postgres-client.js";

export async function connectToDatabase() {
  await query("SELECT 1");
  await ensurePostgresSchema();
}
