import { createClerkClient } from "@clerk/backend";
import { env } from "../config/env.js";
import { User } from "../db/models/index.js";
import { query } from "../db/postgres-client.js";
import { withTransaction } from "../db/postgres-model.js";
import { HttpError } from "../utils/http-error.js";

const clerkClient = env.clerkSecretKey ? createClerkClient({ secretKey: env.clerkSecretKey }) : null;
const customerReferenceCollections = ["orders", "subscriptions", "invoices", "payment_submissions", "support_tickets"];

function firstNonEmpty(...values) {
  return values
    .map((value) => (value === undefined || value === null ? "" : String(value).trim()))
    .find(Boolean);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getPayloadEmail(payload = {}) {
  return firstNonEmpty(
    payload.email,
    payload.email_address,
    payload.primary_email_address,
    payload?.emailAddresses?.[0]?.emailAddress,
    payload?.email_addresses?.[0]?.email_address,
  );
}

function getPayloadName(payload = {}) {
  return firstNonEmpty(
    payload.name,
    [payload.first_name, payload.last_name].filter(Boolean).join(" "),
    payload.username,
  );
}

function getEmailRecordAddress(emailRecord) {
  return firstNonEmpty(emailRecord?.emailAddress, emailRecord?.email_address);
}

function getClerkEmail(clerkUser) {
  return firstNonEmpty(
    clerkUser?.primaryEmailAddress?.emailAddress,
    clerkUser?.emailAddresses?.[0]?.emailAddress,
    clerkUser?.raw?.email_addresses?.find((email) => email.id === clerkUser?.raw?.primary_email_address_id)
      ?.email_address,
    clerkUser?.raw?.email_addresses?.[0]?.email_address,
  );
}

function getClerkPrimaryEmailRecord(clerkUser) {
  if (!clerkUser) {
    return null;
  }

  if (clerkUser.primaryEmailAddress) {
    return clerkUser.primaryEmailAddress;
  }

  const primaryEmailId = firstNonEmpty(clerkUser.primaryEmailAddressId, clerkUser.raw?.primary_email_address_id);
  const emailAddresses = [...(clerkUser.emailAddresses || []), ...(clerkUser.raw?.email_addresses || [])];

  return emailAddresses.find((emailRecord) => emailRecord?.id && emailRecord.id === primaryEmailId) || emailAddresses[0] || null;
}

function isEmailRecordVerified(emailRecord) {
  if (!emailRecord) {
    return false;
  }

  const status = firstNonEmpty(
    emailRecord.verification?.status,
    emailRecord.verification?.verified,
    emailRecord.verified,
  ).toLowerCase();

  return status === "verified" || status === "true";
}

function isPayloadEmailVerified(payload = {}) {
  const value = firstNonEmpty(
    payload.email_verified,
    payload.emailVerified,
    payload.primary_email_verified,
    payload.primaryEmailVerified,
  ).toLowerCase();

  return value === "true" || value === "verified";
}

function getVerifiedPrimaryEmail({ payload = {}, clerkUser }) {
  const primaryEmailRecord = getClerkPrimaryEmailRecord(clerkUser);
  const primaryEmail = getEmailRecordAddress(primaryEmailRecord);

  if (primaryEmail && isEmailRecordVerified(primaryEmailRecord)) {
    return primaryEmail;
  }

  const payloadEmail = getPayloadEmail(payload);
  return payloadEmail && isPayloadEmailVerified(payload) ? payloadEmail : "";
}

function getClerkName(clerkUser) {
  return firstNonEmpty(
    clerkUser?.fullName,
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" "),
    clerkUser?.username,
  );
}

function normalizeBillingAddress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return {
    line1: firstNonEmpty(value.line1),
    line2: firstNonEmpty(value.line2),
    city: firstNonEmpty(value.city),
    state: firstNonEmpty(value.state),
    postalCode: firstNonEmpty(value.postalCode),
    country: firstNonEmpty(value.country),
  };
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

async function getClerkUser(clerkId) {
  if (!clerkClient || !clerkId) {
    return null;
  }

  try {
    return await clerkClient.users.getUser(clerkId);
  } catch (error) {
    return null;
  }
}

async function findUserByClerkId(clerkId, { forUpdate = false } = {}) {
  if (!clerkId) {
    return null;
  }

  const result = await query(
    `
      SELECT id
      FROM eo_documents
      WHERE collection = 'users'
        AND data->>'clerkId' = $1
      LIMIT 1
      ${forUpdate ? "FOR UPDATE" : ""}
    `,
    [String(clerkId)],
  );

  return result.rows[0]?.id ? User.findById(result.rows[0].id) : null;
}

async function findUserByEmail(email, { forUpdate = false } = {}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const result = await query(
    `
      SELECT id
      FROM eo_documents
      WHERE collection = 'users'
        AND lower(data->>'email') = $1
      LIMIT 1
      ${forUpdate ? "FOR UPDATE" : ""}
    `,
    [normalizedEmail],
  );

  return result.rows[0]?.id ? User.findById(result.rows[0].id) : null;
}

