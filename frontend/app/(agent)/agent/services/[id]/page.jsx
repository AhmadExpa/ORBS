import { ServiceDetail } from "@/components/portal/service-detail";

export default async function AgentServiceDetailPage({ params }) {
  const { id } = await params;

  return <ServiceDetail serviceId={id} />;
}
