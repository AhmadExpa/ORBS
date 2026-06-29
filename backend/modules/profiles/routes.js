import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { User } from "../../db/models/index.js";
import { requireCustomer, findUserFromRequest } from "../../middleware/require-customer.js";
import { verifyClerkRequestToken } from "../../services/clerk-auth-service.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";
import { syncCustomerProfile } from "../../services/customer-profile-service.js";

export const profilesRouter = express.Router();

async function verifyCustomerRequest(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new HttpError(401, "Authentication required.");
  }

  const payload = await verifyClerkRequestToken(token);
  if (!payload?.sub) {
    throw new HttpError(401, "Unable to verify user.");
  }

  return payload;
}

profilesRouter.post(
  "/sync",
  asyncHandler(async (req, res) => {
    const payload = await verifyCustomerRequest(req);
    const user = await syncCustomerProfile({
      payload,
      body: req.body,
    });

    res.json({ user });
  }),
);

profilesRouter.get(
  "/account-status",
  asyncHandler(async (req, res) => {
    // Intentionally does NOT use requireCustomer (which rejects non-active
    // accounts) so the portal gate can read the status with a 200 response.
    const authContext = await findUserFromRequest(req, { ignoreInvalidToken: true });
    const user = authContext?.user;

    if (!user) {
      res.json({ status: "active", reason: "" });
      return;
    }

    res.json({
      status: user.accountStatus || "active",
      reason: user.accountStatusReason || "",
    });
  }),
);

profilesRouter.get(
  "/me",
  requireCustomer,
  asyncHandler(async (req, res) => {
    await processSubscriptionRenewals({ userIds: [req.auth.user._id] });
    const user = await User.findById(req.auth.user._id);
    res.json({ user });
  }),
);

profilesRouter.patch(
  "/me",
  requireCustomer,
  asyncHandler(async (req, res) => {
    const allowedFields = ["phone", "company", "address", "billingAddress"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
    );
    const user = await User.findByIdAndUpdate(req.auth.user._id, updates, { new: true });
    res.json({ user });
  }),
);
