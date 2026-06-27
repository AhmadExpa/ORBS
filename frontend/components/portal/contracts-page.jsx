"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CheckCircle2, Download, ExternalLink, RefreshCw } from "lucide-react";
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

const countryOptions = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "United Arab Emirates",
  "Saudi Arabia",
  "Germany",
  "France",
  "Netherlands",
  "Australia",
  "Singapore",
  "India",
  "Other",
];

const signingCapacityOptions = [
  "Account owner",
  "Authorized representative",
  "Company director or officer",
  "Finance or procurement manager",
  "Technical account owner",
];

const registrationTypeOptions = ["EIN", "Company registration number", "Tax ID", "VAT number", "National business identifier"];

function SelectField({ label, value, onChange, options, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
        {required ? " *" : ""}
      </span>
      <select
        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        value={value}
        onChange={onChange}
        required={required}
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ContractsPage() {
  const { getToken } = useAuth();
  const { showToast } = useActionToast();
  const [form, setForm] = useState({
    customerType: "INDIVIDUAL",
    businessName: "",
    signingCapacity: "",
    businessRole: "",
    businessRegistrationType: "",
    businessRegistrationNumber: "",
    incorporationCountry: "",
    country: "",
    phone: "",
  });
  const [wizardStep, setWizardStep] = useState(0);
  const [hydratedContractId, setHydratedContractId] = useState("");
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
  const firstStepComplete = Boolean(form.customerType && form.country && form.signingCapacity);
  const businessStepComplete =
    !isBusiness ||
    Boolean(
      form.businessName.trim() &&
        form.businessRole.trim() &&
        form.businessRegistrationType &&
        form.businessRegistrationNumber.trim() &&
        form.incorporationCountry,
    );
  const contactStepComplete = true;
  const currentStepComplete = wizardStep === 0 ? firstStepComplete : wizardStep === 1 ? businessStepComplete && contactStepComplete : true;
  const formComplete = firstStepComplete && businessStepComplete && contactStepComplete;
  const startDisabled = state.starting || !formComplete;

  const actionLabel = useMemo(() => {
    if (status === "PENDING_SIGNATURE") {
      return "Continue signing";
    }
    if (status === "REJECTED") {
      return "Start revised agreement";
    }
    return "Start signing";
  }, [status]);

  useEffect(() => {
    if (!contract?._id || hydratedContractId === contract._id || !canStart(status)) {
      return;
    }

    setForm({
      customerType: contract.customerType === "BUSINESS" ? "BUSINESS" : "INDIVIDUAL",
      businessName: contract.businessName || "",
      signingCapacity: contract.signingCapacity || "",
      businessRole: contract.businessRole || "",
      businessRegistrationType: contract.businessRegistrationType || "",
      businessRegistrationNumber: contract.businessRegistrationNumber || "",
      incorporationCountry: contract.incorporationCountry || contract.country || "",
      country: contract.country || "",
      phone: contract.phone || "",
    });
    setHydratedContractId(contract._id);
  }, [contract, hydratedContractId, status]);

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "customerType" && value === "INDIVIDUAL"
        ? {
            businessName: "",
            businessRole: "",
            businessRegistrationType: "",
            businessRegistrationNumber: "",
            incorporationCountry: "",
          }
        : {}),
      ...(field === "country" && !current.incorporationCountry ? { incorporationCountry: value } : {}),
    }));
  }

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
          signingCapacity: form.signingCapacity.trim(),
          businessRole: isBusiness ? form.businessRole.trim() : "",
          businessRegistrationType: isBusiness ? form.businessRegistrationType.trim() : "",
          businessRegistrationNumber: isBusiness ? form.businessRegistrationNumber.trim() : "",
          incorporationCountry: isBusiness ? form.incorporationCountry.trim() : "",
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
                  <ContractFact label="Country" value={fieldValue(contract.country)} />
                  <ContractFact label="Phone" value={fieldValue(contract.phone)} />
                  {contract.customerType === "BUSINESS" ? (
                    <>
                      <ContractFact label="Business Role" value={fieldValue(contract.businessRole)} />
                      <ContractFact label="Registration" value={fieldValue(contract.businessRegistrationNumber)} />
                    </>
                  ) : null}
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
                  <div className="grid grid-cols-3 gap-2">
                    {["Profile", "Details", "Review"].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                          wizardStep === index ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-slate-500 hover:border-slate-300"
                        }`}
                        onClick={() => setWizardStep(index)}
                      >
                        {index + 1}. {label}
                      </button>
                    ))}
                  </div>

                  {wizardStep === 0 ? (
                    <div className="space-y-4">
                      <SelectField
                        label="Signing as"
                        value={form.customerType}
                        required
                        options={["INDIVIDUAL", "BUSINESS"]}
                        onChange={(event) => updateForm("customerType", event.target.value)}
                      />
                      <SelectField
                        label="Country"
                        value={form.country}
                        required
                        options={countryOptions}
                        onChange={(event) => updateForm("country", event.target.value)}
                      />
                      <SelectField
                        label="Signing capacity"
                        value={form.signingCapacity}
                        required
                        options={signingCapacityOptions}
                        onChange={(event) => updateForm("signingCapacity", event.target.value)}
                      />
                    </div>
                  ) : null}

                  {wizardStep === 1 ? (
                    <div className="space-y-4">
                      {isBusiness ? (
                        <>
                          <TextInput
                            placeholder="Legal business or company name"
                            value={form.businessName}
                            onChange={(event) => updateForm("businessName", event.target.value)}
                            required
                          />
                          <TextInput
                            placeholder="Your role or title, for example Director"
                            value={form.businessRole}
                            onChange={(event) => updateForm("businessRole", event.target.value)}
                            required
                          />
                          <SelectField
                            label="Registration type"
                            value={form.businessRegistrationType}
                            required
                            options={registrationTypeOptions}
                            onChange={(event) => updateForm("businessRegistrationType", event.target.value)}
                          />
                          <TextInput
                            placeholder="EIN, company registration number, or tax ID"
                            value={form.businessRegistrationNumber}
                            onChange={(event) => updateForm("businessRegistrationNumber", event.target.value)}
                            required
                          />
                          <SelectField
                            label="Incorporation country"
                            value={form.incorporationCountry}
                            required
                            options={countryOptions}
                            onChange={(event) => updateForm("incorporationCountry", event.target.value)}
                          />
                        </>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                          Individual agreements use your verified Clerk account name and email. No business registration details are required.
                        </div>
                      )}
                      <TextInput
                        placeholder="Phone number, optional"
                        value={form.phone}
                        onChange={(event) => updateForm("phone", event.target.value)}
                      />
                    </div>
                  ) : null}

                  {wizardStep === 2 ? (
                    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      <p className="font-semibold text-slate-950">Ready for the signing document</p>
                      <div className="grid gap-3">
                        <ContractFact label="Signing As" value={isBusiness ? "Business" : "Individual"} />
                        <ContractFact label="Country" value={fieldValue(form.country)} />
                        <ContractFact label="Signing Capacity" value={fieldValue(form.signingCapacity)} />
                        {isBusiness ? (
                          <>
                            <ContractFact label="Business Name" value={fieldValue(form.businessName)} />
                            <ContractFact label="Business Role" value={fieldValue(form.businessRole)} />
                            <ContractFact label="Registration" value={`${fieldValue(form.businessRegistrationType)}: ${fieldValue(form.businessRegistrationNumber)}`} />
                            <ContractFact label="Incorporation Country" value={fieldValue(form.incorporationCountry)} />
                          </>
                        ) : null}
                      </div>
                      <p>Your signed-in ElevenOrbits account is used for the agreement. Do not enter another customer's details.</p>
                    </div>
                  ) : null}

                  {state.error ? <p className="text-sm text-rose-600">{state.error}</p> : null}

                  {canStart(status) ? (
                    <div className="flex gap-3">
                      {wizardStep > 0 ? (
                        <Button type="button" variant="ghost" className="flex-1" onClick={() => setWizardStep((current) => Math.max(0, current - 1))}>
                          Back
                        </Button>
                      ) : null}
                      {wizardStep < 2 ? (
                        <Button
                          type="button"
                          className="flex-1"
                          disabled={!currentStepComplete}
                          onClick={() => setWizardStep((current) => Math.min(2, current + 1))}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button type="submit" className="flex-1" disabled={startDisabled}>
                          <ExternalLink className="h-4 w-4" />
                          {state.starting ? "Preparing..." : actionLabel}
                        </Button>
                      )}
                    </div>
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
