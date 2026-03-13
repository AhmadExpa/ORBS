import express from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { HttpError } from "../../utils/http-error.js";
import { User } from "../../db/models/index.js";
import { requireCustomer } from "../../middleware/require-customer.js";
import { verifyClerkRequestToken } from "../../services/clerk-auth-service.js";
import { processSubscriptionRenewals } from "../../services/billing-cycle-service.js";

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

    const email =
      payload.email ||
      payload.email_address ||
      payload?.emailAddresses?.[0]?.emailAddress ||
      req.body.email;

    const name =
      req.body.name ||
      [payload.first_name, payload.last_name].filter(Boolean).join(" ") ||
      payload.username ||
      "ElevenOrbits Customer";

    if (!email) {
      throw new HttpError(400, "Email is required for profile sync.");
    }

    const user = await User.findOneAndUpdate(
      { clerkId: payload.sub },
      {
        clerkId: payload.sub,
        name,
        email,
        phone: req.body.phone || "",
        secondaryEmail: req.body.secondaryEmail || "",
        address: req.body.address || "",
        company: req.body.company || "",
        billingAddress: req.body.billingAddress || {},
        role: "customer",
      },
      { new: true, upsert: true },
    );

    res.json({ user });
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
    const allowedFields = ["phone", "secondaryEmail", "address", "billingAddress"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key)),
    );
    const user = await User.findByIdAndUpdate(req.auth.user._id, updates, { new: true });
    res.json({ user });
  }),
);
