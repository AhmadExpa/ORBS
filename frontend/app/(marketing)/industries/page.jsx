import { IndustryIndex } from "@/components/marketing/listing-pages";
import { industryPages } from "@/lib/marketing-content";

export const metadata = {
  title: "Industries",
  description: "Industries supported by ElevenOrbits managed infrastructure, AI, automation, VoIP, security, billing, and support services.",
  alternates: {
    canonical: "/industries",
  },
};

export default function IndustriesPage() {
  return <IndustryIndex industries={industryPages} />;
}
