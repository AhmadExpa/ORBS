import jwt from "jsonwebtoken";
import { StaffUser } from "../db/models/index.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

async function resolveStaff(req, { ignoreInvalidToken = false } = {}) {
  const token =
    req.cookies?.eo_staff_session ||
    (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);

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

    throw new HttpError(401, "Staff session is invalid.");
  }

  const staff = await StaffUser.findById(payload.staffUserId);

  if (!staff || !staff.isActive) {
    throw new HttpError(401, "Staff session is invalid.");
  }

  return staff;
}

export async function attachStaff(req, res, next) {
  try {
    const staff = await resolveStaff(req, { ignoreInvalidToken: true });
    if (staff) {
      req.staff = staff;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireStaff(req, res, next) {
  try {
    const staff = await resolveStaff(req);
    if (!staff) {
      throw new HttpError(401, "Staff authentication required.");
    }
    req.staff = staff;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (!req.staff || req.staff.role !== "admin") {
    next(new HttpError(403, "Admin access required."));
    return;
  }

  next();
}
