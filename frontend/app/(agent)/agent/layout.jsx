import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { AccountStatusGate } from "@/components/portal/account-status-gate";
import { siteConfig } from "@/lib/constants/site";

async function isDelegateSessionValid(token) {
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${siteConfig.apiUrl}/delegate/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function AgentLayout({ children }) {
  const cookieStore = await cookies();
  const delegateSessionToken = cookieStore.get("eo_delegate_session")?.value || "";

  if (!(await isDelegateSessionValid(delegateSessionToken))) {
    redirect("/agent/login");
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
