"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DataTable, StatusBadge } from "@/lib/ui";
import { formatCurrency } from "@/lib/shared";
import { MetricGrid } from "@/components/shared/metric-grid";
import { Topbar } from "@/components/shared/topbar";
import { useCustomerQuery } from "@/lib/api/hooks";

export function PortalDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reviewMessage, setReviewMessage] = useState("");
  const paymentStatus = searchParams.get("payment");
  const { data, isLoading } = useCustomerQuery({
    queryKey: ["portal-dashboard"],
    path: "/subscriptions",
  });
  const profileQuery = useCustomerQuery({
    queryKey: ["portal-dashboard-profile"],
    path: "/profile/me",
  });
  const invoicesQuery = useCustomerQuery({
    queryKey: ["portal-invoices"],
    path: "/invoices",
  });
  const paymentsQuery = useCustomerQuery({
    queryKey: ["portal-payments"],
    path: "/payments/submissions",
  });
  const ticketsQuery = useCustomerQuery({
    queryKey: ["portal-tickets"],
    path: "/tickets",
  });

  const subscriptions = data?.subscriptions || [];
  const profile = profileQuery.data?.user;
  const invoices = invoicesQuery.data?.invoices || [];
  const submissions = paymentsQuery.data?.submissions || [];
  const tickets = ticketsQuery.data?.tickets || [];

  useEffect(() => {
    if (paymentStatus !== "under-review") {
      return;
    }

    setReviewMessage("Your payment is under review.");

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("payment");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/portal?${nextQuery}` : "/portal", { scroll: false });
  }, [paymentStatus, router, searchParams]);

  return (
    <div>
      <Topbar
        title="Customer Dashboard"
        subtitle="Manage subscriptions, wallet funding, invoices, and support from one place."
        actions={
          <>
            <Link href="/portal/services">
              <Button>Order a Service</Button>
            </Link>
            <Link href="/portal/payments">
              <Button variant="ghost">Top Up Balance</Button>
            </Link>
          </>
        }
      />
      <div className="space-y-6 p-6">
        {reviewMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-900">
            {reviewMessage}
          </div>
        ) : null}
        <MetricGrid
          items={[
            { label: "Active Subscriptions", value: subscriptions.filter((item) => item.status === "active").length },
            { label: "Wallet Balance", value: formatCurrency(profile?.accountBalance || 0) },
            { label: "Pending Payments", value: submissions.filter((item) => item.status === "pending_verification").length },
            { label: "Open Tickets", value: tickets.filter((item) => ["open", "pending"].includes(item.status)).length },
            { label: "Outstanding Invoices", value: formatCurrency(invoices.filter((item) => item.status !== "paid").reduce((sum, item) => sum + item.amount, 0)) },
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Active Services</CardTitle>
              <CardDescription>Managed by ElevenOrbits Team</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  { key: "plan", label: "Plan", render: (row) => row.productPlanId?.name || "Managed Service" },
                  { key: "billingCycle", label: "Cycle" },
                  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
                ]}
                rows={subscriptions.slice(0, 5)}
                emptyMessage={isLoading ? "Loading subscriptions..." : "No services yet."}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Manual payment verification status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submissions.slice(0, 4).map((submission) => (
                <div key={submission._id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{submission.submissionType === "wallet_topup" ? "Wallet Top-up" : submission.invoiceCode}</p>
                      <p className="text-sm text-slate-500">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={submission.status} />
                  </div>
                </div>
              ))}
              {!submissions.length ? <p className="text-sm text-slate-500">No payment submissions yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
