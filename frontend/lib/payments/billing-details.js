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

  if (details.name.length < 2) {
    return "Enter the cardholder's full name.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(details.email)) {
    return "Enter a valid payment email address.";
  }
  if (!details.phone) {
    return "Enter the phone number in international format, such as +14155552671.";
  }
  if (!details.line1) {
    return "Enter the cardholder's billing street address.";
  }
  if (!details.city) {
    return "Enter the billing city.";
  }
  if (!details.postalCode) {
    return "Enter the billing postal code.";
  }
  if (!/^[A-Z]{2}$/u.test(details.country)) {
    return "Enter a two-letter billing country code, such as US, GB, or PK.";
  }

  return "";
}

export function toStripeBillingDetails(value) {
  const details = normalizePaymentBillingDetails(value);

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
