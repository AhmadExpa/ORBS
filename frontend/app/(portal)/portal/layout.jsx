import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { ContractGate } from "@/components/portal/contract-gate";

export default async function PortalLayout({ children }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  // Offset the per-page sticky Topbar so it sticks just below the 56px top nav.
  return (
    <div style={{ "--eo-topbar-top": "3.5rem" }}>
      <PortalShell>
        <ContractGate>{children}</ContractGate>
      </PortalShell>
    </div>
  );
}
