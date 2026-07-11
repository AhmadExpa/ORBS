import jwt from "jsonwebtoken";
import { CustomerDelegate, User } from "../db/models/index.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";
import { findUserFromRequest } from "./require-customer.js";
import { requireApprovedContract } from "../services/contract-service.js";

export const DELEGATE_SESSION_COOKIE = "eo_delegate_session";

function assertActiveCustomer(user) {
  if (!user) {
    throw new HttpError(401, "Customer authentication required.");
  }

  if (user.accountStatus === "blocked") {
    throw new HttpError(403, "Your account has been blocked. Please check your email for details.", {
      code: "ACCOUNT_BLOCKED",
      accountStatus: "blocked",
    });
  }

  if (user.accountStatus === "suspended") {
    throw new HttpError(403, "Your account has been suspended due to suspicious activity. Contact support for more queries.", {
      code: "ACCOUNT_SUSPENDED",
      accountStatus: "suspended",
    });
  }
}

function resolveBearerToken(req) {
  return req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
}

function resolveDelegateToken(req) {
  return req.cookies?.[DELEGATE_SESSION_COOKIE] || resolveBearerToken(req);
}

export function signDelegateToken(delegate) {
  return jwt.sign(
    {
      delegateId: delegate._id,
      ownerUserId: delegate.userId?._id || delegate.userId,
      role: "customer_delegate",
    },
    env.jwtSecret,
    { expiresIn: "7d" },
  );
}

async function resolveDelegateFromRequest(req, { ignoreInvalidToken = false, enforceApprovedContract = true } = {}) {
  const token = resolveDelegateToken(req);

  if (!token) {
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    if (ignoreInvalidToken) {
      return null;
    }

    throw new HttpError(401, "Agent session is invalid.");
  }

  if (payload?.role !== "customer_delegate" || !payload.delegateId) {
    return null;
  }

  const delegate = await CustomerDelegate.findById(payload.delegateId);
  if (!delegate || !delegate.isActive) {
    if (ignoreInvalidToken) {
      return null;
    }

    throw new HttpError(401, "Agent session is invalid.");
  }

  const owner = await User.findById(delegate.userId);
  if (!owner) {
    if (ignoreInvalidToken) {
      return null;
    }

    throw new HttpError(401, "Agent account owner is no longer available.");
  }

  assertActiveCustomer(owner);

  if (enforceApprovedContract) {
    await requireApprovedContract(owner.clerkId);
  }

  return {
    user: owner,
    clerkId: owner.clerkId,
    delegate,
    actorType: "delegate",
    allowedSubscriptionIds: Array.isArray(delegate.subscriptionIds) ? delegate.subscriptionIds.map(String) : [],
    payload,
  };
}

export async function attachDelegate(req, res, next) {
  try {
    const delegateContext = await resolveDelegateFromRequest(req, {
      ignoreInvalidToken: true,
      enforceApprovedContract: false,
    });

    if (delegateContext) {
      req.delegateAuth = delegateContext;
      if (!req.auth?.user) {
        req.auth = delegateContext;
      }
    } else if (req.cookies?.[DELEGATE_SESSION_COOKIE]) {
      res.clearCookie(DELEGATE_SESSION_COOKIE);
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function findPortalActorFromRequest(req, { autoCreateCustomer = true, enforceDelegateApprovedContract = true } = {}) {
  if (req.auth?.user && req.auth.actorType === "delegate") {
    if (enforceDelegateApprovedContract) {
      await requireApprovedContract(req.auth.user.clerkId);
    }
    return req.auth;
  }

  if (req.auth?.user) {
    assertActiveCustomer(req.auth.user);
    return {
      ...req.auth,
      actorType: "owner",
      allowedSubscriptionIds: null,
    };
  }

  const customerContext = await findUserFromRequest(req, {
    autoCreate: autoCreateCustomer,
    ignoreInvalidToken: true,
  });
  if (customerContext?.user) {
    assertActiveCustomer(customerContext.user);
    return {
      ...customerContext,
      actorType: "owner",
      allowedSubscriptionIds: null,
    };
  }

  return resolveDelegateFromRequest(req, {
    ignoreInvalidToken: false,
    enforceApprovedContract: enforceDelegateApprovedContract,
  });
}

export async function requirePortalActor(req, res, next) {
  try {
    const authContext = await findPortalActorFromRequest(req);
    if (!authContext?.user) {
      throw new HttpError(401, "Portal authentication required.");
    }

    req.auth = authContext;
    next();
  } catch (error) {
    if (error.statusCode === 401 && req.cookies?.[DELEGATE_SESSION_COOKIE]) {
      res.clearCookie(DELEGATE_SESSION_COOKIE);
    }
    next(error);
  }
}

export function requirePortalOwner(req, res, next) {
  if (req.auth?.actorType === "delegate") {
    next(new HttpError(403, "Account owner access required."));
    return;
  }

  next();
}

export function isDelegateActor(req) {
  return req.auth?.actorType === "delegate" && Boolean(req.auth?.delegate);
}

export function isSubscriptionAssignedToDelegate(req, subscriptionId) {
  if (!isDelegateActor(req)) {
    return true;
  }

  return req.auth.allowedSubscriptionIds?.includes(String(subscriptionId));
}

export function serializeDelegateSession(delegate, owner) {
  return {
    id: delegate._id,
    username: delegate.username,
    displayName: delegate.displayName || delegate.username,
    subscriptionIds: Array.isArray(delegate.subscriptionIds) ? delegate.subscriptionIds.map(String) : [],
    owner: {
      id: owner._id,
      name: owner.name,
      email: owner.email,
      company: owner.company,
    },
  };
}
