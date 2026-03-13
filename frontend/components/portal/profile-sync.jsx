"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api/client";

export function ProfileSync() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const didSync = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || didSync.current) {
      return;
    }

    didSync.current = true;

    async function sync() {
      const token = await getToken();
      await apiFetch("/profile/sync", {
        method: "POST",
        token,
        body: {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || user.firstName || "ElevenOrbits Customer",
        },
      }).catch(() => null);
    }

    sync();
  }, [getToken, isLoaded, user]);

  return null;
}

