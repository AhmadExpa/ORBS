import Stripe from "stripe";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

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

export function isStripeConfigured() {
  return Boolean(stripe);
}

export function toStripeAmount(amount) {
  return Math.round(Number(amount || 0) * 100);
}

export async function ensureStripeCustomer(user) {
  assertStripeConfigured();

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
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

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  user.stripeCustomerId = customerId;
  user.defaultPaymentMethodId = paymentMethodId;
  user.defaultPaymentMethodBrand = paymentMethod.card?.brand || "";
  user.defaultPaymentMethodLast4 = paymentMethod.card?.last4 || "";
  await user.save();

  return paymentMethod;
}

export async function removeUserDefaultPaymentMethod({ user }) {
  assertStripeConfigured();

  if (!user.defaultPaymentMethodId) {
    return null;
  }

  const paymentMethodId = user.defaultPaymentMethodId;
  const customerId = user.stripeCustomerId;

  if (customerId) {
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: null,
      },
    });
  }

  await stripe.paymentMethods.detach(paymentMethodId);

  user.defaultPaymentMethodId = "";
  user.defaultPaymentMethodBrand = "";
  user.defaultPaymentMethodLast4 = "";
  await user.save();

  return { paymentMethodId, customerId };
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
    client_reference_id: String(user._id),
    metadata: normalizeMetadata({
      type: "card_setup",
      userId: user._id,
    }),
  });
}

export async function createSetupIntent({ user, metadata }) {
  assertStripeConfigured();

  const customerId = await ensureStripeCustomer(user);

  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
    metadata: normalizeMetadata(metadata),
  });
}

export async function createPaymentCheckoutSession({ user, successUrl, cancelUrl, lineItems, metadata }) {
  assertStripeConfigured();

  const customerId = await ensureStripeCustomer(user);
  const normalizedMetadata = normalizeMetadata(metadata);

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    billing_address_collection: "auto",
    client_reference_id: String(user._id),
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: lineItems,
    payment_intent_data: {
      setup_future_usage: "off_session",
      metadata: normalizedMetadata,
    },
    metadata: normalizedMetadata,
  });
}

export async function createPaymentIntent({ user, amount, description, metadata }) {
  assertStripeConfigured();

  const customerId = await ensureStripeCustomer(user);

  return stripe.paymentIntents.create({
    amount: toStripeAmount(amount),
    currency: env.stripeCurrency,
    customer: customerId,
    payment_method_types: ["card"],
    setup_future_usage: "off_session",
    description,
    metadata: normalizeMetadata(metadata),
  });
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
    description,
    metadata: normalizeMetadata(metadata),
  });
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
    expand: ["payment_intent.payment_method", "setup_intent.payment_method"],
  });
}
