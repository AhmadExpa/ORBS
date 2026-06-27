import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

function getOrigin(value) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch (error) {
    return "";
  }
}

export function requireSameOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const allowedOrigins = new Set([env.appUrl, ...env.corsOrigins].map(getOrigin).filter(Boolean));
  const requestOrigin = getOrigin(req.headers.origin);
  const refererOrigin = getOrigin(req.headers.referer);

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    next();
    return;
  }

  if (!requestOrigin && refererOrigin && allowedOrigins.has(refererOrigin)) {
    next();
    return;
  }

  next(new HttpError(403, "Cross-site request rejected."));
}
