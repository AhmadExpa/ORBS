"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge } from "@/lib/ui";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function ContractCompletePage({ contractId }) {
  const { getToken, isLoaded } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState({
    loading: true,
    error: "",
    contract: null,
  });

  async function syncContract({ attempts = 4 } = {}) {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const token = await getToken();
      let response = null;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        response = await apiFetch(`/contracts/${contractId}/sync`, {
          method: "POST",
          token,
          authMode: "customer",
          trackActivity: false,
        });

        if (!["PENDING_SIGNATURE", "SIGNED_PENDING_STORAGE"].includes(response.contract?.status) || attempt === attempts) {
          break;
        }

        await wait(2500);
      }

      const summary = {
        agreementVersion: response.contract?.templateVersion,
        status: response.contract?.status || "PENDING_SIGNATURE",
        contract: response.contract,
      };

      queryClient.setQueryData(["portal-sidebar-contract-gate"], summary);
      queryClient.setQueryData(["portal-contract-gate"], summary);
      queryClient.setQueryData(["portal-contract-current"], summary);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["portal-sidebar-contract-gate"] }),
        queryClient.invalidateQueries({ queryKey: ["portal-contract-gate"] }),
        queryClient.invalidateQueries({ queryKey: ["portal-contract-current"] }),
      ]);
      setState({ loading: false, error: "", contract: response.contract });
    } catch (error) {
      setState({ loading: false, error: error.message || "Contract status could not be synced.", contract: null });
    }
  }

  useEffect(() => {
    if (isLoaded) {
      syncContract();
    }
  }, [isLoaded, contractId]);

  if (state.loading) {
    return <PageLoader title="Contract Signing" subtitle="Checking the signed document status..." cardCount={1} lines={4} />;
  }

  return (
    <div>
      <Topbar title="Contract Signing" subtitle="Documenso returned you to ElevenOrbits. The backend is checking the signed document status." />
      <div className="mx-auto w-full max-w-3xl p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Signing Status</CardTitle>
            <CardDescription>Purchasing remains locked until private storage succeeds and an administrator approves the agreement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {state.error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{state.error}</div>
            ) : (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
                <p className="mt-3 font-semibold">Status synced</p>
                <div className="mt-3">
                  <StatusBadge status={state.contract?.status || "PENDING_SIGNATURE"} />
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="secondary" onClick={syncContract}>
                <RefreshCw className="h-4 w-4" />
                Sync again
              </Button>
              <Link href="/portal/contracts">
                <Button asChild variant="ghost">Back to contracts</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
