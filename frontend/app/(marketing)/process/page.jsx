import { CompanyInfoPage } from "@/components/marketing/company-info-page";
import { companyPages } from "@/lib/marketing-content";
import { siteConfig } from "@/lib/constants/site";

const page = companyPages.process;

export const metadata = {
  title: "Delivery Process",
  description: page.description,
  alternates: {
    canonical: "/process",
  },
  openGraph: {
    title: `Delivery Process | ${siteConfig.name}`,
    description: page.description,
    url: `${siteConfig.publicUrl}/process`,
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function ProcessPage() {
  return <CompanyInfoPage page={page} />;
}
