export function createEmptyPaymentBillingDetails() {
  return {
    name: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  };
}

const E164_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/u;

export function normalizePaymentPhoneNumber(value) {
  const compact = String(value || "")
    .trim()
    .replace(/[\s().-]/gu, "");
  const normalized = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  return E164_PHONE_PATTERN.test(normalized) ? normalized : "";
}

export function normalizePaymentBillingDetails(value = {}) {
  return {
    name: String(value.name || "").trim(),
    email: String(value.email || "").trim().toLowerCase(),
    phone: normalizePaymentPhoneNumber(value.phone),
    line1: String(value.line1 || "").trim(),
    line2: String(value.line2 || "").trim(),
    city: String(value.city || "").trim(),
    state: String(value.state || "").trim(),
    postalCode: String(value.postalCode || "").trim(),
    country: String(value.country || "").trim().toUpperCase(),
  };
}

export function getPaymentBillingDetailsValidationError(value) {
  const details = normalizePaymentBillingDetails(value);
  const rawPhone = String(value?.phone || "").trim();

  if (details.name.length < 2) {
    return "Enter the cardholder's full name.";
  }
  if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(details.email)) {
    return "Enter a valid payment email address.";
  }
  if (rawPhone && !details.phone) {
    return "Enter the phone number in international format, such as +14155552671.";
  }
  if (!details.postalCode) {
    return "Enter the billing postal code.";
  }

  return "";
}

export function toStripeBillingDetails(value) {
  const details = normalizePaymentBillingDetails(value);

  return {
    name: details.name,
    ...(details.email ? { email: details.email } : {}),
    ...(details.phone ? { phone: details.phone } : {}),
    address: {
      postal_code: details.postalCode,
    },
  };
}
