import { ResourceIndex } from "@/components/marketing/listing-pages";
import { resourcePages } from "@/lib/marketing-content";

export const metadata = {
  title: "Resources",
  description: "ElevenOrbits guides for managed VPS, migrations, delegate access, private AI deployment, automation, Vicidial operations, security hardening, and billing.",
  alternates: {
    canonical: "/resources",
  },
};

export default function ResourcesPage() {
  return <ResourceIndex resources={resourcePages} />;
}
