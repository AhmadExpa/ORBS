export function getOrderPath(planSlug) {
  return planSlug ? `/portal/order/${planSlug}` : "/portal";
}

function encodeReturnPath(path) {
  const value = String(path || "/portal");
  const safePath = value.startsWith("/") && !value.startsWith("//") ? value : "/portal";
  return encodeURIComponent(safePath);
}

export function getSignupPath(returnPath = "/portal") {
  return `/signup?redirect_url=${encodeReturnPath(returnPath)}`;
}

export function getLoginPath(returnPath = "/portal") {
  return `/login?redirect_url=${encodeReturnPath(returnPath)}`;
}

export function getPurchasePath(plan) {
  if (!plan || plan.contactSalesOnly) {
    return "/contact";
  }

  return getSignupPath(getOrderPath(plan.slug));
}
