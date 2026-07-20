"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Check, CheckCircle2, Clock3, Download, ExternalLink, FileText, PenLine, RefreshCw, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useCustomerQuery } from "@/lib/api/hooks";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, TextInput } from "@/lib/ui";
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

function TextField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <TextInput {...props} />
    </label>
  );
}

function agreementProgress(status) {
  if (status === "APPROVED") {
    return 3;
  }
  if (["SIGNED_PENDING_STORAGE", "SIGNED_PENDING_ADMIN"].includes(status)) {
    return 2;
  }
  if (["READY_TO_SIGN", "PENDING_SIGNATURE"].includes(status)) {
    return 1;
  }
  return 0;
}

function agreementHeading(status) {
  if (status === "APPROVED") {
    return {
      title: "Your agreement is approved",
      description: "Your workspace and purchasing access are fully available.",
    };
  }
  if (status === "SIGNED_PENDING_ADMIN") {
    return {
      title: "Your agreement is under review",
      description: "Your workspace is available while our team verifies the signed document.",
    };
  }
  if (status === "SIGNED_PENDING_STORAGE") {
    return {
      title: "We received your signed agreement",
      description: "We are securely saving the document before administrative review.",
    };
  }
  if (status === "PENDING_SIGNATURE") {
    return {
      title: "Finish signing your agreement",
      description: "Continue in Documenso, then return here to check the status.",
    };
  }
  if (status === "REJECTED") {
    return {
      title: "Your agreement needs attention",
      description: "Review the administrator's note and provide an updated agreement.",
    };
  }
  return {
    title: "Complete your service agreement",
    description: "Sign a new agreement or submit one you have already completed with ElevenOrbits.",
  };
}

