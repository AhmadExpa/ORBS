"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getDelegateSessionToken } from "../auth/delegate-client-session";
import { apiFetch } from "./client";

export function useCustomerQuery({ queryKey, path, enabled = true }) {
  const { getToken, isLoaded, userId } = useAuth();
  const [hasDelegateSession, setHasDelegateSession] = useState(false);

  useEffect(() => {
    setHasDelegateSession(Boolean(getDelegateSessionToken()));
  }, []);

  return useQuery({
    queryKey,
    enabled: isLoaded && (Boolean(userId) || hasDelegateSession) && enabled,
    queryFn: async () => {
      if (userId) {
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