function buildProfile({ payload, body = {}, clerkUser, verifiedEmail = "" }) {
  const email = firstNonEmpty(verifiedEmail, getClerkEmail(clerkUser), getPayloadEmail(payload), body.email);
  const name = firstNonEmpty(
    body.name,
    getPayloadName(payload),
    getClerkName(clerkUser),
    email ? email.split("@")[0] : "",
    "ElevenOrbits Customer",
  );

  return {
    name,
    email,
    phone: firstNonEmpty(body.phone),
    secondaryEmail: firstNonEmpty(body.secondaryEmail),
    address: firstNonEmpty(body.address),
    company: firstNonEmpty(body.company),
    billingAddress: normalizeBillingAddress(body.billingAddress),
  };
}

async function assertEmailAvailable({ email, currentUserId }) {
  if (!email) {
    return;
  }

  const existingWithEmail = await findUserByEmail(email);
  if (existingWithEmail && String(existingWithEmail._id) !== String(currentUserId || "")) {
    throw new HttpError(
      409,
      "A customer account already exists with this email address. Verify the primary email on your login account or contact support to reconnect the account.",
    );
  }
}

function mergeSavedPaymentMethods(primaryCards = [], secondaryCards = []) {
  const cardsById = new Map();

  for (const card of [...(Array.isArray(primaryCards) ? primaryCards : []), ...(Array.isArray(secondaryCards) ? secondaryCards : [])]) {
    if (card?.id) {
      cardsById.set(String(card.id), card);
    }
  }

  return [...cardsById.values()];
}

function applyProfileUpdates(user, profile, body = {}) {
  if (profile.name) {
    user.name = profile.name;
  }
  if (profile.email) {
    user.email = profile.email;
  }
  if (hasOwn(body, "phone")) {
    user.phone = profile.phone;
  }
  if (hasOwn(body, "secondaryEmail")) {
    user.secondaryEmail = profile.secondaryEmail;
  }
  if (hasOwn(body, "address")) {
    user.address = profile.address;
  }
  if (hasOwn(body, "company")) {
    user.company = profile.company;
  }
  if (hasOwn(body, "billingAddress")) {
    user.billingAddress = profile.billingAddress;
  }
  user.role = "customer";
}

function mergeCustomerFields(targetUser, sourceUser, profile, body = {}) {
  targetUser.name = firstNonEmpty(profile.name, targetUser.name, sourceUser?.name, "ElevenOrbits Customer");
  targetUser.email = firstNonEmpty(profile.email, targetUser.email, sourceUser?.email);
  targetUser.phone = hasOwn(body, "phone") ? profile.phone : firstNonEmpty(targetUser.phone, sourceUser?.phone);
  targetUser.secondaryEmail = hasOwn(body, "secondaryEmail")
    ? profile.secondaryEmail
    : firstNonEmpty(targetUser.secondaryEmail, sourceUser?.secondaryEmail);
  targetUser.address = hasOwn(body, "address") ? profile.address : firstNonEmpty(targetUser.address, sourceUser?.address);
  targetUser.company = hasOwn(body, "company") ? profile.company : firstNonEmpty(targetUser.company, sourceUser?.company);
  targetUser.billingAddress = hasOwn(body, "billingAddress")
    ? profile.billingAddress
    : Object.keys(targetUser.billingAddress || {}).length
      ? targetUser.billingAddress
      : sourceUser?.billingAddress || {};
  targetUser.accountBalance = Number(targetUser.accountBalance || 0) + Number(sourceUser?.accountBalance || 0);
  targetUser.stripeCustomerId = firstNonEmpty(targetUser.stripeCustomerId, sourceUser?.stripeCustomerId);
  targetUser.defaultPaymentMethodId = firstNonEmpty(targetUser.defaultPaymentMethodId, sourceUser?.defaultPaymentMethodId);
  targetUser.defaultPaymentMethodBrand = firstNonEmpty(targetUser.defaultPaymentMethodBrand, sourceUser?.defaultPaymentMethodBrand);
  targetUser.defaultPaymentMethodLast4 = firstNonEmpty(targetUser.defaultPaymentMethodLast4, sourceUser?.defaultPaymentMethodLast4);
  targetUser.savedPaymentMethods = mergeSavedPaymentMethods(targetUser.savedPaymentMethods, sourceUser?.savedPaymentMethods);
  targetUser.autoCardBillingEnabled =
    targetUser.autoCardBillingEnabled === undefined || targetUser.autoCardBillingEnabled === null
      ? sourceUser?.autoCardBillingEnabled ?? true
      : targetUser.autoCardBillingEnabled;
  targetUser.role = "customer";
}

