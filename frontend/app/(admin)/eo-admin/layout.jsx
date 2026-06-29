import { adminNavGroups } from "@/lib/shared";
import { AppShell } from "@/components/shared/app-shell";

export default function AdminLayout({ children }) {
  return (
    <AppShell groups={adminNavGroups} roleLabel="Admin Portal" authMode="staff" logoutRedirectUrl="/eo-admin" sidebarHref="/eo-admin">
      {children}
    </AppShell>
  );
}
