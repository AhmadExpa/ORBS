import { getCustomerPaymentFailureMessage, isStripePaymentError } from "../services/stripe-service.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
}

export function errorHandler(error, req, res, next) {
  const isZodError = error?.name === "ZodError" && Array.isArray(error.issues);
  const statusCode = isZodError ? 400 : error.statusCode || 500;
  const stripeError = isStripePaymentError(error) ? error.raw || error : null;
  const customerMessage = stripeError
    ? getCustomerPaymentFailureMessage({
        code: stripeError.code,
        declineCode: stripeError.decline_code,
        adviceCode: stripeError.advice_code,
        status: stripeError.payment_intent?.status,
      })
    : "";
  const details = isZodError
    ? {
        code: "VALIDATION_ERROR",
        issues: error.issues,
      }
    : error.details || null;

  res.status(statusCode).json({
    code: details?.code || error.code || undefined,
    message: customerMessage || error.message || "Internal server error",
    customerMessage: customerMessage || undefined,
    contractStatus: details?.contractStatus || undefined,
    redirectUrl: details?.redirectUrl || undefined,
    details,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
}
