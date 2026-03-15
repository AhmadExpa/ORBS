"use client";

import Image from "next/image";
import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, TextArea } from "@/lib/ui";
import { Topbar } from "@/components/shared/topbar";
import { useStaffQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";

function submissionTypeLabel(type) {
  if (type === "wallet_topup") {
    return "Wallet Top-up";
  }

  if (type === "renewal_charge") {
    return "Automatic Renewal";
  }

  return "Subscription Payment";
}

export function AdminPaymentsPage() {
  const { data, refetch, isLoading } = useStaffQuery({
    queryKey: ["admin-payments"],
    path: "/admin/payments",
  });
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [state, setState] = useState({ loading: false, error: "" });

  async function handleReview(status) {
    if (!selected) {
      return;
    }

    setState({ loading: true, error: "" });

    try {
      await apiFetch(`/admin/payments/${selected._id}/review`, {
        method: "PATCH",
        body: {
          status,
          adminRemarks: remarks,
        },
      });
      setSelected(null);
      setRemarks("");
      await refetch();
      setState({ loading: false, error: "" });
    } catch (error) {
      setState({ loading: false, error: error.message });
    }
  }

  const submissions = data?.submissions || [];

  return (
    <div>
      <Topbar title="Payment Verification" subtitle="Approve or reject manual submissions after reviewing proof. Stripe payments are recorded automatically." />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card
              key={submission._id}
              className={`cursor-pointer transition ${selected?._id === submission._id ? "border-sky-300" : ""}`}
              onClick={() => {
                setSelected(submission);
                setRemarks(submission.adminRemarks || "");
              }}
            >
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{submission.userId?.name || "Customer"} · {submission.invoiceCode}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {submissionTypeLabel(submission.submissionType)}
                    {" · "}
                    {submission.amount ? `$${Number(submission.amount).toFixed(2)}` : "Order-linked"}
                  </p>
                  <p className="text-sm text-slate-500">Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
                </div>
                <StatusBadge status={submission.status} />
              </CardContent>
            </Card>
          ))}
          {!submissions.length && !isLoading ? <p className="text-sm text-slate-500">No payment submissions available.</p> : null}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Review Submission</CardTitle>
            <CardDescription>Select a payment to inspect proof and add remarks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Customer:</span> {selected.userId?.name || "Unknown"}</p>
                  <p><span className="font-semibold text-slate-900">Type:</span> {submissionTypeLabel(selected.submissionType)}</p>
                  <p><span className="font-semibold text-slate-900">Reference:</span> {selected.invoiceCode}</p>
                  <p><span className="font-semibold text-slate-900">Amount:</span> {selected.amount ? `$${Number(selected.amount).toFixed(2)}` : `$${Number(selected.orderId?.totalAmount || 0).toFixed(2)}`}</p>
                  <p><span className="font-semibold text-slate-900">Method:</span> {selected.paymentMethodType}</p>
                  {selected.orderId?.productPlanId?.name ? (
                    <p><span className="font-semibold text-slate-900">Plan:</span> {selected.orderId.productPlanId.name}</p>
                  ) : null}
                </div>
                {selected.screenshotUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <Image
                      alt="Payment proof"
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:4000"}${selected.screenshotUrl}`}
                      width={360}
                      height={240}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                ) : null}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Admin Remarks</label>
                  <TextArea value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Add review remarks" />
                </div>
                {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}
                {selected.status === "pending_verification" ? (
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={() => handleReview("approved")} disabled={state.loading}>
                      Approve
                    </Button>
                    <Button className="flex-1" variant="ghost" onClick={() => handleReview("rejected")} disabled={state.loading}>
                      Reject
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">This payment has already been completed automatically or reviewed earlier.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Choose a payment from the queue to review it.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
