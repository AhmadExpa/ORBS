import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminNavigation } from "@/lib/shared";
import { AppShell } from "@/components/shared/app-shell";

export default async function AdminLayout({ children }) {
  const cookieStore = await cookies();
  const staffSession = cookieStore.get("eo_staff_session");

  if (!staffSession?.value) {
    redirect("/eo-admin/login");
  }

  return (
    <AppShell items={adminNavigation} roleLabel="Admin Portal" authMode="staff" logoutRedirectUrl="/eo-admin" sidebarHref="/eo-admin">
      {children}
    </AppShell>
  );
}
