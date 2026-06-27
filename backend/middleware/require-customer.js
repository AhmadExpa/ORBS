import { User } from "../db/models/index.js";
import { HttpError } from "../utils/http-error.js";
import { verifyClerkRequestToken } from "../services/clerk-auth-service.js";
import { ensureCustomerProfile } from "../services/customer-profile-service.js";

async function findUserFromRequest(req, { allowUnsynced = false, ignoreInvalidToken = false, autoCreate = false } = {}) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return null;
  }

  let payload;

  try {
    payload = await verifyClerkRequestToken(token);
  } catch (error) {
    if (ignoreInvalidToken) {
      return null;
    }

    throw error;
  }

  if (!payload?.sub) {
    return null;
  }

  let user = await User.findOne({ clerkId: payload.sub });
  if (!user && autoCreate) {
    user = await ensureCustomerProfile({ payload });
  }

  if (!user) {
    if (allowUnsynced) {
      return {
        user: null,
        clerkId: payload.sub,
        payload,
      };
    }

    throw new HttpError(401, "Customer profile is not synced yet.");
  }

  return {
    user,
    clerkId: payload.sub,
    payload,
  };
}

export async function attachCustomer(req, res, next) {
  try {
    const authContext = await findUserFromRequest(req, {
      allowUnsynced: true,
      ignoreInvalidToken: true,
    });
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
    const authContext = await findUserFromRequest(req, { autoCreate: true });
    if (!authContext?.user) {
      throw new HttpError(401, "Customer authentication required.");
    }

    req.auth = authContext;
    next();
  } catch (error) {
    next(error);
  }
}
