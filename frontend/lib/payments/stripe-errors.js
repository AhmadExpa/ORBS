const DEFAULT_PAYMENT_ERROR_MESSAGE =
  "Stripe could not complete this payment. Check Payment Activity for the latest status or use another payment method.";

const CARD_DETAIL_ERROR_CODES = new Set([
  "expired_card",
  "incorrect_address",
  "incorrect_cvc",
  "incorrect_number",
  "incorrect_postal_code",
  "incorrect_zip",
  "invalid_cvc",
  "invalid_expiry_month",
  "invalid_expiry_year",
  "invalid_number",
]);
const INCOMPLETE_CARD_ERROR_CODES = new Set([
  "incomplete_address",
  "incomplete_cvc",
  "incomplete_expiry",
  "incomplete_number",
  "incomplete_zip",
]);
const CONTACT_ISSUER_CODES = new Set([
  "approve_with_id",
  "call_issuer",
  "card_not_supported",
  "currency_not_supported",
  "invalid_account",
  "invalid_amount",
  "not_permitted",
  "service_not_allowed",
  "transaction_not_allowed",
  "withdrawal_count_limit_exceeded",
]);
const SAFE_RETRY_CODES = new Set([
  "issuer_not_available",
  "processing_error",
  "reenter_transaction",
  "try_again_later",
]);
const REPLACE_CARD_CODES = new Set([
  "card_decline_rate_limit_exceeded",
  "card_velocity_exceeded",
  "do_not_honor",
  "fraudulent",
  "generic_decline",
  "lost_card",
  "merchant_blacklist",
  "pickup_card",
  "restricted_card",
  "stolen_card",
]);
const STRIPE_PAYMENT_ERROR_CODES = new Set([
  "authentication_failure",
  "authentication_not_handled",
  "authentication_required",
  "card_declined",
  "card_decline_rate_limit_exceeded",
  "duplicate_transaction",
  "expired_card",
  "incorrect_address",
  "incorrect_cvc",
  "incorrect_number",
  "incorrect_postal_code",
  "incorrect_zip",
  "insufficient_funds",
  "payment_intent_action_required",
  "payment_intent_authentication_failure",
  "setup_intent_authentication_failure",
  "processing_error",
  "try_again_later",
]);

function normalizeCode(value) {
  return String(value || "").trim().toLowerCase();
}

function getStripeErrorFields(error = {}) {
  const rawError = error?.raw || {};

  return {
    code: normalizeCode(error.code || error.stripeFailureCode || rawError.code),
    declineCode: normalizeCode(error.decline_code || error.stripeDeclineCode || rawError.decline_code),
    adviceCode: normalizeCode(error.advice_code || error.stripeAdviceCode || rawError.advice_code),
    status: normalizeCode(error.status || error.paymentIntentStatus || error.payment_intent?.status),
    paymentIntentId: error.payment_intent?.id || error.paymentIntentId || "",
    type: String(error.type || rawError.type || ""),
  };
}

