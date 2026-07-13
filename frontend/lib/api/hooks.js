"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getDelegateSessionToken } from "../auth/delegate-client-session";
import { apiFetch } from "./client";

function normalizeQueryKey(queryKey) {
  return Array.isArray(queryKey) ? queryKey : [queryKey];
}

function sessionKeyForToken(token) {
  let hash = 0;
  for (let index = 0; index < String(token || "").length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

export function useCustomerQuery({ queryKey, path, enabled = true }) {
  const { getToken, isLoaded, userId } = useAuth();
  const pathname = usePathname();
  const [delegateToken, setDelegateToken] = useState("");
  const forceDelegateSession = pathname?.startsWith("/agent");

  useEffect(() => {
    setDelegateToken(getDelegateSessionToken());
  }, []);

  const hasDelegateSession = Boolean(delegateToken);
  const actorQueryKey = forceDelegateSession
    ? `delegate:${hasDelegateSession ? sessionKeyForToken(delegateToken) : "pending"}`
    : userId
      ? `customer:${userId}`
      : hasDelegateSession
        ? `delegate:${sessionKeyForToken(delegateToken)}`
        : "auth:pending";

  return useQuery({
    queryKey: [...normalizeQueryKey(queryKey), actorQueryKey],
    enabled: isLoaded && (forceDelegateSession ? hasDelegateSession : Boolean(userId) || hasDelegateSession) && enabled,
    queryFn: async () => {
      if (!forceDelegateSession && userId) {
        const token = await getToken();
        return apiFetch(path, { token, authMode: "customer" });
      }

      return apiFetch(path, { authMode: "delegate" });
    },
  });
}

export function useStaffQuery({ queryKey, path, enabled = true }) {
  return useQuery({
    queryKey,
    enabled,
    queryFn: () => apiFetch(path, { authMode: "staff" }),
  });
}
