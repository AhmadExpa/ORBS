import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { AccountStatusGate } from "@/components/portal/account-status-gate";

export default async function AgentLayout({ children }) {
  const cookieStore = await cookies();
  const hasDelegateSession = Boolean(cookieStore.get("eo_delegate_session")?.value);

  if (!hasDelegateSession) {
    redirect("/login");
  }

  // Offset the per-page sticky Topbar so it sticks just below the 56px top nav.
  return (
    <div style={{ "--eo-topbar-top": "3.5rem" }}>
      <AccountStatusGate>
        <PortalShell isAgentPortal={true}>
          {children}
        </PortalShell>
      </AccountStatusGate>
    </div>
  );
}
