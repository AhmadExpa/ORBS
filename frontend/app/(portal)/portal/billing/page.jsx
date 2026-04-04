import { InvoicesPage } from "@/components/portal/invoices-page";

export default function PortalBillingPage() {
  return (
    <InvoicesPage
      title="Billing"
      subtitle="Review invoice states, totals, and wallet-payable balances tied to your services."
      emptyTitle="No billing records yet"
      emptyDescription="Invoices appear after you create an order."
    />
  );
}
