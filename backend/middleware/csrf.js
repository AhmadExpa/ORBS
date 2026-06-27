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

  const expectedOrigin = getOrigin(env.appUrl);
  const requestOrigin = getOrigin(req.headers.origin);
  const refererOrigin = getOrigin(req.headers.referer);

  if (requestOrigin && requestOrigin === expectedOrigin) {
    next();
    return;
  }

  if (!requestOrigin && refererOrigin && refererOrigin === expectedOrigin) {
    next();
    return;
  }

  next(new HttpError(403, "Cross-site request rejected."));
}