function AgreementProgress({ status }) {
  const progress = agreementProgress(status);
  const steps = ["Your details", "Signed document", "Admin approval"];

  return (
    <ol className="grid grid-cols-3" aria-label="Agreement progress">
      {steps.map((label, index) => {
        const complete = index < progress;
        const active = index === progress && progress < steps.length;
        return (
          <li key={label} className="relative flex flex-col items-center px-2 text-center">
            {index > 0 ? (
              <span className={`absolute right-1/2 top-4 h-px w-full ${index <= progress ? "bg-emerald-400" : "bg-slate-200"}`} aria-hidden="true" />
            ) : null}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                complete
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : active
                    ? "border-brand-600 bg-brand-600 text-white ring-4 ring-brand-100"
                    : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              {complete ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className={`mt-3 text-xs font-semibold ${complete || active ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
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
  const [entryMode, setEntryMode] = useState("sign");
  const [hydratedContractId, setHydratedContractId] = useState("");
  const [manualForm, setManualForm] = useState({ documentId: "", documentUrl: "" });
  const [hydratedManualContractId, setHydratedManualContractId] = useState("");
  const [state, setState] = useState({
    starting: false,
    submittingExisting: false,
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
  const isManualSubmission = contract?.submissionMethod === "MANUAL_DOCUMENSO_REFERENCE";
  const canSubmitExisting = ["NOT_STARTED", "TURNSTILE_REQUIRED", "READY_TO_SIGN", "PENDING_SIGNATURE", "REJECTED", "CANCELLED", "EXPIRED"].includes(status);
  const signedFieldValues = Array.isArray(contract?.documensoFieldValues)
    ? contract.documensoFieldValues.filter((field) => field?.value)
    : [];
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

  useEffect(() => {
    if (!contract?._id || hydratedManualContractId === contract._id || !isManualSubmission) {
      return;
    }
    setManualForm({
      documentId: contract.documensoDocumentId || "",
      documentUrl: contract.submittedDocumentUrl || "",
    });
    setHydratedManualContractId(contract._id);
  }, [contract, hydratedManualContractId, isManualSubmission]);

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

  async function handleExistingSubmission(event) {
    event.preventDefault();
    if (state.submittingExisting || !manualForm.documentId.trim() || !manualForm.documentUrl.trim()) {
      return;
    }

    setState((current) => ({ ...current, submittingExisting: true, error: "" }));
    try {
      const token = await getToken();
      await apiFetch("/contracts/manual-submission", {
        method: "POST",
        token,
        authMode: "customer",
        body: {
          documentId: manualForm.documentId.trim(),
          documentUrl: manualForm.documentUrl.trim(),
        },
      });
      await contractQuery.refetch();
      showToast({
        type: "success",
        action: "Contracts",
        title: "Document submitted for review",
        description: "Your dashboard is available while an administrator verifies the Documenso document.",
      });
    } catch (error) {
      setState((current) => ({ ...current, error: error.message || "The document reference could not be submitted." }));
      showToast({
        type: "error",
        action: "Contracts",
        title: "Submission failed",
        description: error.message || "The document reference could not be submitted.",
      });
    } finally {
      setState((current) => ({ ...current, submittingExisting: false }));
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

  const heading = agreementHeading(status);
  const isAwaitingReview = ["SIGNED_PENDING_STORAGE", "SIGNED_PENDING_ADMIN"].includes(status);

  return (
    <div>
      <Topbar title="Service Agreement" subtitle="Provide your current Managed Service Agreement to activate your ElevenOrbits workspace." />

      <div className="mx-auto w-full max-w-[1180px] space-y-6 p-5 md:p-8">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-brand-50 text-brand-700"}`}>
                {status === "APPROVED" ? <ShieldCheck className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{heading.title}</h1>
                  <StatusBadge status={status} />
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{heading.description}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                  <span>Agreement version <strong className="text-slate-800">v{agreementVersion}</strong></span>
                  {contract?.contractNumber ? <span>Contract <strong className="text-slate-800">{contract.contractNumber}</strong></span> : null}
                  {contract?.createdAt ? <span>Created <strong className="text-slate-800">{formatDate(contract.createdAt)}</strong></span> : null}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5">
              <AgreementProgress status={status} />
            </div>
          </div>
        </section>

        {contract?.adminRejectionReason ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
            <p className="font-semibold">Why this agreement was not approved</p>
            <p className="mt-1 leading-6">{contract.adminRejectionReason}</p>
          </div>
        ) : null}

        {state.error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
            {state.error}
          </div>
        ) : null}

        {status === "APPROVED" ? (
          <Card className="overflow-hidden border-emerald-200">
            <CardContent className="flex flex-col gap-5 bg-emerald-50/60 p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-emerald-950">Everything is ready</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-800">Your agreement has been verified. You can purchase services, use billing features, and continue working from your dashboard.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {contract?.r2SignedPdfKey ? (
                  <Button type="button" variant="ghost" disabled={Boolean(state.downloading)} onClick={() => handleDownload("signed")}>
                    <Download className="h-4 w-4" />
                    {state.downloading === "signed" ? "Preparing..." : "Download agreement"}
                  </Button>
                ) : null}
                {isManualSubmission && contract?.submittedDocumentUrl ? (
                  <a href={contract.submittedDocumentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                    <Button asChild variant="ghost">Open document <ExternalLink className="h-4 w-4" /></Button>
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : isAwaitingReview ? (
          <Card className="overflow-hidden border-amber-200">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex max-w-2xl items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Clock3 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Administrative review in progress</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">You can use the dashboard and create an order now. Payment stays protected until an ElevenOrbits administrator verifies and approves this agreement.</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  {needsSync(status) ? (
                    <Button type="button" variant="secondary" disabled={state.syncing} onClick={handleSync}>
                      <RefreshCw className="h-4 w-4" />
                      {state.syncing ? "Checking..." : "Check status"}
                    </Button>
                  ) : null}
                  {isManualSubmission && contract?.submittedDocumentUrl ? (
                    <a href={contract.submittedDocumentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                      <Button asChild variant="ghost">Open submitted document <ExternalLink className="h-4 w-4" /></Button>
                    </a>
                  ) : null}
                </div>
              </div>
              {isManualSubmission ? (
                <div className="mt-6 grid gap-3 border-t border-amber-200 pt-5 sm:grid-cols-2">
                  <ContractFact label="Submitted document ID" value={fieldValue(contract?.documensoDocumentId)} />
                  <ContractFact label="Submitted for review" value={formatDate(contract?.manualVerificationSubmittedAt)} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : canStart(status) ? (
          <>
            <section aria-labelledby="agreement-path-heading">
              <div className="mb-4">
                <h2 id="agreement-path-heading" className="text-lg font-semibold text-slate-950">How would you like to continue?</h2>
                <p className="mt-1 text-sm text-slate-500">Choose the option that matches your agreement.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-colors ${entryMode === "sign" ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/10" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  onClick={() => setEntryMode("sign")}
                  aria-pressed={entryMode === "sign"}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${entryMode === "sign" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <PenLine className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-950">I need to sign an agreement</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">Enter your details and continue securely to Documenso.</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-colors ${entryMode === "existing" ? "border-brand-600 bg-brand-50 ring-2 ring-brand-600/10" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  onClick={() => setEntryMode("existing")}
                  aria-pressed={entryMode === "existing"}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${entryMode === "existing" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-950">I already signed with ElevenOrbits</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">Submit the Documenso document reference for manual review.</span>
                  </span>
                </button>
              </div>
            </section>

            {entryMode === "existing" ? (
              <Card>
                <CardHeader className="p-6 md:px-8">
                  <CardTitle>Submit your signed document</CardTitle>
                  <CardDescription>Use the document ID and URL from the agreement you already completed. The URL must be on app.documenso.com.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  {canSubmitExisting ? (
                    <form className="space-y-6" onSubmit={handleExistingSubmission}>
                      <div className="grid gap-5 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
                        <TextField
                          label="Documenso document ID"
                          placeholder="For example, 12345"
                          value={manualForm.documentId}
                          onChange={(event) => setManualForm((current) => ({ ...current, documentId: event.target.value }))}
                          required
                        />
                        <TextField
                          label="Documenso document URL"
                          type="url"
                          placeholder="https://app.documenso.com/..."
                          value={manualForm.documentUrl}
                          onChange={(event) => setManualForm((current) => ({ ...current, documentUrl: event.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="max-w-2xl text-xs leading-5 text-slate-500">By submitting, you confirm this document belongs to your account. We will verify the signer and completed agreement before enabling payments.</p>
                        <Button type="submit" className="shrink-0" disabled={state.submittingExisting || !manualForm.documentId.trim() || !manualForm.documentUrl.trim()}>
                          {state.submittingExisting ? "Submitting..." : "Submit for review"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">This agreement cannot accept another document reference in its current state.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="p-6 md:px-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle>Sign a new agreement</CardTitle>
                      <CardDescription>Your verified ElevenOrbits name and email will be assigned to the signer automatically.</CardDescription>
                    </div>
                    <div className="flex min-w-[280px] gap-1 rounded-lg bg-slate-100 p-1">
                      {["Profile", "Details", "Review"].map((label, index) => (
                        <button
                          key={label}
                          type="button"
                          className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${wizardStep === index ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                          onClick={() => setWizardStep(index)}
                          aria-current={wizardStep === index ? "step" : undefined}
                        >
                          {index + 1}. {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <form className="space-y-7" onSubmit={handleStart}>
                    {wizardStep === 0 ? (
                      <div>
                        <h3 className="font-semibold text-slate-950">Signer profile</h3>
                        <p className="mt-1 text-sm text-slate-500">Tell us who is signing and where the account is based.</p>
                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                          <SelectField label="Signing as" value={form.customerType} required options={["INDIVIDUAL", "BUSINESS"]} onChange={(event) => updateForm("customerType", event.target.value)} />
                          <SelectField label="Country" value={form.country} required options={countryOptions} onChange={(event) => updateForm("country", event.target.value)} />
                          <div className="md:col-span-2">
                            <SelectField label="Signing capacity" value={form.signingCapacity} required options={signingCapacityOptions} onChange={(event) => updateForm("signingCapacity", event.target.value)} />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {wizardStep === 1 ? (
                      <div>
                        <h3 className="font-semibold text-slate-950">Agreement details</h3>
                        <p className="mt-1 text-sm text-slate-500">Add the contact and registration details that should appear on the agreement.</p>
                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                          {isBusiness ? (
                            <>
                              <TextField label="Legal business name" placeholder="Your registered company name" value={form.businessName} onChange={(event) => updateForm("businessName", event.target.value)} required />
                              <TextField label="Your role or title" placeholder="For example, Director" value={form.businessRole} onChange={(event) => updateForm("businessRole", event.target.value)} required />
                              <SelectField label="Registration type" value={form.businessRegistrationType} required options={registrationTypeOptions} onChange={(event) => updateForm("businessRegistrationType", event.target.value)} />
                              <TextField label="Registration number" placeholder="Registration or tax number" value={form.businessRegistrationNumber} onChange={(event) => updateForm("businessRegistrationNumber", event.target.value)} required />
                              <SelectField label="Incorporation country" value={form.incorporationCountry} required options={countryOptions} onChange={(event) => updateForm("incorporationCountry", event.target.value)} />
                            </>
                          ) : (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 md:col-span-2">
                              Individual agreements use your verified ElevenOrbits account name and email. Business registration details are not required.
                            </div>
                          )}
                          <TextField label="Phone number (optional)" placeholder="Include your country code" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} />
                        </div>
                      </div>
                    ) : null}

                    {wizardStep === 2 ? (
                      <div>
                        <h3 className="font-semibold text-slate-950">Review before signing</h3>
                        <p className="mt-1 text-sm text-slate-500">Confirm these details before opening the secure signing document.</p>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <ContractFact label="Signing as" value={isBusiness ? "Business" : "Individual"} />
                          <ContractFact label="Country" value={fieldValue(form.country)} />
                          <ContractFact label="Signing capacity" value={fieldValue(form.signingCapacity)} />
                          {isBusiness ? (
                            <>
                              <ContractFact label="Business name" value={fieldValue(form.businessName)} />
                              <ContractFact label="Business role" value={fieldValue(form.businessRole)} />
                              <ContractFact label="Registration" value={`${fieldValue(form.businessRegistrationType)}: ${fieldValue(form.businessRegistrationNumber)}`} />
                            </>
                          ) : null}
                        </div>
                        <div className="mt-5 flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 p-4 text-sm leading-6 text-brand-900">
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                          <p>Your signed-in ElevenOrbits account is used for this agreement. Do not enter another customer's details.</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
                      <Button type="button" variant="ghost" disabled={wizardStep === 0} onClick={() => setWizardStep((current) => Math.max(0, current - 1))}>Back</Button>
                      {wizardStep < 2 ? (
                        <Button type="button" disabled={!currentStepComplete} onClick={() => setWizardStep((current) => Math.min(2, current + 1))}>
                          Continue
                        </Button>
                      ) : (
                        <Button type="submit" disabled={startDisabled}>
                          <ExternalLink className="h-4 w-4" />
                          {state.starting ? "Preparing..." : actionLabel}
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex items-start gap-4 p-6 md:p-8">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h2 className="font-semibold text-slate-950">Your agreement is being processed</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">No action is required right now. Return here shortly to check its status.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {contract ? (
          <Card>
            <CardHeader className="p-6 md:px-8">
              <CardTitle>Agreement record</CardTitle>
              <CardDescription>The account and document information stored with this agreement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 md:p-8">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ContractFact label="Customer type" value={contract.customerType === "BUSINESS" ? "Business" : "Individual"} />
                <ContractFact label="Account email" value={fieldValue(contract.customerEmail)} />
                <ContractFact label="Country" value={fieldValue(contract.country)} />
                {contract.businessName ? <ContractFact label="Business name" value={contract.businessName} /> : null}
                {contract.businessRole ? <ContractFact label="Business role" value={contract.businessRole} /> : null}
                {contract.businessRegistrationNumber ? <ContractFact label="Registration" value={contract.businessRegistrationNumber} /> : null}
                {contract.phone ? <ContractFact label="Phone" value={contract.phone} /> : null}
                {contract.signedAt ? <ContractFact label="Signed" value={formatDate(contract.signedAt)} /> : null}
                {isManualSubmission ? <ContractFact label="Document ID" value={fieldValue(contract.documensoDocumentId)} /> : null}
                {isManualSubmission ? <ContractFact label="Submitted" value={formatDate(contract.manualVerificationSubmittedAt)} /> : null}
              </div>

              {signedFieldValues.length ? (
                <div className="border-t border-slate-200 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Signed document fields</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {signedFieldValues.map((field, index) => (
                      <ContractFact key={`${field.id || field.label || "field"}-${index}`} label={field.label || field.type || `Field ${index + 1}`} value={fieldValue(field.value)} />
                    ))}
                  </div>
                </div>
              ) : null}

              {contract?.r2AuditCertificateKey ? (
                <div className="border-t border-slate-200 pt-5">
                  <Button type="button" variant="ghost" disabled={Boolean(state.downloading)} onClick={() => handleDownload("audit")}>
                    <Download className="h-4 w-4" />
                    {state.downloading === "audit" ? "Preparing..." : "Download audit certificate"}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
