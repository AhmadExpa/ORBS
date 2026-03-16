import mongoose from "mongoose";
import { env } from "../config/env.js";

const DEFAULT_DATABASE_NAME = "elevenorbits";

function resolveConnectionOptions(uri) {
  try {
    const parsedUri = new URL(uri);
    if (parsedUri.pathname && parsedUri.pathname !== "/") {
      return {};
    }
  } catch {
    return {};
  }

  return { dbName: DEFAULT_DATABASE_NAME };
}

export async function connectToDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri, resolveConnectionOptions(env.mongodbUri));
}
