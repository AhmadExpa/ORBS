import { createClerkClient } from "@clerk/backend";
import { env } from "../config/env.js";
import { User } from "../db/models/index.js";
import { HttpError } from "../utils/http-error.js";

const clerkClient = env.clerkSecretKey ? createClerkClient({ secretKey: env.clerkSecretKey }) : null;

function firstNonEmpty(...values) {
  return values
    .map((value) => (value === undefined || value === null ? "" : String(value).trim()))
    .find(Boolean);
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

function getClerkEmail(clerkUser) {
  return firstNonEmpty(
    clerkUser?.primaryEmailAddress?.emailAddress,
    clerkUser?.emailAddresses?.[0]?.emailAddress,
    clerkUser?.raw?.email_addresses?.find((email) => email.id === clerkUser?.raw?.primary_email_address_id)
      ?.email_address,
    clerkUser?.raw?.email_addresses?.[0]?.email_address,
  );
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

function buildProfile({ payload, body = {}, clerkUser }) {
  const email = firstNonEmpty(body.email, getPayloadEmail(payload), getClerkEmail(clerkUser));
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

  const existingWithEmail = await User.findOne({ email });
  if (existingWithEmail && String(existingWithEmail._id) !== String(currentUserId || "")) {
    throw new HttpError(
      409,
      "A customer account already exists with this email address. Please contact support to merge the account.",
    );
  }
}

export async function ensureCustomerProfile({ payload }) {
  if (!payload?.sub) {
    throw new HttpError(401, "Unable to verify customer identity.");
  }

  const existingUser = await User.findOne({ clerkId: payload.sub });
  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await getClerkUser(payload.sub);
  const profile = buildProfile({ payload, clerkUser });

  if (!profile.email) {
    throw new HttpError(
      401,
      "Customer profile could not be created because Clerk did not provide an email address. Refresh the portal or contact support.",
    );
  }

  await assertEmailAvailable({ email: profile.email });

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

export async function syncCustomerProfile({ payload, body = {} }) {
  if (!payload?.sub) {
    throw new HttpError(401, "Unable to verify customer identity.");
  }

  const existingUser = await User.findOne({ clerkId: payload.sub });
  const clerkUser = await getClerkUser(payload.sub);
  const profile = buildProfile({ payload, body, clerkUser });

  if (!profile.email) {
    throw new HttpError(400, "Email is required for profile sync.");
  }

  await assertEmailAvailable({
    email: profile.email,
    currentUserId: existingUser?._id,
  });

  if (!existingUser) {
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

  existingUser.name = profile.name;
  existingUser.email = profile.email;
  if (hasOwn(body, "phone")) {
    existingUser.phone = profile.phone;
  }
  if (hasOwn(body, "secondaryEmail")) {
    existingUser.secondaryEmail = profile.secondaryEmail;
  }
  if (hasOwn(body, "address")) {
    existingUser.address = profile.address;
  }
  if (hasOwn(body, "company")) {
    existingUser.company = profile.company;
  }
  if (hasOwn(body, "billingAddress")) {
    existingUser.billingAddress = profile.billingAddress;
  }
  existingUser.role = "customer";

  await existingUser.save();
  return existingUser;
}
