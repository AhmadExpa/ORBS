import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectToDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri);
}

