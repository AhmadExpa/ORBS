import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { CustomerDelegate, Subscription, User } from "../../db/models/index.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import {
  DELEGATE_SESSION_COOKIE,
  isDelegateActor,
  requirePortalActor,
  serializeDelegateSession,
  signDelegateToken,
} from "../../middleware/require-portal-actor.js";
import { requireApprovedContract } from "../../services/contract-service.js";
import { recordActivity } from "../../services/activity-log-service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { env } from "../../config/env.js";

export const delegatesRouter = express.Router();
export const delegateAuthRouter = express.Router();

const usernamePattern = /^[a-zA-Z0-9._-]+$/;

const createDelegateSchema = z.object({
  username: z.string().trim().min(3).max(80).regex(usernamePattern, "Use letters, numbers, dots, underscores, or hyphens."),
  displayName: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(200),
  subscriptionIds: z.array(z.string().trim().min(1)).min(1),
  isActive: z.boolean().optional(),
});

const updateDelegateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  subscriptionIds: z.array(z.string().trim().min(1)).min(1).optional(),
  isActive: z.boolean().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(8).max(200),
});

const loginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(200),
});

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function delegateCookieOptions() {
  const options = {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  if (env.sessionCookieDomain) {
    options.domain = env.sessionCookieDomain;
  }

  return options;
}

function delegateClearCookieOptions() {
  const { maxAge, ...options } = delegateCookieOptions();
  return options;
}

function serializeDelegate(delegate) {
  return {
    _id: delegate._id,
    username: delegate.username,
    displayName: delegate.displayName,
    subscriptionIds: Array.isArray(delegate.subscriptionIds)
      ? delegate.subscriptionIds.map((item) => (item?._id ? String(item._id) : String(item)))
      : [],
    subscriptions: Array.isArray(delegate.subscriptionIds)
      ? delegate.subscriptionIds
          .filter((item) => item && typeof item === "object" && item._id)
          .map((item) => ({
            _id: item._id,
            status: item.status,
            productPlanId: item.productPlanId,
          }))
      : [],
    isActive: Boolean(delegate.isActive),
    lastLoginAt: delegate.lastLoginAt,
    deactivatedAt: delegate.deactivatedAt,
    createdAt: delegate.createdAt,
    updatedAt: delegate.updatedAt,
  };
}

async function requireApprovedOwner(req) {
  await requireApprovedContract(req.auth.clerkId);
}

async function validateOwnedSubscriptions(userId, subscriptionIds) {
  const uniqueIds = [...new Set((subscriptionIds || []).map(String))];
  if (!uniqueIds.length) {
    throw new HttpError(400, "Assign at least one service.");
  }

  const subscriptions = await Subscription.find({
    _id: { $in: uniqueIds },
    userId,
    customerDeletedAt: null,
  });

  if (subscriptions.length !== uniqueIds.length) {
    throw new HttpError(400, "One or more selected services are not available on this account.");
  }

  return uniqueIds;
}

delegateAuthRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const delegate = await CustomerDelegate.findOne({
      usernameNormalized: normalizeUsername(payload.username),
    });

    if (!delegate || !delegate.isActive) {
      throw new HttpError(401, "Invalid agent credentials.");
    }

    const passwordMatches = await bcrypt.compare(payload.password, delegate.passwordHash || "");
    if (!passwordMatches) {
      throw new HttpError(401, "Invalid agent credentials.");
    }

    const owner = await User.findById(delegate.userId);
    if (!owner) {
      throw new HttpError(401, "Agent account owner is no longer available.");
    }

    if (owner.accountStatus === "blocked" || owner.accountStatus === "suspended") {
      throw new HttpError(403, "This customer account is not active.");
    }

    await requireApprovedContract(owner.clerkId);

    delegate.lastLoginAt = new Date();
    await delegate.save();

    const token = signDelegateToken(delegate);
    res.cookie(DELEGATE_SESSION_COOKIE, token, delegateCookieOptions());

    await recordActivity({
      actorId: delegate._id,
      actorRole: "customer_delegate",
      action: "delegate.login",
      targetType: "customer_delegate",
      targetId: String(delegate._id),
      metadata: {
        ownerUserId: String(owner._id),
      },
    });

    res.json({
      delegate: serializeDelegateSession(delegate, owner),
      actorType: "delegate",
      token,
    });
  }),
);

delegateAuthRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie(DELEGATE_SESSION_COOKIE, delegateClearCookieOptions());
    res.json({ success: true });
  }),
);

delegateAuthRouter.get(
  "/me",
  requirePortalActor,
  asyncHandler(async (req, res) => {
    if (!isDelegateActor(req)) {
      throw new HttpError(401, "Agent authentication required.");
    }

    res.json({
      delegate: serializeDelegateSession(req.auth.delegate, req.auth.user),
      actorType: "delegate",
    });
  }),
);

delegatesRouter.get(
  "/",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await requireApprovedOwner(req);

    const delegates = await CustomerDelegate.find({ userId: req.auth.user._id })
      .populate({
        path: "subscriptionIds",
        populate: {
          path: "productPlanId",
        },
      })
      .sort({ createdAt: -1 });

    res.json({ delegates: delegates.map(serializeDelegate) });
  }),
);

delegatesRouter.post(
  "/",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await requireApprovedOwner(req);

    const payload = createDelegateSchema.parse(req.body);
    const usernameNormalized = normalizeUsername(payload.username);
    const existing = await CustomerDelegate.findOne({ usernameNormalized });
    if (existing) {
      throw new HttpError(409, "That agent username is already in use.");
    }

    const subscriptionIds = await validateOwnedSubscriptions(req.auth.user._id, payload.subscriptionIds);
    const delegate = await CustomerDelegate.create({
      userId: req.auth.user._id,
      username: payload.username.trim(),
      usernameNormalized,
      displayName: payload.displayName.trim(),
      passwordHash: await bcrypt.hash(payload.password, 10),
      subscriptionIds,
      isActive: payload.isActive ?? true,
      createdBy: req.auth.user._id,
      deactivatedAt: payload.isActive === false ? new Date() : null,
    });

    await recordActivity({
      actorId: req.auth.user._id,
      actorRole: "customer",
      action: "delegate.created",
      targetType: "customer_delegate",
      targetId: String(delegate._id),
      metadata: {
        subscriptionIds,
      },
    });

    res.status(201).json({ delegate: serializeDelegate(delegate) });
  }),
);

delegatesRouter.patch(
  "/:id",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await requireApprovedOwner(req);

    const delegate = await CustomerDelegate.findOne({
      _id: req.params.id,
      userId: req.auth.user._id,
    });

    if (!delegate) {
      throw new HttpError(404, "Agent not found.");
    }

    const payload = updateDelegateSchema.parse(req.body);
    const updates = {};

    if (payload.displayName !== undefined) {
      updates.displayName = payload.displayName.trim();
    }
    if (payload.subscriptionIds !== undefined) {
      updates.subscriptionIds = await validateOwnedSubscriptions(req.auth.user._id, payload.subscriptionIds);
    }
    if (payload.isActive !== undefined) {
      updates.isActive = payload.isActive;
      updates.deactivatedAt = payload.isActive ? null : new Date();
    }

    const updated = await CustomerDelegate.findByIdAndUpdate(delegate._id, { $set: updates }, { new: true });

    await recordActivity({
      actorId: req.auth.user._id,
      actorRole: "customer",
      action: "delegate.updated",
      targetType: "customer_delegate",
      targetId: String(delegate._id),
      metadata: updates,
    });

    res.json({ delegate: serializeDelegate(updated) });
  }),
);

delegatesRouter.post(
  "/:id/password",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await requireApprovedOwner(req);

    const delegate = await CustomerDelegate.findOne({
      _id: req.params.id,
      userId: req.auth.user._id,
    });

    if (!delegate) {
      throw new HttpError(404, "Agent not found.");
    }

    const payload = passwordSchema.parse(req.body);
    delegate.passwordHash = await bcrypt.hash(payload.password, 10);
    await delegate.save();

    await recordActivity({
      actorId: req.auth.user._id,
      actorRole: "customer",
      action: "delegate.password_reset",
      targetType: "customer_delegate",
      targetId: String(delegate._id),
    });

    res.json({ success: true });
  }),
);
