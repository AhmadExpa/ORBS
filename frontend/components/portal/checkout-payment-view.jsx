"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCustomerQuery } from "@/lib/api/hooks";
import { apiFetch } from "@/lib/api/client";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge, TextInput } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { Topbar } from "@/components/shared/topbar";

export function CheckoutPaymentView({ orderId }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { data, isLoading } = useCustomerQuery({
    queryKey: ["portal-order-checkout", orderId],
    path: `/orders/${orderId}`,
  });
  const [invoiceCode, setInvoiceCode] = useState("");
  const [proof, setProof] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const order = data?.order;
  const invoice = data?.invoice;
  const subscription = data?.subscription;
  const paymentSetting = data?.paymentSetting;

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("subscriptionId", subscription?._id || "");
      formData.append("invoiceCode", invoiceCode);
      formData.append("paymentMethodType", paymentSetting?.paymentLink ? "manual_link" : "manual_qr");
      if (proof) {
        formData.append("proof", proof);
      }

      await apiFetch("/payments/submissions", {
        method: "POST",
        token,
        body: formData,
        isMultipart: true,
      });

      router.push("/portal?payment=under-review");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Topbar title="Checkout & Payment" subtitle="Review your plan, pay manually, and submit verification for approval." />
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Selected Plan Summary</CardTitle>
            <CardDescription>{isLoading ? "Loading order..." : order?.productPlanId?.name || "Pending order details"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Total Due</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(invoice?.amount || order?.totalAmount || 0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Invoice</p>
                <p className="mt-2 font-semibold text-slate-950">{invoice?.invoiceNumber || "Generating..."}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm text-slate-500">Status</p>
                <div className="mt-2">
                  <StatusBadge status={subscription?.status || order?.status || "pending_verification"} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Manual Payment</p>
              <div className="mt-4 grid gap-6 md:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                  {paymentSetting?.qrCodeImageUrl ? (
                    <Image
                      alt="Payment QR code"
                      src={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:4000"}${paymentSetting.qrCodeImageUrl}`}
                      width={220}
                      height={220}
                      className="h-auto w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                      QR code will appear here
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <p className="text-sm leading-7 text-slate-600">{paymentSetting?.instructions || "Scan the QR code and submit your payment reference."}</p>
                  {paymentSetting?.paymentLink ? (
                    <Link href={paymentSetting.paymentLink} target="_blank">
                      <Button variant="ghost">Unable to scan? Pay using payment link</Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Payment invoice/reference code</label>
                <TextInput value={invoiceCode} onChange={(event) => setInvoiceCode(event.target.value)} placeholder="Enter transfer reference" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Payment proof screenshot (optional)</label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => setProof(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
              </div>
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting payment..." : "Submit Payment Verification"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
