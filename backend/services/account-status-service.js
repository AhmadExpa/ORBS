import { createClerkClient } from "@clerk/backend";
import { env } from "../config/env.js";
import { User } from "../db/models/index.js";
import { HttpError } from "../utils/http-error.js";
import { recordActivity } from "./activity-log-service.js";
import {
  sendAccountSuspensionNotification,
  sendAccountBlockNotification,
  sendAccountReinstatedNotification,
} from "./email-service.js";

const clerkClient = env.clerkSecretKey ? createClerkClient({ secretKey: env.clerkSecretKey }) : null;

async function loadCustomer(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new HttpError(404, "Customer account not found.");
  }
  if (user.role && user.role !== "customer") {
    throw new HttpError(400, "Only customer accounts can be suspended or blocked.");
  }
  return user;
}

async function banClerkUser(clerkId) {
  if (!clerkClient || !clerkId) {
    return;
  }
  try {
    await clerkClient.users.banUser(clerkId);
  } catch (error) {
    console.error(`Failed to ban Clerk user ${clerkId}`, error);
  }
}

async function unbanClerkUser(clerkId) {
  if (!clerkClient || !clerkId) {
    return;
  }
  try {
    await clerkClient.users.unbanUser(clerkId);
  } catch (error) {
    console.error(`Failed to unban Clerk user ${clerkId}`, error);
  }
}

export async function suspendCustomer({ userId, staff }) {
  const user = await loadCustomer(userId);

  const updated = await User.findByIdAndUpdate(
    userId,
    {
      accountStatus: "suspended",
      accountStatusReason: "",
      accountStatusBy: staff?._id ? String(staff._id) : "",
      accountStatusAt: new Date(),
    },
    { new: true },
  );

  await recordActivity({
    actorId: staff?._id,
    actorRole: staff?.role,
    action: "user.suspended",
    targetType: "user",
    targetId: String(userId),
  });

  await sendAccountSuspensionNotification({ customer: updated });

  return updated;
}

export async function blockCustomer({ userId, staff, reason }) {
  const trimmedReason = String(reason || "").trim();
  if (!trimmedReason) {
    throw new HttpError(400, "A reason is required to permanently block an account.");
  }

  const user = await loadCustomer(userId);

  const updated = await User.findByIdAndUpdate(
    userId,
    {
      accountStatus: "blocked",
      accountStatusReason: trimmedReason,
      accountStatusBy: staff?._id ? String(staff._id) : "",
      accountStatusAt: new Date(),
    },
    { new: true },
  );

  await banClerkUser(user.clerkId);

  await recordActivity({
    actorId: staff?._id,
    actorRole: staff?.role,
    action: "user.blocked",
    targetType: "user",
    targetId: String(userId),
    metadata: { reason: trimmedReason },
  });

  await sendAccountBlockNotification({ customer: updated, reason: trimmedReason });

  return updated;
}

export async function reactivateCustomer({ userId, staff }) {
  const user = await loadCustomer(userId);
  const wasBlocked = user.accountStatus === "blocked";

  const updated = await User.findByIdAndUpdate(
    userId,
    {
      accountStatus: "active",
      accountStatusReason: "",
      accountStatusBy: staff?._id ? String(staff._id) : "",
      accountStatusAt: new Date(),
    },
    { new: true },
  );

  if (wasBlocked) {
    await unbanClerkUser(user.clerkId);
  }

  await recordActivity({
    actorId: staff?._id,
    actorRole: staff?.role,
    action: "user.reactivated",
    targetType: "user",
    targetId: String(userId),
  });

  await sendAccountReinstatedNotification({ customer: updated });

  return updated;
}
