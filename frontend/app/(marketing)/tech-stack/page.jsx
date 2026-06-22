import { TechStackShowcase } from "@/components/marketing/tech-stack-showcase";
import { siteConfig } from "@/lib/constants/site";

export const metadata = {
  title: "Tech Stack",
  description:
    "The ElevenOrbits partner ecosystem for cybersecurity, cloud continuity, endpoint management, managed IT, AI enablement, and UCaaS.",
  alternates: {
    canonical: "/tech-stack",
  },
  openGraph: {
    title: `Tech Stack | ${siteConfig.name}`,
    description:
      "Explore the partner ecosystem ElevenOrbits uses across cybersecurity, cloud continuity, endpoint management, managed IT, AI enablement, and UCaaS.",
    url: `${siteConfig.publicUrl}/tech-stack`,
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function TechStackPage() {
  return <TechStackShowcase />;
}
