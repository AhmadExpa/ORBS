const REENTER_CARD_CODES = new Set([
  "expired_card",
  "incorrect_address",
  "incorrect_cvc",
  "incorrect_number",
  "incorrect_zip",
  "invalid_cvc",
  "invalid_expiry_month",
  "invalid_expiry_year",
  "invalid_number",
]);

const CONTACT_ISSUER_CODES = new Set([
  "approve_with_id",
  "call_issuer",
  "card_not_supported",
  "card_velocity_exceeded",
  "currency_not_supported",
  "invalid_account",
  "invalid_amount",
  "not_permitted",
  "restricted_card",
  "service_not_allowed",
  "transaction_not_allowed",
  "withdrawal_count_limit_exceeded",
]);

const SAFE_RETRY_CODES = new Set(["issuer_not_available", "processing_error", "reenter_transaction", "try_again_later"]);
const REPLACE_CARD_CODES = new Set(["fraudulent", "generic_decline", "lost_card", "merchant_blacklist", "pickup_card", "stolen_card"]);

export function getStripePaymentErrorMessage(error, fallback = "The payment could not be completed.") {
  const declineCode = String(error?.decline_code || error?.code || "").toLowerCase();
  const adviceCode = String(error?.advice_code || "").toLowerCase();

  if (adviceCode === "do_not_try_again") {
    return "Do not retry this card for the same payment. Use another payment method or contact support.";
  }

  if (adviceCode === "confirm_card_data" || REENTER_CARD_CODES.has(declineCode)) {
    return "Check the card number, expiry date, CVC, and billing postal code, then try again.";
  }

  if (declineCode === "authentication_required" || declineCode === "authentication_not_handled") {
    return "Your bank requires verification. Complete the verification prompt, then try the payment again.";
  }

  if (declineCode === "duplicate_transaction") {
    return "A matching payment was submitted recently. Check your wallet activity before trying again.";
  }

  if (declineCode === "insufficient_funds") {
    return "The card has insufficient available funds. Use another payment method or contact your card issuer.";
  }

  if (adviceCode === "try_again_later" || SAFE_RETRY_CODES.has(declineCode)) {
    return "The payment could not be processed right now. Wait a few minutes and try once more.";
  }

  if (CONTACT_ISSUER_CODES.has(declineCode)) {
    return "The card issuer did not permit this payment. Contact the issuer or use another payment method.";
  }

  if (REPLACE_CARD_CODES.has(declineCode) || declineCode === "do_not_honor") {
    return "We could not accept this payment. Use another payment method or contact support before retrying.";
  }

  return fallback;
}

export function shouldPreventSameCardRetry(error) {
  const declineCode = String(error?.decline_code || error?.code || "").toLowerCase();
  const adviceCode = String(error?.advice_code || "").toLowerCase();

  return adviceCode === "do_not_try_again" || REPLACE_CARD_CODES.has(declineCode);
}

export function createStripePaymentError(error, fallback) {
  const paymentError = new Error(getStripePaymentErrorMessage(error, fallback));
  paymentError.preventSameCardRetry = shouldPreventSameCardRetry(error);
  paymentError.stripeCode = error?.decline_code || error?.code || "";
  return paymentError;
}

export function normalizePaymentActionError(error) {
  const message = String(error?.message || "");
  const isNetworkError =
    error?.code === "NETWORK_ERROR" ||
    /failed to fetch|load failed|networkerror|network request failed|err_timed_out/iu.test(message);

  if (!isNetworkError) {
    return error;
  }

  const paymentError = new Error(
    "The payment connection was interrupted. Check Payment Activity before trying again so you do not submit the same payment twice.",
  );
  paymentError.code = "NETWORK_ERROR";
  paymentError.cause = error;
  return paymentError;
}
