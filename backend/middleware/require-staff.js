import jwt from "jsonwebtoken";
import { StaffUser } from "../db/models/index.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const STAFF_SESSION_COOKIE = "eo_staff_session";

async function resolveStaff(req, { ignoreInvalidToken = false } = {}) {
  const token =
    req.cookies?.[STAFF_SESSION_COOKIE] ||
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
    if (ignoreInvalidToken) {
      return null;
    }

    throw new HttpError(401, "Staff session is invalid.");
  }

  return staff;
}

export async function attachStaff(req, res, next) {
  try {
    const staff = await resolveStaff(req, { ignoreInvalidToken: true });
    if (staff) {
      req.staff = staff;
    } else if (req.cookies?.[STAFF_SESSION_COOKIE]) {
      res.clearCookie(STAFF_SESSION_COOKIE);
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
    if (error.statusCode === 401 && req.cookies?.[STAFF_SESSION_COOKIE]) {
      res.clearCookie(STAFF_SESSION_COOKIE);
    }
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
