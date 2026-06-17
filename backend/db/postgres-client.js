import { AsyncLocalStorage } from "async_hooks";
import { Pool } from "pg";
import { env } from "../config/env.js";

const transactionStorage = new AsyncLocalStorage();

function normalizeConnectionString(connectionString) {
  if (!connectionString.includes("sslmode=require") || connectionString.includes("uselibpqcompat=")) {
    return connectionString;
  }

  const separator = connectionString.includes("?") ? "&" : "?";
  return `${connectionString}${separator}uselibpqcompat=true`;
}

function createPool() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL or POSTGRES_URL is required for PostgreSQL persistence.");
  }

  const connectionString = normalizeConnectionString(env.databaseUrl);

  return new Pool({
    connectionString,
    max: Number(process.env.POSTGRES_POOL_MAX || 20),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
  });
}

export const pool = createPool();

export function getActiveClient() {
  return transactionStorage.getStore()?.client || pool;
}

export async function query(text, params = []) {
  return getActiveClient().query(text, params);
}

export async function withTransaction(callback, { isolationLevel = "READ COMMITTED" } = {}) {
  const existingClient = transactionStorage.getStore()?.client;
  if (existingClient) {
    return callback(existingClient);
  }

  const client = await pool.connect();

  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    const result = await transactionStorage.run({ client }, () => callback(client));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  await pool.end();
}
