import Stripe from "stripe";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, {
      maxNetworkRetries: 1,
      timeout: env.stripeRequestTimeoutMs,
    })
  : null;

export const CUSTOMER_PRESENT_THREE_D_SECURE_MODE = "challenge";
export const CARD_VERIFICATION_MODE_STANDARD = "standard";
export const CARD_VERIFICATION_MODE_3DS = "three_d_secure";
export const STANDARD_THREE_D_SECURE_MODE = "automatic";
export const WALLET_TOPUP_THREE_D_SECURE_MODE = STANDARD_THREE_D_SECURE_MODE;
export const CUSTOMER_PRESENT_CAPTURE_METHOD = "automatic";
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/u;

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
const AUTHENTICATION_ERROR_CODES = new Set([
  "authentication_required",
  "authentication_not_handled",
  "payment_intent_action_required",
]);
const AUTHENTICATION_FAILURE_CODES = new Set([
  "authentication_failure",
  "payment_intent_authentication_failure",
  "setup_intent_authentication_failure",
]);
const TEMPORARY_PAYMENT_ERROR_CODES = new Set([
  "issuer_not_available",
  "processing_error",
  "reenter_transaction",
  "try_again_later",
]);
const ISSUER_PERMISSION_ERROR_CODES = new Set([
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
const SECURITY_BLOCK_ERROR_CODES = new Set([
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

function normalizeStripeErrorCode(value) {
  return String(value || "").trim().toLowerCase();
}

export function getCustomerPaymentFailureMessage({
  code = "",
  declineCode = "",
  adviceCode = "",
  status = "",
} = {}) {
  const normalizedCode = normalizeStripeErrorCode(code);
  const normalizedDeclineCode = normalizeStripeErrorCode(declineCode);
  const normalizedAdviceCode = normalizeStripeErrorCode(adviceCode);
  const normalizedStatus = normalizeStripeErrorCode(status);
  const reasonCode = normalizedDeclineCode || normalizedCode;

  if (normalizedAdviceCode === "do_not_try_again") {
    return "Your bank or Stripe security checks declined this card for this payment. Use another card or contact your bank. Do not retry this card.";
  }

  if (normalizedAdviceCode === "confirm_card_data" || CARD_DETAIL_ERROR_CODES.has(reasonCode)) {
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

  if (AUTHENTICATION_ERROR_CODES.has(reasonCode) || normalizedStatus === "requires_action") {
    return "Your bank requires verification. Complete the verification prompt in this portal, then try the payment again.";
  }

  if (AUTHENTICATION_FAILURE_CODES.has(reasonCode)) {
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

  if (normalizedAdviceCode === "try_again_later" || TEMPORARY_PAYMENT_ERROR_CODES.has(reasonCode)) {
    return "The card network could not process the payment temporarily. Wait a few minutes and try once more.";
  }

  if (SECURITY_BLOCK_ERROR_CODES.has(reasonCode)) {
    return "Your bank or Stripe security checks did not approve this payment. Use another card or contact support or your bank. Avoid repeatedly retrying this card.";
  }

  if (ISSUER_PERMISSION_ERROR_CODES.has(reasonCode)) {
    return "Your card issuer did not permit this payment. Contact your bank or use another card.";
  }

  if (reasonCode === "card_declined") {
    return "Your card issuer declined this payment and did not provide a more specific reason. Contact your bank or use another card.";
  }

  if (normalizedStatus === "processing") {
    return "Your payment is still processing. We will update Payment Activity automatically; do not submit it again.";
  }

  if (normalizedStatus === "canceled" || normalizedStatus === "cancelled") {
    return "The payment was canceled before it completed.";
  }

  return "Stripe could not complete this payment. Check Payment Activity for the latest status or use another payment method.";
}

export function isStripePaymentError(error) {
  const rawError = error?.raw || {};
  const type = String(error?.type || rawError.type || "");
  const code = normalizeStripeErrorCode(error?.code || rawError.code);
  const declineCode = normalizeStripeErrorCode(error?.decline_code || rawError.decline_code);

  return type.startsWith("Stripe") || Boolean(declineCode) || [
    "authentication_required",
    "authentication_not_handled",
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
    "processing_error",
    "setup_intent_authentication_failure",
    "try_again_later",
  ].includes(code);
}

function assertStripeConfigured() {
  if (!stripe) {
    throw new HttpError(503, "Stripe is not configured yet.");
  }
}

export function resolveCustomerCardVerificationMode(value) {
  const cardVerificationMode = String(value || CARD_VERIFICATION_MODE_STANDARD).trim().toLowerCase();

  if (cardVerificationMode === CARD_VERIFICATION_MODE_STANDARD) {
    return {
      cardVerificationMode,
      requestThreeDSecure: STANDARD_THREE_D_SECURE_MODE,
    };
  }

  if (cardVerificationMode === CARD_VERIFICATION_MODE_3DS) {
    return {
      cardVerificationMode,
      requestThreeDSecure: CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
    };
  }

  throw new HttpError(400, "Choose either standard card processing or 3D Secure verification.");
}

// Portal payments use Stripe's adaptive SCA/Radar policy. This keeps cards
// without 3DS support eligible while still invoking authentication whenever
// the issuer, regulation, or Stripe's risk engine requires it.
export function resolveWalletTopupVerificationMode() {
  return {
    cardVerificationMode: CARD_VERIFICATION_MODE_STANDARD,
    requestThreeDSecure: STANDARD_THREE_D_SECURE_MODE,
  };
}

export function resolvePortalCardVerificationMode() {
  return resolveWalletTopupVerificationMode();
}

function normalizeMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );
}

function getStatementDescriptorSuffix() {
  const suffix = String(env.stripeStatementDescriptorSuffix || "").trim();
  if (!suffix) {
    return "";
  }

  if (suffix.length > 22 || !/^[A-Za-z0-9 ._-]+$/u.test(suffix)) {
    throw new HttpError(500, "Stripe statement descriptor suffix is invalid. Update STRIPE_STATEMENT_DESCRIPTOR_SUFFIX.");
  }

  return suffix;
}

export function normalizePaymentPhoneNumber(value) {
  const compact = String(value || "")
    .trim()
    .replace(/[\s().-]/gu, "");
  const normalized = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  return E164_PHONE_PATTERN.test(normalized) ? normalized : "";
}

export function normalizePaymentBillingDetails(value) {
  const rawEmail = String(value?.email || "").trim().toLowerCase();
  const rawPhone = String(value?.phone || "").trim();
  const normalizedPhone = normalizePaymentPhoneNumber(value?.phone);
  const details = {
    name: String(value?.name || "").trim(),
    email: rawEmail,
    phone: normalizedPhone,
    line1: String(value?.line1 || "").trim(),
    line2: String(value?.line2 || "").trim(),
    city: String(value?.city || "").trim(),
    state: String(value?.state || "").trim(),
    postalCode: String(value?.postalCode || "").trim(),
    country: String(value?.country || "").trim().toUpperCase(),
  };

  if (rawEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(details.email)) {
    throw new HttpError(400, "Enter a valid payment email address.");
  }
  if (rawPhone && !details.phone) {
    throw new HttpError(400, "Enter the phone number in international format, such as +14155552671.");
  }
  const address = {
    ...(details.line1 ? { line1: details.line1 } : {}),
    ...(details.line2 ? { line2: details.line2 } : {}),
    ...(details.city ? { city: details.city } : {}),
    ...(details.state ? { state: details.state } : {}),
    ...(details.postalCode ? { postal_code: details.postalCode } : {}),
    ...(details.country ? { country: details.country } : {}),
  };

  return {
    ...(details.name ? { name: details.name } : {}),
    ...(details.email ? { email: details.email } : {}),
    ...(details.phone ? { phone: details.phone } : {}),
    ...(Object.keys(address).length ? { address } : {}),
  };
}

async function updateStripeCustomerContact(customerId, billingDetails, fallbackEmail = "") {
  await stripe.customers.update(customerId, {
    ...(billingDetails.name ? { name: billingDetails.name } : {}),
    ...(billingDetails.email || fallbackEmail ? { email: billingDetails.email || fallbackEmail } : {}),
    ...(billingDetails.phone ? { phone: billingDetails.phone } : {}),
    ...(billingDetails.address ? { address: billingDetails.address } : {}),
  });
}

export function isStripeConfigured() {
  return Boolean(stripe);
}

export function toStripeAmount(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function formatCardBrand(brand) {
  const value = String(brand || "").trim();
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Card";
}

function normalizeThreeDSecureDetails(details) {
  const result = String(details?.result || "").trim().toLowerCase();
  const authenticationFlow = String(details?.authentication_flow || details?.authenticationFlow || "")
    .trim()
    .toLowerCase();

  return {
    attempted: Boolean(details),
    authenticated: result === "authenticated" || details?.authenticated === true,
    result: result || "not_available",
    authenticationFlow,
    version: String(details?.version || "").trim(),
    liabilityShift: String(details?.liability_shift || details?.liabilityShift || "").trim(),
  };
}

export function getPaymentIntentCardAuthentication(paymentIntent) {
  const charge = paymentIntent?.latest_charge;
  const details = typeof charge === "object"
    ? charge?.payment_method_details?.card?.three_d_secure
    : null;

  return normalizeThreeDSecureDetails(details);
}

export function getSetupIntentCardAuthentication(setupIntent) {
  const setupAttempt = setupIntent?.latest_attempt;
  const details = typeof setupAttempt === "object"
    ? setupAttempt?.payment_method_details?.card?.three_d_secure
    : null;

  return normalizeThreeDSecureDetails(details);
}

export function assertPaymentIntentCaptured(paymentIntent) {
  if (paymentIntent?.status !== "succeeded") {
    throw new HttpError(400, "The Stripe payment is not completed yet.");
  }

  const charge = paymentIntent.latest_charge;
  if (!charge || typeof charge !== "object") {
    throw new HttpError(400, "The completed Stripe payment charge could not be verified.");
  }

  if (charge.paid !== true || charge.captured !== true) {
    throw new HttpError(400, "The Stripe payment has not been captured successfully.");
  }
}

function buildPaymentMethodSummary(
  paymentMethod,
  {
    isPrimary = false,
    savedAt,
    is3DS = false,
    threeDSecureResult = "not_available",
    threeDSecureAuthenticationFlow = "",
  } = {},
) {
  const card = paymentMethod?.card || {};

  return {
    id: paymentMethod?.id || "",
    brand: card.brand || "",
    brandLabel: formatCardBrand(card.brand),
    last4: card.last4 || "",
    expMonth: card.exp_month || card.expMonth || null,
    expYear: card.exp_year || card.expYear || null,
    funding: card.funding || "",
    country: card.country || "",
    isPrimary,
    is3DS: Boolean(is3DS),
    threeDSecureResult,
    threeDSecureAuthenticationFlow,
    savedAt: savedAt || new Date().toISOString(),
  };
}

export function getUserSavedPaymentMethods(user) {
  const storedCards = Array.isArray(user?.savedPaymentMethods) ? user.savedPaymentMethods : [];
  const cardsById = new Map(
    storedCards
      .filter((card) => card?.id)
      .map((card) => [
        String(card.id),
        {
          ...card,
          brandLabel: card.brandLabel || formatCardBrand(card.brand),
          isPrimary: String(card.id) === String(user?.defaultPaymentMethodId || "") || Boolean(card.isPrimary),
          is3DS: card.is3DS === true,
          threeDSecureResult: card.threeDSecureResult || "not_available",
          threeDSecureAuthenticationFlow: card.threeDSecureAuthenticationFlow || "",
        },
      ]),
  );

  if (user?.defaultPaymentMethodId && !cardsById.has(String(user.defaultPaymentMethodId))) {
    cardsById.set(String(user.defaultPaymentMethodId), {
      id: user.defaultPaymentMethodId,
      brand: user.defaultPaymentMethodBrand || "",
      brandLabel: formatCardBrand(user.defaultPaymentMethodBrand),
      last4: user.defaultPaymentMethodLast4 || "",
      expMonth: null,
      expYear: null,
      funding: "",
      country: "",
      isPrimary: true,
      is3DS: false,
      threeDSecureResult: "not_available",
      threeDSecureAuthenticationFlow: "",
      savedAt: user.updatedAt?.toISOString?.() || new Date().toISOString(),
    });
  }

  const defaultPaymentMethodId = String(user?.defaultPaymentMethodId || "");
  return [...cardsById.values()].map((card) => ({
    ...card,
    isPrimary: defaultPaymentMethodId ? String(card.id) === defaultPaymentMethodId : Boolean(card.isPrimary),
  }));
}

function applyPrimaryPaymentMethodFields(user, primaryCard) {
  user.defaultPaymentMethodId = primaryCard?.id || "";
  user.defaultPaymentMethodBrand = primaryCard?.brand || "";
  user.defaultPaymentMethodLast4 = primaryCard?.last4 || "";
}

export async function ensureStripeCustomer(user, { billingDetails } = {}) {
  assertStripeConfigured();

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    ...(billingDetails
      ? {
          ...(billingDetails.name || user.name ? { name: billingDetails.name || user.name } : {}),
          ...(billingDetails.email || user.email ? { email: billingDetails.email || user.email } : {}),
          ...(billingDetails.phone ? { phone: billingDetails.phone } : {}),
          ...(billingDetails.address ? { address: billingDetails.address } : {}),
        }
      : {}),
    metadata: normalizeMetadata({
      userId: user._id,
      clerkId: user.clerkId,
    }),
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
}

export async function updateUserDefaultPaymentMethod({
  user,
  customerId,
  paymentMethodId,
  is3DS,
  threeDSecureResult,
  threeDSecureAuthenticationFlow,
}) {
  assertStripeConfigured();

  if (!paymentMethodId) {
    return null;
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  const existingCards = getUserSavedPaymentMethods(user);
  const existingCard = existingCards.find((card) => String(card.id) === String(paymentMethodId));
  const paymentMethodSummary = buildPaymentMethodSummary(paymentMethod, {
    isPrimary: true,
    savedAt: existingCard?.savedAt,
    is3DS: is3DS ?? existingCard?.is3DS ?? false,
    threeDSecureResult: threeDSecureResult || existingCard?.threeDSecureResult || "not_available",
    threeDSecureAuthenticationFlow:
      threeDSecureAuthenticationFlow || existingCard?.threeDSecureAuthenticationFlow || "",
  });

  const customerBillingDetails = paymentMethod.billing_details?.email
    ? paymentMethod.billing_details
    : null;

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
    ...(customerBillingDetails
      ? {
          name: customerBillingDetails.name || undefined,
          email: customerBillingDetails.email,
          phone: customerBillingDetails.phone || undefined,
          address: customerBillingDetails.address || undefined,
        }
      : {}),
  });

  user.stripeCustomerId = customerId;
  user.savedPaymentMethods = [
    ...existingCards.filter((card) => String(card.id) !== String(paymentMethodId)),
    paymentMethodSummary,
  ].map((card) => ({
    ...card,
    isPrimary: String(card.id) === String(paymentMethodId),
  }));
  applyPrimaryPaymentMethodFields(user, paymentMethodSummary);
  user.autoCardBillingEnabled = true;
  await user.save();

  return paymentMethod;
}

export async function setUserPrimaryPaymentMethod({ user, paymentMethodId }) {
  assertStripeConfigured();

  const savedCards = getUserSavedPaymentMethods(user);
  const selectedCard = savedCards.find((card) => String(card.id) === String(paymentMethodId));

  if (!selectedCard) {
    throw new HttpError(404, "Saved card not found.");
  }

  if (!user.stripeCustomerId) {
    throw new HttpError(400, "No Stripe customer is attached to this account.");
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (paymentMethod.customer && String(paymentMethod.customer) !== String(user.stripeCustomerId)) {
    throw new HttpError(403, "This saved card does not belong to the authenticated customer.");
  }

  const paymentMethodSummary = buildPaymentMethodSummary(paymentMethod, {
    isPrimary: true,
    savedAt: selectedCard.savedAt,
    is3DS: selectedCard.is3DS === true,
    threeDSecureResult: selectedCard.threeDSecureResult || "not_available",
    threeDSecureAuthenticationFlow: selectedCard.threeDSecureAuthenticationFlow || "",
  });

  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  user.savedPaymentMethods = savedCards.map((card) =>
    String(card.id) === String(paymentMethodId)
      ? paymentMethodSummary
      : {
          ...card,
          isPrimary: false,
        },
  );
  applyPrimaryPaymentMethodFields(user, paymentMethodSummary);
  user.autoCardBillingEnabled = true;
  await user.save();

  return paymentMethodSummary;
}

export async function updateUserCardAutoBilling({ user, enabled }) {
  const shouldEnable = Boolean(enabled);

  if (shouldEnable && !user.defaultPaymentMethodId) {
    return null;
  }

  user.autoCardBillingEnabled = shouldEnable;
  await user.save();

  return {
    autoCardBillingEnabled: user.autoCardBillingEnabled,
  };
}

export async function removeUserPaymentMethod({ user, paymentMethodId }) {
  assertStripeConfigured();

  const savedCards = getUserSavedPaymentMethods(user);
  const resolvedPaymentMethodId = paymentMethodId || user.defaultPaymentMethodId;

  if (!resolvedPaymentMethodId) {
    throw new HttpError(400, "No saved Stripe card is on file.");
  }

  const removedCard = savedCards.find((card) => String(card.id) === String(resolvedPaymentMethodId));
  if (!removedCard) {
    throw new HttpError(404, "Saved card not found.");
  }

  const customerId = user.stripeCustomerId;
  const remainingCards = savedCards.filter((card) => String(card.id) !== String(resolvedPaymentMethodId));
  const removedPrimaryCard = String(user.defaultPaymentMethodId || "") === String(resolvedPaymentMethodId) || removedCard.isPrimary;
  const nextPrimaryCard = removedPrimaryCard ? remainingCards[0] : remainingCards.find((card) => card.isPrimary);

  if (customerId && removedPrimaryCard) {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: nextPrimaryCard?.id || null,
      },
    });
  }

  await stripe.paymentMethods.detach(resolvedPaymentMethodId);

  user.savedPaymentMethods = remainingCards.map((card) => ({
    ...card,
    isPrimary: nextPrimaryCard ? String(card.id) === String(nextPrimaryCard.id) : false,
  }));

  applyPrimaryPaymentMethodFields(user, nextPrimaryCard || null);
  if (!nextPrimaryCard) {
    user.autoCardBillingEnabled = false;
    user.walletAutoTopupEnabled = false;
    user.walletAutoTopupNextRunAt = null;
    user.walletAutoTopupLastStatus = "disabled";
    user.walletAutoTopupLastMessage = "Monthly wallet auto top-up was disabled because no saved card remains.";
  }
  await user.save();

  return { paymentMethodId: resolvedPaymentMethodId, customerId };
}

export async function removeUserDefaultPaymentMethod({ user }) {
  return removeUserPaymentMethod({
    user,
    paymentMethodId: user.defaultPaymentMethodId,
  });
}

export async function createSetupIntent({
  user,
  metadata,
  billingDetails,
  requestThreeDSecure = STANDARD_THREE_D_SECURE_MODE,
  idempotencyKey = "",
}) {
  assertStripeConfigured();

  const normalizedBillingDetails = normalizePaymentBillingDetails(billingDetails);
  const customerId = await ensureStripeCustomer(user, {
    billingDetails: normalizedBillingDetails,
  });
  await updateStripeCustomerContact(customerId, normalizedBillingDetails, user.email);

  return stripe.setupIntents.create(
    {
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      payment_method_options: {
        card: {
          request_three_d_secure: requestThreeDSecure,
        },
      },
      metadata: normalizeMetadata(metadata),
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
}

export function buildUserInitiatedCardPaymentIntentParams({
  customerId,
  paymentMethodId,
  amount,
  description,
  metadata,
  receiptEmail,
  saveForFutureUse = false,
  requestThreeDSecure = STANDARD_THREE_D_SECURE_MODE,
}) {
  const statementDescriptorSuffix = getStatementDescriptorSuffix();

  return {
    amount: toStripeAmount(amount),
    currency: env.stripeCurrency,
    capture_method: CUSTOMER_PRESENT_CAPTURE_METHOD,
    customer: customerId,
    ...(paymentMethodId ? { payment_method: paymentMethodId } : {}),
    payment_method_types: ["card"],
    ...(saveForFutureUse ? { setup_future_usage: "off_session" } : {}),
    payment_method_options: {
      card: {
        request_three_d_secure: requestThreeDSecure,
      },
    },
    description,
    ...(receiptEmail ? { receipt_email: receiptEmail } : {}),
    ...(statementDescriptorSuffix ? { statement_descriptor_suffix: statementDescriptorSuffix } : {}),
    metadata: normalizeMetadata(metadata),
  };
}

export async function createPaymentIntent({
  user,
  amount,
  description,
  metadata,
  billingDetails,
  saveForFutureUse = true,
  requestThreeDSecure = STANDARD_THREE_D_SECURE_MODE,
  idempotencyKey = "",
}) {
  assertStripeConfigured();

  const normalizedBillingDetails = normalizePaymentBillingDetails(billingDetails);
  const customerId = await ensureStripeCustomer(user, {
    billingDetails: normalizedBillingDetails,
  });
  await updateStripeCustomerContact(customerId, normalizedBillingDetails, user.email);

  return stripe.paymentIntents.create(
    buildUserInitiatedCardPaymentIntentParams({
      customerId,
      amount,
      description,
      metadata,
      receiptEmail: normalizedBillingDetails.email || user.email,
      saveForFutureUse,
      requestThreeDSecure,
    }),
    idempotencyKey ? { idempotencyKey } : undefined,
  );
}

export async function createOffSessionCharge({ user, amount, description, metadata, requireAutoCardBillingEnabled = true, idempotencyKey = "" }) {
  assertStripeConfigured();

  if (requireAutoCardBillingEnabled && user.autoCardBillingEnabled === false) {
    throw new HttpError(400, "Saved-card automatic billing is disabled for this customer.");
  }

  if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
    throw new HttpError(400, "No saved Stripe card is available for this customer.");
  }

  const statementDescriptorSuffix = getStatementDescriptorSuffix();

  return stripe.paymentIntents.create(
    {
      amount: toStripeAmount(amount),
      currency: env.stripeCurrency,
      capture_method: CUSTOMER_PRESENT_CAPTURE_METHOD,
      customer: user.stripeCustomerId,
      payment_method: user.defaultPaymentMethodId,
      payment_method_types: ["card"],
      confirm: true,
      error_on_requires_action: true,
      off_session: true,
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic",
        },
      },
      description,
      ...(statementDescriptorSuffix ? { statement_descriptor_suffix: statementDescriptorSuffix } : {}),
      metadata: normalizeMetadata(metadata),
      expand: ["latest_charge"],
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
}

export async function createSavedCardPaymentIntent({
  user,
  paymentMethodId,
  amount,
  description,
  metadata,
  billingDetails,
  requestThreeDSecure = STANDARD_THREE_D_SECURE_MODE,
  idempotencyKey = "",
}) {
  assertStripeConfigured();

  const savedCards = getUserSavedPaymentMethods(user);
  const selectedCard = savedCards.find((card) => String(card.id) === String(paymentMethodId));

  if (!selectedCard) {
    throw new HttpError(404, "Saved card not found.");
  }

  if (!user.stripeCustomerId) {
    throw new HttpError(400, "No Stripe customer is attached to this account.");
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (paymentMethod.customer && String(paymentMethod.customer) !== String(user.stripeCustomerId)) {
    throw new HttpError(403, "This saved card does not belong to the authenticated customer.");
  }

  const normalizedBillingDetails = normalizePaymentBillingDetails(billingDetails);
  const hasBillingDetails = Object.keys(normalizedBillingDetails).length > 0;
  await Promise.all([
    hasBillingDetails
      ? stripe.paymentMethods.update(paymentMethodId, {
          billing_details: normalizedBillingDetails,
        })
      : Promise.resolve(),
    updateStripeCustomerContact(user.stripeCustomerId, normalizedBillingDetails, user.email),
  ]);

  return stripe.paymentIntents.create(
    buildUserInitiatedCardPaymentIntentParams({
      customerId: user.stripeCustomerId,
      paymentMethodId,
      amount,
      description,
      metadata,
      receiptEmail: normalizedBillingDetails.email || user.email,
      requestThreeDSecure,
    }),
    idempotencyKey ? { idempotencyKey } : undefined,
  );
}

export async function constructWebhookEvent(rawBody, signature) {
  assertStripeConfigured();

  if (!env.stripeWebhookSecret) {
    throw new HttpError(503, "Stripe webhook secret is not configured yet.");
  }

  return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

export async function retrieveCheckoutSession(sessionId) {
  assertStripeConfigured();

  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: [
      "payment_intent.payment_method",
      "payment_intent.latest_charge",
      "setup_intent.payment_method",
      "setup_intent.latest_attempt",
    ],
  });
}

export async function retrievePaymentIntent(paymentIntentId) {
  assertStripeConfigured();

  return stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method", "latest_charge"],
  });
}

export async function listRecentCustomerPaymentIntents({ customerId, createdAfter, limit = 100 }) {
  assertStripeConfigured();

  if (!customerId) {
    return [];
  }

  const result = await stripe.paymentIntents.list({
    customer: customerId,
    created: {
      gte: Math.floor(Number(createdAfter || 0)),
    },
    limit: Math.min(Math.max(Number(limit || 100), 1), 100),
  });

  return result.data;
}

export async function retrieveCharge(chargeId) {
  assertStripeConfigured();

  return stripe.charges.retrieve(chargeId, {
    expand: ["payment_intent"],
  });
}

export async function refundStripePayment({ paymentIntentId, metadata = {}, idempotencyKey = "" }) {
  assertStripeConfigured();

  if (!paymentIntentId) {
    throw new HttpError(400, "The original Stripe payment reference is missing.");
  }

  return stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      metadata: normalizeMetadata(metadata),
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
}

export async function retrieveSetupIntent(setupIntentId) {
  assertStripeConfigured();

  return stripe.setupIntents.retrieve(setupIntentId, {
    expand: ["payment_method", "latest_attempt"],
  });
}
