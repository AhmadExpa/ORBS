import { verifyToken } from "@clerk/backend";
import { env } from "../config/env.js";

export async function verifyClerkRequestToken(token) {
  if (!token || !env.clerkSecretKey) {
    return null;
  }

  return verifyToken(token, {
    secretKey: env.clerkSecretKey,
  });
}
