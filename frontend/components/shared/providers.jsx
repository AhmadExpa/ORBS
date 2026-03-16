"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { FeedbackProvider } from "./feedback-layer";

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const authAppearance = {
    elements: {
      footer: "hidden",
      footerPages: "hidden",
      userButtonPopoverFooter: "hidden",
    },
  };

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={authAppearance}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/login"}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/signup"}
      signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/portal"}
      signUpFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "/portal"}
    >
      <QueryClientProvider client={queryClient}>
        <FeedbackProvider>{children}</FeedbackProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
