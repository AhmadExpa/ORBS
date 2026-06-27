"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Building2, CheckCircle2, Download, ExternalLink, RefreshCw, UserRound } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, TextInput } from "@/lib/ui";
import { EmptyState } from "@/components/shared/empty-state";
import { useActionToast } from "@/components/shared/feedback-layer";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

function formatDate(value) {
  if (!value) {
    return "Not available";
  }
  return new Date(value).toLocaleString();
}

function fieldValue(value) {
  return value ? String(value) : "Not provided";
}

function canStart(status) {
  return ["NOT_STARTED", "TURNSTILE_REQUIRED", "READY_TO_SIGN", "PENDING_SIGNATURE", "REJECTED", "CANCELLED", "EXPIRED"].includes(status);
}

function needsSync(status) {
  return ["PENDING_SIGNATURE", "SIGNED_PENDING_STORAGE"].includes(status);
}

function ContractFact({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function TypeButton({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      className={`flex min-h-[96px] items-start gap-3 rounded-lg border px-4 py-4 text-left transition ${
        active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
      onClick={onClick}
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${active ? "bg-white text-slate-950" : "bg-slate-50 text-slate-700"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className={`mt-1 block text-xs leading-5 ${active ? "text-slate-200" : "text-slate-500"}`}>{description}</span>
      </span>
    </button>
  );
}

export function ContractsPage() {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const [form, setForm] = useState({
    customerType: "INDIVIDUAL",
    businessName: "",
    country: "",
    phone: "",
  });
  const [state, setState] = useState({
    starting: false,
    syncing: false,
    downloading: "",
    error: "",
  });

  const contractQuery = useCustomerQuery({
    queryKey: ["portal-contract-current"],
    path: "/contracts/current",
  });

  const contract = contractQuery.data?.contract;
  const status = contract?.status || contractQuery.data?.status || "NOT_STARTED";
  const agreementVersion = contract?.templateVersion || contractQuery.data?.agreementVersion || "1.0";
  const isBusiness = form.customerType === "BUSINESS";
  const startDisabled = state.starting || (isBusiness && !form.businessName.trim());

  const actionLabel = useMemo(() => {
    if (status === "PENDING_SIGNATURE") {
      return "Continue signing";
    }
    if (status === "REJECTED") {
      return "Start revised agreement";
    }
    return "Start signing";
  }, [status]);

  async function handleStart(event) {
    event.preventDefault();
    if (startDisabled) {
      return;
    }

    setState((current) => ({ ...current, starting: true, error: "" }));

    try {
      const token = await getToken();
      const response = await apiFetch("/contracts/start", {
        method: "POST",
        token,
        authMode: "customer",
        body: {
          ...form,
          businessName: isBusiness ? form.businessName.trim() : "",
          country: form.country.trim(),
          phone: form.phone.trim(),
        },
      });

      if (response.signingUrl) {
        window.location.assign(response.signingUrl);
        return;
      }

      await contractQuery.refetch();
      showToast({
        type: "info",
        action: "Contracts",
        title: "Contract updated",
        description: "The current contract status has been refreshed.",
      });
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || "Contract signing could not be started." }));
      showToast({
        type: "error",
        action: "Contracts",
        title: "Signing unavailable",
        description: error.message || "Contract signing could not be started.",
      });
    } finally {
      setState((current) => ({ ...current, starting: false }));
    }
  }

  async function handleSync() {
    if (!contract?._id || state.syncing) {
      return;
    }

    setState((current) => ({ ...current, syncing: true, error: "" }));
    try {
      const token = await getToken();
      await apiFetch(`/contracts/${contract._id}/sync`, {
        method: "POST",
        token,
        authMode: "customer",
      });
      await contractQuery.refetch();
      showToast({
        type: "success",
        action: "Contracts",
        title: "Status synced",
        description: "The contract status was checked against Documenso.",
      });
    } catch (error) {
      showToast({
        type: "error",
        action: "Contracts",
        title: "Sync failed",
        description: error.message || "Contract status could not be synced.",
      });
    } finally {
      setState((current) => ({ ...current, syncing: false }));
    }
  }

  async function handleDownload(kind = "signed") {
    if (!contract?._id || state.downloading) {
      return;
    }

    setState((current) => ({ ...current, downloading: kind }));
    try {
      const token = await getToken();
      const response = await apiFetch(`/contracts/${contract._id}/${kind === "audit" ? "audit-download" : "download"}`, {
        token,
        authMode: "customer",
      });
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      showToast({
        type: "error",
        action: "Contracts",
        title: "Download failed",
        description: error.message || "The contract file could not be downloaded.",
      });
    } finally {
      setState((current) => ({ ...current, downloading: "" }));
    }
  }

  if (contractQuery.isLoading && !contractQuery.data) {
    return <PageLoader title="Contracts" subtitle="Loading contract status..." cardCount={3} lines={4} />;
  }

  return (
    <div>
      <Topbar title="Contracts" subtitle="Sign the current services agreement and track administrative approval before purchasing." />

      <div className="mx-auto w-full max-w-[1680px] space-y-6 p-6 md:p-8">
        <Card>
          <CardContent className="grid gap-4 p-6 md:grid-cols-4">
            <ContractFact label="Status" value={<StatusBadge status={status} />} />
            <ContractFact label="Agreement Version" value={`v${agreementVersion}`} />
            <ContractFact label="Contract Number" value={fieldValue(contract?.contractNumber)} />
            <ContractFact label="Admin Review" value={contract?.adminDecision || (status === "APPROVED" ? "APPROVED" : "Pending")} />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle>Current Agreement</CardTitle>
              <CardDescription>Purchasing remains locked until the signed PDF is stored privately and approved by an ElevenOrbits administrator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <ContractFact label="Customer Type" value={contract.customerType === "BUSINESS" ? "Business" : "Individual"} />
                  <ContractFact label="Business Name" value={fieldValue(contract.businessName)} />
                  <ContractFact label="Created" value={formatDate(contract.createdAt)} />
                  <ContractFact label="Signed" value={formatDate(contract.signedAt)} />
                  <ContractFact label="Stored PDF Hash" value={fieldValue(contract.signedPdfSha256)} />
                  <ContractFact label="Account Email" value={fieldValue(contract.customerEmail)} />
                </div>
              ) : (
                <EmptyState title="No agreement started" description="Start the signing flow with your Clerk account name and verified email." />
              )}

              {contract?.adminRejectionReason ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <p className="font-semibold">Rejection reason</p>
                  <p className="mt-1 leading-6">{contract.adminRejectionReason}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {needsSync(status) ? (
                  <Button type="button" variant="secondary" disabled={state.syncing} onClick={handleSync}>
                    <RefreshCw className="h-4 w-4" />
                    {state.syncing ? "Syncing..." : "Sync status"}
                  </Button>
                ) : null}
                {contract?.r2SignedPdfKey ? (
                  <Button type="button" variant="ghost" disabled={Boolean(state.downloading)} onClick={() => handleDownload("signed")}>
                    <Download className="h-4 w-4" />
                    {state.downloading === "signed" ? "Preparing..." : "Download signed agreement"}
                  </Button>
                ) : null}
                {contract?.r2AuditCertificateKey ? (
                  <Button type="button" variant="ghost" disabled={Boolean(state.downloading)} onClick={() => handleDownload("audit")}>
                    <Download className="h-4 w-4" />
                    {state.downloading === "audit" ? "Preparing..." : "Download audit certificate"}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signing Access</CardTitle>
              <CardDescription>Your Clerk account name and verified email are assigned to the Documenso signer automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              {status === "APPROVED" ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="mt-3 font-semibold">Purchasing is unlocked for the current agreement version.</p>
                  <p className="mt-2 leading-6">You can continue to checkout and service requests while this agreement version remains current.</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleStart}>
                  <div className="grid gap-3">
                    <TypeButton
                      active={form.customerType === "INDIVIDUAL"}
                      icon={UserRound}
                      title="Individual"
                      description="Sign the agreement for your own account."
                      onClick={() => setForm((current) => ({ ...current, customerType: "INDIVIDUAL", businessName: "" }))}
                    />
                    <TypeButton
                      active={form.customerType === "BUSINESS"}
                      icon={Building2}
                      title="Business"
                      description="Sign as an authorized representative."
                      onClick={() => setForm((current) => ({ ...current, customerType: "BUSINESS" }))}
                    />
                  </div>

                  {isBusiness ? (
                    <TextInput
                      placeholder="Business or company name"
                      value={form.businessName}
                      onChange={(event) => setForm((current) => ({ ...current, businessName: event.target.value }))}
                      required
                    />
                  ) : null}

                  <TextInput
                    placeholder="Country"
                    value={form.country}
                    onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
                  />
                  <TextInput
                    placeholder="Phone number, optional"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    Your signed-in ElevenOrbits account is used for the agreement. Do not enter another customer's details.
                  </div>

                  {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

                  {canStart(status) ? (
                    <Button type="submit" className="w-full" disabled={startDisabled}>
                      <ExternalLink className="h-4 w-4" />
                      {state.starting ? "Preparing..." : actionLabel}
                    </Button>
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      The agreement is signed and waiting for private storage or administrative review.
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
