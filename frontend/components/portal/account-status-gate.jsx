"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useCustomerQuery } from "@/lib/api/hooks";
import { PageLoader } from "@/components/shared/page-loader";

/**
 * Blocks suspended/blocked customers from entering the portal. Reads the
 * lightweight /profile/account-status endpoint (which is NOT gated by the
 * suspend/block rejection), and on a non-active status signs the user out and
 * bounces them to the login screen with a notice. Fails open on errors so a
 * transient network issue never locks out a healthy account.
 */
export function AccountStatusGate({ children }) {
  const { signOut } = useClerk();
  const { data, isLoading } = useCustomerQuery({
    queryKey: ["portal-account-status"],
    path: "/profile/account-status",
  });

  const status = data?.status;
  const inactive = Boolean(status) && status !== "active";

  useEffect(() => {
    if (!inactive) {
      return;
    }
    try {
      sessionStorage.setItem("eo_account_status", JSON.stringify({ status, reason: data?.reason || "" }));
    } catch {
      // sessionStorage may be unavailable; the login page falls back to a generic message.
    }
    signOut({ redirectUrl: `/login?status=${encodeURIComponent(status)}` });
  }, [inactive, status, data?.reason, signOut]);

  if (isLoading && !data) {
    return <PageLoader title="Checking your account" subtitle="One moment…" />;
  }

  if (inactive) {
    return <PageLoader title="Signing you out" subtitle="Redirecting you to the login page…" />;
  }

  return children;
}
