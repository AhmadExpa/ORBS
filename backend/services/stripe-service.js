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
export const WALLET_TOPUP_THREE_D_SECURE_MODE = CUSTOMER_PRESENT_THREE_D_SECURE_MODE;
const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/u;

function assertStripeConfigured() {
  if (!stripe) {
    throw new HttpError(503, "Stripe is not configured yet.");
  }
}

function normalizeMetadata(metadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );
}

export function normalizePaymentPhoneNumber(value) {
  const compact = String(value || "")
    .trim()
    .replace(/[\s().-]/gu, "");
  const normalized = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  return E164_PHONE_PATTERN.test(normalized) ? normalized : "";
}

export function normalizePaymentBillingDetails(value) {
  const normalizedPhone = normalizePaymentPhoneNumber(value?.phone);
  const details = {
    name: String(value?.name || "").trim(),
    email: String(value?.email || "").trim().toLowerCase(),
    phone: normalizedPhone,
    line1: String(value?.line1 || "").trim(),
    line2: String(value?.line2 || "").trim(),
    city: String(value?.city || "").trim(),
    state: String(value?.state || "").trim(),
    postalCode: String(value?.postalCode || "").trim(),
    country: String(value?.country || "").trim().toUpperCase(),
  };

  if (details.name.length < 2) {
    throw new HttpError(400, "Enter the cardholder's full name.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(details.email)) {
    throw new HttpError(400, "Enter a valid payment email address.");
  }
  if (!details.phone) {
    throw new HttpError(400, "Enter the phone number in international format, such as +14155552671.");
  }
  if (!details.line1 || !details.city || !details.postalCode) {
    throw new HttpError(400, "Enter the complete billing street address, city, and postal code.");
  }
  if (!/^[A-Z]{2}$/u.test(details.country)) {
    throw new HttpError(400, "Enter a two-letter billing country code, such as US, GB, or PK.");
  }

  return {
    name: details.name,
    email: details.email,
    phone: details.phone,
    address: {
      line1: details.line1,
      ...(details.line2 ? { line2: details.line2 } : {}),
      city: details.city,
      ...(details.state ? { state: details.state } : {}),
      postal_code: details.postalCode,
      country: details.country,
    },
  };
}

async function updateStripeCustomerContact(customerId, billingDetails) {
  await stripe.customers.update(customerId, {
    name: billingDetails.name,
    email: billingDetails.email,
    phone: billingDetails.phone,
    address: billingDetails.address,
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

function buildPaymentMethodSummary(paymentMethod, { isPrimary = false, savedAt } = {}) {
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
          name: billingDetails.name,
          email: billingDetails.email,
          phone: billingDetails.phone,
          address: billingDetails.address,
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

export async function updateUserDefaultPaymentMethod({ user, customerId, paymentMethodId }) {
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

export async function createSetupCheckoutSession({ user, successUrl, cancelUrl }) {
  assertStripeConfigured();

  const customerId = await ensureStripeCustomer(user);

  return stripe.checkout.sessions.create({
    mode: "setup",
    currency: env.stripeCurrency,
    customer: customerId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    payment_method_options: {
      card: {
        request_three_d_secure: CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
      },
    },
    client_reference_id: String(user._id),
    metadata: normalizeMetadata({
      type: "card_setup",
      userId: user._id,
    }),
  });
}

export async function createSetupIntent({ user, metadata, billingDetails }) {
  assertStripeConfigured();

  const normalizedBillingDetails = normalizePaymentBillingDetails(billingDetails);
  const customerId = await ensureStripeCustomer(user, {
    billingDetails: normalizedBillingDetails,
  });
  await updateStripeCustomerContact(customerId, normalizedBillingDetails);

  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
    payment_method_options: {
      card: {
        request_three_d_secure: CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
      },
    },
    metadata: normalizeMetadata(metadata),
  });
}

export async function createPaymentCheckoutSession({
  user,
  successUrl,
  cancelUrl,
  lineItems,
  metadata,
  saveForFutureUse = true,
  requestThreeDSecure = CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
}) {
  assertStripeConfigured();

  const customerId = await ensureStripeCustomer(user);
  const normalizedMetadata = normalizeMetadata(metadata);

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    billing_address_collection: "required",
    phone_number_collection: { enabled: true },
    client_reference_id: String(user._id),
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: lineItems,
    payment_method_options: {
      card: {
        request_three_d_secure: requestThreeDSecure,
      },
    },
    payment_intent_data: {
      ...(saveForFutureUse ? { setup_future_usage: "off_session" } : {}),
      metadata: normalizedMetadata,
    },
    metadata: normalizedMetadata,
  });
}

export function buildUserInitiatedCardPaymentIntentParams({
  customerId,
  paymentMethodId,
  amount,
  description,
  metadata,
  receiptEmail,
  saveForFutureUse = false,
  requestThreeDSecure = CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
}) {
  return {
    amount: toStripeAmount(amount),
    currency: env.stripeCurrency,
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
  requestThreeDSecure = CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
}) {
  assertStripeConfigured();

  const normalizedBillingDetails = normalizePaymentBillingDetails(billingDetails);
  const customerId = await ensureStripeCustomer(user, {
    billingDetails: normalizedBillingDetails,
  });
  await updateStripeCustomerContact(customerId, normalizedBillingDetails);

  return stripe.paymentIntents.create(
    buildUserInitiatedCardPaymentIntentParams({
      customerId,
      amount,
      description,
      metadata,
      receiptEmail: normalizedBillingDetails.email,
      saveForFutureUse,
      requestThreeDSecure,
    }),
  );
}

export function createCheckoutLineItem({ name, description, amount }) {
  return {
    quantity: 1,
    price_data: {
      currency: env.stripeCurrency,
      unit_amount: toStripeAmount(amount),
      product_data: {
        name,
        description,
      },
    },
  };
}

export async function createOffSessionCharge({ user, amount, description, metadata }) {
  assertStripeConfigured();

  if (user.autoCardBillingEnabled === false) {
    throw new HttpError(400, "Saved-card automatic billing is disabled for this customer.");
  }

  if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
    throw new HttpError(400, "No saved Stripe card is available for this customer.");
  }

  return stripe.paymentIntents.create({
    amount: toStripeAmount(amount),
    currency: env.stripeCurrency,
    customer: user.stripeCustomerId,
    payment_method: user.defaultPaymentMethodId,
    payment_method_types: ["card"],
    confirm: true,
    off_session: true,
    payment_method_options: {
      card: {
        request_three_d_secure: "automatic",
      },
    },
    description,
    metadata: normalizeMetadata(metadata),
    expand: ["latest_charge"],
  });
}

export async function createSavedCardPaymentIntent({
  user,
  paymentMethodId,
  amount,
  description,
  metadata,
  billingDetails,
  requestThreeDSecure = CUSTOMER_PRESENT_THREE_D_SECURE_MODE,
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
  await Promise.all([
    stripe.paymentMethods.update(paymentMethodId, {
      billing_details: normalizedBillingDetails,
    }),
    updateStripeCustomerContact(user.stripeCustomerId, normalizedBillingDetails),
  ]);

  return stripe.paymentIntents.create(
    buildUserInitiatedCardPaymentIntentParams({
      customerId: user.stripeCustomerId,
      paymentMethodId,
      amount,
      description,
      metadata,
      receiptEmail: normalizedBillingDetails.email,
      requestThreeDSecure,
    }),
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
    expand: ["payment_intent.payment_method", "payment_intent.latest_charge", "setup_intent.payment_method"],
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
    expand: ["payment_method"],
  });
}