export function getStripePaymentErrorMessage(error, fallback = DEFAULT_PAYMENT_ERROR_MESSAGE) {
  if (String(error?.customerMessage || "").trim()) {
    return String(error.customerMessage).trim();
  }

  const { code, declineCode, adviceCode, status } = getStripeErrorFields(error);
  const reasonCode = declineCode || code;

  if (adviceCode === "do_not_try_again") {
    return "Your bank or card security checks declined this card for this payment. Use another card or contact your bank. Do not retry this card.";
  }

  if (adviceCode === "confirm_card_data" || CARD_DETAIL_ERROR_CODES.has(reasonCode)) {
    if (reasonCode === "expired_card") {
      return "This card has expired. Use another card or update the card details, then try again.";
    }

    if (["incorrect_cvc", "invalid_cvc"].includes(reasonCode)) {
      return "The card security code (CVC) is incorrect. Check it and try again.";
    }

    if (["incorrect_number", "invalid_number"].includes(reasonCode)) {
      return "The card number is incorrect. Check the card number and try again.";
    }

    if (["incorrect_address", "incorrect_postal_code", "incorrect_zip"].includes(reasonCode)) {
      return "The billing address or billing postal code does not match the card. Check it and try again.";
    }

    if (["invalid_expiry_month", "invalid_expiry_year"].includes(reasonCode)) {
      return "The card expiry date is incorrect. Check the month and year, then try again.";
    }

    return "The card details or billing postal code did not match. Check the card number, expiry date, CVC, and postal code, then try again.";
  }

  if (INCOMPLETE_CARD_ERROR_CODES.has(reasonCode)) {
    return "Complete the card number, expiry date, CVC, and billing postal code before continuing.";
  }

  if (["authentication_required", "authentication_not_handled", "payment_intent_action_required"].includes(reasonCode) || status === "requires_action") {
    return "Your bank requires verification. Complete the verification prompt in this portal, then try the payment again.";
  }

  if (["authentication_failure", "payment_intent_authentication_failure", "setup_intent_authentication_failure"].includes(reasonCode)) {
    return "Your bank could not verify this card. Try again once or use another card, or contact your bank.";
  }

  if (reasonCode === "duplicate_transaction") {
    return "Stripe detected a duplicate payment attempt. Check Payment Activity before trying again.";
  }

  if (reasonCode === "insufficient_funds") {
    return "Your card was declined because it has insufficient available funds. Use another card or contact your bank.";
  }

  if (reasonCode === "card_decline_rate_limit_exceeded") {
    return "This card has been declined too many times. Wait 24 hours or use another card.";
  }

  if (adviceCode === "try_again_later" || SAFE_RETRY_CODES.has(reasonCode)) {
    return "The card network could not process the payment temporarily. Wait a few minutes and try once more.";
  }

  if (REPLACE_CARD_CODES.has(reasonCode)) {
    return "Your bank or card security checks did not approve this payment. Use another card or contact support or your bank. Avoid repeatedly retrying this card.";
  }

  if (CONTACT_ISSUER_CODES.has(reasonCode)) {
    return "Your card issuer did not permit this payment. Contact your bank or use another card.";
  }

  if (reasonCode === "card_declined") {
    return "Your card issuer declined this payment and did not provide a more specific reason. Contact your bank or use another card.";
  }

  if (status === "processing") {
    return "Your payment is still processing. We will update Payment Activity automatically; do not submit it again.";
  }

  if (status === "canceled" || status === "cancelled") {
    return "The payment was canceled before it completed.";
  }

  return fallback;
}

export function shouldPreventSameCardRetry(error) {
  const { code, declineCode, adviceCode } = getStripeErrorFields(error);
  const reasonCode = declineCode || code;

  return adviceCode === "do_not_try_again" || REPLACE_CARD_CODES.has(reasonCode);
}

export function createStripePaymentError(error, fallback) {
  const fields = getStripeErrorFields(error);
  const paymentError = new Error(getStripePaymentErrorMessage(error, fallback));
  paymentError.preventSameCardRetry = shouldPreventSameCardRetry(error);
  paymentError.stripeCode = fields.declineCode || fields.code;
  paymentError.stripeDeclineCode = fields.declineCode;
  paymentError.stripeAdviceCode = fields.adviceCode;
  paymentError.paymentIntentId = fields.paymentIntentId;
  return paymentError;
}

export function normalizePaymentActionError(error) {
  const message = String(error?.message || "");
  const isNetworkError =
    error?.code === "NETWORK_ERROR" ||
    /failed to fetch|load failed|networkerror|network request failed|err_timed_out/iu.test(message);

  if (isNetworkError) {
    const paymentError = new Error(
      "The payment connection was interrupted. Check Payment Activity before trying again so you do not submit the same payment twice.",
    );
    paymentError.code = "NETWORK_ERROR";
    paymentError.cause = error;
    return paymentError;
  }

  const fields = getStripeErrorFields(error);
  const isStripePaymentError = Boolean(
    fields.declineCode ||
      fields.type.startsWith("Stripe") ||
      STRIPE_PAYMENT_ERROR_CODES.has(fields.code),
  );

  return isStripePaymentError ? createStripePaymentError(error) : error;
}