async function reassignCustomerReferences({ fromUserId, toUserId }) {
  if (!fromUserId || !toUserId || String(fromUserId) === String(toUserId)) {
    return;
  }

  for (const collection of customerReferenceCollections) {
    await query(
      `
        UPDATE eo_documents
        SET data = jsonb_set(data, '{userId}', to_jsonb($1::text), true),
            updated_at = now()
        WHERE collection = $2
          AND data->>'userId' = $3
      `,
      [String(toUserId), collection, String(fromUserId)],
    );
  }

  await query(
    `
      UPDATE eo_documents
      SET data = jsonb_set(data, '{senderId}', to_jsonb($1::text), true),
          updated_at = now()
      WHERE collection = 'support_messages'
        AND data->>'senderType' = 'customer'
        AND data->>'senderId' = $2
    `,
    [String(toUserId), String(fromUserId)],
  );

  await query(
    `
      UPDATE eo_documents
      SET data = jsonb_set(data, '{actorId}', to_jsonb($1::text), true),
          updated_at = now()
      WHERE collection = 'activity_logs'
        AND data->>'actorRole' = 'customer'
        AND data->>'actorId' = $2
    `,
    [String(toUserId), String(fromUserId)],
  );

  await query(
    `
      UPDATE eo_documents
      SET data = jsonb_set(data, '{targetId}', to_jsonb($1::text), true),
          updated_at = now()
      WHERE collection = 'activity_logs'
        AND data->>'targetType' = 'user'
        AND data->>'targetId' = $2
    `,
    [String(toUserId), String(fromUserId)],
  );

  await query(
    `
      UPDATE payment_ledger_entries
      SET user_id = $1
      WHERE user_id = $2
    `,
    [String(toUserId), String(fromUserId)],
  );
}

async function deleteCustomerDocument(userId) {
  await query(
    `
      DELETE FROM eo_documents
      WHERE collection = 'users'
        AND id = $1
    `,
    [String(userId)],
  );
}

async function attachOrMergeCustomer({ payload, profile, body = {}, verifiedEmail }) {
  const existingByClerk = await findUserByClerkId(payload.sub, { forUpdate: true });
  const existingByEmail = await findUserByEmail(profile.email, { forUpdate: true });

  if (existingByEmail && existingByClerk && String(existingByEmail._id) !== String(existingByClerk._id)) {
    if (!verifiedEmail) {
      throw new HttpError(
        409,
        "A customer account already exists with this email address. Verify the primary email on your login account or contact support to reconnect the account.",
      );
    }

    await reassignCustomerReferences({
      fromUserId: existingByClerk._id,
      toUserId: existingByEmail._id,
    });
    mergeCustomerFields(existingByEmail, existingByClerk, profile, body);
    existingByEmail.clerkId = payload.sub;
    await deleteCustomerDocument(existingByClerk._id);
    await existingByEmail.save();
    return existingByEmail;
  }

  if (existingByClerk) {
    await assertEmailAvailable({
      email: profile.email,
      currentUserId: existingByClerk._id,
    });

    existingByClerk.clerkId = payload.sub;
    applyProfileUpdates(existingByClerk, profile, body);
    await existingByClerk.save();
    return existingByClerk;
  }

  if (existingByEmail) {
    if (!verifiedEmail) {
      throw new HttpError(
        409,
        "A customer account already exists with this email address. Verify the primary email on your login account or contact support to reconnect the account.",
      );
    }

    mergeCustomerFields(existingByEmail, null, profile, body);
    existingByEmail.clerkId = payload.sub;
    await existingByEmail.save();
    return existingByEmail;
  }

  return User.create({
    clerkId: payload.sub,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    secondaryEmail: profile.secondaryEmail,
    address: profile.address,
    company: profile.company,
    billingAddress: profile.billingAddress,
    role: "customer",
  });
}

async function resolveCustomerProfile({ payload, body = {} }) {
  if (!payload?.sub) {
    throw new HttpError(401, "Unable to verify customer identity.");
  }

  const clerkUser = await getClerkUser(payload.sub);
  const verifiedEmail = getVerifiedPrimaryEmail({ payload, clerkUser });
  const profile = buildProfile({ payload, body, clerkUser, verifiedEmail });

  if (!profile.email) {
    throw new HttpError(
      401,
      "Customer profile could not be created because Clerk did not provide an email address. Refresh the portal or contact support.",
    );
  }

  return withTransaction(() => attachOrMergeCustomer({ payload, profile, body, verifiedEmail }));
}

export async function ensureCustomerProfile({ payload }) {
  return resolveCustomerProfile({ payload });
}

export async function syncCustomerProfile({ payload, body = {} }) {
  return resolveCustomerProfile({ payload, body });
}

export async function getClerkAccountIdentity({ clerkId, payload = {} }) {
  const resolvedClerkId = clerkId || payload?.sub;
  if (!resolvedClerkId) {
    throw new HttpError(401, "Unable to verify customer identity.");
  }

  const clerkUser = await getClerkUser(resolvedClerkId);
  const verifiedEmail = getVerifiedPrimaryEmail({ payload, clerkUser });
  if (!verifiedEmail) {
    throw new HttpError(401, "A verified primary Clerk email is required before signing the agreement.");
  }

  const name = firstNonEmpty(getClerkName(clerkUser), getPayloadName(payload), verifiedEmail.split("@")[0]);

  return {
    clerkUserId: resolvedClerkId,
    customerName: name,
    customerEmail: normalizeEmail(verifiedEmail),
  };
}
