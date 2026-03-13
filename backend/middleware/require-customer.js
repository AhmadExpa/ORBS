import { User } from "../db/models/index.js";
import { HttpError } from "../utils/http-error.js";
import { verifyClerkRequestToken } from "../services/clerk-auth-service.js";

async function findUserFromRequest(req, { allowUnsynced = false } = {}) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return null;
  }

  const payload = await verifyClerkRequestToken(token);

  if (!payload?.sub) {
    return null;
  }

  const user = await User.findOne({ clerkId: payload.sub });
  if (!user) {
    if (allowUnsynced) {
      return {
        user: null,
        clerkId: payload.sub,
      };
    }

    throw new HttpError(401, "Customer profile is not synced yet.");
  }

  return {
    user,
    clerkId: payload.sub,
  };
}

export async function attachCustomer(req, res, next) {
  try {
    const authContext = await findUserFromRequest(req, { allowUnsynced: true });
    if (authContext?.user) {
      req.auth = authContext;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireCustomer(req, res, next) {
  try {
    const authContext = await findUserFromRequest(req);
    if (!authContext?.user) {
      throw new HttpError(401, "Customer authentication required.");
    }

    req.auth = authContext;
    next();
  } catch (error) {
    next(error);
  }
}
