import { getCustomerPaymentFailureMessage } from "./stripe-service.js";

const CUSTOMER_HIDDEN_PAYMENT_FIELDS = [
  "stripeFailureMessage",
  "stripeFailureCode",
  "stripeDeclineCode",
  "stripeAdviceCode",
  "stripeNetworkDeclineCode",
  "stripeOutcomeType",
  "stripeRiskLevel",
];

export function serializeCustomerPaymentSubmission(submission) {
  if (!submission) {
    return submission;
  }

  const serialized = typeof submission.toJSON === "function"
    ? submission.toJSON()
    : { ...submission };

  const status = String(serialized.status || serialized.paymentIntentStatus || "").toLowerCase();
  const hasFailureDetails = Boolean(
    serialized.stripeFailureCode ||
      serialized.stripeDeclineCode ||
      serialized.stripeFailureMessage,
  );

  if (!String(serialized.customerMessage || "").trim() && (hasFailureDetails || [
    "cancelled",
    "failed",
    "pending_verification",
    "processing",
    "rejected",
    "requires_action",
  ].includes(status))) {
    serialized.customerMessage = getCustomerPaymentFailureMessage({
      code: serialized.stripeFailureCode,
      declineCode: serialized.stripeDeclineCode,
      adviceCode: serialized.stripeAdviceCode,
      status: serialized.status || serialized.paymentIntentStatus,
    });
  }

  CUSTOMER_HIDDEN_PAYMENT_FIELDS.forEach((field) => {
    delete serialized[field];
  });

  return serialized;
}
