"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Download, RefreshCw, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useStaffQuery } from "@/lib/api/hooks";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, TextArea } from "@/lib/ui";
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

function DetailFact({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function AdminContractDetailPage({ contractId }) {
  const { showToast } = useActionToast();
  const contractQuery = useStaffQuery({
    queryKey: ["admin-contract-detail", contractId],
    path: `/admin/contracts/${contractId}`,
  });
  const [reason, setReason] = useState("");
  const [action, setAction] = useState("");

  const contract = contractQuery.data?.contract;
  const canReview = contract?.status === "SIGNED_PENDING_ADMIN";
  const signedFieldValues = Array.isArray(contract?.documensoFieldValues)
    ? contract.documensoFieldValues.filter((field) => field?.value)
    : [];

  async function runAction(nextAction, request) {
    setAction(nextAction);
    try {
      await request();
      await contractQuery.refetch();
      showToast({
        type: "success",
        action: "Contracts",
        title: "Contract updated",
        description: "The contract review state has been saved.",
      });
    } catch (error) {
      showToast({
        type: "error",
        action: "Contracts",
        title: "Contract action failed",
        description: error.message || "The contract could not be updated.",
      });
    } finally {
      setAction("");
    }
  }

  async function handleSync() {
    await runAction("sync", () =>
      apiFetch(`/admin/contracts/${contractId}/sync`, {
        method: "POST",
        authMode: "staff",
      }),
    );
  }

  async function handleApprove() {
    await runAction("approve", () =>
      apiFetch(`/admin/contracts/${contractId}/approve`, {
        method: "POST",
        authMode: "staff",
      }),
    );
  }

  async function handleReject() {
    if (!reason.trim()) {
      showToast({
        type: "error",
        action: "Contracts",
        title: "Reason required",
        description: "Enter a rejection reason before rejecting the agreement.",
      });
      return;
    }

    await runAction("reject", () =>
      apiFetch(`/admin/contracts/${contractId}/reject`, {
        method: "POST",
        authMode: "staff",
        body: {
          reason: reason.trim(),
        },
      }),
    );
  }

  async function handleDownload(kind = "signed") {
    await runAction(kind, async () => {
      const response = await apiFetch(`/admin/contracts/${contractId}/${kind === "audit" ? "audit-download" : "download"}`, {
        authMode: "staff",
      });
      window.open(response.url, "_blank", "noopener,noreferrer");
    });
  }

  if (contractQuery.isLoading && !contractQuery.data) {
    return <PageLoader title="Contract Review" subtitle="Loading contract details..." cardCount={3} lines={4} />;
  }

  if (!contract) {
    return (
      <div>
        <Topbar title="Contract Review" subtitle="Contract not found." />
      </div>
    );
  }

  return (
    <div>
      <Topbar title={contract.contractNumber || "Contract Review"} subtitle="Inspect signed agreement evidence and make the administrative approval decision." />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap gap-3">
          <Link href="/eo-admin/contracts">
            <Button asChild variant="ghost">Back to contracts</Button>
          </Link>
          <Button type="button" variant="secondary" disabled={Boolean(action)} onClick={handleSync}>
            <RefreshCw className="h-4 w-4" />
            {action === "sync" ? "Syncing..." : "Sync Documenso"}
          </Button>
          {contract.r2SignedPdfKey ? (
            <Button type="button" variant="ghost" disabled={Boolean(action)} onClick={() => handleDownload("signed")}>
              <Download className="h-4 w-4" />
              {action === "signed" ? "Preparing..." : "Download signed PDF"}
            </Button>
          ) : null}
          {contract.r2AuditCertificateKey ? (
            <Button type="button" variant="ghost" disabled={Boolean(action)} onClick={() => handleDownload("audit")}>
              <Download className="h-4 w-4" />
              {action === "audit" ? "Preparing..." : "Download audit certificate"}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Details</CardTitle>
                <CardDescription>Customer, signing, storage, and review metadata.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <DetailFact label="Status" value={<StatusBadge status={contract.status} />} />
                <DetailFact label="Agreement Version" value={`v${contract.templateVersion}`} />
                <DetailFact label="Customer Name" value={fieldValue(contract.customerName)} />
                <DetailFact label="Customer Email" value={fieldValue(contract.customerEmail)} />
                <DetailFact label="Clerk User ID" value={fieldValue(contract.clerkUserId)} />
                <DetailFact label="Type" value={contract.customerType === "BUSINESS" ? "Business" : "Individual"} />
                <DetailFact label="Signing Capacity" value={fieldValue(contract.signingCapacity)} />
                <DetailFact label="Business Name" value={fieldValue(contract.businessName)} />
                <DetailFact label="Business Role" value={fieldValue(contract.businessRole)} />
                <DetailFact label="Business Registration" value={fieldValue(contract.businessRegistrationNumber)} />
                <DetailFact label="Registration Type" value={fieldValue(contract.businessRegistrationType)} />
                <DetailFact label="Incorporation Country" value={fieldValue(contract.incorporationCountry)} />
                <DetailFact label="Country" value={fieldValue(contract.country)} />
                <DetailFact label="Phone" value={fieldValue(contract.phone)} />
                <DetailFact label="Documenso Document ID" value={fieldValue(contract.documensoDocumentId)} />
                <DetailFact label="Documenso Fields Synced" value={formatDate(contract.documensoFieldValuesSyncedAt)} />
                <DetailFact label="Signing Started" value={formatDate(contract.turnstileVerifiedAt || contract.createdAt)} />
                <DetailFact label="Signed At" value={formatDate(contract.signedAt || contract.documensoCompletedAt)} />
                <DetailFact label="Admin Reviewed At" value={formatDate(contract.adminReviewedAt)} />
                <DetailFact label="Admin Reviewed By" value={fieldValue(contract.adminReviewedBy)} />
                <DetailFact label="SHA-256" value={fieldValue(contract.signedPdfSha256)} />
                <DetailFact label="Signed PDF Key" value={fieldValue(contract.r2SignedPdfKey)} />
                <DetailFact label="Audit Certificate Key" value={fieldValue(contract.r2AuditCertificateKey)} />
                <DetailFact label="Evidence Key" value={fieldValue(contract.r2EvidenceKey)} />
              </CardContent>
            </Card>

            {signedFieldValues.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>Signed Form Fields</CardTitle>
                  <CardDescription>Values returned by Documenso for the completed document.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2">
                  {signedFieldValues.map((field, index) => (
                    <DetailFact
                      key={`${field.id || field.label || "field"}-${index}`}
                      label={field.label || field.type || `Field ${index + 1}`}
                      value={fieldValue(field.value)}
                    />
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Review Decision</CardTitle>
              <CardDescription>Approving unlocks checkout and service activation for the current agreement version.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.adminDecision ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-slate-950">Decision: {contract.adminDecision}</p>
                  <p className="mt-2 text-slate-600">{contract.adminRejectionReason || "No rejection reason recorded."}</p>
                </div>
              ) : null}

              <Button type="button" className="w-full" disabled={!canReview || Boolean(action)} onClick={handleApprove}>
                <CheckCircle2 className="h-4 w-4" />
                {action === "approve" ? "Approving..." : "Approve contract"}
              </Button>

              <div className="space-y-3">
                <TextArea
                  placeholder="Required rejection reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  disabled={!canReview || Boolean(action)}
                />
                <Button type="button" variant="destructive" className="w-full" disabled={!canReview || Boolean(action) || !reason.trim()} onClick={handleReject}>
                  <XCircle className="h-4 w-4" />
                  {action === "reject" ? "Rejecting..." : "Reject contract"}
                </Button>
              </div>

              {!canReview ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Only contracts with stored PDFs pending admin review can be approved or rejected.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
