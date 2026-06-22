import { ResourceIndex } from "@/components/marketing/listing-pages";
import { resourcePages } from "@/lib/marketing-content";

export const metadata = {
  title: "Resources",
  description: "ElevenOrbits guides for managed VPS, private AI deployment, workflow automation, Vicidial operations, security hardening, and billing.",
  alternates: {
    canonical: "/resources",
  },
};

export default function ResourcesPage() {
  return <ResourceIndex resources={resourcePages} />;
}
