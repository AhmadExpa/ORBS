"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmbedSignDocument } from "@documenso/embed-react";
import { useAuth } from "@clerk/nextjs";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

export function ContractSignPage({ contractId }) {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [state, setState] = useState({
    loading: true,
    syncing: false,
    ready: false,
    error: "",
    token: "",
    host: "",
    contract: null,
  });

  async function loadSigningToken() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const token = await getToken();
      const response = await apiFetch(`/contracts/${contractId}/signing-token`, {
        token,
        authMode: "customer",
      });

      setState({
        loading: false,
        syncing: false,
        ready: false,
        error: "",
        token: response.token,
        host: response.host,
        contract: response.contract,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message || "The signing session could not be opened.",
      }));
    }
  }

  async function syncAndContinue() {
    setState((current) => ({ ...current, syncing: true, error: "" }));
    try {
      const token = await getToken();
      await apiFetch(`/contracts/${contractId}/sync`, {
        method: "POST",
        token,
        authMode: "customer",
      });
      router.replace(`/portal/contracts/${contractId}/complete`);
    } catch (error) {
      setState((current) => ({
        ...current,
        syncing: false,
        error: error.message || "The signed contract could not be synced yet.",
      }));
    }
  }

  useEffect(() => {
    if (isLoaded) {
      loadSigningToken();
    }
  }, [isLoaded, contractId]);

  if (state.loading) {
    return <PageLoader title="Contract Signing" subtitle="Opening the secure Documenso signing session..." cardCount={1} lines={4} />;
  }

  return (
    <div>
      <Topbar title="Contract Signing" subtitle="Review and sign the ElevenOrbits services agreement inside the secure Documenso signing session." />
      <div className="mx-auto w-full max-w-[1680px] space-y-5 p-6 md:p-8">
        {state.error ? (
          <Card>
            <CardHeader>
              <CardTitle>Signing Unavailable</CardTitle>
              <CardDescription>The signing session could not be opened or synced.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                <AlertCircle className="mb-2 h-5 w-5" />
                {state.error}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={loadSigningToken}>
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </Button>
                <Link href="/portal/contracts">
                  <Button asChild variant="ghost">Back to contracts</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {state.token ? (
          <Card>
            <CardHeader>
              <CardTitle>{state.ready ? "Ready to Sign" : "Loading Signing Session"}</CardTitle>
              <CardDescription>Purchasing remains locked until the signed PDF is stored privately and approved by an ElevenOrbits administrator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <EmbedSignDocument
                  className="h-[78vh] min-h-[720px] w-full"
                  host={state.host || "https://app.documenso.com"}
                  token={state.token}
                  name={state.contract?.customerName || undefined}
                  email={state.contract?.customerEmail || undefined}
                  lockName
                  lockEmail
                  allowDocumentRejection={false}
                  darkModeDisabled
                  onDocumentReady={() => setState((current) => ({ ...current, ready: true }))}
                  onDocumentCompleted={syncAndContinue}
                  onDocumentRejected={() => router.replace("/portal/contracts")}
                  onDocumentError={(error) =>
                    setState((current) => ({
                      ...current,
                      error: typeof error === "string" ? error : "Documenso could not load the signing session.",
                    }))
                  }
                />
              </div>
              {state.syncing ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Contract signed. Syncing status with ElevenOrbits...
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
