import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../../utils/async-handler.js";
import { StaffUser } from "../../db/models/index.js";
import { env } from "../../config/env.js";
import { requireStaff } from "../../middleware/require-staff.js";
import { HttpError } from "../../utils/http-error.js";
import { recordActivity } from "../../services/activity-log-service.js";

export const staffAuthRouter = express.Router();

function signStaffToken(staff) {
  return jwt.sign(
    {
      staffUserId: staff._id,
      role: staff.role,
    },
    env.jwtSecret,
    { expiresIn: "7d" },
  );
}

staffAuthRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const staff = await StaffUser.findOne({ email });
    if (!staff || !staff.isActive) {
      throw new HttpError(401, "Invalid staff credentials.");
    }

    const isValid = await bcrypt.compare(password, staff.passwordHash);
    if (!isValid) {
      throw new HttpError(401, "Invalid staff credentials.");
    }

    staff.lastLoginAt = new Date();
    await staff.save();

    const token = signStaffToken(staff);
    res.cookie("eo_staff_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.nodeEnv === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await recordActivity({
      actorId: staff._id,
      actorRole: staff.role,
      action: "staff.login",
      targetType: "staff_user",
      targetId: String(staff._id),
    });

    res.json({
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
      token,
    });
  }),
);

staffAuthRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    res.clearCookie("eo_staff_session");
    res.json({ success: true });
  }),
);

staffAuthRouter.get(
  "/me",
  requireStaff,
  asyncHandler(async (req, res) => {
    res.json({
      staff: {
        id: req.staff._id,
        name: req.staff.name,
        email: req.staff.email,
        role: req.staff.role,
      },
    });
  }),
);

staffAuthRouter.patch(
  "/password",
  requireStaff,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const isValid = await bcrypt.compare(currentPassword, req.staff.passwordHash);
    if (!isValid) {
      throw new HttpError(400, "Current password is incorrect.");
    }

    req.staff.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.staff.save();

    await recordActivity({
      actorId: req.staff._id,
      actorRole: req.staff.role,
      action: "staff.password_changed",
      targetType: "staff_user",
      targetId: String(req.staff._id),
    });

    res.json({ success: true });
  }),
);

