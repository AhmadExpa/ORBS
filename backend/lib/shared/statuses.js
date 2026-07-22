export const ORDER_STATUSES = [
  "draft",
  "pending_verification",
  "trial_requested",
  "approved",
  "rejected",
  "cancelled",
  "deleted",
];

export const SUBSCRIPTION_STATUSES = [
  "pending_verification",
  "trial_requested",
  "active",
  "rejected",
  "suspended",
  "cancelled",
  "expired",
];

export const INVOICE_STATUSES = ["pending", "paid", "refunded", "rejected", "void", "deleted"];

export const PAYMENT_STATUSES = [
  "pending_verification",
  "approved",
  "refunded",
  "rejected",
];

export const CONTRACT_STATUSES = [
  "NOT_STARTED",
  "TURNSTILE_REQUIRED",
  "READY_TO_SIGN",
  "PENDING_SIGNATURE",
  "SIGNED_PENDING_STORAGE",
  "SIGNED_PENDING_ADMIN",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "SUPERSEDED",
];

export const TICKET_STATUSES = ["open", "pending", "resolved", "closed"];

export const TICKET_PRIORITIES = ["low", "medium", "high", "critical"];

export const STAFF_ROLES = ["admin", "support_agent"];
