import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { portalNavigation } from "@/lib/shared";
import { AppShell } from "@/components/shared/app-shell";
import { ProfileSync } from "@/components/portal/profile-sync";

export default async function PortalLayout({ children }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  return (
    <AppShell items={portalNavigation} roleLabel="Customer Portal" logoSrc="/invoice.png" logoWidth={500} logoHeight={500} sidebarHref="/portal">
      <ProfileSync />
      {children}
    </AppShell>
  );
}
