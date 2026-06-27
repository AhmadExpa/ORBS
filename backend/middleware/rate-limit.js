import { HttpError } from "../utils/http-error.js";

const buckets = new Map();

function cleanExpiredBuckets(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit({ name, windowMs = 60_000, max = 10, keyFn }) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    cleanExpiredBuckets(now);

    const identity = keyFn?.(req) || req.auth?.clerkId || req.staff?._id || req.ip || "anonymous";
    const key = `${name}:${identity}`;
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      next(new HttpError(429, "Too many requests. Please try again shortly."));
      return;
    }

    next();
  };
}
