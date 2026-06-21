"use client";

import Link from "next/link";
import { CheckCircle2, ReceiptText, ServerCog } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, StatusBadge } from "@/lib/ui";
import { resolvePublicFileUrl } from "@/lib/api/file-url";
import { useCustomerQuery } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/shared";
import { PageLoader } from "@/components/shared/page-loader";
import { Topbar } from "@/components/shared/topbar";

export function CheckoutThankYouView({ orderId }) {
  const orderQuery = useCustomerQuery({
    queryKey: ["portal-order-thank-you", orderId],
    path: `/orders/${orderId}`,
  });

  const order = orderQuery.data?.order;
  const invoice = orderQuery.data?.invoice;
  const subscription = orderQuery.data?.subscription;
  const invoiceFileUrl = resolvePublicFileUrl(invoice?.pdfUrl);
  const totalPaid = Number(invoice?.amount || order?.totalAmount || 0);
  const isPaid = invoice?.status === "paid" || order?.status === "approved";

  if (orderQuery.isLoading) {
    return <PageLoader title="Payment Confirmation" subtitle="Confirming payment status..." cardCount={2} lines={3} />;
  }

  if (!order) {
    return (
      <div>
        <Topbar title="Payment Confirmation" subtitle="Order not found." />
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title={isPaid ? "Payment Successful" : "Payment Status Updating"}
        subtitle={
          isPaid
            ? "Your card payment was received. The service is now ready for provisioning follow-up in the portal."
            : "Stripe confirmed the checkout flow, and the portal is refreshing the final payment state."
        }
      />
      <div className="mx-auto w-full max-w-[1180px] p-6 md:p-8">
        <Card className="overflow-hidden border-slate-200 bg-white">
          <CardContent className="p-0">
            <div className="grid gap-px bg-slate-200 lg:grid-cols-[1.05fr_0.95fr]">
              <section className="bg-white p-7 md:p-9">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  ElevenOrbits Checkout
                </p>
                <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-slate-950 md:text-5xl">
                  Thank you. Your order is in the portal.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
                  The selected settings, invoice, and service record are attached to your account. The ElevenOrbits team will handle provisioning and add access details after setup.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/portal">
                    <Button>Open Portal</Button>
                  </Link>
                  {invoiceFileUrl ? (
                    <Link href={invoiceFileUrl} target="_blank">
                      <Button variant="ghost">Open Invoice PDF</Button>
                    </Link>
                  ) : null}
                </div>
              </section>

              <aside className="bg-slate-50 p-7 md:p-9">
                <div className="rounded-lg border border-slate-200 bg-white">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{order.productPlanId?.name || "Managed Service"}</CardTitle>
                        <CardDescription>Order and payment summary</CardDescription>
                      </div>
                      <StatusBadge status={subscription?.status || order.status || "approved"} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <ReceiptText className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Amount Paid</p>
                          <p className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(totalPaid)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <ServerCog className="h-5 w-5 text-slate-600" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Next Step</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">Provisioning and access handoff</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Invoice</span>
                        <span className="font-semibold text-slate-950">{invoice?.invoiceNumber || "Generating"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Billing cycle</span>
                        <span className="font-semibold capitalize text-slate-950">{subscription?.billingCycle || order.billingCycle}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Payment</span>
                        <span className="font-semibold text-slate-950">{isPaid ? "Card received" : "Updating"}</span>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </aside>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
