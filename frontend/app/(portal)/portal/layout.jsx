import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { portalNavigation } from "@/lib/shared";
import { AppShell } from "@/components/shared/app-shell";
import { ContractGate } from "@/components/portal/contract-gate";

export default async function PortalLayout({ children }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  return (
    <AppShell items={portalNavigation} roleLabel="Customer Portal" sidebarHref="/portal">
      <ContractGate>{children}</ContractGate>
    </AppShell>
  );
}
