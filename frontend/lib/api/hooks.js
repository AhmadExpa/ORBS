"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./client";

export function useCustomerQuery({ queryKey, path, enabled = true }) {
  const { getToken, isLoaded, userId } = useAuth();

  return useQuery({
    queryKey,
    enabled: isLoaded && Boolean(userId) && enabled,
    queryFn: async () => {
      const token = await getToken();
      return apiFetch(path, { token });
    },
  });
}

export function useStaffQuery({ queryKey, path, enabled = true }) {
  return useQuery({
    queryKey,
    enabled,
    queryFn: () => apiFetch(path),
  });
}

