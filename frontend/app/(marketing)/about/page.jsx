import { CompanyInfoPage } from "@/components/marketing/company-info-page";
import { companyPages } from "@/lib/marketing-content";
import { siteConfig } from "@/lib/constants/site";

const page = companyPages.about;

export const metadata = {
  title: "About ElevenOrbits",
  description: page.description,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `About ${siteConfig.name}`,
    description: page.description,
    url: `${siteConfig.publicUrl}/about`,
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function AboutPage() {
  return <CompanyInfoPage page={page} />;
}
