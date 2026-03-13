import { ServiceDetail } from "@/components/portal/service-detail";

export default async function PortalServiceDetailPage({ params }) {
  const { id } = await params;

  return <ServiceDetail serviceId={id} />;
}
