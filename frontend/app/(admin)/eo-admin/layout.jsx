import { adminNavigation } from "@/lib/shared";
import { AppShell } from "@/components/shared/app-shell";

export default function AdminLayout({ children }) {
  return (
    <AppShell items={adminNavigation} roleLabel="Admin Portal" authMode="staff" logoutRedirectUrl="/eo-admin" sidebarHref="/eo-admin">
      {children}
    </AppShell>
  );
}
