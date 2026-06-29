"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Ban, ShieldAlert } from "lucide-react";

/**
 * Shown on the login screen after a suspended/blocked customer is bounced out.
 * Reads the `status` query param plus an optional reason stashed in
 * sessionStorage by the portal AccountStatusGate.
 */
export function AccountStatusNotice() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (status !== "suspended" && status !== "blocked") {
      return;
    }
    try {
      const raw = sessionStorage.getItem("eo_account_status");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.status === status && parsed?.reason) {
          setReason(parsed.reason);
        }
        sessionStorage.removeItem("eo_account_status");
      }
    } catch {
      // ignore
    }
  }, [status]);

  if (status !== "suspended" && status !== "blocked") {
    return null;
  }

  const isBlocked = status === "blocked";
  const Icon = isBlocked ? Ban : ShieldAlert;

  return (
    <div
      className={`mb-6 rounded-lg border p-4 ${
        isBlocked ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">{isBlocked ? "Account permanently blocked" : "Account suspended"}</p>
          <p className="mt-1 text-sm leading-6">
            {isBlocked
              ? "Your account has been permanently blocked and you can no longer sign in."
              : "Your account has been suspended due to suspicious activity. Contact support for more queries."}
          </p>
          {isBlocked && reason ? <p className="mt-2 text-sm leading-6"><span className="font-semibold">Reason:</span> {reason}</p> : null}
        </div>
      </div>
    </div>
  );
}
